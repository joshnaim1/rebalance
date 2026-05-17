import { useState, useRef, useEffect } from 'react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

function buildSystemPrompt(sessions, profile) {
  const recentSessions = sessions.slice(-5);
  const sessionSummaries = recentSessions.map((s, i) =>
    `Session ${i + 1}: ${s.duration}s, score ${s.avgScore}/100, L${s.leftPctAvg}%/R${s.rightPctAvg}%`
  ).join('\n');

  const trend = sessions.length >= 2
    ? sessions[sessions.length - 1].avgScore - sessions[0].avgScore
    : null;

  return `You are an objective balance therapy assistant for BalanceBack, a stroke recovery platform.
You ONLY have access to sensor-derived session data. You do NOT know the patient's demographics, gender, gender-affirming care history, or any unrelated medical history. Do not speculate on or ask about any of that.

Your role: Answer questions about balance therapy progress, explain what scores mean, suggest exercises, and encourage the patient.

PATIENT THERAPY DATA:
- Affected side: ${profile.affectedSide || 'not set'}
- Therapy goals (for encouragement context only, do not quote or repeat verbatim): ${profile.goals || 'not set'}
- Total sessions completed: ${sessions.length}
- Recent sessions (sensor data only):
${sessionSummaries || 'No sessions yet.'}
${trend !== null ? `- Score trend: ${trend > 0 ? '+' + trend : trend} points from first to last session` : ''}

Rules:
- Be encouraging and clear. This is a patient, not a clinician.
- Keep answers concise but ALWAYS complete your sentences. Aim for 2-4 complete sentences.
- Never cut off mid-sentence or mid-thought.
- Never quote the patient's goals back to them verbatim in a clinical context. Goals are for motivational framing only, not clinical recommendations.
- Never ask for or reference any identity, demographic, or non-therapy medical info.
- If asked something outside balance therapy, politely redirect.`;
}

function generateSuggestedPrompts(sessions) {
  if (sessions.length === 0) {
    return [
      "What does my balance score mean?",
      "How do I get the most out of my first session?",
      "What is a good balance score to aim for?",
      "How often should I practice for the best recovery?",
    ];
  }

  const latest = sessions[sessions.length - 1];
  const prompts = [];

  if (latest.avgScore >= 80) {
    prompts.push(`My last score was ${latest.avgScore} — what should I work on next?`);
  } else if (latest.avgScore >= 60) {
    prompts.push(`My score was ${latest.avgScore}/100 — how do I improve it?`);
  } else {
    prompts.push(`My score was ${latest.avgScore}/100 — is that normal for a stroke patient?`);
  }

  const weakSide = latest.leftPctAvg > latest.rightPctAvg ? 'right' : 'left';
  prompts.push(`I keep leaning toward my ${weakSide === 'left' ? 'right' : 'left'} side — what exercises help?`);

  if (sessions.length >= 2) {
    const trend = latest.avgScore - sessions[sessions.length - 2].avgScore;
    if (trend > 0) {
      prompts.push(`My score improved by ${trend} points — what's causing that?`);
    } else if (trend < 0) {
      prompts.push(`My score dropped by ${Math.abs(trend)} points — should I be worried?`);
    } else {
      prompts.push("My score hasn't changed — how do I break through a plateau?");
    }
  } else {
    prompts.push("How often should I practice for the best recovery?");
  }

  if (latest.avgScore < 80) {
    prompts.push("How many sessions until I might reach a score of 80?");
  } else {
    prompts.push("What does a score of 80+ mean for my recovery?");
  }

  return prompts.slice(0, 4);
}

async function callGemini(userMessage, sessions, profile, messageHistory) {
  const contents = [
    ...messageHistory.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }]
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }]
    }
  ];

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: buildSystemPrompt(sessions, profile) }]
      },
      contents,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      }
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error('Gemini API error:', response.status, errBody);
    throw new Error('Gemini API error');
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
}

function loadChatContext() {
  const freshSessions = JSON.parse(localStorage.getItem('balanceback_sessions') || '[]');
  const freshProfile = JSON.parse(localStorage.getItem('balanceback_profile') || '{}');
  const prompts = generateSuggestedPrompts(freshSessions);

  const name = freshProfile.name ? ' ' + freshProfile.name.split(' ')[0] : '';
  const sessionCount = freshSessions.length;
  const welcomeText = sessionCount === 0
    ? `Hi${name}! I'm your therapy assistant. I can answer questions about balance therapy and help you get started. What would you like to know?`
    : `Hi${name}! You've completed ${sessionCount} session${sessionCount > 1 ? 's' : ''}. Your last score was ${freshSessions[freshSessions.length - 1].avgScore}/100. What would you like to know about your progress?`;

  return {
    sessions: freshSessions,
    profile: freshProfile,
    suggestedPrompts: prompts,
    welcomeMessage: { role: 'assistant', text: welcomeText },
  };
}

export default function TherapyChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const sessionsRef = useRef([]);
  const profileRef = useRef({});
  const messagesEndRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (isOpen && !initializedRef.current) {
      initializedRef.current = true;
      const ctx = loadChatContext();
      sessionsRef.current = ctx.sessions;
      profileRef.current = ctx.profile;
      setSuggestedPrompts(ctx.suggestedPrompts);
      setMessages([ctx.welcomeMessage]);
    }
    if (!isOpen) {
      initializedRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput('');
    const updatedMessages = [...messages, { role: 'user', text: userText }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const reply = await callGemini(userText, sessionsRef.current, profileRef.current, updatedMessages);
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Connection error. Check your API key in .env.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#4ADE80] text-[#0F172A] flex items-center justify-center shadow-lg hover:bg-green-400 transition-all"
        aria-label="Open therapy assistant"
      >
        {isOpen
          ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        }
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 h-[480px] bg-[#1E293B] border border-[#334155] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#0F172A] border-b border-[#334155] shrink-0">
            <div>
              <p className="text-sm font-semibold text-[#F1F5F9]">Therapy Assistant</p>
              <p className="text-xs text-[#64748B]">Sensor data only · No medical history</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-[#64748B] hover:text-[#F1F5F9] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#4ADE80] text-[#0F172A] rounded-2xl rounded-br-sm'
                      : 'bg-[#334155] text-[#F1F5F9] rounded-2xl rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#334155] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#4ADE80] animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts — only show before first user message */}
          {messages.filter(m => m.role === 'user').length === 0 && suggestedPrompts.length > 0 && (
            <div className="px-3 pb-2 shrink-0">
              <p className="text-xs text-[#64748B] mb-1.5">Suggested:</p>
              <div className="flex flex-col gap-1.5">
                {suggestedPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(p)}
                    className="text-left text-xs px-3 py-1.5 bg-[#0F172A] border border-[#334155] text-[#94A3B8] rounded-full hover:border-[#4ADE80] hover:text-[#4ADE80] transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-[#334155] shrink-0">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your therapy..."
              className="flex-1 bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#4ADE80] transition-colors"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-[#4ADE80] text-[#0F172A] rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-400 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
