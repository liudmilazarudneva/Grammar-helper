// data.jsx — channel definitions, tone definitions, icons, and the Groq prompt builder.

// --- Channel icons (generic, evocative shapes — not platform logos) ---
const IconWorkMail = ({ s = 26 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="5.5" width="19" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
    <path d="M8.5 5.5V4a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 4v1.5" />
  </svg>
);
const IconPersonalMail = ({ s = 26 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="5" width="19" height="14.5" rx="3" />
    <path d="M3 7.5l9 6 9-6" />
    <path d="M12 17.4l-.8-.72c-1.3-1.16-2.2-1.97-2.2-2.98a1.4 1.4 0 0 1 2.45-.93l.55.6.55-.6a1.4 1.4 0 0 1 2.45.93c0 1.01-.9 1.82-2.2 2.99l-.8.71z" fill="currentColor" stroke="none" opacity="0.0" />
  </svg>
);
const IconTeams = ({ s = 26 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 16.5h-7l-4 3.5v-3.5H4A1.5 1.5 0 0 1 2.5 15V7A1.5 1.5 0 0 1 4 5.5z" />
    <path d="M7.5 10h9" />
    <path d="M7.5 13h6" />
  </svg>
);
const IconWhatsApp = ({ s = 26 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3.5a8.5 8.5 0 0 0-7.4 12.7L3.5 20.5l4.45-1.1A8.5 8.5 0 1 0 12 3.5z" />
    <path d="M9 9.2c-.2 1.2.6 2.6 1.6 3.6s2.4 1.8 3.6 1.6c.5-.08.9-.5 1-1 .05-.3-.05-.5-.3-.65l-1.2-.65c-.25-.13-.5-.06-.68.13l-.35.4c-.7-.35-1.45-1.1-1.8-1.8l.4-.35c.2-.18.26-.43.13-.68l-.65-1.2c-.15-.25-.35-.35-.65-.3-.5.1-.92.45-1 .95z" fill="currentColor" stroke="none" />
  </svg>
);

const CHANNELS = [
  {
    id: "work_email",
    label: "Work email",
    blurb: "Professional & structured",
    Icon: IconWorkMail,
    hue: "#2f6df0",
    guide:
      "Format as a professional work email. Use an appropriate greeting and a courteous sign-off. Keep it clear, well-structured, and concise. Use complete sentences and paragraphs. Do not include a subject line unless the draft contains one.",
  },
  {
    id: "personal_email",
    label: "Personal email",
    blurb: "Warm & personable",
    Icon: IconPersonalMail,
    hue: "#e0762f",
    guide:
      "Format as a warm, personable email to someone the writer knows. Use a friendly greeting and a casual sign-off. Keep the writer's natural voice while fixing grammar and clarity. Use complete sentences.",
  },
  {
    id: "teams",
    label: "Teams message",
    blurb: "Direct workplace chat",
    Icon: IconTeams,
    hue: "#6a54d8",
    guide:
      "Format as a concise workplace chat message (like Microsoft Teams). No email greetings or sign-offs. Get to the point quickly, stay polite and collaborative. Short paragraphs or a quick bullet list are fine. Keep it skimmable.",
  },
  {
    id: "whatsapp",
    label: "WhatsApp message",
    blurb: "Casual & conversational",
    Icon: IconWhatsApp,
    hue: "#1fa855",
    guide:
      "Format as a casual, conversational WhatsApp text message. Keep it short and natural, like texting a friend or close colleague. No formal greetings or sign-offs. A light, tasteful emoji is acceptable only if it genuinely fits — never force one.",
  },
];

const TONES = [
  { id: "friendly", label: "Friendly", guide: "Lean warm, approachable, and upbeat — but never unprofessional." },
  { id: "professional", label: "Professional", guide: "Lean crisp, polished, and businesslike — confident but never stiff." },
];

const MODELS = [
  { id: "groq/compound", label: "Groq Compound · free" },
  { id: "groq/compound-mini", label: "Groq Compound Mini · fastest free" },
  { id: "openai/gpt-oss-20b", label: "OpenAI GPT-OSS 20B · low cost" },
  { id: "openai/gpt-oss-120b", label: "OpenAI GPT-OSS 120B · high quality" },
];

function profileLines(profile, channel) {
  if (!profile) return [];
  const isEmail = channel.id === "work_email" || channel.id === "personal_email";
  const lines = [];
  if (profile.name && profile.name.trim()) {
    lines.push("The writer's name is " + profile.name.trim() + (isEmail ? ". Sign the email with this name." : "."));
  }
  if (profile.closing && profile.closing.trim() && channel.id === "work_email") {
    lines.push('Use this closing / sign-off before the name: "' + profile.closing.trim() + '".');
  }
  if (profile.notes && profile.notes.trim()) {
    lines.push("Always-on writer instructions (follow strictly): " + profile.notes.trim());
  }
  return lines.length ? ["", "WRITER PREFERENCES:", ...lines] : [];
}

function buildMessages(draft, channelId, toneId, profile) {
  const channel = CHANNELS.find((c) => c.id === channelId) || CHANNELS[0];
  const tone = TONES.find((t) => t.id === toneId) || TONES[0];
  const system = [
    "You are a precise writing assistant. You rewrite the user's draft message so it is clear, correct, and well-suited to its destination.",
    "Fix all grammar, spelling, and punctuation. Improve clarity and flow. Preserve the writer's intent, key facts, names, numbers, and meaning — never invent details.",
    "",
    "TARGET CHANNEL: " + channel.label + ".",
    channel.guide,
    "",
    "TONE: " + tone.label + ". " + tone.guide,
    ...profileLines(profile, channel),
    "",
    "Output ONLY the rewritten message itself. No preamble, no explanation, no quotation marks around it, no markdown code fences, no notes. If the draft is empty or nonsensical, return it lightly cleaned up.",
  ].join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: "Rewrite this draft:\n\n" + draft },
  ];
}

function buildReplyMessages(incoming, draft, channelId, toneId, profile) {
  const channel = CHANNELS.find((c) => c.id === channelId) || CHANNELS[0];
  const tone = TONES.find((t) => t.id === toneId) || TONES[0];
  const system = [
    "You are a precise writing assistant. The user received a message and has written a rough draft reply. Polish their draft into a clear, correct, well-structured response to the original message.",
    "Fix all grammar, spelling, and punctuation. Improve clarity and flow. Address the points raised in the original message, but only say what the user's draft intends — preserve their intent, decisions, facts, names, and numbers. Never invent commitments, details, or information the user did not provide.",
    "",
    "TARGET CHANNEL: " + channel.label + ".",
    channel.guide,
    "",
    "TONE: " + tone.label + ". " + tone.guide,
    ...profileLines(profile, channel),
    "",
    "Output ONLY the polished reply itself. No preamble, no explanation, no quotation marks, no markdown code fences, no notes.",
  ].join("\n");

  const user = [
    "ORIGINAL MESSAGE I RECEIVED:",
    incoming.trim() || "(none provided)",
    "",
    "MY ROUGH DRAFT REPLY:",
    draft,
  ].join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

async function callGroq({ apiKey, model, messages }) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_completion_tokens: 1200,
    }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j?.error?.message || JSON.stringify(j);
    } catch (e) {
      detail = await res.text().catch(() => "");
    }
    const err = new Error(detail || ("Request failed (" + res.status + ")"));
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("The model returned an empty response. Try again.");
  return text;
}

Object.assign(window, {
  CHANNELS,
  TONES,
  MODELS,
  buildMessages,
  buildReplyMessages,
  callGroq,
  IconWorkMail,
  IconPersonalMail,
  IconTeams,
  IconWhatsApp,
});
