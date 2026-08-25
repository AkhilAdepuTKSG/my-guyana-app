import { useEffect, useRef, useState } from 'react';
import { useAppState } from '../../state/AppStateContext';
import AuthSplash from './AuthSplash';
import { SignInDevice, EidSignIn, OtherWays, PasswordScreen, IdentifierScreen, NoAccount } from './AuthSignIn';
import {
  GovId, GovScan, GovCheck, NoRecord, ConfirmId, NotMe, GovContact, ContactHelp,
} from './AuthGovId';
import { Consent, Proof, EidAuth, EidFail, EidCard, LinkConfirm, Mismatch } from './AuthEid';
import { Otp, Blocked, Pol, FaceCheck } from './AuthOtpFace';
import { Manual, Review, Limited } from './AuthManual';
import { Setup } from './AuthFinish';
import { Recovery, RecoveryFix } from './AuthRecovery';
import { EidBook } from './AuthEidApply';
import { isBiometricSupported, hasEnrolledBiometric, authenticateBiometric, enrolBiometric, clearBiometric } from './biometric';
import { recognizeImage, parseFields } from '../../lib/ocr';
import { findByEid, findByDocument, toSessionGov, GOV_CITIZENS } from '../../state/govRegistry';
import { formatEidDate } from '../eid/eidData';

const CONTACT_PLACEHOLDER = { phone: '••• ••• 4820', email: 'n••••••@example.gy' };

// The one demo citizen who holds an e-ID — used when a create-account flow
// discovers "you have an e-ID" without a specific number to look up.
const EID_CITIZEN = GOV_CITIZENS.find((c) => c.hasEid) || null;

// Masked contact channels for whichever gov record is in play, falling back to
// the generic placeholder before any record is resolved.
function contactChannels(citizen) {
  return {
    phone: citizen?.phoneMasked || CONTACT_PLACEHOLDER.phone,
    email: citizen?.emailMasked || CONTACT_PLACEHOLDER.email,
  };
}

function makeInitialState(persona) {
  const [first = '', ...rest] = (persona?.name || '').split(' ');
  return {
    authStep: 'splash',
    authIntent: 'signin', // 'signin' | 'create'

    govStep: 'choose', // choose | how | number
    govIdType: '',
    govIdValue: '',
    govIdError: '',
    govIdBusy: false,

    contactMode: 'phone',
    contactValue: '',
    contactError: '',
    contactBusy: false,

    otpValue: '', otpError: '', otpTries: 0, otpSeconds: 45, otpExpired: false,
    otpSource: 'contact', // contact | otherways | govrecord | registry | manual
    otpBusy: false,

    signInPassword: '', signInPassError: '',

    eidCardNo: '', eidDob: '', eidCardError: '', eidReadTries: 0,

    consentFrom: 'lookup', // lookup | recovery
    consentBusy: false,
    discoverResult: null, // 'eid' | 'citizen' | 'unresolved' | null

    // The government record resolved from the number/e-ID the citizen gave us
    // (see govRegistry). Everything the "we found your record" screens show, and
    // everything we prepopulate the new account with, comes from here.
    govCitizen: null,
    eidSignInError: '',

    manualFields: { first, last: rest.join(' '), dob: '', country: '', gender: '', phone: '', email: '', password: '' },
    docType: '', docUploaded: false, manualDocNo: '', limitedReason: 'nodoc',
    manualScan: { status: 'idle', pct: 0, text: '', error: '' },

    setupEmail: '', setupPass: '', setupError: '',

    accountLevel: 'basic',

    // Where the "Confirm it's really you" face check continues to once the
    // capture passes: 'record' (gov-record path → book e-ID / set up account)
    // or 'link' (e-ID path → confirm the record link).
    polNext: 'record',

    // Real device biometric (WebAuthn) — populated by a probe when the flow opens.
    bioProbed: false, bioSupported: false, bioEnrolled: false, bioBusy: false, bioError: '',

    // Default e-ID application booked when a citizen signs up with a TIN or
    // passport (i.e. they don't already have an e-ID).
    eidApplied: false, eidApptOffice: '', eidApptDate: '', eidApptTime: '',

    recoveryFrom: 'identifier', recoveryReason: null,
  };
}

export default function AuthFlow({ gate = false }) {
  const { isOpen, closeOverlay, persona, showToast, signIn, addNotification, addAppointment, addApplication, connectAgency } = useAppState();
  const open = gate || isOpen('auth');
  const [st, setSt] = useState(() => makeInitialState(persona));
  const timers = useRef([]);
  const otpTick = useRef(null);

  const after = (ms, fn) => { const id = setTimeout(fn, ms); timers.current.push(id); return id; };
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (otpTick.current) { clearInterval(otpTick.current); otpTick.current = null; }
  };

  // Every time the flow (re)opens it boots at the splash screen — this is a
  // gate the rest of the app reaches via openOverlay('auth'), not a wizard
  // that resumes where a previous session left off.
  useEffect(() => {
    if (open) { clearTimers(); setSt(makeInitialState(persona)); }
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => clearTimers, []);

  // Probe the device once the flow opens: can it do a platform biometric, and is
  // a passkey already enrolled here? Drives which sign-in button we show.
  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    isBiometricSupported().then((supported) => {
      if (alive) setSt((s) => ({ ...s, bioProbed: true, bioSupported: supported, bioEnrolled: hasEnrolledBiometric() }));
    });
    return () => { alive = false; };
  }, [open]);

  const patch = (obj) => setSt({ ...st, ...obj });

  const startOtpClock = () => {
    if (otpTick.current) clearInterval(otpTick.current);
    // Functional form so this always lands on top of whatever the caller
    // just set a moment earlier in the same handler (authStep, otpSource…).
    setSt((s) => ({ ...s, otpSeconds: 45, otpExpired: false }));
    otpTick.current = setInterval(() => {
      setSt((s) => {
        if (s.otpSeconds <= 1) return { ...s, otpSeconds: 0, otpExpired: true, otpError: 'That code ran out. Ask us for a new one.' };
        return { ...s, otpSeconds: s.otpSeconds - 1 };
      });
    }, 1000);
  };

  // Snapshot who just signed in / registered, for the persisted session. The
  // create-account paths all terminate on a user tap (onboarding "Go to Home"),
  // so `st` is current here; the sign-in paths are method 'returning'.
  // `citizen` is the resolved government record (govRegistry) when one was
  // matched — passed explicitly where a timeout fires before state settles.
  const buildUser = (citizen = st.govCitizen, level = st.accountLevel) => {
    const create = st.authIntent === 'create';
    const method = !create ? 'returning'
      : (st.govIdType === 'e-ID' || st.discoverResult === 'eid') ? 'eid'
        : st.govIdType ? st.govIdType // 'TIN' | 'Passport' | 'National ID' | "Driver's licence"
          : 'manual';
    // Whether the citizen already holds an e-ID drives what the app shows and
    // whether a Service Centre visit still has to be booked.
    const hasEid = citizen ? citizen.hasEid : st.discoverResult === 'eid';
    const eidStatus = hasEid ? 'issued' : st.eidApplied ? 'applied' : 'none';
    // A matched government record (or a linked e-ID) is a complete profile;
    // a hand-typed manual account is not until an officer reviews it.
    const profileComplete = !!citizen || !create || st.discoverResult === 'eid';
    // Prefer the matched record's name, then whatever the citizen typed/scanned
    // in the manual flow; fall back to a neutral label so the header is never blank.
    const m = st.manualFields || {};
    const enteredName = [m.first, m.last].map((s) => (s || '').trim()).filter(Boolean).join(' ');
    return {
      name: citizen?.name || enteredName || 'Citizen',
      method,
      verificationLevel: citizen ? 'verified' : create ? level : 'verified', // 'verified' | 'basic'
      profileComplete,
      // Whether a sign-in password exists on the account. The e-ID path never
      // asks for one, so the profile's Sign-in & Security section surfaces it
      // as a pending field until the citizen sets one.
      passwordSet: !create || !!(st.setupPass || m.password),
      eidStatus, // 'issued' | 'applied' | 'none'
      eidNo: citizen?.eidNo || null,
      eidApplied: !!st.eidApplied,
      eidAppointment: st.eidApplied ? { office: st.eidApptOffice, date: st.eidApptDate, time: st.eidApptTime } : null,
      gov: toSessionGov(citizen), // masked contacts, TIN, address, etc. for prepopulation
    };
  };

  const finish = (msg, citizen = st.govCitizen, level) => {
    clearTimers();
    signIn(buildUser(citizen, level));
    // Every agency the government record links this citizen to comes in with
    // them — pulled from the master list, never a hand-picked few (backlog 1.5).
    (citizen?.linkedAgencies || []).forEach((id) => connectAgency(id));
    // A citizen who registered without an e-ID has one started for them, with a
    // Service Centre visit booked. Surface it as a real appointment, a tracked
    // application, and a first notification so the whole thing is coherent.
    if (st.eidApplied) {
      const today = new Date().toISOString().slice(0, 10);
      if (st.eidApptDate) {
        addAppointment({
          id: 'appt-eid',
          agency: 'mops',
          title: 'e-ID enrolment appointment',
          location: st.eidApptOffice || 'MoPS Service Centre — Georgetown',
          date: st.eidApptDate,
          time: st.eidApptTime,
        });
      }
      addApplication({
        id: 'app-eid',
        type: 'eid',
        agency: 'mops',
        title: 'National e-ID Card',
        status: 'Appointment booked',
        step: 1,
        totalSteps: 4,
        submittedOn: today,
        eta: st.eidApptDate ? formatEidDate(st.eidApptDate) : '',
        documents: [],
        pendingActions: [{ label: 'Attend your Service Centre visit' }],
      });
      addNotification({
        agency: 'mops', icon: 'fingerprint', title: 'e-ID application started',
        body: st.eidApptDate
          ? 'Your Service Centre visit is booked. Attend it to finish your e-ID.'
          : 'Complete your profile to speed things up.',
      });
    }
    if (msg) showToast(msg);
    closeOverlay('auth');
  };

  // The account is settled — no onboarding interstitials. Land the citizen
  // straight on Home with a welcome and their agencies already gathered
  // (backlog 1.4: "you just boom, take them in, that's it").
  const settle = (level) => {
    const first = (st.govCitizen?.firstName || st.manualFields?.first || '').trim();
    finish(first ? `Welcome, ${first}` : 'Welcome to My Guyana', st.govCitizen, level);
  };

  const govStartCheck = () => {
    setSt((s) => ({ ...s, authStep: 'govcheck', govIdType: s.govIdType || 'National ID' }));
    after(1500, () => {
      setSt((s) => {
        const typed = (s.govIdValue || '').trim();
        // Explicit demo escape hatch, then a real registry lookup by the typed
        // number. The scan path carries no number, so it resolves to the
        // primary demo citizen (their sample card is what gets scanned).
        const forcedNoRecord = typed.replace(/\D/g, '') === '9999';
        const citizen = forcedNoRecord
          ? null
          : findByDocument(s.govIdType, typed) || (!typed ? EID_CITIZEN : null);
        if (!citizen) {
          return { ...s, authStep: 'norecord', discoverResult: 'unresolved', govCitizen: null };
        }
        return {
          ...s,
          authStep: 'confirmid',
          discoverResult: 'citizen',
          govCitizen: citizen,
          setupEmail: s.setupEmail || citizen.email || '',
        };
      });
    });
  };

  const on = {
    // --- splash ---
    signInGo: () => patch({ authStep: 'signin-device', authIntent: 'signin' }),
    createAccount: () => patch({
      authStep: 'govid', authIntent: 'create', consentFrom: 'lookup', govStep: 'choose',
      govIdType: '', govIdValue: '', govIdError: '', discoverResult: null,
    }),
    backToSplash: () => patch({ authStep: 'splash', contactValue: '', contactError: '', otpError: '' }),

    // --- sign in: device / other ways / password ---
    // Real biometric: pops the device Face ID / Touch ID / fingerprint prompt.
    // On success we show the capture animation briefly, then go in. On any
    // failure we surface a recoverable message and keep the OTP/password paths.
    startFaceSignIn: async () => {
      setSt((s) => ({ ...s, bioBusy: true, bioError: '' }));
      const res = await authenticateBiometric();
      if (res.ok) {
        setSt((s) => ({ ...s, bioBusy: false, authStep: 'face' }));
        after(1200, () => finish('Welcome back'));
        return;
      }
      // Nothing enrolled on this device yet — flip the button to "set up" instead.
      if (res.reason === 'noenrol') { setSt((s) => ({ ...s, bioBusy: false, bioEnrolled: false, bioError: '' })); return; }
      setSt((s) => ({ ...s, bioBusy: false, bioError: res.message }));
    },
    // First-time on this device: enrol a platform passkey, then go in.
    enrolBiometricNow: async () => {
      setSt((s) => ({ ...s, bioBusy: true, bioError: '' }));
      const res = await enrolBiometric({ name: persona?.name || 'My Guyana citizen', displayName: persona?.name || 'My Guyana citizen' });
      if (res.ok) {
        setSt((s) => ({ ...s, bioBusy: false, bioEnrolled: true, authStep: 'face' }));
        after(1200, () => finish('Welcome back'));
        return;
      }
      setSt((s) => ({ ...s, bioBusy: false, bioError: res.message }));
    },
    // The device says it's enrolled but the passkey no longer works (e.g. it was
    // deleted from the browser/OS). WebAuthn won't tell us that, so let the
    // citizen forget the stale record and enrol a fresh passkey in one tap.
    bioResetEnrol: async () => {
      clearBiometric();
      setSt((s) => ({ ...s, bioEnrolled: false, bioError: '', bioBusy: true }));
      const res = await enrolBiometric({ name: persona?.name || 'My Guyana citizen', displayName: persona?.name || 'My Guyana citizen' });
      if (res.ok) {
        setSt((s) => ({ ...s, bioBusy: false, bioEnrolled: true, authStep: 'face' }));
        after(1200, () => finish('Welcome back'));
        return;
      }
      // Enrolment cancelled/failed → stay on the setup state so they can retry.
      setSt((s) => ({ ...s, bioBusy: false, bioEnrolled: false, bioError: res.message }));
    },
    otherWays: () => patch({ authStep: 'otherways', signInPassError: '' }),
    otherWaysBack: () => patch({ authStep: 'signin-device' }),
    useOtherAccount: () => patch({ authStep: 'identifier', authIntent: 'signin', contactValue: '', contactError: '' }),

    // --- sign in with e-ID: tap the card (NFC) or scan/upload it (OCR). We never
    // ask for the number by hand. Either way we resolve the citizen, then send a
    // one-time code (MFA) before showing their profile. ---
    signInWithEid: () => patch({ authStep: 'eid-signin', authIntent: 'signin', eidSignInError: '' }),
    goToEidOtp: (citizen) => {
      setSt((s) => ({ ...s, govCitizen: citizen, contactMode: 'phone', contactValue: citizen.phoneMasked, otpSource: 'eidsignin', authStep: 'otp', otpValue: '', otpError: '', otpTries: 0, otpExpired: false }));
      startOtpClock();
    },
    eidSignInTap: () => {
      const citizen = EID_CITIZEN;
      patch({ authStep: 'idscan', eidSignInError: '' });
      after(1500, () => {
        if (!citizen) { setSt((s) => ({ ...s, authStep: 'eid-signin', eidSignInError: 'No e-ID could be read. Try scanning it instead.' })); return; }
        on.goToEidOtp(citizen);
      });
    },
    eidSignInScanFile: async (file) => {
      if (!file) return;
      patch({ authStep: 'idscan', eidSignInError: '' });
      try {
        const text = await recognizeImage(file);
        const parsed = parseFields(text);
        // e-ID numbers follow the MoPS 3-5-4 format, e.g. GUY-04471-0928 (backlog 1.1).
        const num = parsed.documentNumber || (text.match(/\b[A-Z]{2,3}-?\d{5}-?\d{4}\b/i)?.[0]) || '';
        const citizen = findByEid(num);
        if (!citizen) {
          setSt((s) => ({ ...s, authStep: 'eid-signin', eidSignInError: "We couldn't read a known e-ID from that image. Try tapping the card, or create an account." }));
          return;
        }
        after(300, () => on.goToEidOtp(citizen));
      } catch {
        setSt((s) => ({ ...s, authStep: 'eid-signin', eidSignInError: 'We could not read that card. Try tapping it instead.' }));
      }
    },
    signInSendCode: (channel) => {
      patch({ contactMode: channel, otpSource: 'otherways', contactValue: CONTACT_PLACEHOLDER[channel], authStep: 'otp', otpValue: '', otpError: '', otpTries: 0, otpExpired: false });
      startOtpClock();
    },
    usePassword: () => patch({ authStep: 'password', signInPassword: '', signInPassError: '' }),
    recoverFromOtherWays: () => patch({ authStep: 'recovery', recoveryFrom: 'otherways' }),
    updateSignInPassword: (e) => patch({ signInPassword: e.target.value, signInPassError: '' }),
    forgotPassword: () => { patch({ authStep: 'otherways' }); showToast('Send yourself a code instead — you can set a new password once you are in'); },
    submitPassword: () => {
      if (st.signInPassword.length < 4) { patch({ signInPassError: 'Enter your password to continue.' }); return; }
      patch({ authStep: 'face', signInPassError: '' });
      after(1500, () => finish('Welcome back'));
    },

    // --- identifier (contact-first entry) ---
    updateContact: (e) => patch({ contactValue: e.target.value, contactError: '' }),
    toggleContactMode: () => patch({ contactMode: st.contactMode === 'phone' ? 'email' : 'phone', contactValue: '', contactError: '' }),
    submitContact: () => {
      const v = st.contactValue.trim();
      if (v === '0') {
        patch({ contactError: st.contactMode === 'phone' ? 'Enter a 7-digit mobile number, without the country code.' : 'That email address does not look right. Check for a missing @ or a typo.' });
        return;
      }
      patch({ contactBusy: true, contactError: '' });
      after(1100, () => {
        setSt((s) => ({ ...s, contactBusy: false, authStep: 'otp', otpSource: 'contact', otpValue: '', otpError: '', otpTries: 0, otpExpired: false }));
        startOtpClock();
      });
    },
    cantReceiveCode: () => patch({ authStep: 'recovery', recoveryFrom: 'identifier' }),
    noAccountCreate: () => patch({ authIntent: 'create', authStep: 'govid', govStep: 'choose', consentFrom: 'lookup' }),
    noAccountChange: () => patch({ authStep: 'identifier', contactValue: '', contactError: '' }),

    // --- gov-id document lookup (create-account, stage 1) ---
    govStepBack: () => patch(
      st.govStep === 'number' ? { govStep: 'choose' }
        : st.govStep === 'how' ? { govStep: 'choose' }
          : { authStep: 'splash' },
    ),
    govPickType: (t) => {
      if (t === 'e-ID') {
        patch({ govIdType: t, authStep: st.consentFrom === 'recovery' ? 'eid-auth' : 'consent', discoverResult: null });
        return;
      }
      patch({ govIdType: t, govStep: 'how', govIdValue: '', govIdError: '' });
    },
    govChooseType: () => patch({ govStep: 'choose' }),
    govHowTypeIt: () => patch({ govStep: 'number', govIdError: '' }),
    govScanStart: () => { patch({ authStep: 'govscan' }); after(1800, govStartCheck); },
    updateGovId: (e) => patch({ govIdValue: e.target.value, govIdError: '' }),
    govIdSubmit: () => {
      const v = (st.govIdValue || '').trim();
      if (!v) { patch({ govIdError: 'Type the number just as it appears on your document.' }); return; }
      patch({ govIdBusy: true, govIdError: '' });
      after(400, () => {
        if (v.replace(/\D/g, '') === '0000') {
          setSt((s) => ({ ...s, govIdBusy: false, govIdError: 'No record with that number came back. Check the number, or continue without it.' }));
          return;
        }
        setSt((s) => ({ ...s, govIdBusy: false }));
        govStartCheck();
      });
    },
    govIdNone: () => patch({ authStep: 'manual', discoverResult: 'unresolved' }),
    noRecordAnotherDoc: () => patch({ authStep: 'govid', govStep: 'choose', govIdValue: '', govIdError: '' }),
    noRecordManual: () => patch({ authStep: 'manual', discoverResult: 'unresolved' }),
    govIdBack: () => patch(st.otpSource === 'manual' ? { authStep: 'manual' } : { authStep: 'govid', govStep: 'choose', govIdError: '' }),
    confirmIsMe: () => patch({ authStep: 'govcontact' }),
    confirmNotMe: () => patch({ authStep: 'notme' }),
    notMeTryAgain: () => patch({ authStep: 'govid', govStep: 'number', govIdValue: '', govIdError: '' }),
    notMeReport: () => { patch({ authStep: 'govid', govStep: 'choose', govIdValue: '', govIdError: '' }); showToast('Reported. Government will look into that record.'); },
    govSendCode: (channel) => {
      patch({ contactMode: channel, otpSource: 'govrecord', contactValue: contactChannels(st.govCitizen)[channel], authStep: 'otp', otpValue: '', otpError: '', otpTries: 0, otpExpired: false });
      startOtpClock();
    },
    govContactWrong: () => patch({ authStep: 'contacthelp' }),
    contactHelpBack: () => patch({ authStep: 'govcontact' }),
    contactHelpOtherDoc: () => patch({ authStep: 'govid', govStep: 'choose', govIdValue: '', govIdError: '' }),
    contactHelpManual: () => patch({ authStep: 'manual' }),

    // --- discovery: consent -> proof -> e-ID auth -> link / mismatch ---
    authStepBack: () => {
      const map = { consent: 'govid', proof: 'consent', manual: 'govid', 'link-confirm': 'proof' };
      const back = map[st.authStep] || 'splash';
      patch(back === 'govid' ? { authStep: 'govid', govStep: 'choose', govIdError: '' } : { authStep: back });
    },
    consentAgree: () => {
      const isEid = st.govIdType === 'e-ID';
      const fromLookup = st.consentFrom === 'lookup';
      patch({ consentBusy: true });
      after(1300, () => {
        setSt((s) => (fromLookup
          ? {
            ...s, consentBusy: false, discoverResult: isEid ? 'eid' : 'citizen',
            // "You have an e-ID" resolves to the demo e-ID holder so the
            // confirm/link screens show a real record.
            govCitizen: isEid ? EID_CITIZEN : s.govCitizen,
            setupEmail: s.setupEmail || (isEid ? EID_CITIZEN?.email : '') || '',
            authStep: 'proof',
          }
          : { ...s, consentBusy: false, authStep: 'eid-auth' }));
      });
    },
    consentDecline: () => {
      if (st.consentFrom === 'lookup') { settle('basic'); return; }
      patch({ authStep: 'proof' });
    },
    consentDemoNoRecord: () => patch({ authStep: 'manual', discoverResult: 'unresolved' }),
    proofTap: () => patch({ authStep: 'eid-auth' }),
    // Verify by scanning the physical ID card: real on-device OCR reads it, then
    // the "Confirm it's really you" face check runs before the record link.
    proofScanFile: async (file) => {
      if (!file) return;
      patch({ authStep: 'idscan' });
      try {
        await recognizeImage(file);
        after(400, () => setSt((s) => ({ ...s, polNext: 'link', authStep: 'pol' })));
      } catch {
        setSt((s) => ({ ...s, authStep: 'proof' }));
        showToast('We could not read that card. Try another way to verify.');
      }
    },
    proofOtherMethod: () => showToast('Other verification methods are still being confirmed with the identity team'),
    eidGoAlt: () => patch({ authStep: st.consentFrom === 'recovery' ? 'recovery-fix' : 'proof', eidCardError: '' }),
    eidAuthTap: () => {
      const recovery = st.consentFrom === 'recovery';
      after(700, () => {
        if (recovery) { finish('Signed in with your e-ID'); return; }
        // Card read — now confirm it's really them before linking the record.
        setSt((s) => ({ ...s, polNext: 'link', authStep: 'pol' }));
      });
    },
    eidReadFailed: () => patch({ authStep: 'eid-fail', eidReadTries: (st.eidReadTries || 0) + 1 }),
    eidFailRetry: () => patch({ authStep: 'eid-auth' }),
    eidUseCardNumber: () => patch({ authStep: 'eid-card', eidCardError: '' }),
    updateEidCardNo: (e) => patch({ eidCardNo: e.target.value.replace(/[^0-9 ]/g, '').slice(0, 14), eidCardError: '' }),
    updateEidDob: (e) => patch({ eidDob: e.target.value, eidCardError: '' }),
    eidCardSubmit: () => {
      if ((st.eidCardNo || '').replace(/\D/g, '').length < 8) { patch({ eidCardError: 'Enter the card number exactly as it appears on the front.' }); return; }
      if (!(st.eidDob || '').trim()) { patch({ eidCardError: 'Enter your date of birth as day, month and year.' }); return; }
      const citizen = findByEid(st.eidCardNo) || EID_CITIZEN;
      patch({ govCitizen: citizen, setupEmail: st.setupEmail || citizen?.email || '', authStep: 'otp', otpSource: 'registry', otpValue: '', otpError: '', otpTries: 0, otpExpired: false, eidCardError: '' });
      startOtpClock();
    },
    linkConfirm: () => settle('verified'),
    linkDecline: () => patch({ authStep: 'mismatch', discoverResult: null, eidCardNo: '', eidDob: '', eidCardError: '' }),
    mismatchAltMethod: () => showToast('An approved alternative is being confirmed with the identity team'),
    // The citizen said the record isn't theirs — continue with a basic account
    // and nothing from that record (no linked agencies, no verified level).
    mismatchContinue: () => finish('Welcome to My Guyana', null, 'basic'),

    // --- OTP / lockout / proof of life / live face check ---
    updateOtp: (e) => patch({ otpValue: e.target.value.replace(/\D/g, '').slice(0, 6), otpError: '' }),
    otpSubmit: () => {
      if (st.otpExpired) { patch({ otpError: 'That code ran out. Ask us for a new one.' }); return; }
      if (st.otpValue.length < 6) { patch({ otpError: 'Enter all six digits.' }); return; }
      if (st.otpValue === '000000') {
        const tries = st.otpTries + 1;
        if (tries >= 3) {
          if (st.otpSource === 'registry' || st.otpSource === 'govrecord') { patch({ otpTries: 0, otpValue: '', authStep: 'blocked' }); return; }
          patch({ otpTries: 0, otpValue: '', otpError: 'That code is wrong. Wait a minute before trying again.' });
          return;
        }
        patch({ otpTries: tries, otpValue: '', otpError: `That code is wrong. ${3 - tries} ${tries === 2 ? 'try' : 'tries'} left.` });
        return;
      }
      if (otpTick.current) { clearInterval(otpTick.current); otpTick.current = null; }
      if (st.otpSource === 'manual') { patch({ otpSource: 'contact', authStep: st.docUploaded ? 'review' : 'limited', limitedReason: 'nodoc' }); return; }
      if (st.otpSource === 'registry') {
        if (st.consentFrom === 'recovery') { finish('Signed in with your e-ID'); return; }
        // Code verified — the face check comes next, on its own screen,
        // before the record link is confirmed (backlog 1.2).
        patch({ otpSource: 'contact', polNext: 'link', authStep: 'pol' });
        return;
      }
      if (st.otpSource === 'govrecord') { patch({ otpSource: 'contact', polNext: 'record', authStep: 'pol' }); return; }
      if (st.otpSource === 'eidsignin') { finish(`Welcome back, ${st.govCitizen?.firstName || ''}`.trim(), st.govCitizen); return; }
      // 'contact' / 'otherways'
      if (st.authIntent === 'signin' && st.contactValue.trim().toLowerCase() === 'new') { patch({ authStep: 'no-account' }); return; }
      finish(st.authIntent === 'signin' ? 'Welcome back' : null);
    },
    otpResend: () => { patch({ otpValue: '', otpError: '' }); startOtpClock(); showToast('New code sent'); },
    otpSwitchChannel: () => {
      const mode = st.contactMode === 'phone' ? 'email' : 'phone';
      patch({ contactMode: mode, contactValue: CONTACT_PLACEHOLDER[mode], otpValue: '', otpError: '', otpExpired: false });
      startOtpClock();
      showToast('New code sent');
    },
    otpBack: () => {
      if (otpTick.current) { clearInterval(otpTick.current); otpTick.current = null; }
      patch({
        authStep: st.otpSource === 'registry' ? 'eid-card'
          : st.otpSource === 'govrecord' ? 'govcontact'
            : st.otpSource === 'eidsignin' ? 'eid-signin'
              : st.otpSource === 'otherways' ? 'otherways'
                : st.otpSource === 'manual' ? 'manual' : 'identifier',
      });
    },
    visitCentre: () => showToast('Nearest centre: Camp Street, Georgetown · 08:00–16:00'),
    polStart: () => {
      const recovery = st.consentFrom === 'recovery';
      patch({ authStep: 'face' });
      after(2200, () => {
        if (recovery) { finish('Signed in with your e-ID'); return; }
        setSt((s) => {
          // e-ID path: the face passed — present the record to link.
          if (s.polNext === 'link') return { ...s, authStep: 'link-confirm' };
          // Gov-record path: no e-ID on record yet → a Service Centre visit
          // must be booked before going any further.
          return { ...s, authStep: (s.authIntent === 'create' && !s.govCitizen?.hasEid) ? 'eid-book' : 'setup' };
        });
      });
    },
    selectEidOffice: (name) => patch({ eidApptOffice: name }),
    selectEidDate: (iso) => patch({ eidApptDate: iso }),
    selectEidTime: (t) => patch({ eidApptTime: t }),
    eidBookConfirm: () => {
      if (!st.eidApptOffice || !st.eidApptDate || !st.eidApptTime) return;
      patch({ eidApplied: true, authStep: 'setup' });
      showToast('e-ID application started · appointment booked');
    },

    // --- manual account creation ---
    updateManual: (key, e) => { const v = e.target.value; patch({ manualFields: { ...st.manualFields, [key]: v } }); },
    updateDocType: (e) => patch({ docType: e.target.value }),
    updateManualDocNo: (e) => patch({ manualDocNo: e.target.value }),
    pickUpload: () => patch({ docUploaded: !st.docUploaded }),
    manualScanFile: async (file) => {
      if (!file) return;
      setSt((s) => ({ ...s, manualScan: { status: 'scanning', pct: 0, text: '', error: '' } }));
      try {
        const text = await recognizeImage(file, (pct) => setSt((s) => ({ ...s, manualScan: { ...s.manualScan, pct } })));
        const parsed = parseFields(text);
        const preview = text.replace(/\s+/g, ' ').trim().slice(0, 220);
        setSt((s) => ({
          ...s,
          docUploaded: true,
          docType: s.docType || 'passport',
          manualDocNo: s.manualDocNo || parsed.documentNumber || '',
          manualFields: {
            ...s.manualFields,
            first: s.manualFields.first || parsed.givenNames || '',
            last: s.manualFields.last || parsed.surname || '',
            dob: s.manualFields.dob || parsed.dob || '',
          },
          manualScan: { status: 'done', pct: 100, text: preview, error: '' },
        }));
        showToast(preview ? 'We read your document — check the details.' : "Couldn't read much — enter details by hand.");
      } catch {
        setSt((s) => ({ ...s, manualScan: { status: 'error', pct: 0, text: '', error: 'Could not read that image. Enter your details by hand.' } }));
      }
    },
    manualSubmit: () => {
      const m = st.manualFields;
      if (!m.first.trim() || !m.last.trim()) { showToast('Enter your first and last name'); return; }
      if (!m.dob) { showToast('Enter your date of birth'); return; }
      if (!(m.email || '').includes('@')) { showToast('Add an email we can reach you on'); return; }
      if ((m.password || '').length < 8) { showToast('Make the password at least 8 characters'); return; }
      patch({ otpSource: 'manual', authStep: 'govcontact' });
    },
    manualSendCode: (channel) => {
      patch({
        otpSource: 'manual', contactMode: channel,
        contactValue: st.manualFields[channel] || CONTACT_PLACEHOLDER[channel],
        authStep: 'otp', otpValue: '', otpError: '', otpTries: 0, otpExpired: false,
      });
      startOtpClock();
    },
    reviewContinue: () => finish("We'll tell you when your document has been checked"),
    reviewDemoPass: () => settle('verified'),
    reviewDemoFail: () => patch({ authStep: 'limited', limitedReason: 'failed' }),
    limitedAddDoc: () => patch({ authStep: 'manual' }),

    // --- finishing: set up the account, then straight to Home ---
    updateSetupEmail: (e) => patch({ setupEmail: e.target.value, setupError: '' }),
    updateSetupPass: (e) => patch({ setupPass: e.target.value, setupError: '' }),
    setupSubmit: () => {
      if (!(st.setupEmail || '').includes('@')) { patch({ setupError: 'Add an email we can reach you on.' }); return; }
      if ((st.setupPass || '').length < 8) { patch({ setupError: 'Make the password at least 8 characters.' }); return; }
      // Password created → straight to Home. Face ID for this device can be
      // turned on any time from the profile (backlog 1.4).
      settle('verified');
    },

    // --- recovery ---
    recoveryBack: () => patch({ authStep: st.recoveryFrom === 'otherways' ? 'otherways' : 'identifier', contactError: '' }),
    pickRecoveryReason: (id) => patch({ recoveryReason: id, authStep: 'recovery-fix' }),
    recoveryFixBack: () => patch({ authStep: 'recovery' }),
    recoveryEditContact: () => patch({ authStep: 'identifier', contactValue: '', contactError: '' }),
    recoveryResend: () => { patch({ otpValue: '', otpError: '' }); startOtpClock(); showToast('New code sent'); },
    recoverySwitchChannel: () => {
      patch({ contactMode: 'email', contactValue: CONTACT_PLACEHOLDER.email, authStep: 'otp', otpValue: '', otpError: '', otpTries: 0, otpExpired: false });
      startOtpClock();
      showToast('Code sent to your email');
    },
    recoveryUseDocument: () => patch({ authStep: 'govid', govStep: 'choose', consentFrom: 'recovery', govIdType: '', govIdValue: '', govIdError: '' }),
    recoveryFace: () => { patch({ authStep: 'face' }); after(1800, () => finish('Signed in with your e-ID')); },
    recoveryAskGov: () => showToast('Ask Gov opens once you are signed in'),
    recoveryCentre: () => showToast('Nearest centre: Camp Street, Georgetown · 08:00–16:00'),
  };

  if (!open) return null;

  let ScreenNode;
  switch (st.authStep) {
    case 'signin-device': ScreenNode = <SignInDevice st={st} on={on} persona={persona} />; break;
    case 'eid-signin': ScreenNode = <EidSignIn st={st} on={on} />; break;
    case 'otherways': ScreenNode = <OtherWays st={st} on={on} />; break;
    case 'password': ScreenNode = <PasswordScreen st={st} on={on} persona={persona} />; break;
    case 'identifier': ScreenNode = <IdentifierScreen st={st} on={on} />; break;
    case 'no-account': ScreenNode = <NoAccount st={st} on={on} />; break;

    case 'govid': ScreenNode = <GovId st={st} on={on} />; break;
    case 'govscan': ScreenNode = <GovScan />; break;
    case 'idscan': ScreenNode = <GovScan />; break;
    case 'govcheck': ScreenNode = <GovCheck st={st} />; break;
    case 'norecord': ScreenNode = <NoRecord st={st} on={on} />; break;
    case 'confirmid': ScreenNode = <ConfirmId st={st} on={on} persona={st.govCitizen || persona} />; break;
    case 'notme': ScreenNode = <NotMe on={on} />; break;
    case 'govcontact': ScreenNode = <GovContact st={st} on={on} />; break;
    case 'contacthelp': ScreenNode = <ContactHelp on={on} />; break;

    case 'consent': ScreenNode = <Consent st={st} on={on} />; break;
    case 'proof': ScreenNode = <Proof st={st} on={on} />; break;
    case 'eid-auth': ScreenNode = <EidAuth on={on} />; break;
    case 'eid-fail': ScreenNode = <EidFail on={on} />; break;
    case 'eid-card': ScreenNode = <EidCard st={st} on={on} />; break;
    case 'link-confirm': ScreenNode = <LinkConfirm persona={st.govCitizen || persona} on={on} />; break;
    case 'mismatch': ScreenNode = <Mismatch on={on} />; break;

    case 'otp': ScreenNode = <Otp st={st} on={on} />; break;
    case 'blocked': ScreenNode = <Blocked on={on} />; break;
    case 'pol': ScreenNode = <Pol on={on} />; break;
    case 'face': ScreenNode = <FaceCheck />; break;

    case 'manual': ScreenNode = <Manual st={st} on={on} />; break;
    case 'review': ScreenNode = <Review on={on} />; break;
    case 'limited': ScreenNode = <Limited st={st} on={on} />; break;

    case 'eid-book': ScreenNode = <EidBook st={st} on={on} />; break;

    case 'setup': ScreenNode = <Setup st={st} on={on} persona={st.govCitizen || persona} />; break;

    case 'recovery': ScreenNode = <Recovery on={on} />; break;
    case 'recovery-fix': ScreenNode = <RecoveryFix st={st} on={on} />; break;

    case 'splash':
    default: ScreenNode = <AuthSplash onSignIn={on.signInGo} onCreateAccount={on.createAccount} />;
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1000, overflow: 'hidden', background: 'var(--surface-1)', fontFamily: 'var(--font-sans)' }}>
      {ScreenNode}
    </div>
  );
}
