import { useState, useRef, useEffect } from "react";

const API_BASE = "http://localhost:8000";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SPEED_OPTIONS = [
  { id: "instant", label: "Instant",  desc: "Clipboard paste"    },
  { id: "fast",    label: "Fast",     desc: "No delay"           },
  { id: "medium",  label: "Medium",   desc: "Balanced"           },
  { id: "slow",    label: "Slow",     desc: "Human-like"         },
  { id: "human",   label: "Human",    desc: "Realistic + typos"  },
];

const GROQ_MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 · 70B",   badge: "Best"    },
  { id: "llama-3.1-8b-instant",    label: "Llama 3.1 · 8B",    badge: "Fastest" },
  { id: "mixtral-8x7b-32768",      label: "Mixtral · 8x7B",    badge: "32k"     },
  { id: "gemma2-9b-it",            label: "Gemma 2 · 9B",      badge: "Light"   },
];

const TONE_OPTIONS = ["professional", "casual", "formal", "creative"];

const SAMPLE_PROMPTS = [
  "Email to HR requesting 2 days sick leave",
  "LinkedIn post about the future of AI automation",
  "Follow-up email after a job interview",
  "Professional bio for a software engineer",
];

const SYSTEM_PROMPT = "You are a professional writing assistant. Generate clean, ready-to-use text. Output ONLY the final text — no explanations, no preamble, no markdown unless asked. The text will be auto-typed directly.";
const TONE_MAP = {
  professional: "Write in a professional, clear, and concise tone.",
  casual: "Write in a friendly, conversational tone.",
  formal: "Write in a formal, structured tone.",
  creative: "Write creatively with vivid, engaging language.",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #080c0e;
    color: #e2e8f0;
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .header {
    border-bottom: 1px solid #1a2530;
    padding: 0 2rem;
    height: 58px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #080c0e;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .logo-icon {
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, #00d4aa, #00a3cc);
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    color: #080c0e;
    font-family: 'JetBrains Mono', monospace;
  }
  .logo-text {
    font-size: 15px;
    font-weight: 600;
    color: #f0f4f8;
    letter-spacing: -0.3px;
  }
  .logo-sub {
    font-size: 11px;
    color: #4a6275;
    font-weight: 400;
    margin-left: 2px;
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .status-dot {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #4a6275;
    font-family: 'JetBrains Mono', monospace;
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  .dot.online  { background: #00d4aa; box-shadow: 0 0 6px #00d4aa88; }
  .dot.offline { background: #e05252; }

  /* Main layout */
  .main {
    display: grid;
    grid-template-columns: 220px 1fr;
    flex: 1;
    min-height: calc(100vh - 58px);
  }

  /* Sidebar */
  .sidebar {
    border-right: 1px solid #1a2530;
    padding: 1.5rem 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: #060a0c;
  }
  .sidebar-label {
    font-size: 10px;
    font-weight: 600;
    color: #2d4255;
    letter-spacing: 1.5px;
    padding: 0 1.25rem;
    margin-bottom: 6px;
    margin-top: 4px;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 1.25rem;
    cursor: pointer;
    border-radius: 0;
    border: none;
    background: transparent;
    color: #4a6275;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 400;
    width: 100%;
    text-align: left;
    transition: all 0.15s;
    border-left: 2px solid transparent;
  }
  .nav-item:hover { color: #94b4c8; background: #0d1820; }
  .nav-item.active {
    color: #00d4aa;
    background: #0a1a16;
    border-left-color: #00d4aa;
    font-weight: 500;
  }
  .nav-icon {
    font-size: 14px;
    width: 18px;
    text-align: center;
    flex-shrink: 0;
  }
  .sidebar-divider {
    height: 1px;
    background: #1a2530;
    margin: 10px 1.25rem;
  }
  .speed-section {
    padding: 0 1.25rem;
    margin-top: 8px;
  }
  .speed-label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .speed-label {
    font-size: 10px;
    font-weight: 600;
    color: #2d4255;
    letter-spacing: 1.5px;
  }
  .speed-val {
    font-size: 11px;
    color: #00d4aa;
    font-family: 'JetBrains Mono', monospace;
  }
  input[type=range].speed-slider {
    width: 100%;
    -webkit-appearance: none;
    height: 3px;
    background: #1a2a35;
    border-radius: 2px;
    outline: none;
    margin-bottom: 6px;
  }
  input[type=range].speed-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #00d4aa;
    cursor: pointer;
    box-shadow: 0 0 8px #00d4aa66;
  }
  .speed-marks {
    display: flex;
    justify-content: space-between;
  }
  .speed-mark {
    font-size: 9px;
    color: #2d4255;
  }
  .delay-section {
    padding: 0 1.25rem;
    margin-top: 14px;
  }

  /* Content area */
  .content {
    padding: 2rem 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    overflow-y: auto;
  }

  /* Panel card */
  .panel {
    background: #0d1620;
    border: 1px solid #1a2d3d;
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    animation: fadeUp 0.2s ease;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .panel-title {
    font-size: 11px;
    font-weight: 600;
    color: #2d4a60;
    letter-spacing: 1.4px;
    margin-bottom: 12px;
  }

  /* Textarea */
  .text-area {
    width: 100%;
    background: #060e14;
    border: 1px solid #1a2d3d;
    border-radius: 8px;
    padding: 14px 16px;
    color: #c8dde8;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    line-height: 1.7;
    resize: vertical;
    outline: none;
    transition: border-color 0.2s;
    min-height: 200px;
  }
  .text-area:focus { border-color: #00d4aa44; }
  .text-area::placeholder { color: #1e3040; }

  /* Prompt input */
  .prompt-input {
    width: 100%;
    background: #060e14;
    border: 1px solid #1a2d3d;
    border-radius: 8px;
    padding: 12px 16px;
    color: #c8dde8;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }
  .prompt-input:focus { border-color: #00d4aa44; }
  .prompt-input::placeholder { color: #1e3040; }

  /* Chips row */
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }
  .chip {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid #1e3545;
    background: transparent;
    color: #4a6275;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.15s;
  }
  .chip:hover { border-color: #00d4aa55; color: #7ab8c8; }
  .chip.active {
    border-color: #00d4aa;
    background: #00d4aa15;
    color: #00d4aa;
    font-weight: 500;
  }

  /* Sample prompts */
  .sample-chip {
    font-size: 11px;
    padding: 5px 11px;
    border-radius: 20px;
    border: 1px dashed #1e3545;
    background: transparent;
    color: #3d5a6a;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.15s;
    text-align: left;
  }
  .sample-chip:hover { border-color: #00d4aa44; color: #5a8898; }

  /* Model grid */
  .model-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 10px;
  }
  .model-card {
    background: #060e14;
    border: 1px solid #1a2d3d;
    border-radius: 8px;
    padding: 10px 12px;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .model-card:hover { border-color: #2a4a60; }
  .model-card.active { border-color: #00d4aa; background: #00d4aa08; }
  .model-name { font-size: 12px; font-weight: 500; color: #7ab8c8; font-family: 'JetBrains Mono', monospace; }
  .model-badge {
    font-size: 9px;
    padding: 2px 6px;
    border-radius: 10px;
    background: #1a2d3d;
    color: #4a6275;
    font-weight: 500;
  }
  .model-card.active .model-badge { background: #00d4aa22; color: #00d4aa; }

  /* Buttons */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 22px;
    background: #00d4aa;
    color: #080c0e;
    border: none;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: -0.2px;
  }
  .btn-primary:hover { background: #00e8bb; }
  .btn-primary:active { transform: scale(0.98); }
  .btn-primary:disabled { background: #1a2d3d; color: #2d4a60; cursor: not-allowed; }

  .btn-danger {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 22px;
    background: #e05252;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    animation: pulse 1.5s ease-in-out infinite;
  }
  .btn-warn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 22px;
    background: #d48800;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    background: transparent;
    color: #4a6275;
    border: 1px solid #1a2d3d;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-ghost:hover { border-color: #2a4a60; color: #7ab8c8; }
  .btn-ghost:disabled { opacity: 0.3; cursor: not-allowed; }

  .btn-ai {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: #0d1a28;
    color: #00d4aa;
    border: 1px solid #00d4aa44;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    margin-top: 12px;
  }
  .btn-ai:hover { background: #00d4aa12; border-color: #00d4aa88; }
  .btn-ai:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Action bar */
  .action-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .char-count {
    font-size: 11px;
    color: #2d4a60;
    font-family: 'JetBrains Mono', monospace;
    margin-left: auto;
  }

  /* Status bar */
  .status-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: #060e14;
    border: 1px solid #1a2d3d;
    border-radius: 8px;
    font-size: 12.5px;
    animation: fadeUp 0.2s ease;
  }
  .status-info    { color: #5bb8d4; border-color: #1a3a4d; }
  .status-success { color: #00d4aa; border-color: #00d4aa33; }
  .status-error   { color: #e07070; border-color: #3a1a1a; }
  .status-idle    { color: #4a6275; }

  /* Voice button */
  .voice-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 2.5rem;
    background: #060e14;
    border: 1px dashed #1a2d3d;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .voice-btn:hover { border-color: #e0525244; background: #120808; }
  .voice-btn.listening {
    border-color: #e05252;
    background: #120808;
    animation: borderPulse 1.5s ease-in-out infinite;
  }
  @keyframes borderPulse {
    0%,100% { border-color: #e05252; }
    50% { border-color: #e0525266; }
  }
  .mic-ring {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #1a0808;
    border: 2px solid #e05252;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    transition: all 0.2s;
  }
  .voice-btn.listening .mic-ring {
    background: #e05252;
    box-shadow: 0 0 20px #e0525255;
  }
  .voice-label { font-size: 13px; color: #4a6275; font-weight: 500; }
  .voice-btn.listening .voice-label { color: #e07070; }

  /* Templates */
  .template-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: #060e14;
    border: 1px solid #1a2d3d;
    border-radius: 8px;
    transition: border-color 0.15s;
  }
  .template-row:hover { border-color: #2a4050; }
  .tpl-name { font-size: 13px; font-weight: 500; color: #7ab8c8; flex: 1; }
  .tpl-hotkey {
    font-size: 10px;
    padding: 2px 7px;
    border-radius: 4px;
    background: #1a2d3d;
    color: #4a6275;
    font-family: 'JetBrains Mono', monospace;
  }
  .tpl-preview { font-size: 11px; color: #2d4a60; margin-top: 2px; }
  .tpl-actions { display: flex; gap: 6px; }
  .tpl-btn {
    font-size: 11px;
    padding: 3px 9px;
    border-radius: 5px;
    border: 1px solid #1a2d3d;
    background: transparent;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    color: #4a6275;
    transition: all 0.15s;
  }
  .tpl-btn:hover { border-color: #00d4aa44; color: #00d4aa; }
  .tpl-btn.danger:hover { border-color: #e0525244; color: #e07070; }

  .save-row {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }
  .save-row input {
    background: #060e14;
    border: 1px solid #1a2d3d;
    border-radius: 7px;
    padding: 9px 12px;
    color: #c8dde8;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
  }
  .save-row input:focus { border-color: #00d4aa44; }
  .save-row input::placeholder { color: #1e3040; }

  /* Key input box field */
  .key-section {
    background: #060e14;
    border: 1px solid #1a2d3d;
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 4px;
  }
  .key-label {
    font-size: 10px;
    font-weight: 600;
    color: #2d4a60;
    letter-spacing: 1.3px;
    margin-bottom: 8px;
  }
  .key-input {
    width: 100%;
    background: #080c0e;
    border: 1px solid #1a2d3d;
    border-radius: 6px;
    padding: 9px 12px;
    color: #c8dde8;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    outline: none;
    transition: border-color 0.2s;
  }
  .key-input:focus { border-color: #00d4aa44; }
  .key-input::placeholder { color: #1e3040; }
  .key-note { font-size: 11px; color: #2d3f50; margin-top: 6px; }

  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.65} }
  @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  .spinner { animation: spin 1s linear infinite; display: inline-block; }
`;

export default function App() {
  const [mode, setMode]               = useState("manual");
  const [text, setText]               = useState("");
  const [aiPrompt, setAiPrompt]       = useState("");
  const [aiTone, setAiTone]           = useState("professional");
  const [groqModel, setGroqModel]     = useState(GROQ_MODELS[0].id);
  const [groqKey, setGroqKey]         = useState("");
  const [speedIdx, setSpeedIdx]       = useState(2);
  const [focusDelay, setFocusDelay]   = useState(3);
  const [isTyping, setIsTyping]       = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus]           = useState({ msg: "", type: "idle" });
  const [templates, setTemplates]     = useState([]);
  const [newTplName, setNewTplName]   = useState("");
  const [newTplHotkey, setNewTplHotkey] = useState("");
  const [countdown, setCountdown]     = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [serverModel, setServerModel] = useState("");
  const countdownRef  = useRef(null);
  const recognitionRef = useRef(null);
  const speed = SPEED_OPTIONS[speedIdx];

  useEffect(() => {
    checkBackend();
    fetchTemplates();
    const saved = sessionStorage.getItem("groq_key");
    if (saved) setGroqKey(saved);
  }, []);

  useEffect(() => {
    if (groqKey) sessionStorage.setItem("groq_key", groqKey);
  }, [groqKey]);

  useEffect(() => {
    if (!isTyping) return;
    const poll = setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE}/status`);
        const d = await r.json();
        if (!d.active) { setIsTyping(false); showStatus("Typing complete!", "success"); }
      } catch {}
    }, 800);
    return () => clearInterval(poll);
  }, [isTyping]);

  const checkBackend = async () => {
    try {
      const r = await fetch(`${API_BASE}/config`, { signal: AbortSignal.timeout(2000) });
      const d = await r.json();
      setBackendOnline(true);
      setServerModel(d.model || "");
      if (!groqKey && d.api_key_set) setGroqKey("(set in .env)");
    } catch { setBackendOnline(false); }
  };

  const fetchTemplates = async () => {
    try {
      const r = await fetch(`${API_BASE}/templates`);
      const d = await r.json();
      setTemplates(d.templates || []);
    } catch { setTemplates([]); }
  };

  const showStatus = (msg, type = "info") => {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: "", type: "idle" }), 5000);
  };

  const startCountdown = (seconds, onDone) => {
    setCountdown(seconds);
    let rem = seconds;
    countdownRef.current = setInterval(() => {
      rem -= 1; setCountdown(rem);
      if (rem <= 0) { clearInterval(countdownRef.current); setCountdown(null); onDone(); }
    }, 1000);
  };

  const handleType = () => {
    if (!text.trim()) { showStatus("No text to type.", "error"); return; }
    showStatus(`Switch to target window — typing in ${focusDelay}s…`, "info");
    startCountdown(focusDelay, async () => {
      if (backendOnline) {
        setIsTyping(true);
        try {
          await fetch(`${API_BASE}/type`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, mode: speed.id, focus_delay: 0 }),
          });
        } catch { showStatus("Backend request failed.", "error"); setIsTyping(false); }
      } else { showStatus("Backend offline. Start python main.py first.", "error"); }
    });
  };

  const handleStop = async () => {
    clearInterval(countdownRef.current);
    setCountdown(null); setIsTyping(false); setIsListening(false);
    recognitionRef.current?.stop();
    try { await fetch(`${API_BASE}/stop`, { method: "POST" }); } catch {}
    showStatus("Stopped.", "idle");
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) { showStatus("Enter a prompt first.", "error"); return; }
    setIsGenerating(true); setText("");
    showStatus("Generating…", "info");
    if (backendOnline) { await generateViaBackend(); }
    else if (groqKey && groqKey.startsWith("gsk_")) { await generateDirect(); }
    else { showStatus("Enter your Groq API key below.", "error"); }
    setIsGenerating(false);
  };

  const generateViaBackend = async () => {
    try {
      const r = await fetch(`${API_BASE}/ai/stream`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, tone: aiTone }),
      });
      const reader = r.body.getReader(); const dec = new TextDecoder(); let full = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of dec.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          full += data.replace(/\\n/g, "\n"); setText(full);
        }
      }
      showStatus("Generated! Edit if needed, then Start Typing.", "success");
    } catch (e) { showStatus(`Stream error: ${e.message}`, "error"); }
  };

  const generateDirect = async () => {
    try {
      const r = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: groqModel, max_tokens: 1000, temperature: 0.7, stream: true,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `${TONE_MAP[aiTone]}\n\n${aiPrompt}` },
          ],
        }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); showStatus(e?.error?.message || `Error ${r.status}`, "error"); return; }
      const reader = r.body.getReader(); const dec = new TextDecoder(); let full = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of dec.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim(); if (data === "[DONE]") break;
          try { const j = JSON.parse(data); const d = j.choices?.[0]?.delta?.content; if (d) { full += d; setText(full); } } catch {}
        }
      }
      showStatus("Generated! Edit if needed, then Start Typing.", "success");
    } catch (e) { showStatus(`Groq error: ${e.message}`, "error"); }
  };

  const handleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showStatus("Voice requires Chrome or Edge browser.", "error"); return; }
    const rec = new SR(); recognitionRef.current = rec;
    rec.continuous = false; rec.interimResults = true; rec.lang = "en-US";
    rec.onstart = () => { setIsListening(true); showStatus("Listening…", "info"); };
    rec.onresult = e => setText(Array.from(e.results).map(r => r[0].transcript).join(""));
    rec.onend = () => { setIsListening(false); showStatus("Captured! Start Typing when ready.", "success"); };
    rec.onerror = e => { setIsListening(false); showStatus(`Error: ${e.error}`, "error"); };
    rec.start();
  };

  const saveTemplate = async () => {
    if (!newTplName.trim() || !text.trim()) { showStatus("Enter a name and load text first.", "error"); return; }
    try {
      await fetch(`${API_BASE}/templates`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTplName, text, hotkey: newTplHotkey || null, speed: speed.id }),
      });
      setNewTplName(""); setNewTplHotkey(""); fetchTemplates();
      showStatus(`Template "${newTplName}" saved!`, "success");
    } catch { showStatus("Backend offline — templates need the server.", "error"); }
  };

  const deleteTemplate = async (name) => {
    try { await fetch(`${API_BASE}/templates/${encodeURIComponent(name)}`, { method: "DELETE" }); fetchTemplates(); } catch {}
  };

  const TABS = [
    { id: "manual",    icon: "✎", label: "Manual"      },
    { id: "ai",        icon: "◆", label: "AI Generate"  },
    { id: "voice",     icon: "●", label: "Voice"        },
    { id: "templates", icon: "▦", label: "Templates"    },
  ];

  const modelShort = serverModel ? serverModel.replace("llama-", "").replace("-versatile","").replace("-instant","") : "";

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* Header */}
        <header className="header">
          <div className="logo">
            <div className="logo-icon">AT</div>
            <span className="logo-text">AutoTyper</span>
            <span className="logo-sub">Groq Edition</span>
          </div>
          <div className="header-right">
            <div className="status-dot">
              <div className={`dot ${backendOnline ? "online" : "offline"}`} />
              {backendOnline ? `backend · ${modelShort || "ready"}` : "backend offline"}
            </div>
          </div>
        </header>

        {/* Main */}
        <div className="main">

          {/* Sidebar */}
          <aside className="sidebar">
            <div className="sidebar-label">MODE</div>
            {TABS.map(t => (
              <button key={t.id} className={`nav-item ${mode === t.id ? "active" : ""}`} onClick={() => setMode(t.id)}>
                <span className="nav-icon">{t.icon}</span>
                {t.label}
              </button>
            ))}

            <div className="sidebar-divider" />
            <div className="sidebar-label">SPEED</div>
            <div className="speed-section">
              <div className="speed-label-row">
                <span className="speed-label">TYPING</span>
                <span className="speed-val">{speed.label}</span>
              </div>
              <input type="range" className="speed-slider" min={0} max={4} step={1} value={speedIdx} onChange={e => setSpeedIdx(Number(e.target.value))} />
              <div className="speed-marks">
                {SPEED_OPTIONS.map(s => <span key={s.id} className="speed-mark">{s.label}</span>)}
              </div>
            </div>

            <div className="delay-section">
              <div className="speed-label-row" style={{ marginBottom: 8 }}>
                <span className="speed-label">DELAY</span>
                <span className="speed-val">{focusDelay}s</span>
              </div>
              <input type="range" className="speed-slider" min={1} max={10} step={1} value={focusDelay} onChange={e => setFocusDelay(Number(e.target.value))} />
              <p style={{ fontSize: 10, color: "#1e3040", marginTop: 6, lineHeight: 1.5 }}>Seconds to switch to target window before typing starts.</p>
            </div>
          </aside>

          {/* Content */}
          <main className="content">

            {/* AI Mode top panel */}
            {mode === "ai" && (
              <div className="panel">
                <div className="panel-title">PROMPT</div>
                <input className="prompt-input" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                  placeholder="e.g. Write an email to HR requesting sick leave for 2 days…"
                  onKeyDown={e => e.key === "Enter" && handleAIGenerate()}
                />
                <div className="chips" style={{ marginTop: 10 }}>
                  {SAMPLE_PROMPTS.map((p, i) => (
                    <button key={i} className="sample-chip" onClick={() => setAiPrompt(p)}>
                      {p.length > 42 ? p.slice(0, 42) + "…" : p}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 16 }}>
                  <div className="panel-title">MODEL</div>
                  <div className="model-grid">
                    {GROQ_MODELS.map(m => (
                      <div key={m.id} className={`model-card ${groqModel === m.id ? "active" : ""}`} onClick={() => setGroqModel(m.id)}>
                        <span className="model-name">{m.label}</span>
                        <span className="model-badge">{m.badge}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div className="panel-title">TONE</div>
                  <div className="chips">
                    {TONE_OPTIONS.map(t => (
                      <button key={t} className={`chip ${aiTone === t ? "active" : ""}`} onClick={() => setAiTone(t)}>{t}</button>
                    ))}
                  </div>
                </div>

                {!backendOnline && (
                  <div style={{ marginTop: 14 }}>
                    <div className="key-section">
                      <div className="key-label">GROQ API KEY (BROWSER MODE)</div>
                      <input className="key-input" type="password" value={groqKey} onChange={e => setGroqKey(e.target.value)} placeholder="gsk_…" />
                      <p className="key-note">Stored in session only. Get a free key at console.groq.com</p>
                    </div>
                  </div>
                )}

                <button className="btn-ai" onClick={handleAIGenerate} disabled={isGenerating || !aiPrompt.trim()}>
                  {isGenerating ? <><span className="spinner">◌</span> Generating…</> : <><span>◆</span> Generate</>}
                </button>
              </div>
            )}

            {/* Voice Mode */}
            {mode === "voice" && (
              <div className="panel">
                <div className="panel-title">VOICE INPUT</div>
                <div className={`voice-btn ${isListening ? "listening" : ""}`} onClick={isListening ? () => recognitionRef.current?.stop() : handleVoice}>
                  <div className="mic-ring">🎙</div>
                  <span className="voice-label">
                    {isListening ? "Listening — click to stop" : "Click to start recording"}
                  </span>
                  <span style={{ fontSize: 11, color: "#2d4a60" }}>Chrome / Edge only</span>
                </div>
              </div>
            )}

            {/* Templates Mode */}
            {mode === "templates" && (
              <div className="panel">
                <div className="panel-title">SAVED TEMPLATES</div>
                {templates.length === 0
                  ? <p style={{ fontSize: 13, color: "#2d4a60" }}>No templates yet. Load text into the editor and save it below.</p>
                  : <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                      {templates.map((t, i) => (
                        <div key={i} className="template-row">
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span className="tpl-name">{t.name}</span>
                              {t.hotkey && <span className="tpl-hotkey">{t.hotkey}</span>}
                            </div>
                            <div className="tpl-preview">{t.text.slice(0, 70)}{t.text.length > 70 ? "…" : ""}</div>
                          </div>
                          <div className="tpl-actions">
                            <button className="tpl-btn" onClick={() => { setText(t.text); setMode("manual"); }}>Load</button>
                            <button className="tpl-btn danger" onClick={() => deleteTemplate(t.name)}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                }
                <div className="panel-title" style={{ marginTop: 8 }}>SAVE CURRENT TEXT AS TEMPLATE</div>
                <div className="save-row">
                  <input value={newTplName} onChange={e => setNewTplName(e.target.value)} placeholder="Template name" style={{ flex: 1 }} />
                  <input value={newTplHotkey} onChange={e => setNewTplHotkey(e.target.value)} placeholder="Hotkey e.g. ctrl+alt+a" style={{ width: 180, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
                  <button className="btn-ghost" onClick={saveTemplate}>Save</button>
                </div>
              </div>
            )}

            {/* Text Editor — always visible */}
            <div className="panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div className="panel-title" style={{ marginBottom: 0 }}>
                  {mode === "ai" ? "GENERATED TEXT" : mode === "voice" ? "RECOGNIZED SPEECH" : "TEXT TO TYPE"}
                </div>
                <span className="char-count" style={{ marginLeft: 0 }}>{text.length} chars</span>
              </div>
              <textarea className="text-area" value={text} onChange={e => setText(e.target.value)} rows={10}
                placeholder={
                  mode === "ai"    ? "AI-generated text will stream here…" :
                  mode === "voice" ? "Spoken words will appear here…" :
                  "Type or paste your text here — then click Start Typing…"
                }
              />
            </div>

            {/* Action Bar */}
            <div className="panel" style={{ padding: "1rem 1.5rem" }}>
              <div className="action-bar">
                {countdown !== null
                  ? <button className="btn-warn" onClick={handleStop}>Starting in {countdown}s — Cancel</button>
                  : isTyping
                  ? <button className="btn-danger" onClick={handleStop}>■ Stop Typing</button>
                  : <button className="btn-primary" onClick={handleType} disabled={!text.trim() || !backendOnline}>
                      ▶ Start Typing
                    </button>
                }
                <button className="btn-ghost" onClick={() => { navigator.clipboard.writeText(text); showStatus("Copied!", "success"); }} disabled={!text.trim()}>
                  ⧉ Copy
                </button>
                <button className="btn-ghost" onClick={() => setText("")}>✕ Clear</button>
                {isTyping && (
                  <span style={{ fontSize: 12, color: "#00d4aa", fontFamily: "'JetBrains Mono', monospace", marginLeft: 4 }}>
                    <span className="spinner">◌</span> typing {text.length} chars · {speed.label}
                  </span>
                )}
                {!backendOnline && (
                  <span style={{ fontSize: 11, color: "#e07070", marginLeft: "auto" }}>
                    Backend offline — run python main.py
                  </span>
                )}
              </div>

              {status.msg && (
                <div className={`status-bar status-${status.type}`} style={{ marginTop: 10 }}>
                  <span>{status.msg}</span>
                </div>
              )}
            </div>

          </main>
        </div>
      </div>
    </>
  );
}
