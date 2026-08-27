import { useEffect, useRef, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';
import { AGENCIES, SERVICE_CENTRES } from '../../state/mockData';
import { AGENCY_HUBS, agencyCategoryId, SERVICE_ACCESS } from '../../lib/serviceCatalog';

// Ask Gov, scoped per review (backlog 4.1): information, pointing the citizen
// to the right service, eligibility, and application status. Every answer that
// names a service or an application carries deep-link buttons that land ON the
// page in question (4.3) — "Apply now" opens the passport flow, "Renew your
// passport" opens it pre-set to renewal, a status answer opens that very
// application's tracking page over My applications. No transaction ever
// happens inside the chat. Opened from inside a service, the quick actions
// are scoped to that service (4.2).

// -- canned copy --------------------------------------------------------

const GREETING = "Hi, I'm Ask Gov. Ask me about any service — I'll explain it and take you straight there — or ask where an application stands.";

const CHIPS = [
  { id: 'status', label: "Where's my application?", prompt: "What's the status of my applications?" },
  { id: 'passport', label: 'Passport', prompt: 'Tell me about the passport service' },
  { id: 'nis', label: 'Apply for an NIS benefit', prompt: 'How do I apply for an NIS benefit?' },
  { id: 'bill', label: 'Pay my electricity bill', prompt: 'How do I pay my electricity bill?' },
  { id: 'pension', label: 'Pension eligibility', prompt: 'Am I eligible for a pension?' },
  { id: 'appt', label: 'Book an appointment near me', prompt: 'Book an appointment at the nearest MoPS office' },
];

// Per-service context (4.2): opened from inside a service, the quick actions
// are that service's questions, not the generic set.
const CONTEXTS = {
  passport: {
    title: 'Guyana Passport',
    chips: [
      { id: 'p-apply', label: 'Apply for a passport', prompt: 'How do I apply for a passport?' },
      { id: 'p-renew', label: 'Renew my passport', prompt: 'How do I renew my passport?' },
      { id: 'p-docs', label: 'Documents required', prompt: 'What documents do I need for my passport?' },
      { id: 'p-status', label: 'Track my passport application', prompt: "What's the status of my passport application?" },
    ],
  },
  cashGrant: {
    title: 'Cash Grant',
    chips: [
      { id: 'c-elig', label: 'Am I eligible?', prompt: 'Am I eligible for the cash grant?' },
      { id: 'c-docs', label: 'Documents required', prompt: 'What documents do I need for the cash grant?' },
      { id: 'c-status', label: 'Track my application', prompt: "What's the status of my cash grant application?" },
    ],
  },
  // The seeded services are keyed by their service id, which is what
  // ServiceView / ServiceApply pass in as the Ask Gov context.
  svc_cash_grant: {
    title: 'Cash Grant',
    chips: [
      { id: 'c-elig', label: 'Am I eligible?', prompt: 'Am I eligible for the cash grant?' },
      { id: 'c-docs', label: 'Documents required', prompt: 'What documents do I need for the cash grant?' },
      { id: 'c-status', label: 'Track my application', prompt: "What's the status of my cash grant application?" },
    ],
  },
  svc_sw_water_connection: {
    title: 'Water connection',
    chips: [
      { id: 'w-empty', label: 'My plot is empty', prompt: 'What happens if my plot is empty?' },
      { id: 'w-need', label: 'What do I need first?', prompt: 'What do I need before applying for a water connection?' },
      { id: 'w-who', label: 'Who reviews it?', prompt: 'Which agencies review a water connection?' },
    ],
  },
  svc_sw_construction_permit: {
    title: 'Construction permit',
    chips: [
      { id: 'p-who', label: 'Who reviews my plan?', prompt: 'Which agencies review my building plan?' },
      { id: 'p-need', label: 'What do I need first?', prompt: 'What do I need before applying for a construction permit?' },
    ],
  },
  svc_sw_power_connection: {
    title: 'Power connection',
    chips: [
      { id: 'e-need', label: 'What do I need first?', prompt: 'What do I need before applying for a power connection?' },
      { id: 'e-who', label: 'Who reviews it?', prompt: 'Which agencies review a power connection?' },
    ],
  },
  svc_sw_construction_utilities: {
    title: 'Construction utilities',
    chips: [
      { id: 'u-need', label: 'What do I need first?', prompt: 'What do I need before applying for construction utilities?' },
      { id: 'u-what', label: 'What is the Single Window?', prompt: 'What is the Single Window?' },
    ],
  },
  svc_gro_birth: {
    title: 'Birth certificate',
    chips: [
      { id: 'b-no', label: 'Where is my registration number?', prompt: 'Where do I find my registration number?' },
      { id: 'b-how', label: 'How does this work?', prompt: 'How do I get my birth certificate?' },
    ],
  },
  svc_gro_death: {
    title: 'Death certificate',
    chips: [
      { id: 'd-no', label: 'Where is my registration number?', prompt: 'Where do I find my registration number?' },
      { id: 'd-how', label: 'How does this work?', prompt: 'How do I get a death certificate?' },
    ],
  },
  svc_gro_marriage: {
    title: 'Marriage certificate',
    chips: [
      { id: 'm-no', label: 'Where is my registration number?', prompt: 'Where do I find my registration number?' },
      { id: 'm-how', label: 'How does this work?', prompt: 'How do I get a marriage certificate?' },
    ],
  },
};

// -- deep-link targets ----------------------------------------------------
// go: { screen? , overlay?, payload? } — a screen change, an overlay, or both
// (screen first, overlay on top of it).
const GO = {
  passportApply: { overlay: 'apply', payload: { serviceId: 'passport' } },
  passportRenew: { overlay: 'apply', payload: { serviceId: 'passport', preset: { applicationType: 'renewal' } } },
  passportReplace: { overlay: 'apply', payload: { serviceId: 'passport', preset: { applicationType: 'replacement' } } },
  immigrationServices: { overlay: 'category', payload: { id: 'cat-immigration' } },
  cashGrant: { overlay: 'serviceView', payload: { serviceId: 'svc_cash_grant' } },
  singleWindow: { overlay: 'singleWindow' },
  waterConnection: { overlay: 'serviceView', payload: { serviceId: 'svc_sw_water_connection' } },
  constructionPermit: { overlay: 'serviceView', payload: { serviceId: 'svc_sw_construction_permit' } },
  powerConnection: { overlay: 'serviceView', payload: { serviceId: 'svc_sw_power_connection' } },
  constructionUtilities: { overlay: 'serviceView', payload: { serviceId: 'svc_sw_construction_utilities' } },
  groBirth: { overlay: 'serviceView', payload: { serviceId: 'svc_gro_birth' } },
  groDeath: { overlay: 'serviceView', payload: { serviceId: 'svc_gro_death' } },
  groMarriage: { overlay: 'serviceView', payload: { serviceId: 'svc_gro_marriage' } },
  financeServices: { overlay: 'category', payload: { id: 'cat-finance' } },
  nisHub: { screen: 'nis' },
  nisRegister: { overlay: 'nisReg' },
  socialServices: { overlay: 'category', payload: { id: 'cat-social' } },
  benefit: (type) => ({ overlay: 'benefit', payload: { type } }),
  gplHub: { screen: 'gpl' },
  gplPay: { overlay: 'gplPay' },
  gplOutage: { overlay: 'gplOutage' },
  gplNew: { overlay: 'onboard', payload: { agency: 'gpl', intent: 'new' } },
  utilityServices: { overlay: 'category', payload: { id: 'cat-utilities' } },
  mopsHub: { screen: 'mops' },
  vault: { screen: 'vault' },
  eidApply: { overlay: 'eid' },
  identityServices: { overlay: 'category', payload: { id: 'cat-id' } },
  applications: { screen: 'applications' },
  calendar: { screen: 'calendar' },
  wallet: { screen: 'wallet' },
  services: { screen: 'services' },
};

const act = (label, icon, go) => ({ label, icon, go });

// -- application status (4.1) --------------------------------------------

// Which application a question is about, by the words the citizen uses.
const APP_MATCHERS = [
  { keys: ['passport'], ids: ['passport'], label: 'passport', apply: act('Apply for a passport', 'plane', GO.passportApply) },
  { keys: ['cash grant', 'grant'], ids: ['cashGrant'], label: 'cash grant', apply: act('Check eligibility and apply', 'banknote', GO.cashGrant) },
  { keys: ['e-id', 'eid', 'digital id', 'id card'], ids: ['eid'], label: 'e-ID', apply: act('Apply for an e-ID', 'fingerprint', GO.eidApply) },
  { keys: ['nis registration', 'registration', 'register'], ids: ['nisReg'], label: 'NIS registration', apply: act('Register with NIS', 'badge-check', GO.nisRegister) },
  { keys: ['sickness'], ids: ['sickness'], label: 'sickness benefit', apply: act('Apply for Sickness Benefit', 'thermometer', GO.benefit('sickness')) },
  { keys: ['maternity'], ids: ['maternity'], label: 'maternity benefit', apply: act('Apply for Maternity Benefit', 'baby', GO.benefit('maternity')) },
  { keys: ['funeral'], ids: ['funeral'], label: 'funeral grant', apply: act('Apply for the Funeral Grant', 'flower-2', GO.benefit('funeral')) },
  { keys: ['connection', 'new electricity'], ids: ['gpl-new'], label: 'new electricity connection', apply: act('Apply for a new connection', 'plug', GO.gplNew) },
];

function appMatches(a, m) {
  const keys = [a.serviceId, a.type, a.id].filter(Boolean).map((k) => String(k).toLowerCase());
  return m.ids.some((id) => keys.some((k) => k.includes(id.toLowerCase())));
}

// Plain words for where an application stands.
function statusPhrase(status = '') {
  const s = status.toLowerCase();
  if (s.includes('approv') || s.includes('issued') || s.includes('ready') || s.includes('complete')) return 'approved';
  if (s.includes('reject') || s.includes('denied') || s.includes('disallow')) return 'not approved';
  if (s.includes('appointment') || s.includes('booked')) return 'waiting for your Service Centre visit';
  if (s.includes('action') || s.includes('missing') || s.includes('waiting on')) return 'waiting on something from you';
  return 'under review';
}

// Land on My applications with this application's tracking page on top —
// closing the details leaves the citizen on My applications.
const trackAction = (a) => act(`${a.title} — details`, 'route', { screen: 'applications', overlay: 'track', payload: a });

function statusReply(text, applications) {
  const t = text.toLowerCase();
  const asked = APP_MATCHERS.find((m) => m.keys.some((k) => t.includes(k)));
  const apps = applications || [];

  if (asked) {
    const mine = apps.filter((a) => appMatches(a, asked));
    if (mine.length === 0) {
      return {
        text: `You haven't applied for a ${asked.label} yet${asked.apply ? ' — you can start right here.' : '.'}`,
        actions: [asked.apply, act('My applications', 'route', GO.applications)].filter(Boolean),
      };
    }
    const a = mine[0];
    const step = a.step && a.totalSteps ? ` (step ${a.step} of ${a.totalSteps})` : '';
    return {
      text: `Your ${a.title} application is currently ${statusPhrase(a.status)}${step}. Tap below for the details.`,
      actions: mine.map(trackAction),
    };
  }

  if (apps.length === 0) {
    return {
      text: "You haven't submitted any applications yet. When you do, I can tell you exactly where each one stands.",
      actions: [act('Browse services', 'layout-grid', GO.services)],
    };
  }
  const lines = apps.slice(0, 3).map((a) => `• ${a.title} — ${statusPhrase(a.status)}${a.step && a.totalSteps ? ` (step ${a.step} of ${a.totalSteps})` : ''}`);
  const more = apps.length > 3 ? `\nAnd ${apps.length - 3} more.` : '';
  return {
    text: `Here's where ${apps.length === 1 ? 'your application stands' : 'your applications stand'}:\n${lines.join('\n')}${more}`,
    actions: apps.slice(0, 3).map(trackAction),
  };
}

// -- services & agencies: what they are, and the links into them (4.3) ------

function passportReply(t, applications) {
  const renew = act('Renew your passport', 'refresh-cw', GO.passportRenew);
  const applyNow = act('Apply now', 'plane', GO.passportApply);
  const all = act('All Immigration & Passport services', 'layout-grid', GO.immigrationServices);
  const hasApp = (applications || []).some((a) => appMatches(a, APP_MATCHERS[0]));
  const track = hasApp ? act('Track my passport application', 'route', GO.applications) : null;
  if (t.includes('renew')) {
    return {
      text: 'To renew a Guyana passport you need your current (or expired) passport, your birth certificate and National ID from your Vault, and a recent passport photo. You book a Passport Office visit as part of the application — about 10 working days from that visit.',
      actions: [renew, all],
    };
  }
  if (t.includes('replace') || t.includes('lost') || t.includes('damag')) {
    return {
      text: 'Lost or damaged passport? Apply for a replacement — the same documents as a renewal, plus a short note on what happened to the old one.',
      actions: [act('Replace my passport', 'plane', GO.passportReplace), all],
    };
  }
  if (t.includes('document') || t.includes('need')) {
    return {
      text: 'For a Guyana passport you need your birth certificate and National ID (both connect from your Vault — nothing to upload), a recent colour passport photo, and optionally a proof of address. Bring the originals to your Passport Office visit.',
      actions: [applyNow, renew, all],
    };
  }
  if (t.includes('fee') || t.includes('cost') || t.includes('how long') || t.includes('time')) {
    return {
      text: 'A standard passport is G$6,000 and takes about 10 working days from your Passport Office visit. Express processing is available at the Georgetown office.',
      actions: [applyNow, renew, all],
    };
  }
  return {
    text: 'Guyana Passport — apply for your first passport, renew one, or replace a lost or damaged one. Your birth certificate and National ID connect from your Vault; you add a photo and book a Passport Office visit inside the application.',
    actions: [applyNow, renew, track, all].filter(Boolean),
  };
}

function cashGrantReply(t) {
  const open = act('Check eligibility and apply', 'banknote', GO.cashGrant);
  if (t.includes('document')) {
    return { text: "You need your National ID (it connects from your Vault) and the bank account the grant should reach — that's it. Your verified profile covers the rest.", actions: [open] };
  }
  return {
    text: 'The Cash Grant is a one-off payment for every Guyanese citizen resident in Guyana — one grant per person. Your eligibility is checked against your record the moment you open it.',
    actions: [open, act('All Finance & Grants services', 'layout-grid', GO.financeServices)],
  };
}

// The Single Window — land-development approvals routed across agencies.
function singleWindowReply(t, ctxId) {
  const openWindow = act('Open the Single Window', 'building-2', GO.singleWindow);
  if (t.includes('empty')) {
    return {
      text: 'If the plot is still empty, GWI sends an officer to investigate the site first — they measure the run to the nearest main, fix the service size, and quote the connection before you are asked to pay anything.',
      actions: [act('Open water connection', 'droplets', GO.waterConnection), openWindow],
    };
  }
  if (t.includes('who') || t.includes('agenc') || t.includes('review')) {
    return {
      text: 'A building plan is reviewed by CH&PA, Lands & Surveys, the Central Board of Health, the EPA, the Fire Service, Public Works, and Sea Defence where the parcel sits inside a reserve. You see each decision on your tracker.',
      actions: [act('Open construction permit', 'hard-hat', GO.constructionPermit), openWindow],
    };
  }
  if (t.includes('need') || t.includes('before') || t.includes('require')) {
    return {
      text: 'Two things gate everything in the Single Window: proof that you hold the land (a transport, title, lease or CH&PA agreement of sale) and outline planning permission from CH&PA. You confirm both as part of the application.',
      actions: [openWindow],
    };
  }
  if (ctxId === 'svc_sw_power_connection' || t.includes('power') || t.includes('electric')) {
    return {
      text: 'GPL runs the connection, but it goes through the Single Window so the wiring inspection and any Public Works clearance for a new pole are handled in one place. A new building needs a construction permit and a wiring certificate first.',
      actions: [act('Open power connection', 'plug-zap', GO.powerConnection), openWindow],
    };
  }
  return {
    text: 'The Single Window is one place for every land-development approval — the building permit, the water connection, the power connection and construction utilities. You apply once and it is routed to every agency that has to approve it.',
    actions: [openWindow, act('Browse services', 'layout-grid', GO.services)],
  };
}

// GRO certificates — everything starts from the registration number.
function groReply(t, ctxId) {
  const type = ctxId === 'svc_gro_death' || t.includes('death') ? 'death'
    : ctxId === 'svc_gro_marriage' || t.includes('marriage') ? 'marriage'
      : 'birth';
  const target = { birth: GO.groBirth, death: GO.groDeath, marriage: GO.groMarriage }[type];
  const open = act(`Open ${type} certificate`, 'book-open', target);
  if (t.includes('number') || t.includes('where')) {
    return {
      text: 'Your registration number is on the slip the GRO gave the informant when the entry was registered. It looks like B/GT/1990/004512 — spacing, dashes and slashes do not matter when you type it.',
      actions: [open],
    };
  }
  return {
    text: 'Births, deaths and marriages are registered inside the General Register Office, and registration produces a registration number. Enter that number here to follow it — and once it is approved, to view and download your certificate. A copy is filed in your Vault, visible only to you.',
    actions: [open, act('Open my Vault', 'user-lock', GO.vault)],
  };
}

function nisReply(t, persona) {
  const hub = act('Open NIS', 'shield-check', GO.nisHub);
  const all = act('All Social Security services', 'layout-grid', GO.socialServices);
  if (t.includes('pension')) {
    return {
      text: 'To qualify for the NIS pension you need to be 60 or older with at least 150 paid and 750 total contributions. Your pension progress is on the NIS page.',
      actions: [act('See my pension progress', 'landmark', GO.nisHub), all],
    };
  }
  if (t.includes('sick')) return { text: 'Sickness Benefit pays while a doctor certifies you unfit for work — apply with your medical certificate and your last working day.', actions: [act('Apply for Sickness Benefit', 'thermometer', GO.benefit('sickness')), hub] };
  if (t.includes('matern')) return { text: 'Maternity Benefit pays for up to 13 weeks around the birth — apply with your expected date and your contribution record does the rest.', actions: [act('Apply for Maternity Benefit', 'baby', GO.benefit('maternity')), hub] };
  if (t.includes('funeral')) return { text: 'The Funeral Grant helps with the cost of a funeral for an insured person or their dependant — apply with the death certificate.', actions: [act('Apply for the Funeral Grant', 'flower-2', GO.benefit('funeral')), hub] };
  if (t.includes('regist')) {
    return {
      text: persona?.nisAccountState === 'active'
        ? `You're already registered with NIS${persona.nisNumber ? ` — your number is ${persona.nisNumber}` : ''}.`
        : 'Registering with NIS gives you a number your contributions are recorded against — it takes about five minutes.',
      actions: persona?.nisAccountState === 'active' ? [hub] : [act('Register with NIS', 'badge-check', GO.nisRegister), hub],
    };
  }
  if (t.includes('number') || t.includes('no.')) {
    return persona?.nisNumber
      ? { text: `Your NIS Number is ${persona.nisNumber}. It's on your NIS card in the Vault.`, actions: [act('Open my Vault', 'user-lock', GO.vault)] }
      : { text: "You don't have an NIS Number in My Guyana yet — register and NIS issues one.", actions: [act('Register with NIS', 'badge-check', GO.nisRegister)] };
  }
  return {
    text: 'Social Security (NIS) — register, apply for Sickness, Maternity or Funeral benefits, check your contributions and follow your pension progress.',
    actions: [hub, act('Apply for a benefit', 'file-plus-2', GO.nisHub), all],
  };
}

function gplReply(t) {
  const hub = act('Open Electricity', 'zap', GO.gplHub);
  const all = act('All Utilities services', 'layout-grid', GO.utilityServices);
  if (t.includes('outage') || t.includes('power cut') || t.includes('no power')) return { text: 'Report an outage and GPL dispatches a crew — you can follow it under claims and reports.', actions: [act('Report an outage', 'zap-off', GO.gplOutage), hub] };
  if (t.includes('new connection') || t.includes('connection')) return { text: 'A new electricity connection needs a certificate of inspection and proof you own or rent the property — GPL reviews it and schedules a site visit.', actions: [act('Apply for a new connection', 'plug', GO.gplNew), hub] };
  if (t.includes('bill') || t.includes('pay')) return { text: 'Your GPL bill can be paid right here in My Guyana — card or mobile money, with the receipt kept in your payments history.', actions: [act('Pay my bill', 'receipt', GO.gplPay), hub] };
  return { text: 'Electricity (GPL) — pay your bill, see your usage, report an outage, or apply for a new connection.', actions: [act('Pay my bill', 'receipt', GO.gplPay), act('Report an outage', 'zap-off', GO.gplOutage), hub, all] };
}

function eidReply(t, persona) {
  const vault = act('Open my Vault', 'user-lock', GO.vault);
  const all = act('All Identity & Records services', 'layout-grid', GO.identityServices);
  if (t.includes('vote')) return { text: "Your e-ID lets you apply for services faster, but it doesn't replace your National ID for voting. If your National ID is close to expiring, renew that too.", actions: [vault] };
  if (persona?.eidStatus === 'issued') return { text: 'Your e-ID is active. It lives in your Vault — open it there to view or present it.', actions: [vault, all] };
  if (persona?.eidStatus === 'applied') return { text: 'Your e-ID application is in progress — attend your Service Centre visit and MoPS issues the card.', actions: [act('Track my e-ID application', 'route', GO.applications), act('My appointments', 'calendar', GO.calendar)] };
  return { text: 'The e-ID is your digital identity card from MoPS — apply in about five minutes and book a Service Centre visit to enrol.', actions: [act('Apply for an e-ID', 'fingerprint', GO.eidApply), all] };
}

// -- every other agency on the account (Task: information for the rest) ------
// Any of the ~45 master-list agencies can be asked about by name (or by its
// citizen-facing service name — Water, Tax & Revenue, …). The answer says what
// state it's in and links to wherever its services live today.
function findAgencyInText(t) {
  const alias = Object.values(SERVICE_ACCESS).find((s) => t.includes(s.name.toLowerCase()));
  if (alias && AGENCIES[alias.id]) return AGENCIES[alias.id];
  const words = t.split(/[^a-z0-9]+/);
  return Object.values(AGENCIES).find((a) => {
    const long = a.name.toLowerCase();
    const short = (a.shortName || '').toLowerCase();
    if (t.includes(long)) return true;
    if (!short || short.length < 3) return false;
    return short.includes(' ') ? t.includes(short) : words.includes(short);
  }) || null;
}

function agencyReply(a) {
  const svc = SERVICE_ACCESS[a.id];
  const friendly = svc ? `${a.name} — ${svc.name} —` : `${a.name}`;
  if (a.comingSoon) {
    return {
      text: `${friendly} is joining My Guyana soon; its online services aren't live yet. I'll be able to take you there the moment it lands.`,
      actions: [act('Browse services', 'layout-grid', GO.services)],
    };
  }
  const catId = agencyCategoryId(a.id);
  const actions = [];
  if (AGENCY_HUBS.includes(a.id)) actions.push(act(`Open ${svc?.name || a.shortName}`, svc?.icon || a.icon, { screen: a.id }));
  if (catId) actions.push(act(`Browse ${a.shortName} services`, 'layout-grid', { overlay: 'category', payload: { id: catId } }));
  if (actions.length === 0) {
    return {
      text: `${friendly} is connected to your account from your government record. Its online services are still being added to My Guyana — until then, any Service Centre can help with it.`,
      actions: [act('Book a Service Centre visit', 'calendar', GO.calendar), act('Browse services', 'layout-grid', GO.services)],
    };
  }
  return {
    text: `${friendly} is connected to your account — here's where its services live.`,
    actions: [...actions, act('All services', 'layout-grid', GO.services)],
  };
}

function pickReply(text, { persona, applications, ctxId }) {
  const t = text.toLowerCase();

  // Application status — "status", "track", "where's my …", "progress".
  if (t.includes('status') || t.includes('track') || t.includes('progress') || (t.includes('where') && t.includes('application'))) {
    return statusReply(text, applications);
  }
  // Appointments are booked in the Appointments tab, never inside the chat (4.1).
  if (t.includes('appointment') || t.includes('nearest') || (t.includes('mops') && t.includes('office'))) {
    return {
      text: `The nearest MoPS office is ${SERVICE_CENTRES[0].name}. Appointments are booked from the Appointments tab — I'll take you there.`,
      actions: [act('Open Appointments', 'calendar', GO.calendar)],
    };
  }
  // Services and agencies — the context sharpens the match, keywords work anywhere.
  if (ctxId === 'passport' || t.includes('passport') || t.includes('travel')) return passportReply(t, applications);
  if (String(ctxId).startsWith('svc_sw_') || t.includes('single window') || t.includes('permit')
      || t.includes('water connection') || t.includes('power connection') || t.includes('building plan')
      || t.includes('construction')) {
    return singleWindowReply(t, ctxId);
  }
  if (String(ctxId).startsWith('svc_gro_') || t.includes('registration number')
      || t.includes('birth cert') || t.includes('death cert') || t.includes('marriage cert')
      || t.includes('certificate')) {
    return groReply(t, ctxId);
  }
  if (ctxId === 'cashGrant' || ctxId === 'svc_cash_grant' || (t.includes('cash') && t.includes('grant')) || t.includes('grant')) return cashGrantReply(t);
  if (t.includes('e-id') || t.includes('eid') || t.includes('digital id') || t.includes('vote')) return eidReply(t, persona);
  if (t.includes('nis') || t.includes('pension') || t.includes('benefit') || t.includes('sick') || t.includes('matern') || t.includes('funeral') || t.includes('social security') || t.includes('contribution')) return nisReply(t, persona);
  if (t.includes('gpl') || t.includes('electric') || t.includes('bill') || t.includes('outage') || t.includes('power')) return gplReply(t);
  if (t.includes('birth certificate') || t.includes('change of name') || t.includes('record')) {
    return { text: 'Birth certificate copies and changes of name are handled under Identity & Records.', actions: [act('Open Identity & Records', 'file-text', GO.identityServices)] };
  }
  if (t.includes('mops') || t.includes('public service')) return { text: 'MoPS (Ministry of Public Service) issues your e-ID and runs the Service Centres.', actions: [act('Open MoPS', 'landmark', GO.mopsHub), act('Open my Vault', 'user-lock', GO.vault)] };
  // Any other agency on the account, asked for by name or by its service name.
  const agencyHit = findAgencyInText(t);
  if (agencyHit) return agencyReply(agencyHit);
  if (t.includes('vault') || t.includes('document')) return { text: 'Your Vault holds your e-ID, IDs, certificates and records — and connects them into any application so you never re-upload them.', actions: [act('Open my Vault', 'user-lock', GO.vault)] };
  if (t.includes('service')) return { text: 'Every service is under Services, grouped by category with the owning agency labelled.', actions: [act('Browse services', 'layout-grid', GO.services)] };

  return {
    text: "I can explain any service and take you straight to it, check eligibility, or tell you where an application stands — try 'passport', 'pay my bill', 'NIS benefit' or 'status of my application'.",
    actions: [act('Browse services', 'layout-grid', GO.services), act('My applications', 'route', GO.applications)],
  };
}

let msgSeq = 2;

export default function AskGov() {
  const { isOpen, closeOverlay, openOverlay, navigate, getPayload, persona, applications } = useAppState();
  const open = isOpen('askGov');

  // Service context (4.2): { serviceId } when opened from inside a service.
  const payload = getPayload('askGov');
  const ctxId = payload && typeof payload === 'object' ? payload.serviceId : null;
  const ctx = CONTEXTS[ctxId] || null;

  const [messages, setMessages] = useState(() => [{ id: 1, from: 'bot', text: GREETING }]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [chipsVisible, setChipsVisible] = useState(true);
  const [speakingId, setSpeakingId] = useState(null);
  const lastCtx = useRef(null);

  const threadRef = useRef(null);

  useEffect(() => {
    if (open && threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Entering from a service: greet in that context once, and surface its chips.
  useEffect(() => {
    if (!open) { lastCtx.current = null; return; }
    if (ctx && lastCtx.current !== ctxId) {
      lastCtx.current = ctxId;
      setChipsVisible(true);
      setMessages((prev) => [...prev, {
        id: ++msgSeq, from: 'bot',
        text: `You're in ${ctx.title} — ask me anything about it, or pick a quick action below.`,
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ctxId]);

  function sendMessage(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    const userMsg = { id: ++msgSeq, from: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTimeout(() => {
      const reply = pickReply(trimmed, { persona, applications, ctxId });
      setMessages((prev) => [...prev, { id: ++msgSeq, from: 'bot', text: reply.text, actions: reply.actions }]);
    }, 500);
  }

  // Deep-link out of the chat (4.3): close Ask Gov, then land exactly where the
  // button says — a screen, an overlay, or a screen with an overlay on top of it
  // (status → My applications with that application's details open).
  function runAction(action) {
    const go = action.go || {};
    closeOverlay('askGov');
    if (go.screen) {
      closeOverlay('apply'); // a screen target must not stay hidden under a service flow
      navigate(go.screen);
    }
    if (go.overlay) openOverlay(go.overlay, go.payload ?? true);
  }

  function toggleMic() {
    // Purely visual — no real speech-to-text wired up.
    setListening((v) => !v);
  }

  function toggleSpeak(msg) {
    setSpeakingId((cur) => (cur === msg.id ? null : msg.id));
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  if (!open) return null;

  const chips = ctx ? ctx.chips : CHIPS;

  const footer = (
    <>
      <div style={{ padding: '8px 16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#E1E4EB' }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
          {ctx ? `${ctx.title} — quick actions` : 'Quick actions'}
        </span>
        <button className="press focus-ring" onClick={() => setChipsVisible((v) => !v)} aria-label="Toggle quick actions"
          style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-3)' }}>
          <Icon name={chipsVisible ? 'chevron-down' : 'chevron-up'} size={16} />
        </button>
      </div>
      {chipsVisible && (
        <div style={{ padding: '0 16px 8px', display: 'flex', gap: 8, overflowX: 'auto', background: '#E1E4EB' }}>
          {chips.map((c) => (
            <button key={c.id} className="press focus-ring" onClick={() => sendMessage(c.prompt)}
              style={{ flexShrink: 0, minHeight: 44, padding: '0 16px', borderRadius: 999, border: '1px solid var(--surface-border)', background: 'var(--surface-1)', color: 'var(--fg-1)', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {c.label}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ padding: '10px 16px 24px', borderTop: '1px solid var(--surface-hairline)', background: 'var(--surface-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button type="button" className="press focus-ring" onClick={toggleMic} aria-label="Voice input" aria-pressed={listening}
          style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: listening ? 'var(--status-error)' : 'var(--surface-2)', color: listening ? '#fff' : 'var(--fg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="mic" size={19} />
        </button>
        <input
          type="text"
          enterKeyHint="done"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? 'Listening…' : ctx ? `Ask about ${ctx.title}` : 'Ask a question'}
          style={{ flex: 1, minHeight: 44, padding: '0 14px', borderRadius: 999, border: '1px solid var(--surface-border)', background: 'var(--surface-2)', fontSize: 14, color: 'var(--fg-1)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
        />
        <button type="submit" className="press focus-ring" aria-label="Send"
          style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'var(--brand-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="arrow-up" size={18} />
        </button>
      </form>
    </>
  );

  return (
    <PageOverlay open={open} onClose={() => closeOverlay('askGov')} title="Ask Gov" subtitle={ctx ? ctx.title : 'Government assistant'}
      headerRight={null} noPadding footer={footer}
    >
      <div ref={threadRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m) => (
          <MessageRow key={m.id} m={m} speakingId={speakingId} onSpeak={toggleSpeak} onAction={runAction} />
        ))}
      </div>
    </PageOverlay>
  );
}

function MessageRow({ m, speakingId, onSpeak, onAction }) {
  const isBot = m.from === 'bot';
  const isSpeaking = speakingId === m.id;
  return (
    <div style={{ display: 'flex', justifyContent: isBot ? 'flex-start' : 'flex-end' }}>
      <div style={{ maxWidth: '86%', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          padding: '11px 14px', borderRadius: 16, fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-line',
          background: isBot ? 'var(--surface-1)' : 'var(--brand-600)',
          border: isBot ? '1px solid var(--surface-border)' : 'none',
          color: isBot ? 'var(--fg-1)' : '#fff',
        }}>
          {m.text}
        </div>

        {/* Deep-links into the related service or application (4.3) */}
        {isBot && m.actions && m.actions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
            {m.actions.map((a) => (
              <button key={a.label} className="press focus-ring" onClick={() => onAction(a)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 40, padding: '0 14px', borderRadius: 999, border: 'none', background: 'var(--brand-600)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Icon name={a.icon || 'arrow-right'} size={14} color="#fff" />
                {a.label}
              </button>
            ))}
          </div>
        )}

        {isBot && (
          <button className="press focus-ring" onClick={() => onSpeak(m)}
            style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', padding: '2px 4px', color: 'var(--fg-3)', fontSize: 12, fontWeight: 600, height: 22 }}>
            <Icon name={isSpeaking ? 'volume-x' : 'volume-2'} size={12} />
            {isSpeaking ? 'Stop' : 'Read aloud'}
          </button>
        )}
      </div>
    </div>
  );
}
