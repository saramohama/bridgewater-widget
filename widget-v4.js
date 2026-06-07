/**
 * Bridgewater Engineers — Chat Widget v4
 * Dark theme matching bridgewaterengineers.com
 */

(function () {
  "use strict";

  const N8N_WEBHOOK = "https://n8n-production-14cb8.up.railway.app/webhook/bridgewater-chat";

  // ── Colors matching the website ──────────────────────────
  const COLOR_BG      = "#0a0a0a";   // dark background
  const COLOR_HEADER  = "#111111";   // slightly lighter dark
  const COLOR_ACCENT  = "#4a7c59";   // green accent from site
  const COLOR_GOLD    = "#c8902b";   // gold accent
  const COLOR_TEXT    = "#ffffff";
  const COLOR_BUBBLE_BOT = "#1a1a1a";
  const COLOR_BORDER  = "#2a2a2a";
  const FONT          = "Cormorant Garamond, Georgia, serif"; // serif matching site

  // ── Session management ────────────────────────────────────
  const SESSION_KEY = "bw_session_id";
  const HISTORY_KEY = "bw_chat_history";

  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = "bw-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  let chatHistory = [];
  try {
    const saved = sessionStorage.getItem(HISTORY_KEY);
    if (saved) chatHistory = JSON.parse(saved);
  } catch(e) { chatHistory = []; }

  function saveHistory(h) {
    try { sessionStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch(e) {}
  }

  // ── Styles ────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&display=swap');

    #bw-launcher {
      position:fixed; bottom:28px; right:28px; z-index:99998;
      width:60px; height:60px; border-radius:50%;
      background:${COLOR_BG}; border:1px solid ${COLOR_ACCENT};
      cursor:pointer;
      box-shadow:0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${COLOR_ACCENT}40;
      display:flex; align-items:center; justify-content:center;
      transition:transform .2s, box-shadow .2s;
    }
    #bw-launcher:hover {
      transform:scale(1.07);
      box-shadow:0 6px 32px rgba(0,0,0,0.6), 0 0 0 2px ${COLOR_ACCENT};
    }
    #bw-notif {
      position:absolute; top:-2px; right:-2px;
      width:16px; height:16px; background:${COLOR_ACCENT};
      border-radius:50%; border:2px solid #000; display:none;
    }

    #bw-window {
      position:fixed; bottom:104px; right:28px; z-index:99999;
      width:380px; max-width:calc(100vw - 32px);
      height:600px; max-height:calc(100vh - 130px);
      background:${COLOR_BG}; border-radius:4px;
      border:1px solid ${COLOR_BORDER};
      box-shadow:0 20px 60px rgba(0,0,0,0.7);
      display:flex; flex-direction:column; overflow:hidden;
      font-family:${FONT};
      transform-origin:bottom right;
      transition:transform .25s cubic-bezier(.34,1.56,.64,1), opacity .2s;
    }
    #bw-window.bw-closed { transform:scale(0.88); opacity:0; pointer-events:none; }

    /* Header */
    #bw-header {
      background:${COLOR_HEADER};
      border-bottom:1px solid ${COLOR_BORDER};
      padding:16px 18px;
      display:flex; align-items:center; gap:12px; flex-shrink:0;
    }
    .bw-avatar {
      width:40px; height:40px; border-radius:50%;
      background:${COLOR_BG}; border:1px solid ${COLOR_ACCENT};
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    #bw-hinfo { flex:1; min-width:0; }
    #bw-hinfo strong {
      display:block; font-size:15px; font-weight:500;
      color:${COLOR_TEXT}; letter-spacing:.03em;
      font-family:${FONT};
    }
    #bw-hinfo span { font-size:11px; color:#888; letter-spacing:.05em; text-transform:uppercase; }
    .bw-dot {
      width:7px; height:7px; background:${COLOR_ACCENT};
      border-radius:50%; animation:bwpulse 2.5s infinite;
    }
    @keyframes bwpulse { 0%,100%{opacity:1} 50%{opacity:.3} }
    #bw-close-btn {
      background:none; border:none; color:#666;
      cursor:pointer; padding:4px; border-radius:3px;
      display:flex; align-items:center; transition:color .15s;
    }
    #bw-close-btn:hover { color:#fff; }

    /* Progress */
    #bw-prog-bar { height:1px; background:${COLOR_BORDER}; flex-shrink:0; }
    #bw-prog-fill { height:100%; background:${COLOR_ACCENT}; transition:width .6s ease; width:20%; }

    /* Stage label */
    #bw-stage {
      padding:7px 18px; font-size:10px; font-weight:600;
      letter-spacing:.1em; text-transform:uppercase;
      color:${COLOR_ACCENT}; background:${COLOR_HEADER};
      border-bottom:1px solid ${COLOR_BORDER}; flex-shrink:0;
    }

    /* Messages */
    #bw-msgs {
      flex:1; overflow-y:auto; padding:16px 14px;
      display:flex; flex-direction:column; gap:12px;
      background:${COLOR_BG}; scroll-behavior:smooth;
    }
    #bw-msgs::-webkit-scrollbar { width:3px; }
    #bw-msgs::-webkit-scrollbar-track { background:transparent; }
    #bw-msgs::-webkit-scrollbar-thumb { background:#333; border-radius:2px; }

    .bw-row { display:flex; gap:10px; animation:bwin .2s ease; }
    .bw-row.bw-u { flex-direction:row-reverse; }
    @keyframes bwin { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }

    .bw-bbl {
      max-width:78%; padding:11px 14px;
      font-size:14px; line-height:1.6; border-radius:3px;
      font-family:${FONT}; font-weight:400;
    }
    .bw-row:not(.bw-u) .bw-bbl {
      background:${COLOR_BUBBLE_BOT};
      border:1px solid ${COLOR_BORDER};
      color:#e0e0e0;
    }
    .bw-row.bw-u .bw-bbl {
      background:${COLOR_ACCENT}20;
      border:1px solid ${COLOR_ACCENT}60;
      color:#fff;
    }
    .bw-ico {
      width:30px; height:30px; border-radius:50%;
      background:${COLOR_HEADER}; border:1px solid ${COLOR_ACCENT}60;
      display:flex; align-items:center; justify-content:center;
      flex-shrink:0; margin-top:2px;
    }

    /* Typing */
    .bw-dots { display:flex; gap:5px; align-items:center; padding:2px 0; }
    .bw-dots span {
      width:5px; height:5px; background:#555; border-radius:50%;
      animation:bwbounce 1.3s infinite;
    }
    .bw-dots span:nth-child(2){animation-delay:.18s}
    .bw-dots span:nth-child(3){animation-delay:.36s}
    @keyframes bwbounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

    /* Buttons */
    #bw-btns {
      padding:10px 14px 6px; background:${COLOR_BG};
      border-top:1px solid ${COLOR_BORDER};
      display:flex; flex-wrap:wrap; gap:7px; flex-shrink:0;
    }
    .bw-qbtn {
      background:transparent;
      border:1px solid ${COLOR_ACCENT};
      color:${COLOR_ACCENT}; border-radius:2px;
      padding:7px 14px; font-size:12px; font-weight:500;
      font-family:${FONT}; letter-spacing:.06em; text-transform:uppercase;
      cursor:pointer; white-space:nowrap;
      transition:background .15s, color .15s;
    }
    .bw-qbtn:hover { background:${COLOR_ACCENT}; color:#fff; }

    /* Input */
    #bw-foot {
      padding:12px 14px; background:${COLOR_HEADER};
      border-top:1px solid ${COLOR_BORDER};
      display:flex; gap:8px; align-items:flex-end; flex-shrink:0;
    }
    #bw-input {
      flex:1; background:${COLOR_BG}; border:1px solid ${COLOR_BORDER};
      border-radius:2px; padding:9px 13px;
      font-size:13px; font-family:${FONT};
      outline:none; resize:none; max-height:90px; line-height:1.5;
      color:#e0e0e0; transition:border-color .15s;
    }
    #bw-input:focus { border-color:${COLOR_ACCENT}; }
    #bw-input::placeholder { color:#444; }
    #bw-send {
      width:38px; height:38px; border-radius:2px;
      background:${COLOR_ACCENT}; border:none; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition:filter .15s, transform .1s; flex-shrink:0;
    }
    #bw-send:hover { filter:brightness(1.2); }
    #bw-send:active { transform:scale(.93); }
    #bw-send:disabled { opacity:.3; cursor:not-allowed; transform:none; }

    #bw-caption {
      text-align:center; font-size:10px; color:#444;
      padding:6px; background:${COLOR_HEADER};
      border-top:1px solid ${COLOR_BORDER};
      letter-spacing:.05em; text-transform:uppercase; flex-shrink:0;
      font-family:${FONT};
    }
    #bw-caption a { color:${COLOR_ACCENT}; text-decoration:none; }

    @media(max-width:420px){
      #bw-window{bottom:0;right:0;width:100vw;max-width:100vw;
        height:100dvh;max-height:100dvh;border-radius:0;}
      #bw-launcher{bottom:20px;right:20px;}
    }
  `;
  document.head.appendChild(style);

  // ── HTML ──────────────────────────────────────────────────
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <button id="bw-launcher" aria-label="Open chat">
      <div id="bw-notif"></div>
      <svg id="bw-ic-chat" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"
              fill="${COLOR_ACCENT}" opacity=".9"/>
        <circle cx="8" cy="11" r="1.1" fill="${COLOR_BG}"/>
        <circle cx="12" cy="11" r="1.1" fill="${COLOR_BG}"/>
        <circle cx="16" cy="11" r="1.1" fill="${COLOR_BG}"/>
      </svg>
      <svg id="bw-ic-x" width="20" height="20" viewBox="0 0 24 24" fill="none" style="display:none">
        <path d="M18 6L6 18M6 6l12 12" stroke="${COLOR_ACCENT}" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>

    <div id="bw-window" class="bw-closed" role="dialog" aria-label="Bridgewater Engineers Chat">
      <div id="bw-header">
        <div class="bw-avatar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  stroke="${COLOR_ACCENT}" stroke-width="1.5" fill="none"
                  stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="9 22 9 12 15 12 15 22"
                      stroke="${COLOR_ACCENT}" stroke-width="1.5"
                      stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div id="bw-hinfo">
          <strong>Chris — Bridgewater Engineers</strong>
          <span>Structural Engineering</span>
        </div>
        <div class="bw-dot"></div>
        <button id="bw-close-btn" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <div id="bw-prog-bar"><div id="bw-prog-fill"></div></div>
      <div id="bw-stage">Step 1 of 5 — Getting started</div>

      <div id="bw-msgs" aria-live="polite"></div>
      <div id="bw-btns"></div>

      <div id="bw-foot">
        <textarea id="bw-input" rows="1"
          placeholder="Type a message or tap a button…"
          aria-label="Your message"></textarea>
        <button id="bw-send" aria-label="Send" disabled>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="white"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div id="bw-caption">
        Bridgewater Engineers &nbsp;·&nbsp;
        <a href="tel:+17036797028">+1 (703) 679-7028</a>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  // ── DOM refs ──────────────────────────────────────────────
  const launcher  = document.getElementById("bw-launcher");
  const win       = document.getElementById("bw-window");
  const msgsEl    = document.getElementById("bw-msgs");
  const btnsEl    = document.getElementById("bw-btns");
  const inputEl   = document.getElementById("bw-input");
  const sendBtn   = document.getElementById("bw-send");
  const progFill  = document.getElementById("bw-prog-fill");
  const stageEl   = document.getElementById("bw-stage");
  const notif     = document.getElementById("bw-notif");
  const icChat    = document.getElementById("bw-ic-chat");
  const icX       = document.getElementById("bw-ic-x");

  const STAGES = [
    { pct:20,  label:"Step 1 of 5 — Who are you?"      },
    { pct:40,  label:"Step 2 of 5 — Service selection" },
    { pct:60,  label:"Step 3 of 5 — Project details"   },
    { pct:80,  label:"Step 4 of 5 — Your contact info" },
    { pct:100, label:"Step 5 of 5 — All done ✓"        },
  ];

  let isOpen = false, isLoading = false, started = false;

  function setStage(n) {
    const s = STAGES[Math.min(n - 1, STAGES.length - 1)];
    progFill.style.width = s.pct + "%";
    stageEl.textContent  = s.label;
  }

  const BOT_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          stroke="${COLOR_ACCENT}" stroke-width="1.5" fill="none"
          stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="9 22 9 12 15 12 15 22"
              stroke="${COLOR_ACCENT}" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  function addMsg(role, text) {
    const row = document.createElement("div");
    row.className = "bw-row" + (role === "user" ? " bw-u" : "");
    if (role === "bot") {
      const ico = document.createElement("div");
      ico.className = "bw-ico";
      ico.innerHTML = BOT_ICON;
      row.appendChild(ico);
    }
    const bbl = document.createElement("div");
    bbl.className = "bw-bbl";
    bbl.textContent = text;
    row.appendChild(bbl);
    msgsEl.appendChild(row);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  let typingEl = null;
  function showTyping() {
    typingEl = document.createElement("div");
    typingEl.className = "bw-row";
    const ico = document.createElement("div");
    ico.className = "bw-ico";
    ico.innerHTML = BOT_ICON;
    const bbl = document.createElement("div");
    bbl.className = "bw-bbl";
    bbl.innerHTML = `<div class="bw-dots"><span></span><span></span><span></span></div>`;
    typingEl.appendChild(ico);
    typingEl.appendChild(bbl);
    msgsEl.appendChild(typingEl);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }
  function hideTyping() {
    if (typingEl) { typingEl.remove(); typingEl = null; }
  }

  function renderButtons(list) {
    btnsEl.innerHTML = "";
    if (!list || !list.length) return;
    list.forEach(label => {
      const b = document.createElement("button");
      b.className = "bw-qbtn";
      b.textContent = label;
      b.addEventListener("click", () => {
        btnsEl.innerHTML = "";
        send(label);
      });
      btnsEl.appendChild(b);
    });
  }

  // ── API ───────────────────────────────────────────────────
  async function callWebhook(message) {
    const res = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        message:    message,
        history:    chatHistory,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async function startChat() {
    showTyping();
    try {
      const data = await callWebhook("START_CONVERSATION");
      hideTyping();
      // Store history returned from server
      if (data.history) { chatHistory = data.history; saveHistory(chatHistory); }
      else if (data.updatedHistory) { chatHistory = data.updatedHistory; saveHistory(chatHistory); }
      addMsg("bot", data.reply);
      renderButtons(data.buttons);
      setStage(data.stage || 1);
    } catch(e) {
      hideTyping();
      addMsg("bot", "Hi! I'm having trouble connecting right now. Please call us at +1 (703) 679-7028 — we're happy to help!");
    }
  }

  async function send(text) {
    text = (text || inputEl.value).trim();
    if (!text || isLoading) return;

    inputEl.value = "";
    inputEl.style.height = "auto";
    sendBtn.disabled = true;
    isLoading = true;
    btnsEl.innerHTML = "";

    addMsg("user", text);
    showTyping();

    try {
      const data = await callWebhook(text);
      hideTyping();

      // Update history from server response — handle both field names
      if (data.history) { chatHistory = data.history; saveHistory(chatHistory); }
      else if (data.updatedHistory) { chatHistory = data.updatedHistory; saveHistory(chatHistory); }

      addMsg("bot", data.reply);
      renderButtons(data.buttons);
      setStage(data.stage || 1);
    } catch(e) {
      hideTyping();
      addMsg("bot", "Sorry, I lost connection. Please try again or call +1 (703) 679-7028.");
    } finally {
      isLoading = false;
      sendBtn.disabled = inputEl.value.trim().length === 0;
    }
  }

  // ── Toggle ────────────────────────────────────────────────
  function openChat() {
    isOpen = true;
    win.classList.remove("bw-closed");
    icChat.style.display = "none";
    icX.style.display    = "block";
    notif.style.display  = "none";
    if (!started) { started = true; setTimeout(startChat, 300); }
    setTimeout(() => inputEl.focus(), 350);
  }

  function closeChat() {
    isOpen = false;
    win.classList.add("bw-closed");
    icChat.style.display = "block";
    icX.style.display    = "none";
  }

  inputEl.addEventListener("input", () => {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 90) + "px";
    sendBtn.disabled = inputEl.value.trim().length === 0 || isLoading;
  });
  inputEl.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  });
  sendBtn.addEventListener("click", () => send());
  launcher.addEventListener("click", () => isOpen ? closeChat() : openChat());
  document.getElementById("bw-close-btn").addEventListener("click", closeChat);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && isOpen) closeChat(); });

  setTimeout(() => { if (!started) notif.style.display = "block"; }, 8000);

  window.BridgewaterChat = { open: openChat, close: closeChat };

})();
