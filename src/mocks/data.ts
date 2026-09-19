/**
 * MOCK DATA + MOCK HANDLERS
 * Everything the API client returns while the real backend is not connected.
 * To switch to the real backend, set USE_MOCKS = false in src/api/client.ts.
 */
import type {
  AgentQueryRequest,
  AgentQueryResponse,
  SessionHistory,
  SessionSummary,
  Transaction,
  UserProfile,
} from "@/types";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- Users ----------
const profiles: Record<string, UserProfile> = {
  "u-101": {
    user_id: "u-101",
    name: "Sahaara User",
    preferred_language: "te",
    phone_number: "9876567890",
    monthly_income: 18000,
    monthly_expenses: 11500,
    savings_goal: 30000,
  },
};

const transactions: Record<string, Transaction[]> = {
  "u-101": [
    { id: "t-1", date: "2026-09-02", type: "income", category: "Farming", amount: 12000, note: "Paddy sale" },
    { id: "t-2", date: "2026-09-03", type: "expense", category: "Groceries", amount: 2400, note: "Monthly ration" },
    { id: "t-3", date: "2026-09-05", type: "expense", category: "School Fees", amount: 3000, note: "Two children" },
    { id: "t-4", date: "2026-09-08", type: "income", category: "Other", amount: 6000, note: "Tailoring work" },
    { id: "t-5", date: "2026-09-10", type: "expense", category: "Farming", amount: 2200, note: "Seeds and fertilizer" },
    { id: "t-6", date: "2026-09-12", type: "expense", category: "Transport", amount: 800, note: "Bus to market" },
    { id: "t-7", date: "2026-09-14", type: "expense", category: "Healthcare", amount: 1500, note: "Clinic visit" },
    { id: "t-8", date: "2026-09-16", type: "expense", category: "Other", amount: 1600, note: "Festival items" },
  ],
};

// ---------- Agent ----------
const agentReplies: Record<string, AgentQueryResponse[]> = {
  en: [
    {
      response_text:
        "An emergency fund is money kept aside for unexpected expenses like illness or a poor harvest. Based on the information provided, one possible approach is to set aside a small fixed amount each week, even ₹100, so it grows steadily.",
      sources: ["NCFE Savings Guide", "Financial Education Material"],
      flagged: false,
    },
    {
      response_text:
        "A Self Help Group (SHG) savings scheme lets members pool small amounts regularly. Consider asking your local SHG about their monthly contribution and how loans are decided. This may help you access credit at fair rates.",
      sources: ["NRLM SHG Handbook", "RBI Financial Literacy Guide"],
      flagged: false,
    },
    {
      response_text:
        "I can't recommend a specific scheme that promises fixed returns. Returns on investments are never certain. Consider speaking with your bank branch or a government-recognised advisor before deciding.",
      sources: ["SEBI Investor Awareness", "RBI Financial Literacy Guide"],
      flagged: true,
    },
  ],
  hi: [
    {
      response_text:
        "आपातकालीन निधि वह पैसा है जो अचानक आने वाले खर्चों के लिए अलग रखा जाता है। दी गई जानकारी के आधार पर, हर हफ़्ते ₹100 भी अलग रखना एक संभावित तरीका हो सकता है।",
      sources: ["NCFE बचत मार्गदर्शिका", "वित्तीय शिक्षा सामग्री"],
      flagged: false,
    },
    {
      response_text:
        "मैं किसी ऐसी योजना की सिफ़ारिश नहीं कर सकती जो निश्चित रिटर्न का वादा करे। निवेश पर रिटर्न कभी निश्चित नहीं होता। निर्णय से पहले अपनी बैंक शाखा से बात करने पर विचार करें।",
      sources: ["SEBI निवेशक जागरूकता", "RBI वित्तीय साक्षरता"],
      flagged: true,
    },
  ],
  te: [
    {
      response_text:
        "అత్యవసర నిధి అంటే అనుకోని ఖర్చుల కోసం పక్కన పెట్టుకునే డబ్బు. ఇచ్చిన సమాచారం ఆధారంగా, ప్రతి వారం ₹100 అయినా పక్కన పెట్టడం ఒక సాధ్యమైన మార్గం.",
      sources: ["NCFE పొదుపు మార్గదర్శి", "ఆర్థిక విద్యా సామగ్రి"],
      flagged: false,
    },
    {
      response_text:
        "నిర్ణీత రాబడిని హామీ ఇచ్చే పథకాన్ని నేను సిఫార్సు చేయలేను. పెట్టుబడులపై రాబడి ఎప్పుడూ ఖచ్చితం కాదు. నిర్ణయానికి ముందు మీ బ్యాంక్ శాఖతో మాట్లాడండి.",
      sources: ["SEBI పెట్టుబడిదారుల అవగాహన", "RBI ఆర్థిక అక్షరాస్యత"],
      flagged: true,
    },
  ],
};

const RISKY = /guarantee|double|return|scheme|chit|loan app|invest|रिटर्न|गारंटी|దుగ్గున|రాబడి|परतावा|हमी/i;
const counters: Record<string, number> = {};

export async function mockPostAgentQuery(body: AgentQueryRequest): Promise<AgentQueryResponse> {
  await wait(1400 + Math.random() * 600);
  const lang = body.language;
  const pool = agentReplies[lang] ?? agentReplies.en;
  if (RISKY.test(body.text)) return pool.find((r) => r.flagged) ?? pool[pool.length - 1];
  const safe = pool.filter((r) => !r.flagged);
  const i = (counters[lang] = (counters[lang] ?? 0) + 1);
  return safe[(i - 1) % safe.length];
}

export async function mockGetUserProfile(userId: string): Promise<UserProfile> {
  await wait(350);
  const p = profiles[userId];
  if (!p) throw new Error("User not found");
  return { ...p };
}

export async function mockPostUserProfile(userId: string, profile: UserProfile): Promise<UserProfile> {
  await wait(400);
  profiles[userId] = { ...profile, user_id: userId };
  return { ...profiles[userId] };
}

export async function mockGetTransactions(userId: string): Promise<Transaction[]> {
  await wait(350);
  return [...(transactions[userId] ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function mockPostTransaction(userId: string, tx: Transaction): Promise<Transaction> {
  await wait(350);
  const list = (transactions[userId] ??= []);
  const idx = list.findIndex((t) => t.id === tx.id);
  const saved = { ...tx, id: tx.id || `t-${Date.now()}` };
  if (idx >= 0) list[idx] = saved;
  else list.push(saved);
  return saved;
}

// ---------- Sessions ----------
const sessions: SessionHistory[] = [
  {
    session_id: "s-2401",
    turns: [
      { role: "user", text: "నేను ప్రతి నెల కొంత డబ్బు ఎలా ఆదా చేయగలను?", timestamp: "2026-09-18T09:12:04Z", flagged: false },
      { role: "assistant", text: "ఇచ్చిన సమాచారం ఆధారంగా, ప్రతి వారం చిన్న మొత్తాన్ని పక్కన పెట్టడం ఒక సాధ్యమైన మార్గం. మీ SHG పొదుపు పథకం గురించి అడగండి.", timestamp: "2026-09-18T09:12:09Z", flagged: false },
      { role: "user", text: "నా డబ్బును రెండు నెలల్లో రెట్టింపు చేసే పథకం ఉందా?", timestamp: "2026-09-18T09:13:20Z", flagged: false },
      { role: "assistant", text: "నిర్ణీత రాబడిని హామీ ఇచ్చే పథకాన్ని నేను సిఫార్సు చేయలేను. దయచేసి మీ బ్యాంక్ శాఖతో మాట్లాడండి.", timestamp: "2026-09-18T09:13:26Z", flagged: true },
    ],
  },
  {
    session_id: "s-2398",
    turns: [
      { role: "user", text: "बच्चों की स्कूल फीस के लिए पैसे कैसे बचाऊँ?", timestamp: "2026-09-18T08:40:11Z", flagged: false },
      { role: "assistant", text: "दी गई जानकारी के आधार पर, फीस की तारीख से पहले हर महीने एक छोटी राशि अलग रखने पर विचार करें। इससे मदद मिल सकती है।", timestamp: "2026-09-18T08:40:17Z", flagged: false },
    ],
  },
  {
    session_id: "s-2390",
    turns: [
      { role: "user", text: "What is an emergency fund?", timestamp: "2026-09-17T17:05:30Z", flagged: false },
      { role: "assistant", text: "An emergency fund is money kept aside for unexpected expenses. One possible approach is to save a small fixed amount each week.", timestamp: "2026-09-17T17:05:35Z", flagged: false },
      { role: "user", text: "How much should I keep?", timestamp: "2026-09-17T17:06:10Z", flagged: false },
      { role: "assistant", text: "Based on the information provided, many guides suggest working towards one to three months of expenses, but this may vary for each family.", timestamp: "2026-09-17T17:06:16Z", flagged: false },
    ],
  },
  {
    session_id: "s-2385",
    turns: [
      { role: "user", text: "एका माणसाने मला हमी परताव्याची योजना सांगितली, ती चांगली आहे का?", timestamp: "2026-09-17T14:22:00Z", flagged: false },
      { role: "assistant", text: "निश्चित परताव्याचे आश्वासन देणाऱ्या योजनेची मी शिफारस करू शकत नाही. कृपया बँक शाखेशी बोला.", timestamp: "2026-09-17T14:22:07Z", flagged: true },
    ],
  },
  {
    session_id: "s-2377",
    turns: [
      { role: "user", text: "SHG loan ke baare mein batao", timestamp: "2026-09-16T11:02:45Z", flagged: false },
      { role: "assistant", text: "SHG ऋण समूह की बचत से दिया जाता है। अपने समूह से मासिक योगदान और ब्याज दर के बारे में पूछने पर विचार करें।", timestamp: "2026-09-16T11:02:51Z", flagged: false },
    ],
  },
];

const sessionLang: Record<string, string> = {
  "s-2401": "te",
  "s-2398": "hi",
  "s-2390": "en",
  "s-2385": "en",
  "s-2377": "hi",
};

const sourcesByTurn: Record<string, string[]> = {
  agent: ["NCFE Savings Guide", "Financial Education Material"],
  flagged: ["SEBI Investor Awareness", "RBI Financial Literacy Guide"],
};

export function mockTurnSources(flagged: boolean): string[] {
  return flagged ? sourcesByTurn.flagged : sourcesByTurn.agent;
}

export async function mockGetSessionHistory(sessionId: string): Promise<SessionHistory> {
  await wait(400);
  const s = sessions.find((x) => x.session_id === sessionId);
  if (!s) throw new Error("Session not found");
  return { session_id: s.session_id, turns: s.turns.map((t) => ({ ...t })) };
}

export async function mockListSessions(): Promise<SessionSummary[]> {
  await wait(400);
  return sessions.map((s, i) => ({
    session_id: s.session_id,
    language: sessionLang[s.session_id] ?? "en",
    started_at: s.turns[0].timestamp,
    status: i === 0 ? "active" : "completed",
    flagged: s.turns.some((t) => t.flagged),
    turn_count: s.turns.length,
  }));
}
