/**
 * Bridgewater Engineers — Chat Widget v3 (Pure n8n)
 *
 * Embed on any page with one script tag before </body>:
 *
 *   <script
 *     src="https://YOUR-N8N-URL.up.railway.app/static/widget.js"
 *     data-api="https://YOUR-N8N-URL.up.railway.app"
 *     defer
 *   ></script>
 *
 * Replace YOUR-N8N-URL with: n8n-production-14cb8.up.railway.app
 */

(function () {
  "use strict";

  const script = document.currentScript || document.querySelector("script[data-api]");
  const N8N_WEBHOOK = "https://n8n-production-14cb8.up.railway.app/webhook/bridgewater-chat";
  const COLOR  = "#1a2744";
  const ACCENT = "#c8902b";

  // Session management — persists across page refreshes
  const SESSION_KEY = "bw_session_id";
  const HISTORY_KEY = "bw_chat_history";

  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = "bw-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  // Load existing history from session storage
  let chatHistory = [];
  try {
    const saved = sessionStorage.getItem(HISTORY_KEY);
    if (saved) chatHistory = JSON.parse(saved);
  } catch(e) { chatHistory = []; }

  function saveHistory(history) {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch(e) {}
  }

  // ── Inject styles ──────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    #bw-launcher {
      position:fixed;bottom:24px;right:24px;z-index:99998;
      width:58px;height:58px;border-radius:50%;
      background:${COLOR};border:none;cursor:pointer;
      box-shadow:0 4px 24px rgba(0,0,0,0.22);
      display:flex;align-items:center;justify-content:center;
      transition:transform .2s,box-shadow .2s;
    }
    #bw-launcher:hover{transform:scale(1.07);box-shadow:0 6px 30px rgba(0,0,0,0.28);}
    #bw-notif{
      position:absolute;top:-3px;right:-3px;
      width:18px;height:18px;background:${ACCENT};
      border-radius:50%;border:2px solid #fff;display:none;
    }
    #bw-window{
      position:fixed;bottom:96px;right:24px;z-index:99999;
      width:375px;max-width:calc(100vw - 32px);
      height:590px;max-height:calc(100vh - 116px);
      background:#fff;border-radius:18px;
      box-shadow:0 10px 48px rgba(0,0,0,0.16);
      display:flex;flex-direction:column;overflow:hidden;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      transform-origin:bottom right;
      transition:transform .28s cubic-bezier(.34,1.56,.64,1),opacity .2s;
    }
    #bw-window.bw-closed{transform:scale(0.85);opacity:0;pointer-events:none;}

    /* Header */
    #bw-header{
      background:${COLOR};color:#fff;
      padding:14px 16px;display:flex;align-items:center;gap:11px;flex-shrink:0;
    }
    .bw-avatar{
      width:38px;height:38px;border-radius:50%;
      background:rgba(255,255,255,0.15);
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
    }
    #bw-hinfo{flex:1;min-width:0;}
    #bw-hinfo strong{display:block;font-size:14px;font-weight:600;}
    #bw-hinfo span{font-size:12px;opacity:.72;}
    .bw-dot{width:8px;height:8px;background:#4ade80;border-radius:50%;animation:bwpulse 2.2s infinite;}
    @keyframes bwpulse{0%,100%{opacity:1}50%{opacity:.35}}
    #bw-close-btn{
      background:none;border:none;color:rgba(255,255,255,.75);
      cursor:pointer;padding:4px;border-radius:6px;
      display:flex;align-items:center;transition:color .15s,background .15s;
    }
    #bw-close-btn:hover{color:#fff;background:rgba(255,255,255,.12);}

    /* Progress */
    #bw-prog-bar{height:3px;background:rgba(255,255,255,0.15);flex-shrink:0;}
    #bw-prog-fill{height:100%;background:${ACCENT};transition:width .5s ease;width:20%;}

    /* Stage label */
    #bw-stage{
      padding:6px 16px;font-size:11px;font-weight:600;
      letter-spacing:.05em;text-transform:uppercase;
      color:${COLOR};background:#f0f4ff;flex-shrink:0;
      border-bottom:1px solid #e5e7eb;
    }

    /* Messages */
    #bw-msgs{
      flex:1;overflow-y:auto;padding:14px 12px;
      display:flex;flex-direction:column;gap:10px;
      background:#f7f8fa;scroll-behavior:smooth;
    }
    #bw-msgs::-webkit-scrollbar{width:3px;}
    #bw-msgs::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:2px;}

    .bw-row{display:flex;gap:8px;animation:bwin .2s ease;}
    .bw-row.bw-u{flex-direction:row-reverse;}
    @keyframes bwin{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}

    .bw-bbl{
      max-width:80%;padding:10px 13px;
      font-size:14px;line-height:1.55;border-radius:16px;
    }
    .bw-row:not(.bw-u) .bw-bbl{
      background:#fff;border:1px solid #e5e7eb;
      color:#1a1a1a;border-bottom-left-radius:4px;
    }
    .bw-row.bw-u .bw-bbl{
      background:${COLOR};color:#fff;border-bottom-right-radius:4px;
    }
    .bw-ico{
      width:28px;height:28px;border-radius:50%;
      background:${COLOR};display:flex;align-items:center;
      justify-content:center;flex-shrink:0;margin-top:2px;
    }

    /* Typing */
    .bw-dots{display:flex;gap:4px;align-items:center;padding:2px 0;}
    .bw-dots span{
      width:6px;height:6px;background:#9ca3af;border-radius:50%;
      animation:bwbounce 1.2s infinite;
    }
    .bw-dots span:nth-child(2){animation-delay:.15s}
    .bw-dots span:nth-child(3){animation-delay:.3s}
    @keyframes bwbounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}

    /* Quick reply buttons */
    #bw-btns{
      padding:8px 12px 4px;background:#f7f8fa;
      display:flex;flex-wrap:wrap;gap:6px;flex-shrink:0;
      min-height:0;
    }
    .bw-qbtn{
      background:#fff;border:1.5px solid ${COLOR};
      color:${COLOR};border-radius:20px;
      padding:7px 14px;font-size:13px;font-weight:600;
      cursor:pointer;white-space:nowrap;
      transition:background .15s,color .15s;
    }
    .bw-qbtn:hover{background:${COLOR};color:#fff;}

    /* Input */
    #bw-foot{
      padding:10px 12px;background:#fff;
      border-top:1px solid #e5e7eb;
      display:flex;gap:8px;align-items:flex-end;flex-shrink:0;
    }
    #bw-input{
      flex:1;border:1px solid #d1d5db;border-radius:20px;
      padding:9px 14px;font-size:14px;font-family:inherit;
      outline:none;resize:none;max-height:90px;line-height:1.4;
      background:#f9fafb;color:#1a1a1a;transition:border-color .15s;
    }
    #bw-input:focus{border-color:${COLOR};background:#fff;}
    #bw-input::placeholder{color:#9ca3af;}
    #bw-send{
      width:38px;height:38px;border-radius:50%;
      background:${COLOR};border:none;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      transition:filter .15s,transform .15s;flex-shrink:0;
    }
    #bw-send:hover{filter:brightness(1.15);}
    #bw-send:active{transform:scale(.92);}
    #bw-send:disabled{opacity:.35;cursor:not-allowed;transform:none;}

    #bw-caption{
      text-align:center;font-size:11px;color:#9ca3af;
      padding:5px;background:#fff;border-top:1px solid #f3f4f6;flex-shrink:0;
    }
    #bw-caption a{color:${ACCENT};text-decoration:none;font-weight:500;}

    @media(max-width:420px){
      #bw-window{bottom:0;right:0;width:100vw;max-width:100vw;
        height:100dvh;max-height:100dvh;border-radius:0;}
      #bw-launcher{bottom:16px;right:16px;}
    }
  `;
  document.head.appendChild(style);

  // ── Inject HTML ────────────────────────────────────────────
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <button id="bw-launcher" aria-label="Open chat">
      <div id="bw-notif"></div>
      <svg id="bw-ic-chat" width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" fill="white" opacity=".9"/>
        <circle cx="8" cy="11" r="1.2" fill="${COLOR}"/>
        <circle cx="12" cy="11" r="1.2" fill="${COLOR}"/>
        <circle cx="16" cy="11" r="1.2" fill="${COLOR}"/>
      </svg>
      <svg id="bw-ic-x" width="22" height="22" viewBox="0 0 24 24" fill="none" style="display:none">
        <path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </button>

    <div id="bw-window" class="bw-closed" role="dialog" aria-label="Bridgewater Engineers Chat">
      <div id="bw-header">
        <div class="bw-avatar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  stroke="white" stroke-width="1.8" stroke-linecap="round"
                  stroke-linejoin="round" fill="none"/>
            <polyline points="9 22 9 12 15 12 15 22" stroke="white"
                      stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div id="bw-hinfo">
          <strong>Chris — Bridgewater Engineers</strong>
          <span>Structural Engineering Assistant</span>
        </div>
        <div class="bw-dot"></div>
        <button id="bw-close-btn" aria-label="Close chat">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
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
          aria-label="Type your message"></textarea>
        <button id="bw-send" aria-label="Send" disabled>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
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

  // ── DOM refs ───────────────────────────────────────────────
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

  const STAGE_META = [
    { pct: 20,  label: "Step 1 of 5 — Who are you?"      },
    { pct: 40,  label: "Step 2 of 5 — Service selection" },
    { pct: 60,  label: "Step 3 of 5 — Project details"   },
    { pct: 80,  label: "Step 4 of 5 — Your contact info" },
    { pct: 100, label: "Step 5 of 5 — All done! ✓"       },
  ];

  let isOpen    = false;
  let isLoading = false;
  let started   = false;

  // ── UI helpers ─────────────────────────────────────────────
  function setStage(n) {
    const s = STAGE_META[Math.min(n - 1, STAGE_META.length - 1)];
    progFill.style.width = s.pct + "%";
    stageEl.textContent  = s.label;
  }

  const BOT_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          stroke="white" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round" fill="none"/>
    <polyline points="9 22 9 12 15 12 15 22" stroke="white"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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

  // ── API call ───────────────────────────────────────────────
  async function callN8N(message) {
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
      const data = await callN8N("START_CONVERSATION");
      hideTyping();
      chatHistory = data.history || [];
      saveHistory(chatHistory);
      addMsg("bot", data.reply);
      renderButtons(data.buttons);
      setStage(data.stage || 1);
    } catch (e) {
      hideTyping();
      addMsg("bot", "Hi! I'm having a little trouble connecting. Please call us at +1 (703) 679-7028 — we're happy to help!");
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
      const data = await callN8N(text);
      hideTyping();
      chatHistory = data.history || chatHistory;
      saveHistory(chatHistory);
      addMsg("bot", data.reply);
      renderButtons(data.buttons);
      setStage(data.stage || 1);

      // If lead was saved, show a subtle confirmation
      if (data.lead_saved) {
        console.log("Lead saved:", data.lead_id);
      }
    } catch (e) {
      hideTyping();
      addMsg("bot", "Sorry, I lost connection for a moment. Please try again or call +1 (703) 679-7028.");
    } finally {
      isLoading = false;
      sendBtn.disabled = inputEl.value.trim().length === 0;
    }
  }

  // ── Open / close ───────────────────────────────────────────
  function openChat() {
    isOpen = true;
    win.classList.remove("bw-closed");
    icChat.style.display = "none";
    icX.style.display    = "block";
    notif.style.display  = "none";
    if (!started) {
      started = true;
      setTimeout(startChat, 300);
    }
    setTimeout(() => inputEl.focus(), 350);
  }

  function closeChat() {
    isOpen = false;
    win.classList.add("bw-closed");
    icChat.style.display = "block";
    icX.style.display    = "none";
  }

  // ── Input handlers ─────────────────────────────────────────
  inputEl.addEventListener("input", () => {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 90) + "px";
    sendBtn.disabled = inputEl.value.trim().length === 0 || isLoading;
  });
  inputEl.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  });
  sendBtn.addEventListener("click", () => send());

  // ── Toggle ─────────────────────────────────────────────────
  launcher.addEventListener("click", () => isOpen ? closeChat() : openChat());
  document.getElementById("bw-close-btn").addEventListener("click", closeChat);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && isOpen) closeChat(); });

  // Show badge after 6s if not opened
  setTimeout(() => { if (!started) notif.style.display = "block"; }, 6000);

  // ── Public API ─────────────────────────────────────────────
  window.BridgewaterChat = { open: openChat, close: closeChat };

})();
