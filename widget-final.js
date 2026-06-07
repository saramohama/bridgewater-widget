/**
 * Bridgewater Engineers — Chat Widget FINAL
 * Fixed: buttons not showing on first load
 * Fixed: font loading causing render issues
 * Added: retry mechanism if buttons fail to render
 */
(function () {
  "use strict";

  // Wait for full page load before doing anything
  function init() {

    const N8N_WEBHOOK = "https://n8n-production-14cb8.up.railway.app/webhook/bridgewater-chat";

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

    // Preload font before rendering anything
    const fontLink = document.createElement("link");
    fontLink.rel = "preload";
    fontLink.as  = "style";
    fontLink.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&display=swap";
    fontLink.onload = function(){ this.rel = "stylesheet"; };
    document.head.appendChild(fontLink);

    // Inject styles
    const style = document.createElement("style");
    style.textContent = `
      #bw-launcher {
        position: fixed !important;
        bottom: 28px !important;
        right: 28px !important;
        z-index: 99998 !important;
        width: 58px !important;
        height: 58px !important;
        background: #000 !important;
        border: 1px solid #4a7c59 !important;
        cursor: pointer !important;
        box-shadow: 0 4px 30px rgba(0,0,0,0.8) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: transform .2s, box-shadow .2s !important;
        padding: 0 !important;
        border-radius: 0 !important;
        outline: none !important;
      }
      #bw-launcher:hover {
        transform: scale(1.06) !important;
        box-shadow: 0 0 24px rgba(74,124,89,0.4) !important;
      }
      #bw-notif {
        position: absolute !important;
        top: -4px !important; right: -4px !important;
        width: 14px !important; height: 14px !important;
        background: #4a7c59 !important;
        border-radius: 50% !important;
        border: 2px solid #000 !important;
        display: none !important;
      }
      #bw-window {
        position: fixed !important;
        bottom: 102px !important; right: 28px !important;
        z-index: 99999 !important;
        width: 390px !important;
        max-width: calc(100vw - 32px) !important;
        height: 610px !important;
        max-height: calc(100vh - 120px) !important;
        background: #000 !important;
        border: 1px solid #1e1e1e !important;
        box-shadow: 0 20px 60px rgba(0,0,0,0.95) !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
        font-family: 'Cormorant Garamond', Georgia, serif !important;
        transform-origin: bottom right !important;
        transition: transform .25s cubic-bezier(.34,1.56,.64,1), opacity .2s !important;
        border-radius: 0 !important;
      }
      #bw-window.bw-closed {
        transform: scale(0.88) !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      #bw-header {
        background: #0a0a0a !important;
        border-bottom: 1px solid #1e1e1e !important;
        padding: 14px 18px !important;
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        flex-shrink: 0 !important;
      }
      #bw-window .bw-avatar {
        width: 38px !important; height: 38px !important;
        background: #000 !important;
        border: 1px solid #4a7c59 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-shrink: 0 !important;
        border-radius: 0 !important;
      }
      #bw-hinfo { flex: 1 !important; min-width: 0 !important; }
      #bw-hinfo strong {
        display: block !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        color: #fff !important;
        letter-spacing: .04em !important;
        font-family: 'Cormorant Garamond', Georgia, serif !important;
      }
      #bw-hinfo span {
        font-size: 10px !important;
        color: #666 !important;
        letter-spacing: .1em !important;
        text-transform: uppercase !important;
      }
      #bw-window .bw-online-dot {
        width: 7px !important; height: 7px !important;
        background: #4a7c59 !important;
        border-radius: 50% !important;
        animation: bwpulse 2.5s infinite !important;
        flex-shrink: 0 !important;
      }
      @keyframes bwpulse { 0%,100%{opacity:1} 50%{opacity:.25} }
      #bw-x-btn {
        background: none !important; border: none !important;
        color: #666 !important; cursor: pointer !important;
        padding: 4px !important; display: flex !important;
        align-items: center !important; transition: color .15s !important;
        flex-shrink: 0 !important;
      }
      #bw-x-btn:hover { color: #fff !important; }
      #bw-prog { height: 1px !important; background: #111 !important; flex-shrink: 0 !important; }
      #bw-prog-fill {
        height: 100% !important; background: #4a7c59 !important;
        transition: width .6s ease !important; width: 20% !important;
      }
      #bw-stage-lbl {
        padding: 7px 18px !important;
        font-size: 9px !important; font-weight: 600 !important;
        letter-spacing: .12em !important; text-transform: uppercase !important;
        color: #4a7c59 !important; background: #0a0a0a !important;
        border-bottom: 1px solid #1e1e1e !important;
        flex-shrink: 0 !important;
        font-family: 'Cormorant Garamond', Georgia, serif !important;
      }
      #bw-msgs {
        flex: 1 !important; overflow-y: auto !important;
        padding: 16px 14px !important;
        display: flex !important; flex-direction: column !important;
        gap: 12px !important; background: #000 !important;
        scroll-behavior: smooth !important; cursor: default !important;
      }
      #bw-msgs::-webkit-scrollbar { width: 3px; }
      #bw-msgs::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
      #bw-window .bw-row {
        display: flex !important; gap: 10px !important;
        animation: bwin .22s ease !important;
      }
      #bw-window .bw-row.bw-u { flex-direction: row-reverse !important; }
      @keyframes bwin { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
      #bw-window .bw-bbl {
        max-width: 78% !important; padding: 11px 15px !important;
        font-size: 14px !important; line-height: 1.7 !important;
        font-family: 'Cormorant Garamond', Georgia, serif !important;
        font-weight: 400 !important; cursor: text !important;
      }
      #bw-window .bw-row:not(.bw-u) .bw-bbl {
        background: #0d0d0d !important; border: 1px solid #1e1e1e !important;
        color: #ccc !important;
      }
      #bw-window .bw-row.bw-u .bw-bbl {
        background: rgba(74,124,89,0.1) !important;
        border: 1px solid rgba(74,124,89,0.3) !important;
        color: #fff !important;
      }
      #bw-window .bw-ico {
        width: 30px !important; height: 30px !important;
        background: #000 !important;
        border: 1px solid rgba(74,124,89,0.4) !important;
        display: flex !important; align-items: center !important;
        justify-content: center !important; flex-shrink: 0 !important;
        margin-top: 2px !important; border-radius: 0 !important;
      }
      .bw-dots { display:flex; gap:5px; align-items:center; padding:3px 0; }
      .bw-dots span {
        width:5px; height:5px; background:#444; border-radius:50%;
        animation:bwbounce 1.3s infinite;
      }
      .bw-dots span:nth-child(2){animation-delay:.18s}
      .bw-dots span:nth-child(3){animation-delay:.36s}
      @keyframes bwbounce{ 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
      #bw-btns {
        padding: 10px 14px 8px !important;
        background: #000 !important;
        border-top: 1px solid #1a1a1a !important;
        display: flex !important; flex-wrap: wrap !important;
        gap: 7px !important; flex-shrink: 0 !important;
        min-height: 0 !important;
      }
      #bw-btns:empty { padding: 0 !important; border-top: none !important; }
      #bw-foot {
        padding: 12px 14px !important; background: #0a0a0a !important;
        border-top: 1px solid #1e1e1e !important;
        display: flex !important; gap: 8px !important;
        align-items: flex-end !important; flex-shrink: 0 !important;
      }
      #bw-input {
        flex: 1 !important; background: #000 !important;
        border: 1px solid #222 !important;
        padding: 10px 13px !important; font-size: 13px !important;
        font-family: 'Cormorant Garamond', Georgia, serif !important;
        outline: none !important; resize: none !important;
        max-height: 90px !important; line-height: 1.5 !important;
        color: #ccc !important; transition: border-color .15s !important;
        cursor: text !important; border-radius: 0 !important;
        box-sizing: border-box !important;
      }
      #bw-input:focus { border-color: #4a7c59 !important; }
      #bw-input::placeholder { color: #333 !important; }
      #bw-send {
        width: 40px !important; height: 40px !important;
        background: #4a7c59 !important; border: none !important;
        cursor: pointer !important; display: flex !important;
        align-items: center !important; justify-content: center !important;
        transition: background .15s, transform .1s !important;
        flex-shrink: 0 !important; border-radius: 0 !important;
      }
      #bw-send:hover { background: #5a9469 !important; }
      #bw-send:active { transform: scale(.93) !important; }
      #bw-send:disabled { opacity: .25 !important; cursor: not-allowed !important; transform: none !important; }
      #bw-cap {
        text-align: center !important; font-size: 9px !important;
        color: #333 !important; padding: 7px !important;
        background: #0a0a0a !important; border-top: 1px solid #111 !important;
        letter-spacing: .08em !important; text-transform: uppercase !important;
        font-family: 'Cormorant Garamond', Georgia, serif !important;
        flex-shrink: 0 !important;
      }
      #bw-cap a { color: #4a7c59 !important; text-decoration: none !important; }
      @media (max-width: 440px) {
        #bw-window {
          bottom: 0 !important; right: 0 !important;
          width: 100vw !important; max-width: 100vw !important;
          height: 100dvh !important; max-height: 100dvh !important;
        }
        #bw-launcher { bottom: 20px !important; right: 20px !important; }
      }
    `;
    document.head.appendChild(style);

    // HTML
    const wrap = document.createElement("div");
    wrap.id = "bw-chat-root";
    wrap.innerHTML = `
      <button id="bw-launcher" aria-label="Open chat with Bridgewater Engineers">
        <div id="bw-notif"></div>
        <svg id="bw-ic-open" width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" fill="#4a7c59"/>
          <circle cx="8" cy="11" r="1.1" fill="#000"/>
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
        <div id="bw-msgs" aria-live="polite"></div>
        <div id="bw-btns"></div>
        <div id="bw-foot">
          <textarea id="bw-input" rows="1"
            placeholder="Type a message or select an option above…"
            aria-label="Your message"></textarea>
          <button id="bw-send" aria-label="Send" disabled>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                    stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
    const launcher = document.getElementById("bw-launcher");
    const win      = document.getElementById("bw-window");
    const msgsEl   = document.getElementById("bw-msgs");
    const btnsEl   = document.getElementById("bw-btns");
    const inputEl  = document.getElementById("bw-input");
    const sendBtn  = document.getElementById("bw-send");
    const progFill = document.getElementById("bw-prog-fill");
    const stageLbl = document.getElementById("bw-stage-lbl");
    const notif    = document.getElementById("bw-notif");
    const icOpen   = document.getElementById("bw-ic-open");
    const icClose  = document.getElementById("bw-ic-close");

    const STAGES = [
      { pct: 20,  label: "Step 1 of 5 — Who are you?"      },
      { pct: 40,  label: "Step 2 of 5 — Service selection" },
      { pct: 60,  label: "Step 3 of 5 — Project details"   },
      { pct: 80,  label: "Step 4 of 5 — Your contact info" },
      { pct: 100, label: "Step 5 of 5 — All done ✓"        },
    ];

    let isOpen = false, isLoading = false, started = false;
    // Store last buttons for retry
    let lastButtons = [];

    function setStage(n) {
      const s = STAGES[Math.min((n||1)-1, STAGES.length-1)];
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
      ico.className = "bw-ico"; ico.innerHTML = ICON;
      const bbl = document.createElement("div");
      bbl.className = "bw-bbl";
      bbl.innerHTML = `<div class="bw-dots"><span></span><span></span><span></span></div>`;
      typingEl.appendChild(ico); typingEl.appendChild(bbl);
      msgsEl.appendChild(typingEl);
      msgsEl.scrollTop = msgsEl.scrollHeight;
    }
    function hideTyping() { if(typingEl){ typingEl.remove(); typingEl=null; } }

    function makeBtn(label) {
      const b = document.createElement("button");
      b.textContent = label;
      // Set ALL styles inline — cannot be overridden by any theme
      const setDefault = () => {
        b.setAttribute("style", [
          "display: inline-block",
          "background: transparent",
          "border: 1px solid #4a7c59",
          "color: #4a7c59",
          "padding: 8px 16px",
          "font-size: 11px",
          "font-weight: 600",
          "font-family: Cormorant Garamond, Georgia, serif",
          "letter-spacing: .09em",
          "text-transform: uppercase",
          "cursor: pointer",
          "white-space: nowrap",
          "line-height: 1.4",
          "border-radius: 0",
          "outline: none",
          "box-shadow: none",
          "margin: 0",
          "transition: background 0.15s, color 0.15s",
        ].join("; "));
      };
      const setHover = () => {
        b.setAttribute("style", [
          "display: inline-block",
          "background: #4a7c59",
          "border: 1px solid #4a7c59",
          "color: #ffffff",
          "padding: 8px 16px",
          "font-size: 11px",
          "font-weight: 600",
          "font-family: Cormorant Garamond, Georgia, serif",
          "letter-spacing: .09em",
          "text-transform: uppercase",
          "cursor: pointer",
          "white-space: nowrap",
          "line-height: 1.4",
          "border-radius: 0",
          "outline: none",
          "box-shadow: none",
          "margin: 0",
        ].join("; "));
      };
      setDefault();
      b.addEventListener("mouseenter", setHover);
      b.addEventListener("mouseleave", setDefault);
      b.addEventListener("click", () => { btnsEl.innerHTML = ""; lastButtons = []; send(label); });
      return b;
    }

    function renderButtons(list) {
      btnsEl.innerHTML = "";
      if (!list || !list.length) { lastButtons = []; return; }
      lastButtons = list;
      list.forEach(label => btnsEl.appendChild(makeBtn(label)));
    }

    // Retry rendering buttons — handles cases where they appear blank
    function retryButtons() {
      if (lastButtons.length > 0 && btnsEl.children.length === 0) {
        renderButtons(lastButtons);
      }
    }

    // API call with retry
    async function callWebhook(message, attempt) {
      attempt = attempt || 1;
      try {
        const res = await fetch(N8N_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, message, history: chatHistory }),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        return await res.json();
      } catch(e) {
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 1000));
          return callWebhook(message, attempt + 1);
        }
        throw e;
      }
    }

    function handleResponse(data) {
      const h = data.history || data.updatedHistory;
      if (h) { chatHistory = h; saveHistory(chatHistory); }
      addMsg("bot", data.reply);
      // Small delay before rendering buttons — lets DOM settle
      setTimeout(() => {
        renderButtons(data.buttons || []);
        setStage(data.stage || 1);
      }, 50);
    }

    async function startChat() {
      showTyping();
      try {
        const data = await callWebhook("START_CONVERSATION");
        hideTyping();
        handleResponse(data);
      } catch(e) {
        hideTyping();
        addMsg("bot", "Hi! Having trouble connecting. Please call us at +1 (703) 679-7028 — we'd love to help.");
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
      lastButtons = [];
      addMsg("user", text);
      showTyping();
      try {
        const data = await callWebhook(text);
        hideTyping();
        handleResponse(data);
      } catch(e) {
        hideTyping();
        addMsg("bot", "Sorry, lost connection. Please try again or call +1 (703) 679-7028.");
      } finally {
        isLoading = false;
        sendBtn.disabled = inputEl.value.trim().length === 0;
      }
    }

    function openChat() {
      isOpen = true;
      win.classList.remove("bw-closed");
      icOpen.style.display = "none";
      icClose.style.display = "block";
      notif.style.display = "none";
      if (!started) {
        started = true;
        // Small delay to let the window animation finish before loading
        setTimeout(startChat, 400);
      } else {
        // Re-render buttons in case they disappeared
        setTimeout(retryButtons, 100);
      }
      setTimeout(() => inputEl.focus(), 400);
    }

    function closeChat() {
      isOpen = false;
      win.classList.add("bw-closed");
      icOpen.style.display = "block";
      icClose.style.display = "none";
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
    document.getElementById("bw-x-btn").addEventListener("click", closeChat);
    document.addEventListener("keydown", e => { if (e.key === "Escape" && isOpen) closeChat(); });

    // Re-render buttons on window focus (handles tab switching)
    window.addEventListener("focus", () => {
      if (isOpen) setTimeout(retryButtons, 100);
    });

    // Show notification badge after 8s if not opened
    setTimeout(() => { if (!started) notif.style.display = "block"; }, 8000);

    window.BridgewaterChat = { open: openChat, close: closeChat };
  }

  // Initialize after page is fully loaded
  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
  }

})();
