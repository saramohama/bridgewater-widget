/**
 * Bridgewater Engineers — Chat Widget v6
 * Fixed: cursor on messages, button text color, improved visuals
 */
(function () {
  "use strict";

  const N8N_WEBHOOK = "https://n8n-production-14cb8.up.railway.app/webhook/bridgewater-chat";

  // Session
  const SESSION_KEY = "bw_session_id";
  const HISTORY_KEY = "bw_chat_history";
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = "bw-" + Date.now() + "-" + Math.random().toString(36).slice(2,7);
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  let chatHistory = [];
  try { const s = sessionStorage.getItem(HISTORY_KEY); if(s) chatHistory = JSON.parse(s); } catch(e){}
  function saveHistory(h){ try{ sessionStorage.setItem(HISTORY_KEY, JSON.stringify(h)); }catch(e){} }

  // Inject Google Font
  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&display=swap";
  document.head.appendChild(fontLink);

  // Styles — all colors hardcoded to avoid template literal issues
  const style = document.createElement("style");
  style.textContent = `
    #bw-launcher {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 99998;
      width: 58px;
      height: 58px;
      background: #000000;
      border: 1px solid #4a7c59;
      cursor: pointer;
      box-shadow: 0 4px 30px rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform .2s, box-shadow .2s;
    }
    #bw-launcher:hover {
      transform: scale(1.06);
      box-shadow: 0 0 24px rgba(74,124,89,0.35);
    }
    #bw-notif {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 14px;
      height: 14px;
      background: #4a7c59;
      border-radius: 50%;
      border: 2px solid #000;
      display: none;
    }

    #bw-window {
      position: fixed;
      bottom: 102px;
      right: 28px;
      z-index: 99999;
      width: 385px;
      max-width: calc(100vw - 32px);
      height: 600px;
      max-height: calc(100vh - 120px);
      background: #000000;
      border: 1px solid #1e1e1e;
      box-shadow: 0 20px 60px rgba(0,0,0,0.95), 0 0 0 1px rgba(74,124,89,0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: 'Cormorant Garamond', Georgia, serif;
      transform-origin: bottom right;
      transition: transform .25s cubic-bezier(.34,1.56,.64,1), opacity .2s;
    }
    #bw-window.bw-closed {
      transform: scale(0.88);
      opacity: 0;
      pointer-events: none;
    }

    /* Header */
    #bw-header {
      background: #0a0a0a;
      border-bottom: 1px solid #1e1e1e;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    .bw-avatar {
      width: 38px;
      height: 38px;
      background: #000;
      border: 1px solid #4a7c59;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    #bw-hinfo { flex: 1; min-width: 0; }
    #bw-hinfo strong {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #ffffff;
      letter-spacing: .04em;
      font-family: 'Cormorant Garamond', Georgia, serif;
    }
    #bw-hinfo span {
      font-size: 10px;
      color: #666;
      letter-spacing: .1em;
      text-transform: uppercase;
    }
    .bw-online-dot {
      width: 7px;
      height: 7px;
      background: #4a7c59;
      border-radius: 50%;
      animation: bwpulse 2.5s infinite;
    }
    @keyframes bwpulse { 0%,100%{opacity:1} 50%{opacity:.25} }
    #bw-x-btn {
      background: none;
      border: none;
      color: #555;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      transition: color .15s;
      line-height: 1;
    }
    #bw-x-btn:hover { color: #fff; }

    /* Progress bar */
    #bw-prog {
      height: 1px;
      background: #111;
      flex-shrink: 0;
    }
    #bw-prog-fill {
      height: 100%;
      background: #4a7c59;
      transition: width .6s ease;
      width: 20%;
    }

    /* Stage label */
    #bw-stage-lbl {
      padding: 7px 18px;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: #4a7c59;
      background: #0a0a0a;
      border-bottom: 1px solid #1e1e1e;
      flex-shrink: 0;
      font-family: 'Cormorant Garamond', Georgia, serif;
    }

    /* Messages area */
    #bw-msgs {
      flex: 1;
      overflow-y: auto;
      padding: 16px 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #000;
      scroll-behavior: smooth;
      cursor: default;
    }
    #bw-msgs::-webkit-scrollbar { width: 3px; }
    #bw-msgs::-webkit-scrollbar-track { background: transparent; }
    #bw-msgs::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }

    .bw-row {
      display: flex;
      gap: 10px;
      animation: bwin .22s ease;
    }
    .bw-row.bw-u { flex-direction: row-reverse; }
    @keyframes bwin { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }

    .bw-bbl {
      max-width: 78%;
      padding: 11px 15px;
      font-size: 14px;
      line-height: 1.7;
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-weight: 400;
      cursor: text;
      user-select: text;
    }
    .bw-row:not(.bw-u) .bw-bbl {
      background: #0d0d0d;
      border: 1px solid #1e1e1e;
      color: #cccccc;
    }
    .bw-row.bw-u .bw-bbl {
      background: rgba(74,124,89,0.12);
      border: 1px solid rgba(74,124,89,0.35);
      color: #ffffff;
    }
    .bw-ico {
      width: 30px;
      height: 30px;
      background: #000;
      border: 1px solid rgba(74,124,89,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
    }

    /* Typing dots */
    .bw-dots {
      display: flex;
      gap: 5px;
      align-items: center;
      padding: 3px 0;
    }
    .bw-dots span {
      width: 5px;
      height: 5px;
      background: #333;
      border-radius: 50%;
      animation: bwbounce 1.3s infinite;
    }
    .bw-dots span:nth-child(2) { animation-delay: .18s; }
    .bw-dots span:nth-child(3) { animation-delay: .36s; }
    @keyframes bwbounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

    /* Quick reply buttons */
    #bw-btns {
      padding: 10px 14px 8px;
      background: #000;
      border-top: 1px solid #1a1a1a;
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      flex-shrink: 0;
    }
    .bw-qbtn {
      background: transparent;
      border: 1px solid #4a7c59;
      color: #4a7c59 !important;
      padding: 8px 15px;
      font-size: 11px;
      font-weight: 600;
      font-family: 'Cormorant Garamond', Georgia, serif;
      letter-spacing: .09em;
      text-transform: uppercase;
      cursor: pointer;
      white-space: nowrap;
      transition: background .15s, color .15s, border-color .15s;
      line-height: 1.2;
    }
    .bw-qbtn:hover {
      background: #4a7c59 !important;
      color: #ffffff !important;
      border-color: #4a7c59;
    }
    .bw-qbtn:active {
      background: #3d6b4c !important;
      transform: scale(.97);
    }

    /* Input area */
    #bw-foot {
      padding: 12px 14px;
      background: #0a0a0a;
      border-top: 1px solid #1e1e1e;
      display: flex;
      gap: 8px;
      align-items: flex-end;
      flex-shrink: 0;
    }
    #bw-input {
      flex: 1;
      background: #000;
      border: 1px solid #222;
      padding: 10px 13px;
      font-size: 13px;
      font-family: 'Cormorant Garamond', Georgia, serif;
      outline: none;
      resize: none;
      max-height: 90px;
      line-height: 1.5;
      color: #cccccc;
      transition: border-color .15s;
      cursor: text;
    }
    #bw-input:focus { border-color: #4a7c59; }
    #bw-input::placeholder { color: #333; }

    #bw-send {
      width: 40px;
      height: 40px;
      background: #4a7c59;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background .15s, transform .1s;
      flex-shrink: 0;
    }
    #bw-send:hover { background: #5a9469; }
    #bw-send:active { transform: scale(.93); }
    #bw-send:disabled { opacity: .25; cursor: not-allowed; transform: none; }

    /* Footer caption */
    #bw-cap {
      text-align: center;
      font-size: 9px;
      color: #2a2a2a;
      padding: 7px;
      background: #0a0a0a;
      border-top: 1px solid #111;
      letter-spacing: .08em;
      text-transform: uppercase;
      font-family: 'Cormorant Garamond', Georgia, serif;
      flex-shrink: 0;
    }
    #bw-cap a {
      color: #4a7c59;
      text-decoration: none;
      transition: color .15s;
    }
    #bw-cap a:hover { color: #5a9469; }

    /* Mobile full screen */
    @media (max-width: 440px) {
      #bw-window {
        bottom: 0; right: 0;
        width: 100vw; max-width: 100vw;
        height: 100dvh; max-height: 100dvh;
      }
      #bw-launcher { bottom: 20px; right: 20px; }
    }
  `;
  document.head.appendChild(style);

  // HTML
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <button id="bw-launcher" aria-label="Open chat with Bridgewater Engineers">
      <div id="bw-notif"></div>
      <svg id="bw-ic-open" width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" fill="#4a7c59"/>
        <circle cx="8"  cy="11" r="1.1" fill="#000"/>
        <circle cx="12" cy="11" r="1.1" fill="#000"/>
        <circle cx="16" cy="11" r="1.1" fill="#000"/>
      </svg>
      <svg id="bw-ic-close" width="18" height="18" viewBox="0 0 24 24" fill="none" style="display:none">
        <path d="M18 6L6 18M6 6l12 12" stroke="#4a7c59" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>

    <div id="bw-window" class="bw-closed" role="dialog" aria-label="Chat with Bridgewater Engineers">

      <div id="bw-header">
        <div class="bw-avatar">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  stroke="#4a7c59" stroke-width="1.5" fill="none"
                  stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="9 22 9 12 15 12 15 22"
                      stroke="#4a7c59" stroke-width="1.5"
                      stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div id="bw-hinfo">
          <strong>Chris — Bridgewater Engineers</strong>
          <span>Structural Engineering Assistant</span>
        </div>
        <div class="bw-online-dot"></div>
        <button id="bw-x-btn" aria-label="Close chat">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <div id="bw-prog"><div id="bw-prog-fill"></div></div>
      <div id="bw-stage-lbl">Step 1 of 5 — Getting started</div>

      <div id="bw-msgs" aria-live="polite" aria-atomic="false"></div>
      <div id="bw-btns"></div>

      <div id="bw-foot">
        <textarea
          id="bw-input"
          rows="1"
          placeholder="Type a message or select an option above…"
          aria-label="Your message"
        ></textarea>
        <button id="bw-send" aria-label="Send message" disabled>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                  stroke="white" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <div id="bw-cap">
        Bridgewater Engineers &nbsp;·&nbsp;
        <a href="tel:+17036797028">+1 (703) 679-7028</a>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  // DOM refs
  const launcher  = document.getElementById("bw-launcher");
  const win       = document.getElementById("bw-window");
  const msgsEl    = document.getElementById("bw-msgs");
  const btnsEl    = document.getElementById("bw-btns");
  const inputEl   = document.getElementById("bw-input");
  const sendBtn   = document.getElementById("bw-send");
  const progFill  = document.getElementById("bw-prog-fill");
  const stageLbl  = document.getElementById("bw-stage-lbl");
  const notif     = document.getElementById("bw-notif");
  const icOpen    = document.getElementById("bw-ic-open");
  const icClose   = document.getElementById("bw-ic-close");

  const STAGES = [
    { pct: 20,  label: "Step 1 of 5 — Who are you?"      },
    { pct: 40,  label: "Step 2 of 5 — Service selection" },
    { pct: 60,  label: "Step 3 of 5 — Project details"   },
    { pct: 80,  label: "Step 4 of 5 — Your contact info" },
    { pct: 100, label: "Step 5 of 5 — All done ✓"        },
  ];

  let isOpen = false, isLoading = false, started = false;

  function setStage(n) {
    const s = STAGES[Math.min((n || 1) - 1, STAGES.length - 1)];
    progFill.style.width = s.pct + "%";
    stageLbl.textContent = s.label;
  }

  const ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          stroke="#4a7c59" stroke-width="1.5" fill="none"
          stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="9 22 9 12 15 12 15 22"
              stroke="#4a7c59" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  function addMsg(role, text) {
    const row = document.createElement("div");
    row.className = "bw-row" + (role === "user" ? " bw-u" : "");
    if (role === "bot") {
      const ico = document.createElement("div");
      ico.className = "bw-ico";
      ico.innerHTML = ICON;
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
    ico.innerHTML = ICON;
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
      // Force green color via style attribute to override any theme CSS
      b.style.color = "#4a7c59";
      b.style.borderColor = "#4a7c59";
      b.addEventListener("mouseenter", () => {
        b.style.background = "#4a7c59";
        b.style.color = "#ffffff";
      });
      b.addEventListener("mouseleave", () => {
        b.style.background = "transparent";
        b.style.color = "#4a7c59";
      });
      b.addEventListener("click", () => {
        btnsEl.innerHTML = "";
        send(label);
      });
      btnsEl.appendChild(b);
    });
  }

  // API call
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
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  }

  function handleResponse(data) {
    const newHistory = data.history || data.updatedHistory;
    if (newHistory) { chatHistory = newHistory; saveHistory(chatHistory); }
    addMsg("bot", data.reply);
    renderButtons(data.buttons || []);
    setStage(data.stage || 1);
  }

  async function startChat() {
    showTyping();
    try {
      const data = await callWebhook("START_CONVERSATION");
      hideTyping();
      handleResponse(data);
    } catch(e) {
      hideTyping();
      addMsg("bot", "Hi! I'm having trouble connecting right now. Please call us at +1 (703) 679-7028 — we'd love to help.");
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
      handleResponse(data);
    } catch(e) {
      hideTyping();
      addMsg("bot", "Sorry, I lost connection. Please try again or call +1 (703) 679-7028.");
    } finally {
      isLoading = false;
      sendBtn.disabled = inputEl.value.trim().length === 0;
    }
  }

  function openChat() {
    isOpen = true;
    win.classList.remove("bw-closed");
    icOpen.style.display  = "none";
    icClose.style.display = "block";
    notif.style.display   = "none";
    if (!started) { started = true; setTimeout(startChat, 300); }
    setTimeout(() => inputEl.focus(), 350);
  }

  function closeChat() {
    isOpen = false;
    win.classList.add("bw-closed");
    icOpen.style.display  = "block";
    icClose.style.display = "none";
  }

  // Input auto-grow
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
  document.getElementById("bw-x-btn").addEventListener("click", closeChat);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && isOpen) closeChat(); });

  // Show notification badge after 8s if not opened
  setTimeout(() => { if (!started) notif.style.display = "block"; }, 8000);

  window.BridgewaterChat = { open: openChat, close: closeChat };

})();
