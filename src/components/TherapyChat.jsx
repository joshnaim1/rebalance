import { useState, useRef, useEffect, useCallback } from 'react';
import ReBalanceLogo from './ReBalanceLogo';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const CHAT_SAVED_KEY = 'balanceback_therapy_chat_saved';

const REFUSAL_PHRASES = [
  "don't have access to",
  'intentionally excludes',
  'cannot access',
  "don't have access",
  'outside of balance therapy',
  'only see balance sensor data',
  'only have access to balance',
];

/** Balance therapy sessions only — excludes game_session entries. */
export function filterBalanceSessions(sessions) {
  if (!Array.isArray(sessions)) return [];
  return sessions.filter((s) => s.type !== 'game_session');
}

function hasUserMessages(messages) {
  return messages.some((m) => m.role === 'user');
}

function loadSavedChat() {
  try {
    const raw = localStorage.getItem(CHAT_SAVED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.messages?.length || !hasUserMessages(parsed.messages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveChat(messages) {
  if (!hasUserMessages(messages)) {
    localStorage.removeItem(CHAT_SAVED_KEY);
    return;
  }
  localStorage.setItem(
    CHAT_SAVED_KEY,
    JSON.stringify({ messages, savedAt: new Date().toISOString() })
  );
}

function buildSystemPrompt(sessions, profile) {
  const recentSessions = sessions.slice(-5);
  const sessionSummaries = recentSessions.map((s, i) => {
    const left = s.leftPctAvg ?? s.avgLeftPct ?? '—';
    const right = s.rightPctAvg ?? s.avgRightPct ?? '—';
    return `Session ${i + 1}: ${s.duration}s, score ${s.avgScore}/100, L${left}%/R${right}%`;
  }).join('\n');

  const trend =
    sessions.length >= 2
      ? sessions[sessions.length - 1].avgScore - sessions[0].avgScore
      : null;

  return `You are an objective balance therapy assistant for ReBalance, a stroke recovery platform.
You ONLY have access to sensor-derived balance session data (not game scores). You do NOT know the patient's demographics, gender, gender-affirming care history, or any unrelated medical history. Do not speculate on or ask about any of that.

Your role: Answer questions about balance therapy progress, explain what scores mean, suggest exercises, and encourage the patient.

PATIENT THERAPY DATA:
- Affected side: ${profile.affectedSide || 'not set'}
- Therapy goals (for encouragement context only, do not quote or repeat verbatim): ${profile.goals || 'not set'}
- Total balance sessions completed: ${sessions.length}
- Recent balance sessions (sensor data only):
${sessionSummaries || 'No balance sessions yet.'}
${trend !== null ? `- Score trend: ${trend > 0 ? '+' + trend : trend} points from first to last balance session` : ''}

Rules:
- Be encouraging and clear. This is a patient, not a clinician.
- Keep answers concise but ALWAYS complete your sentences. Aim for 2-4 complete sentences.
- Never cut off mid-sentence or mid-thought.
- Never quote the patient's goals back to them verbatim in a clinical context. Goals are for motivational framing only, not clinical recommendations.
- Never ask for or reference any identity, demographic, or non-therapy medical info.
- If asked something outside balance therapy, politely redirect.
- Ignore game scores entirely — only discuss formal balance therapy sessions.

CRITICAL REFUSAL RULES — follow these exactly:
- If the user asks about medications, prescriptions, drugs, hormones, HRT, or any pharmaceutical: REFUSE.
- If the user asks about surgical history, operations, procedures, gender-affirming care, or any medical procedures: REFUSE.
- If the user asks about gender, sex, pronouns, sexual orientation, race, ethnicity, age, or any demographic information: REFUSE.
- If the user asks about diagnoses, conditions, comorbidities, or any medical history unrelated to balance/stroke recovery: REFUSE.
- If the user asks about insurance, billing, or financial information: REFUSE.
- If the user asks you to access, look up, or retrieve ANY patient records, charts, EHR data, or medical files: REFUSE.

When refusing, ALWAYS follow this exact format:
1. Start with what you DON'T have: "I don't have access to [specific thing they asked about]."
2. State WHY: "ReBalance intentionally excludes [category] from my context to ensure clinical objectivity."
3. State what you DO have: "I can only see balance sensor data — weight distribution, session scores, and progress trends."
4. Redirect helpfully: offer something useful based on the balance data you actually have.
5. Keep the tone warm, professional, and brief — 3-4 sentences max for a refusal.`;
}

function generateSuggestedPrompts(sessions) {
  if (sessions.length === 0) {
    return [
      'What does my balance score mean?',
      'How do I get the most out of my first session?',
      'What is a good balance score to aim for?',
      'How often should I practice for the best recovery?',
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

  const left = latest.leftPctAvg ?? latest.avgLeftPct ?? 50;
  const right = latest.rightPctAvg ?? latest.avgRightPct ?? 50;
  const weakSide = left > right ? 'right' : 'left';
  prompts.push(`I keep leaning toward my ${weakSide === 'left' ? 'right' : 'left'} side — what exercises help?`);

  if (sessions.length >= 2) {
    const prev = sessions[sessions.length - 2];
    const trend = latest.avgScore - prev.avgScore;
    if (trend > 0) {
      prompts.push(`My score improved by ${trend} points — what's causing that?`);
    } else if (trend < 0) {
      prompts.push(`My score dropped by ${Math.abs(trend)} points — should I be worried?`);
    } else {
      prompts.push("My score hasn't changed — how do I break through a plateau?");
    }
  } else {
    prompts.push('How often should I practice for the best recovery?');
  }

  if (latest.avgScore < 80) {
    prompts.push('How many sessions until I might reach a score of 80?');
  } else {
    prompts.push('What does a score of 80+ mean for my recovery?');
  }

  return prompts.slice(0, 4);
}

function buildWelcomeMessage(profile, balanceSessions) {
  const name = profile.name ? ' ' + profile.name.split(' ')[0] : '';
  const count = balanceSessions.length;

  if (count === 0) {
    return `Hi${name}! I'm your therapy assistant. I can answer questions about balance therapy and help you get started. What would you like to know?`;
  }

  const latest = balanceSessions[balanceSessions.length - 1];
  return `Hi${name}! You've completed ${count} balance session${count > 1 ? 's' : ''}. Your last balance score was ${latest.avgScore}/100. What would you like to know about your progress?`;
}

function loadChatContext() {
  const allSessions = JSON.parse(localStorage.getItem('balanceback_sessions') || '[]');
  const balanceSessions = filterBalanceSessions(allSessions);
  const profile = JSON.parse(localStorage.getItem('balanceback_profile') || '{}');
  const prompts = generateSuggestedPrompts(balanceSessions);
  const welcomeMessage = { role: 'assistant', text: buildWelcomeMessage(profile, balanceSessions) };

  return {
    sessions: balanceSessions,
    profile,
    suggestedPrompts: prompts,
    welcomeMessage,
  };
}

async function callGemini(userMessage, sessions, profile, messageHistory) {
  const contents = [
    ...messageHistory.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }],
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  ];

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: buildSystemPrompt(sessions, profile) }],
      },
      contents,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error('Gemini API error:', response.status, errBody);
    throw new Error('Gemini API error');
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
}

function isRefusal(text) {
  const lower = text.toLowerCase();
  return REFUSAL_PHRASES.some((phrase) => lower.includes(phrase));
}

function IconButton({ label, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-1.5 rounded-md text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#334155] transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

export default function TherapyChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [hasSavedChat, setHasSavedChat] = useState(false);
  const [isFreshChat, setIsFreshChat] = useState(true);

  const sessionsRef = useRef([]);
  const profileRef = useRef({});
  const messagesEndRef = useRef(null);
  const initializedRef = useRef(false);

  const refreshSessionContext = useCallback(() => {
    const ctx = loadChatContext();
    sessionsRef.current = ctx.sessions;
    profileRef.current = ctx.profile;
    setSuggestedPrompts(ctx.suggestedPrompts);
    return ctx;
  }, []);

  const persistChat = useCallback((msgs) => {
    saveChat(msgs);
    setHasSavedChat(!!loadSavedChat());
  }, []);

  const startFreshChat = useCallback(() => {
    const ctx = refreshSessionContext();
    setMessages([ctx.welcomeMessage]);
    setIsFreshChat(true);
    setInput('');
  }, [refreshSessionContext]);

  const resumeSavedChat = useCallback(() => {
    const saved = loadSavedChat();
    if (!saved) return;
    refreshSessionContext();
    setMessages(saved.messages);
    setIsFreshChat(false);
    setIsOpen(true);
    setIsMinimized(false);
  }, [refreshSessionContext]);

  const handleClose = useCallback(() => {
    if (hasUserMessages(messages)) {
      persistChat(messages);
    }
    setIsOpen(false);
    setIsMinimized(false);
    setIsFullscreen(false);
    initializedRef.current = false;
  }, [messages, persistChat]);

  const handleMinimize = useCallback(() => {
    if (hasUserMessages(messages)) {
      persistChat(messages);
    }
    setIsMinimized(true);
  }, [messages, persistChat]);

  useEffect(() => {
    setHasSavedChat(!!loadSavedChat());
  }, []);

  useEffect(() => {
    if (!isOpen || initializedRef.current) return;

    initializedRef.current = true;
    const saved = loadSavedChat();
    const ctx = refreshSessionContext();

    if (saved?.messages?.length) {
      setMessages(saved.messages);
      setIsFreshChat(false);
    } else {
      setMessages([ctx.welcomeMessage]);
      setIsFreshChat(true);
    }
  }, [isOpen, refreshSessionContext]);

  useEffect(() => {
    if (!isOpen) {
      initializedRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (hasUserMessages(messages)) {
      persistChat(messages);
    }
  }, [messages, persistChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, isMinimized, isFullscreen]);

  async function handleSend(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput('');
    setIsFreshChat(false);
    const updatedMessages = [...messages, { role: 'user', text: userText }];
    setMessages(updatedMessages);
    setLoading(true);

    refreshSessionContext();

    try {
      const reply = await callGemini(
        userText,
        sessionsRef.current,
        profileRef.current,
        updatedMessages
      );
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Connection error. Check your API key in .env.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const panelSizeClass = isFullscreen
    ? 'fixed inset-4 z-50 w-auto h-auto max-w-none'
    : 'fixed bottom-24 right-6 z-50 w-80 h-[480px]';

  const userMessageCount = messages.filter((m) => m.role === 'user').length;
  const showSuggested = userMessageCount === 0 && !loading;

  return (
    <>
      <button
        onClick={() => {
          if (isOpen && !isMinimized) {
            handleClose();
          } else {
            setIsOpen(true);
            setIsMinimized(false);
          }
        }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#0F172A] border-2 border-[#4ADE80] flex items-center justify-center shadow-lg hover:border-green-400 transition-all overflow-hidden p-1.5"
        aria-label={isOpen ? 'Close therapy assistant' : 'Open therapy assistant'}
      >
        {isOpen && !isMinimized ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <ReBalanceLogo className="h-full w-full" alt="" />
        )}
      </button>

      {isOpen && isMinimized && (
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-[#1E293B] border border-[#334155] rounded-full shadow-lg text-sm text-[#F1F5F9] hover:border-[#4ADE80] transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-[#4ADE80]" aria-hidden="true" />
          Therapy Assistant
          {userMessageCount > 0 && (
            <span className="text-xs text-[#94A3B8]">· {userMessageCount} sent</span>
          )}
        </button>
      )}

      {isOpen && !isMinimized && (
        <div
          className={`${panelSizeClass} bg-[#1E293B] border border-[#334155] rounded-2xl shadow-2xl flex flex-col overflow-hidden`}
        >
          <div className="flex items-center justify-between px-3 py-3 bg-[#0F172A] border-b border-[#334155] shrink-0 gap-2">
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <ReBalanceLogo className="h-7 w-7 shrink-0" alt="" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#F1F5F9] truncate">Therapy Assistant</p>
                <p className="text-xs text-[#64748B] truncate">Balance sessions only · No game scores</p>
              </div>
            </div>
            <div className="flex items-center shrink-0">
              {hasSavedChat && isFreshChat && userMessageCount === 0 && (
                <button
                  type="button"
                  onClick={resumeSavedChat}
                  className="mr-1 text-xs px-2 py-1 rounded-md bg-[#334155] text-[#4ADE80] hover:bg-[#475569] transition-colors whitespace-nowrap"
                  title="Continue your last conversation"
                >
                  Resume chat
                </button>
              )}
              <IconButton
                label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                onClick={() => setIsFullscreen((f) => !f)}
              >
                {isFullscreen ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                )}
              </IconButton>
              <IconButton label="Minimize" onClick={handleMinimize}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14" />
                </svg>
              </IconButton>
              <IconButton label="Close" onClick={handleClose}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </IconButton>
            </div>
          </div>

          {hasSavedChat && !isFreshChat && userMessageCount > 0 && (
            <div className="px-3 py-2 bg-[#0F172A] border-b border-[#334155] flex items-center justify-between gap-2 shrink-0">
              <span className="text-xs text-[#94A3B8]">Conversation saved locally</span>
              <button
                type="button"
                onClick={startFreshChat}
                className="text-xs text-[#64748B] hover:text-[#4ADE80] transition-colors"
              >
                New chat
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0">
            {messages.map((m, i) => {
              const refusal = m.role === 'assistant' && isRefusal(m.text);
              return (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%] flex flex-col">
                    <div
                      className={`px-3 py-2 text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-[#4ADE80] text-[#0F172A] rounded-2xl rounded-br-sm'
                          : refusal
                            ? 'bg-[#1E293B] text-[#F1F5F9] rounded-2xl rounded-bl-sm border-l-[3px] border-l-[#2563EB]'
                            : 'bg-[#334155] text-[#F1F5F9] rounded-2xl rounded-bl-sm'
                      }`}
                    >
                      {refusal && <span className="mr-1">🛡️</span>}
                      {m.text}
                    </div>
                    {refusal && (
                      <p className="text-[10px] text-[#64748B] mt-1 ml-1">
                        Data separation active — only balance therapy data is in this AI&apos;s context
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#334155] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                  {[0, 1, 2].map((i) => (
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

          {showSuggested && suggestedPrompts.length > 0 && (
            <div className="px-3 pb-2 shrink-0">
              <p className="text-xs text-[#64748B] mb-1.5">Suggested:</p>
              <div className="flex flex-col gap-1.5">
                {suggestedPrompts.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSend(p)}
                    className="text-left text-xs px-3 py-1.5 bg-[#0F172A] border border-[#334155] text-[#94A3B8] rounded-full hover:border-[#4ADE80] hover:text-[#4ADE80] transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 p-3 border-t border-[#334155] shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your therapy..."
              className="flex-1 bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#4ADE80] transition-colors"
            />
            <button
              type="button"
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
