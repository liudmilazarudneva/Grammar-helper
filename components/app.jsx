// app.jsx — Grammar Helper main application

const { useState, useEffect, useRef } = React;

const KEY_STORAGE = "groqApiKey_v1";

// Curated accent options per the Tweaks panel
const ACCENTS = ["#1f6feb", "#0f9d58", "#e0762f", "#7c4dff", "#111111"];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  theme: "clean",
  accent: "#1f6feb",
  layout: "split",
  serifHeads: false,
} /*EDITMODE-END*/;

function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v === null ? initial : v;
    } catch (e) {
      return initial;
    }
  });
  const set = (v) => {
    setVal(v);
    try {
      if (v === null || v === undefined || v === "") localStorage.removeItem(key);
      else localStorage.setItem(key, v);
    } catch (e) {}
  };
  return [val, set];
}

// ---------- API key gate (inline panel) ----------
function KeyPanel({ apiKey, onSave, onClose }) {
  const [draftKey, setDraftKey] = useState(apiKey || "");
  const [show, setShow] = useState(false);
  return (
    <div className="gh-modal-backdrop" onMouseDown={onClose}>
      <div className="gh-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="gh-modal-head">
          <h2 className="gh-h2">Connect Groq</h2>
          <button className="gh-iconbtn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <p className="gh-modal-sub">
          Your key is stored only in this browser (localStorage) and sent directly to Groq. It never touches any other server.
        </p>
        <label className="gh-field-label">Groq API key</label>
        <div className="gh-keyrow">
          <input
            className="gh-input gh-mono"
            type={show ? "text" : "password"}
            placeholder="gsk_…"
            value={draftKey}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setDraftKey(e.target.value.trim())}
          />
          <button className="gh-ghostbtn" onClick={() => setShow((s) => !s)}>{show ? "Hide" : "Show"}</button>
        </div>
        <div className="gh-modal-foot">
          <a className="gh-link" href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">Get a free key ↗</a>
          <div className="gh-foot-actions">
            {apiKey ? <button className="gh-ghostbtn" onClick={() => { onSave(""); onClose(); }}>Remove</button> : null}
            <button className="gh-primary gh-primary-sm" disabled={!draftKey.startsWith("gsk_") && draftKey.length < 8} onClick={() => { onSave(draftKey); onClose(); }}>Save key</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Channel tile ----------
function ChannelTile({ channel, active, onClick }) {
  const { Icon } = channel;
  return (
    <button
      className={"gh-chip" + (active ? " is-active" : "")}
      onClick={onClick}
      title={channel.blurb}
      style={active ? { "--tile-hue": channel.hue } : undefined}
    >
      <span className="gh-chip-ico" style={{ color: active ? channel.hue : undefined }}><Icon s={17} /></span>
      <span className="gh-chip-label">{channel.label}</span>
    </button>
  );
}

// ---------- Result panel ----------
function ResultPanel({ status, result, error, channel }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => { setCopied(false); }, [result]);

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = result; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e2) {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="gh-result">
      <button className={"gh-copybtn" + (copied ? " is-copied" : "")} onClick={copy} disabled={!result} title="Copy" aria-label="Copy">
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6" /></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
        )}
      </button>

      <div className="gh-result-body">
        {status === "idle" && (
          <div className="gh-placeholder">
            <div className="gh-placeholder-mark">
              {channel ? <channel.Icon s={30} /> : null}
            </div>
            <p>Your polished {channel ? channel.label.toLowerCase() : "message"} will appear here.</p>
          </div>
        )}
        {status === "loading" && (
          <div className="gh-loading">
            <span className="gh-dot" /><span className="gh-dot" /><span className="gh-dot" />
            <span className="gh-loading-text">Rewriting…</span>
          </div>
        )}
        {status === "error" && (
          <div className="gh-error">
            <strong>Couldn’t rewrite that.</strong>
            <span>{error}</span>
          </div>
        )}
        {status === "done" && (
          <div className="gh-output">{result}</div>
        )}
      </div>
    </section>
  );
}

// ---------- Settings panel ----------
const CLOSINGS = ["Best regards", "Kind regards", "Best wishes", "Warm regards", "Many thanks", "Sincerely"];

function SettingsPanel({ profile, onSaveProfile, apiKey, onSaveKey, onClose }) {
  const [name, setName] = useState(profile.name || "");
  const [closing, setClosing] = useState(profile.closing || "");
  const [notes, setNotes] = useState(profile.notes || "");
  const [key, setKey] = useState(apiKey || "");
  const [showK, setShowK] = useState(false);

  const save = () => {
    onSaveProfile({ name: name.trim(), closing: closing.trim(), notes: notes.trim() });
    onSaveKey(key.trim());
    onClose();
  };

  return (
    <div className="gh-modal-backdrop" onMouseDown={onClose}>
      <div className="gh-modal gh-modal-lg" onMouseDown={(e) => e.stopPropagation()}>
        <div className="gh-modal-head">
          <h2 className="gh-h2">Settings</h2>
          <button className="gh-iconbtn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="gh-modal-scroll">
          <label className="gh-field-label">Your name</label>
          <input className="gh-input" placeholder="e.g. Alex Morgan" value={name} onChange={(e) => setName(e.target.value)} />
          <p className="gh-field-help">Used to sign off your emails.</p>

          <label className="gh-field-label">Work-email closing</label>
          <input className="gh-input" placeholder="e.g. Best regards" value={closing} onChange={(e) => setClosing(e.target.value)} />
          <div className="gh-quickpicks">
            {CLOSINGS.map((c) => (
              <button key={c} className={"gh-quickpick" + (closing === c ? " is-active" : "")} onClick={() => setClosing(c)}>{c}</button>
            ))}
          </div>

          <label className="gh-field-label">Always-on instructions for the AI</label>
          <textarea
            className="gh-input gh-input-area"
            placeholder={'e.g. Never use em dashes ("—"). Avoid corporate jargon. Keep replies short.'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <p className="gh-field-help">Applied to every rewrite and reply, on both tabs.</p>

          <div className="gh-settings-rule" />

          <label className="gh-field-label">Groq API key</label>
          <div className="gh-keyrow">
            <input className="gh-input gh-mono" type={showK ? "text" : "password"} placeholder="gsk_…" spellCheck={false} autoComplete="off" value={key} onChange={(e) => setKey(e.target.value.trim())} />
            <button className="gh-ghostbtn" onClick={() => setShowK((s) => !s)}>{showK ? "Hide" : "Show"}</button>
          </div>
          <p className="gh-field-help">Stored only in this browser. <a className="gh-link" href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">Get a free key ↗</a></p>
        </div>

        <div className="gh-modal-foot">
          <span className="gh-conn"><span className={"gh-keydot" + (key ? " on" : "")} />{key ? "Groq key set" : "No key yet"}</span>
          <button className="gh-primary gh-primary-sm" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [apiKey, setApiKey] = useLocalStorage(KEY_STORAGE, "");
  const [showKey, setShowKey] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const rewriteRef = useRef(null);
  const replyIncomingRef = useRef(null);

  const [profileName, setProfileName] = useLocalStorage("gh_name", "");
  const [profileClosing, setProfileClosing] = useLocalStorage("gh_closing", "");
  const [profileNotes, setProfileNotes] = useLocalStorage("gh_notes", "");
  const profile = { name: profileName, closing: profileClosing, notes: profileNotes };

  const [tab, setTab] = useLocalStorage("gh_tab", "rewrite");
  const [draft, setDraft] = useState("");
  const [incoming, setIncoming] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [channelId, setChannelId] = useLocalStorage("gh_channel", "work_email");
  const [toneId, setToneId] = useLocalStorage("gh_tone", "friendly");
  const [model, setModel] = useLocalStorage("gh_model", MODELS[0].id);

  // per-tab output so switching tabs keeps each result
  const [results, setResults] = useState({
    rewrite: { status: "idle", text: "", error: "" },
    reply: { status: "idle", text: "", error: "" },
  });
  const cur = results[tab];
  const setTabResult = (patch) =>
    setResults((r) => ({ ...r, [tab]: { ...r[tab], ...patch } }));

  // apply theme + accent to root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", t.theme);
    document.documentElement.setAttribute("data-serif", t.serifHeads ? "on" : "off");
    document.documentElement.style.setProperty("--accent", t.accent);
  }, [t.theme, t.accent, t.serifHeads]);

  // coerce any stale stored tone (e.g. removed "auto") to a valid one
  useEffect(() => {
    if (!TONES.some((tn) => tn.id === toneId)) setToneId(TONES[0].id);
  }, [toneId]);

  useEffect(() => {
    // Keep focus on the first field when loading and when switching tabs.
    const focusTimer = requestAnimationFrame(() => {
      const target = tab === "reply" ? replyIncomingRef.current : rewriteRef.current;
      if (target && typeof target.focus === "function") {
        target.focus();
        const len = target.value ? target.value.length : 0;
        if (typeof target.setSelectionRange === "function") {
          target.setSelectionRange(len, len);
        }
      }
    });

    return () => cancelAnimationFrame(focusTimer);
  }, [tab]);

  const channel = CHANNELS.find((c) => c.id === channelId) || CHANNELS[0];
  const sourceText = tab === "reply" ? replyDraft : draft;
  const canSend = sourceText.trim().length > 0 && cur.status !== "loading";

  const handleSend = async () => {
    const text0 = tab === "reply" ? replyDraft : draft;
    if (!text0.trim()) return;
    if (!apiKey) { setShowKey(true); return; }
    setTabResult({ status: "loading", error: "", text: "" });
    try {
      const messages =
        tab === "reply"
          ? buildReplyMessages(incoming, replyDraft, channelId, toneId, profile)
          : buildMessages(draft, channelId, toneId, profile);
      const text = await callGroq({ apiKey, model, messages });
      setTabResult({ status: "done", text });
    } catch (e) {
      let msg = e.message || "Something went wrong.";
      if (e.status === 401) msg = "Your API key was rejected. Check it in settings.";
      if (e.status === 429) msg = "Rate limit reached — wait a moment and try again.";
      if (/Failed to fetch|NetworkError/i.test(msg)) msg = "Network/CORS error reaching Groq. Check your connection and key.";
      setTabResult({ status: "error", error: msg });
    }
  };

  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleSend(); }
  };

  // global ⌘/Ctrl + Enter triggers rewrite from anywhere
  useEffect(() => {
    const onGlobalKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
    };
    window.addEventListener("keydown", onGlobalKey);
    return () => window.removeEventListener("keydown", onGlobalKey);
  });

  return (
    <div className={"gh-app gh-layout-" + t.layout}>
      <main className="gh-main">
        {/* TAB BAR */}
        <div className="gh-tabsrow">
          <div className="gh-tabs">
            <button className={"gh-tab" + (tab === "rewrite" ? " is-active" : "")} onClick={() => setTab("rewrite")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20l4-1 9.5-9.5a2.1 2.1 0 0 0-3-3L5 16l-1 4z" /><path d="M13.5 6.5l3 3" /></svg>
              Rewrite
            </button>
            <button className={"gh-tab" + (tab === "reply" ? " is-active" : "")} onClick={() => setTab("reply")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17l-5-5 5-5" /><path d="M4 12h11a5 5 0 0 1 5 5v1" /></svg>
              Reply
            </button>
          </div>
          <button className="gh-gear" onClick={() => setShowSettings(true)} title="Settings" aria-label="Settings">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          </button>
        </div>

        {/* TOP CONTROL ROW: channels + tone */}
        <div className="gh-topcontrols">
          <div className="gh-tiles">
            {CHANNELS.map((c) => (
              <ChannelTile key={c.id} channel={c} active={c.id === channelId} onClick={() => setChannelId(c.id)} />
            ))}
          </div>
          <div className="gh-segmented gh-segmented-tone">
            {TONES.map((tn) => (
              <button key={tn.id} className={"gh-seg" + (tn.id === toneId ? " is-active" : "")} onClick={() => setToneId(tn.id)}>{tn.label}</button>
            ))}
          </div>
        </div>

        {/* PAIRED PANELS */}
        <div className="gh-panes">
          {tab === "rewrite" ? (
            <section className="gh-card gh-compose">
              <textarea
                ref={rewriteRef}
                className="gh-textarea"
                placeholder="Paste or type the message you want to clean up…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                spellCheck={true}
              />
              <button className="gh-go" disabled={!canSend} onClick={handleSend}>
                {cur.status === "loading" ? <span className="gh-go-spin" /> : (
                  <>
                    <span className="gh-go-label">Rewrite</span>
                    <span className="gh-go-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13" /><path d="M13 6l6 6-6 6" /></svg></span>
                  </>
                )}
              </button>
            </section>
          ) : (
            <section className="gh-card gh-compose gh-compose-reply">
              <div className="gh-field">
                <label className="gh-field-tag">Their message</label>
                <textarea
                  ref={replyIncomingRef}
                  className="gh-textarea gh-textarea-sm"
                  placeholder="Paste the email or message you received…"
                  value={incoming}
                  onChange={(e) => setIncoming(e.target.value)}
                  spellCheck={true}
                />
              </div>
              <div className="gh-field-rule" />
              <div className="gh-field">
                <label className="gh-field-tag">Your draft reply</label>
                <textarea
                  className="gh-textarea gh-textarea-sm"
                  placeholder="Jot down your rough reply…"
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  onKeyDown={onKeyDown}
                  spellCheck={true}
                />
              </div>
              <button className="gh-go" disabled={!canSend} onClick={handleSend}>
                {cur.status === "loading" ? <span className="gh-go-spin" /> : (
                  <>
                    <span className="gh-go-label">Polish reply</span>
                    <span className="gh-go-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13" /><path d="M13 6l6 6-6 6" /></svg></span>
                  </>
                )}
              </button>
            </section>
          )}

          <ResultPanel status={cur.status} result={cur.text} error={cur.error} channel={channel} />
        </div>
      </main>

      {showKey ? <KeyPanel apiKey={apiKey} onSave={setApiKey} onClose={() => setShowKey(false)} /> : null}
      {showSettings ? (
        <SettingsPanel
          profile={profile}
          onSaveProfile={(p) => { setProfileName(p.name); setProfileClosing(p.closing); setProfileNotes(p.notes); }}
          apiKey={apiKey}
          onSaveKey={setApiKey}
          onClose={() => setShowSettings(false)}
        />
      ) : null}

      <TweaksPanel>
        <TweakSection label="Look" />
        <TweakRadio label="Theme" value={t.theme} options={["clean", "warm", "bold", "dark"]} onChange={(v) => setTweak("theme", v)} />
        <TweakColor label="Accent" value={t.accent} options={ACCENTS} onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Arrangement" value={t.layout} options={["split", "stacked"]} onChange={(v) => setTweak("layout", v)} />
        <TweakToggle label="Serif headings" value={t.serifHeads} onChange={(v) => setTweak("serifHeads", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
