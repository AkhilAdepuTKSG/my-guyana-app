import { useEffect, useRef, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';
import { SERVICE_CENTRES } from '../../state/mockData';

// Ask Gov, scoped down per review (backlog 4.1): information lookup, pointing
// the citizen to the right service, eligibility checks and application status.
// No agentic transactions — anything that needs doing is a deep-link into the
// real service flow (4.3), never done inside the chat. When opened from inside
// a service, the quick actions are scoped to that service (4.2). Closing the
// chat always lands back on the originating screen — it is an overlay above it.

// -- canned copy --------------------------------------------------------

const GREETING = "Hi, I'm Ask Gov. I can look up information, point you to the right service, check what you may be eligible for, and tell you where your applications stand. What do you need?";

const CHIPS = [
  { id: 'status', label: "Where's my application?", prompt: "What's the status of my applications?" },
  { id: 'nis', label: 'Apply for an NIS benefit', prompt: 'How do I apply for an NIS benefit?' },
  { id: 'pension', label: 'Pension eligibility', prompt: 'Am I eligible for a pension?' },
  { id: 'bill', label: 'Pay my electricity bill', prompt: 'How do I pay my electricity bill?' },
  { id: 'eid', label: 'Can I vote with my e-ID?', prompt: 'Can I vote with my e-ID?' },
  { id: 'appt', label: 'Book an appointment near me', prompt: 'Book an appointment at the nearest MoPS office' },
];

// Per-service context (4.2): opened from inside a service, the quick actions
// are that service's questions, not the generic set. All copy is invented
// placeholder data, like the rest of the prototype.
const CONTEXTS = {
  passport: {
    title: 'Guyana Passport',
    chips: [
      { id: 'p-renew', label: 'Documents required for renewal', prompt: 'What documents do I need to renew my passport?' },
      { id: 'p-first', label: 'First-time application', prompt: 'What do I need for a first-time passport?' },
      { id: 'p-fees', label: 'Fees and processing time', prompt: 'What are the passport fees and how long does it take?' },
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
};

const REPLIES = {
  default: 'I can look things up, point you to the right service, check eligibility or track your applications — try asking about a benefit, your e-ID, a bill or an application.',
  nis: 'For NIS you can apply for Sickness Benefit, Maternity, Funeral Grant, Pension and more. Each one is a short application from the NIS page.',
  eid: "Your e-ID lets you apply for services faster, but it doesn't replace your National ID for voting. If your National ID is close to expiring, I'd renew that too.",
  pension: "To qualify for the NIS pension you need to be 60 or older with at least 150 paid and 750 total contributions. Your pension progress is on the NIS page.",
  bill: 'Your GPL bill can be paid right here in My Guyana — I can take you straight to the payment.',
  passportRenew: 'To renew a Guyana passport you need: your current (or expired) passport, your National ID or birth certificate, two recent passport photos, and the completed application form. Bring the originals — copies are made at the counter.',
  passportFirst: "For a first-time passport you need your birth certificate, your National ID, two passport photos and the completed Form A — plus a parent or guardian present if you're under 16.",
  passportFees: 'A standard renewal is G$6,000 and takes about 10 working days from your appointment. Express processing is available at the Georgetown office.',
  cashGrantElig: 'The cash grant is for every Guyanese citizen resident in Guyana — one grant per person. With your identity verified in My Guyana, you can apply straight away.',
  cashGrantDocs: "You need your National ID or e-ID, and the bank account the payout should reach. That's it — your verified profile covers the rest.",
};

function nisNumberReply(persona) {
  if (persona?.nisNumber) {
    return {
      text: `Your NIS Number is ${persona.nisNumber}. It's on your NIS card in Wallet — open Wallet to see or copy it.`,
      actions: [{ label: 'Open Wallet', icon: 'wallet', go: { screen: 'wallet' } }],
    };
  }
  return {
    text: "You don't have an NIS Number in My Guyana yet. Add National Insurance Scheme from your home dial: if you already have a number you can link it, and if you don't, NIS issues one when you register — we'll email the number and a first-time PIN.",
    actions: [{ label: 'Go to Home', icon: 'house', go: { screen: 'home' } }],
  };
}

// Application status (4.1) — read from the citizen's real submitted
// applications, never invented.
function statusReply(applications) {
  if (!applications || applications.length === 0) {
    return {
      text: "You haven't submitted any applications yet. When you do, I can tell you exactly where each one stands.",
      actions: [{ label: 'Browse services', icon: 'layout-grid', go: { screen: 'services' } }],
    };
  }
  const lines = applications.slice(0, 3).map((a) => `• ${a.title} — ${a.status}${a.step && a.totalSteps ? ` (step ${a.step} of ${a.totalSteps})` : ''}`);
  const more = applications.length > 3 ? `\nAnd ${applications.length - 3} more.` : '';
  return {
    text: `Here's where ${applications.length === 1 ? 'your application stands' : 'your applications stand'}:\n${lines.join('\n')}${more}`,
    actions: [{ label: 'View my applications', icon: 'route', go: { screen: 'applications' } }],
  };
}

function pickReply(text, { persona, applications, ctxId }) {
  const t = text.toLowerCase();
  const asksNumber = t.includes('number') || t.includes('no.');

  // Application status first — "status", "track", "where's my application".
  if (t.includes('status') || t.includes('track') || (t.includes('where') && t.includes('application'))) {
    return statusReply(applications);
  }
  // Appointments are booked in the Appointments tab, not inside the chat (4.1).
  if (t.includes('appointment') || t.includes('nearest') || (t.includes('mops') && t.includes('office'))) {
    return {
      text: `The nearest MoPS office is ${SERVICE_CENTRES[0].name}. Appointments are booked from the Appointments tab — I'll take you there and you can pick a date and time.`,
      actions: [{ label: 'Open Appointments', icon: 'calendar', go: { screen: 'calendar' } }],
    };
  }
  // Passport — the service context sharpens the match, but the keywords work anywhere.
  if (ctxId === 'passport' || t.includes('passport')) {
    const openPassport = { label: 'Open the passport service', icon: 'plane', go: { overlay: 'apply', payload: { serviceId: 'passport' } } };
    if (t.includes('first')) return { text: REPLIES.passportFirst, actions: [openPassport] };
    if (t.includes('fee') || t.includes('cost') || t.includes('how long') || t.includes('time')) return { text: REPLIES.passportFees, actions: [openPassport] };
    if (t.includes('renew') || t.includes('document')) return { text: REPLIES.passportRenew, actions: [openPassport] };
    if (ctxId === 'passport') return { text: REPLIES.passportRenew, actions: [openPassport] };
  }
  if (ctxId === 'cashGrant' || (t.includes('cash') && t.includes('grant'))) {
    const openGrant = { label: 'Open the cash grant service', icon: 'banknote', go: { overlay: 'apply', payload: { serviceId: 'cashGrant' } } };
    if (t.includes('document')) return { text: REPLIES.cashGrantDocs, actions: [openGrant] };
    return { text: REPLIES.cashGrantElig, actions: [openGrant] };
  }
  if (asksNumber && t.includes('nis')) return nisNumberReply(persona);
  if (t.includes('pension')) {
    return { text: REPLIES.pension, actions: [{ label: 'Open NIS', icon: 'shield-check', go: { screen: 'nis' } }] };
  }
  if (t.includes('e-id') || t.includes('eid') || t.includes('vote')) {
    return { text: REPLIES.eid, actions: [{ label: 'Open my Vault', icon: 'user-lock', go: { screen: 'vault' } }] };
  }
  if (t.includes('nis') || t.includes('benefit') || t.includes('sick')) {
    return { text: REPLIES.nis, actions: [{ label: 'Open NIS', icon: 'shield-check', go: { screen: 'nis' } }] };
  }
  if (t.includes('bill') || t.includes('electric') || t.includes('gpl')) {
    return { text: REPLIES.bill, actions: [{ label: 'Pay my bill', icon: 'receipt', go: { overlay: 'gplPay' } }] };
  }
  return { text: REPLIES.default };
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

  // Deep-link out of the chat (4.3): close Ask Gov first so the citizen lands
  // where the button says — a screen (also closing any service flow beneath)
  // or a real service overlay.
  function runAction(action) {
    const go = action.go || {};
    closeOverlay('askGov');
    if (go.screen) {
      closeOverlay('apply'); // a screen target must not stay hidden under a flow
      navigate(go.screen);
      return;
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
      <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: 4 }}>
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
