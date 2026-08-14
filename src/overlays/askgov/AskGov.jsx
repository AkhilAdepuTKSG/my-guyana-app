import { useEffect, useRef, useState } from 'react';
import PageOverlay from '../../components/ui/PageOverlay';
import Icon from '../../components/ui/Icon';
import { useAppState } from '../../state/AppStateContext';
import { SERVICE_CENTRES } from '../../state/mockData';

// -- canned copy --------------------------------------------------------

const GREETING = "Hi, I'm Ask Gov. I can help you find services, check requirements, or get pointed to the right agency. What do you need help with?";

const CHIPS = [
  { id: 'nis', label: 'Apply for an NIS benefit', prompt: 'How do I apply for an NIS benefit?' },
  { id: 'eid', label: 'Can I vote with my e-ID?', prompt: 'Can I vote with my e-ID?' },
  { id: 'pension', label: 'Pension eligibility', prompt: 'Am I eligible for a pension?' },
  { id: 'bill', label: 'Pay my electricity bill', prompt: 'How do I pay my electricity bill?' },
  { id: 'nisno', label: "What's my NIS Number?", prompt: "What's my NIS Number?" },
  { id: 'appt', label: 'Book an appointment near me', prompt: 'Book an appointment at the nearest MoPS office' },
];

const REPLIES = {
  default: "I can help with NIS, MoPS or GPL. Try asking about applying for a benefit, tracking an application, or your e-ID.",
  nis: "For NIS, you can apply for Sickness Benefit, Maternity, Pension and more from the NIS agency page. Want me to take you there?",
  eid: "Your e-ID lets you apply for services faster, but it doesn't replace your National ID for voting. If your National ID is close to expiring, I'd renew that too.",
  pension: "To apply for a pension you need to be 60 or older with at least 150 paid and 750 total contributions. You can start the application from the NIS page under 'Apply for pension'.",
  bill: "You can pay your GPL bill, check usage, or report an outage from the Electricity agency page.",
};

const TIME_OPTIONS = ['9:00 AM', '10:30 AM', '1:00 PM', '2:30 PM'];

function nisNumberReply(persona) {
  if (persona?.nisNumber) {
    return `Your NIS Number is ${persona.nisNumber}. It's on your NIS card in Wallet — open Wallet to see or copy it.`;
  }
  return "You don't have an NIS Number in My Guyana yet. Add National Insurance Scheme from your home dial: if you already have a number you can link it, and if you don't, NIS issues one when you register — we'll email the number and a first-time PIN.";
}

function pickReply(text, persona) {
  const t = text.toLowerCase();
  const asksNumber = t.includes('number') || t.includes('no.');
  if (t.includes('appointment') || t.includes('nearest') || (t.includes('mops') && t.includes('office'))) {
    return { card: 'appointment', text: 'The nearest MoPS office is ' + SERVICE_CENTRES[0].name + '. I found the next available slot.' };
  }
  if (asksNumber && t.includes('nis')) return { text: nisNumberReply(persona) };
  if (t.includes('pension')) return { text: REPLIES.pension };
  if (t.includes('e-id') || t.includes('eid') || t.includes('vote')) return { text: REPLIES.eid };
  if (t.includes('nis') || t.includes('benefit') || t.includes('sick')) return { text: REPLIES.nis };
  if (t.includes('bill') || t.includes('electric') || t.includes('gpl')) return { text: REPLIES.bill };
  return { text: REPLIES.default };
}

// Next 5 weekdays from "today", used as the appointment date-picker options.
function upcomingWeekdays(count = 5) {
  const out = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (out.length < count) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      out.push({
        id: d.toISOString().slice(0, 10),
        dow: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        day: String(d.getDate()),
        label: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
      });
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

let msgSeq = 2;

export default function AskGov() {
  const { isOpen, closeOverlay, persona } = useAppState();
  const open = isOpen('askGov');

  const [messages, setMessages] = useState(() => [{ id: 1, from: 'bot', text: GREETING }]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [chipsVisible, setChipsVisible] = useState(true);
  const [speakingId, setSpeakingId] = useState(null);

  // Appointment mini-flow selection state (one flow in-progress at a time,
  // mirrors the source prototype's model).
  const [apptOffice, setApptOffice] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const dateOptions = useRef(upcomingWeekdays()).current;

  const threadRef = useRef(null);

  useEffect(() => {
    if (open && threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, open]);

  function sendMessage(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    const userMsg = { id: ++msgSeq, from: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTimeout(() => {
      const reply = pickReply(trimmed, persona);
      setMessages((prev) => [...prev, { id: ++msgSeq, from: 'bot', text: reply.text, card: reply.card }]);
    }, 500);
  }

  function confirmAppt(msgId) {
    if (!apptDate || !apptTime) return;
    const chosenDate = dateOptions.find((d) => d.id === apptDate);
    setMessages((prev) => prev.map((m) => (
      m.id === msgId
        ? { ...m, apptConfirmed: true, apptOfficeDone: apptOffice, apptDateDone: chosenDate ? chosenDate.label : apptDate, apptTimeDone: apptTime }
        : m
    )));
    setApptOffice('');
    setApptDate('');
    setApptTime('');
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: ++msgSeq, from: 'bot', text: "Booked. You'll find it under Calendar, and I've sent a reminder to your phone." }]);
    }, 400);
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

  const footer = (
    <>
      <div style={{ padding: '8px 16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#E1E4EB' }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>Quick actions</span>
        <button className="press focus-ring" onClick={() => setChipsVisible((v) => !v)} aria-label="Toggle quick actions"
          style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-3)' }}>
          <Icon name={chipsVisible ? 'chevron-down' : 'chevron-up'} size={16} />
        </button>
      </div>
      {chipsVisible && (
        <div style={{ padding: '0 16px 8px', display: 'flex', gap: 8, overflowX: 'auto', background: '#E1E4EB' }}>
          {CHIPS.map((c) => (
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
          placeholder={listening ? 'Listening…' : 'Ask a question'}
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
    <PageOverlay open={open} onClose={() => closeOverlay('askGov')} title="Ask Gov" subtitle="Government assistant"
      headerRight={null} noPadding footer={footer}
    >
      <div ref={threadRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m) => (
          <MessageRow key={m.id} m={m} speakingId={speakingId} onSpeak={toggleSpeak}
            apptOffice={apptOffice} apptDate={apptDate} apptTime={apptTime}
            setApptOffice={setApptOffice} setApptDate={setApptDate} setApptTime={setApptTime}
            dateOptions={dateOptions} onConfirmAppt={() => confirmAppt(m.id)}
          />
        ))}
      </div>
    </PageOverlay>
  );
}

function MessageRow({ m, speakingId, onSpeak, apptOffice, apptDate, apptTime, setApptOffice, setApptDate, setApptTime, dateOptions, onConfirmAppt }) {
  const isBot = m.from === 'bot';
  const isSpeaking = speakingId === m.id;
  return (
    <div style={{ display: 'flex', justifyContent: isBot ? 'flex-start' : 'flex-end' }}>
      <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          padding: '11px 14px', borderRadius: 16, fontSize: 14, lineHeight: 1.5,
          background: isBot ? 'var(--surface-1)' : 'var(--brand-600)',
          border: isBot ? '1px solid var(--surface-border)' : 'none',
          color: isBot ? 'var(--fg-1)' : '#fff',
        }}>
          {m.text}
        </div>

        {m.card === 'appointment' && (
          <ApptCard
            confirmed={!!m.apptConfirmed}
            apptOfficeDone={m.apptOfficeDone} apptDateDone={m.apptDateDone} apptTimeDone={m.apptTimeDone}
            apptOffice={apptOffice} apptDate={apptDate} apptTime={apptTime}
            setApptOffice={setApptOffice} setApptDate={setApptDate} setApptTime={setApptTime}
            dateOptions={dateOptions} onConfirm={onConfirmAppt}
          />
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

function ApptCard({ confirmed, apptOfficeDone, apptDateDone, apptTimeDone, apptOffice, apptDate, apptTime, setApptOffice, setApptDate, setApptTime, dateOptions, onConfirm }) {
  if (confirmed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 14, background: 'var(--surface-1)', border: '1px solid var(--surface-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="map-pin" size={15} color="var(--brand-600)" />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-1)' }}>{apptOfficeDone}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="calendar" size={15} color="var(--fg-3)" />
          <span style={{ fontSize: 12.5, color: 'var(--fg-2)' }}>{apptDateDone} · {apptTimeDone}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--status-success)', fontSize: 12.5, fontWeight: 700 }}>
          <Icon name="check-circle-2" size={15} />
          Appointment booked
        </div>
      </div>
    );
  }

  const officeChosen = !!apptOffice;
  const dateChosen = !!apptDate;
  const readyToConfirm = !!apptOffice && !!apptDate && !!apptTime;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 14, background: 'var(--surface-1)', border: '1px solid var(--surface-border)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>Office</label>
        {SERVICE_CENTRES.map((o) => {
          const active = apptOffice === o.name;
          return (
            <button key={o.id} className="press focus-ring" onClick={() => setApptOffice(o.name)}
              style={{
                width: '100%', textAlign: 'left', minHeight: 48, padding: '12px 14px', borderRadius: 12,
                border: `1px solid ${active ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
                background: active ? 'var(--agency-accent)' : 'var(--surface-1)',
                color: active ? 'var(--agency-contrast)' : 'var(--fg-1)',
                fontSize: 14, fontWeight: 600, boxSizing: 'border-box',
              }}>
              {o.name}
            </button>
          );
        })}
      </div>

      {officeChosen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>Available dates</label>
          <p style={{ margin: '-4px 0 0', fontSize: 12, color: 'var(--fg-3)' }}>Service Centres open weekdays only.</p>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            {dateOptions.map((d) => {
              const active = apptDate === d.id;
              return (
                <button key={d.id} className="press focus-ring" onClick={() => setApptDate(d.id)}
                  style={{
                    flexShrink: 0, width: 64, minHeight: 74, padding: '10px 6px', borderRadius: 14,
                    border: `1px solid ${active ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
                    background: active ? 'var(--agency-accent)' : 'var(--surface-1)',
                    color: active ? 'var(--agency-contrast)' : 'var(--fg-1)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.03em' }}>{d.dow}</span>
                  <span style={{ fontSize: 18, fontWeight: 800 }}>{d.day}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: active ? 'var(--agency-contrast)' : 'var(--status-success)' }}>Open</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {dateChosen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>Available times</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TIME_OPTIONS.map((t) => {
              const active = apptTime === t;
              return (
                <button key={t} className="press focus-ring" onClick={() => setApptTime(t)}
                  style={{
                    minHeight: 44, padding: '0 18px', borderRadius: 999,
                    border: `1px solid ${active ? 'var(--agency-accent)' : 'var(--surface-border)'}`,
                    background: active ? 'var(--agency-accent)' : 'var(--surface-1)',
                    color: active ? 'var(--agency-contrast)' : 'var(--fg-1)',
                    fontSize: 14, fontWeight: 600,
                  }}>
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {readyToConfirm && (
        <button className="press focus-ring" onClick={onConfirm}
          style={{ minHeight: 48, marginTop: 2, borderRadius: 12, border: 'none', background: 'var(--brand-600)', color: '#fff', fontSize: 14, fontWeight: 700 }}>
          Confirm appointment
        </button>
      )}
    </div>
  );
}
