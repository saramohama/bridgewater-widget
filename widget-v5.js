/**
 * Bridgewater Engineers — Chat Widget v5
 * Matches bridgewaterengineers.com exactly:
 * - Pure black background
 * - White text
 * - Green accent (matching site buttons)
 * - Uppercase serif typography
 * - Clean minimal borders
 */

(function () {
  "use strict";

  const N8N_WEBHOOK = "https://n8n-production-14cb8.up.railway.app/webhook/bridgewater-chat";

  const C_BG       = "#000000";
  const C_SURFACE  = "#0d0d0d";
  const C_BORDER   = "#222222";
  const C_GREEN    = "#4a7c59";
  const C_TEXT     = "#ffffff";
  const C_MUTED    = "#888888";
  const FONT       = "'Cormorant Garamond', 'Playfair Display', Georgia, serif";

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

  // Styles
  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&display=swap');

    #bw-launcher {
      position:fixed; bottom:28px; right:28px; z-index:99998;
      width:56px; height:56px; border-radius:0;
      background:${C_BG}; border:1px solid ${C_GREEN};
      cursor:pointer; box-shadow:0 4px 30px rgba(0,0,0,0.8);
      display:flex; align-items:center; justify-content:center;
      transition:transform .2s, border-color .2s;
    }
    #bw-launcher:hover { transform:scale(1.06); border-color:${C_GREEN}; box-shadow:0 0 20px ${C_GREEN}33; }
    #bw-notif {
      position:absolute; top:-4px; right:-4px;
      width:14px; height:14px; background:${C_GREEN};
      border-radius:50%; border:2px solid ${C_BG}; display:none;
    }

    #bw-window {
      position:fixed; bottom:100px; right:28px; z-index:99999;
      width:380px; max-width:calc(100vw - 32px);
      height:590px; max-height:calc(100vh - 120px);
      background:${C_BG}; border:1px solid ${C_BORDER};
      box-shadow:0 20px 60px rgba(0,0,0,0.9), 0 0 0 1px ${C_GREEN}22;
      display:flex; flex-direction:column; overflow:hidden;
      font-family:${FONT};
      transform-origin:bottom right;
      transition:transform .25s cubic-bezier(.34,1.56,.64,1), opacity .2s;
    }
    #bw-window.bw-closed { transform:scale(0.88); opacity:0; pointer-events:none; }

    #bw-header {
      background:${C_SURFACE};
      border-bottom:1px solid ${C_BORDER};
      padding:14px 18px;
      display:flex; align-items:center; gap:12px; flex-shrink:0;
    }
    .bw-avatar {
      width:36px; height:36px;
      background:${C_BG}; border:1px solid ${C_GREEN};
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    #bw-hinfo { flex:1; min-width:0; }
    #bw-hinfo strong {
      display:block; font-size:14px; font-weight:500;
      color:${C_TEXT}; letter-spacing:.04em; font-family:${FONT};
    }
    #bw-hinfo span {
      font-size:10px; color:${C_MUTED};
      letter-spacing:.1em; text-transform:uppercase;
    }
    .bw-online {
      width:6px; height:6px; background:${C_GREEN};
      border-radius:50%; animation:bwpulse 2.5s infinite;
    }
    @keyframes bwpulse{ 0%,100%{opacity:1} 50%{opacity:.2} }
    #bw-x {
      background:none; border:none; color:${C_MUTED};
      cursor:pointer; padding:4px; display:flex; align-items:center;
      transition:color .15s;
    }
    #bw-x:hover { color:${C_TEXT}; }

    #bw-prog { height:1px; background:${C_BORDER}; flex-shrink:0; }
    #bw-prog-inner { height:100%; background:${C_GREEN}; transition:width .6s ease; width:20%; }

    #bw-stage-lbl {
      padding:6px 18px; font-size:9px; font-weight:500;
      letter-spacing:.12em; text-transform:uppercase;
      color:${C_GREEN}; background:${C_SURFACE};
      border-bottom:1px solid ${C_BORDER}; flex-shrink:0;
    }

    #bw-msgs {
      flex:1; overflow-y:auto; padding:16px 14px;
      display:flex; flex-direction:column; gap:12px;
      background:${C_BG}; scroll-behavior:smooth;
    }
    #bw-msgs::-webkit-scrollbar { width:2px; }
    #bw-msgs::-webkit-scrollbar-thumb { background:#222; }

    .bw-row { display:flex; gap:10px; animation:bwin .2s ease; }
    .bw-row.bw-u { flex-direction:row-reverse; }
    @keyframes bwin { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }

    .bw-bbl {
      max-width:78%; padding:11px 14px;
      font-size:14px; line-height:1.65;
      font-family:${FONT}; font-weight:400;
    }
    .bw-row:not(.bw-u) .bw-bbl {
      background:${C_SURFACE}; border:1px solid ${C_BORDER};
      color:#dddddd;
    }
    .bw-row.bw-u .bw-bbl {
      background:${C_GREEN}18; border:1px solid ${C_GREEN}44;
      color:${C_TEXT};
    }
    .bw-ico {
      width:28px; height:28px;
      background:${C_BG}; border:1px solid ${C_GREEN}55;
      display:flex; align-items:center; justify-content:center;
      flex-shrink:0; margin-top:2px;
    }

    .bw-dots { display:flex; gap:5px; align-items:center; padding:3px 0; }
    .bw-dots span {
      width:5px; height:5px; background:#333; border-radius:50%;
      animation:bwbounce 1.3s infinite;
    }
    .bw-dots span:nth-child(2){animation-delay:.18s}
    .bw-dots span:nth-child(3){animation-delay:.36s}
    @keyframes bwbounce{ 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

    #bw-btns {
      padding:10px 14px 6px; background:${C_BG};
      border-top:1px solid ${C_BORDER};
      display:flex; flex-wrap:wrap; gap:7px; flex-shrink:0;
    }
    .bw-qbtn {
      background:transparent; border:1px solid ${C_GREEN};
      color:${C_GREEN}; padding:7px 14px;
      font-size:11px; font-weight:500; font-family:${FONT};
      letter-spacing:.08em; text-transform:uppercase;
      cursor:pointer; white-space:nowrap;
      transition:background .15s, color .15s;
    }
    .bw-qbtn:hover { background:${C_GREEN}; color:#000; }

    #bw-foot {
      padding:11px 14px; background:${C_SURFACE};
      border-top:1px solid ${C_BORDER};
      display:flex; gap:8px; align-items:flex-end; flex-shrink:0;
    }
    #bw-input {
      flex:1; background:${C_BG}; border:1px solid ${C_BORDER};
      padding:9px 13px; font-size:13px; font-family:${FONT};
      outline:none; resize:none; max-height:90px; line-height:1.5;
      color:#ccc; transition:border-color .15s;
    }
    #bw-input:focus { border-color:${C_GREEN}; }
    #bw-input::placeholder { color:#333; }
    #bw-send {
      width:38px; height:38px; background:${C_GREEN};
      border:none; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition:filter .15s, transform .1s; flex-shrink:0;
    }
    #bw-send:hover { filter:brightness(1.2); }
    #bw-send:active { transform:scale(.93); }
    #bw-send:disabled { opacity:.25; cursor:not-allowed; transform:none; }

    #bw-cap {
      text-align:center; font-size:9px; color:#333;
      padding:6px; background:${C_SURFACE};
      border-top:1px solid ${C_BORDER};
      letter-spacing:.08em; text-transform:uppercase;
      font-family:${FONT}; flex-shrink:0;
    }
    #bw-cap a { color:${C_GREEN}; text-decoration:none; }

    @media(max-width:420px){
      #bw-window{bottom:0;right:0;width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;}
      #bw-launcher{bottom:20px;right:20px;}
    }
  `;
  document.head.appendChild(style);

  // HTML
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <button id="bw-launcher" aria-label="Open chat">
      <div id="bw-notif"></div>
      <svg id="bw-ic-open" width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" fill="${C_GREEN}"/>
        <circle cx="8" cy="11" r="1" fill="${C_BG}"/>
        <circle cx="12" cy="11" r="1" fill="${C_BG}"/>
        <circle cx="16" cy="11" r="1" fill="${C_BG}"/>
      </svg>
      <svg id="bw-ic-close" width="18" height="18" viewBox="0 0 24 24" fill="none" style="display:none">
        <path d="M18 6L6 18M6 6l12 12" stroke="${C_GREEN}" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>

    <div id="bw-window" class="bw-closed" role="dialog" aria-label="Chat with Bridgewater Engineers">
      <div id="bw-header">
        <div class="bw-avatar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  stroke="${C_GREEN}" stroke-width="1.5" fill="none"
                  stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="9 22 9 12 15 12 15 22"
                      stroke="${C_GREEN}" stroke-width="1.5"
                      stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div id="bw-hinfo">
          <strong>Chris — Bridgewater Engineers</strong>
          <span>Structural Engineering Assistant</span>
        </div>
        <div class="bw-online"></div>
        <button id="bw-x" aria-label="Close">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <div id="bw-prog"><div id="bw-prog-inner"></div></div>
      <div id="bw-stage-lbl">Step 1 of 5 — Getting started</div>

      <div id="bw-msgs" aria-live="polite"></div>
      <div id="bw-btns"></div>

      <div id="bw-foot">
        <textarea id="bw-input" rows="1"
          placeholder="Type a message or select an option above…"
          aria-label="Your message"></textarea>
        <button id="bw-send" aria-label="Send" disabled>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="white"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
  const progEl   = document.getElementById("bw-prog-inner");
  const stageEl  = document.getElementById("bw-stage-lbl");
  const notif    = document.getElementById("bw-notif");
  const icOpen   = document.getElementById("bw-ic-open");
  const icClose  = document.getElementById("bw-ic-close");

  const STAGES = [
    { pct:20,  label:"Step 1 of 5 — Who are you?"      },
    { pct:40,  label:"Step 2 of 5 — Service selection" },
    { pct:60,  label:"Step 3 of 5 — Project details"   },
    { pct:80,  label:"Step 4 of 5 — Your contact info" },
    { pct:100, label:"Step 5 of 5 — All done ✓"        },
  ];

  let isOpen=false, isLoading=false, started=false;

  function setStage(n){
    const s = STAGES[Math.min((n||1)-1, STAGES.length-1)];
    progEl.style.width = s.pct+"%";
    stageEl.textContent = s.label;
  }

  const ICON_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          stroke="${C_GREEN}" stroke-width="1.5" fill="none"
          stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="9 22 9 12 15 12 15 22"
              stroke="${C_GREEN}" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  function addMsg(role, text){
    const row = document.createElement("div");
    row.className = "bw-row"+(role==="user"?" bw-u":"");
    if(role==="bot"){
      const ico = document.createElement("div");
      ico.className="bw-ico"; ico.innerHTML=ICON_SVG;
      row.appendChild(ico);
    }
    const bbl = document.createElement("div");
    bbl.className="bw-bbl"; bbl.textContent=text;
    row.appendChild(bbl);
    msgsEl.appendChild(row);
    msgsEl.scrollTop=msgsEl.scrollHeight;
  }

  let typingEl=null;
  function showTyping(){
    typingEl=document.createElement("div");
    typingEl.className="bw-row";
    const ico=document.createElement("div"); ico.className="bw-ico"; ico.innerHTML=ICON_SVG;
    const bbl=document.createElement("div"); bbl.className="bw-bbl";
    bbl.innerHTML=`<div class="bw-dots"><span></span><span></span><span></span></div>`;
    typingEl.appendChild(ico); typingEl.appendChild(bbl);
    msgsEl.appendChild(typingEl); msgsEl.scrollTop=msgsEl.scrollHeight;
  }
  function hideTyping(){ if(typingEl){typingEl.remove();typingEl=null;} }

  function renderButtons(list){
    btnsEl.innerHTML="";
    if(!list||!list.length) return;
    list.forEach(label=>{
      const b=document.createElement("button");
      b.className="bw-qbtn"; b.textContent=label;
      b.addEventListener("click",()=>{ btnsEl.innerHTML=""; send(label); });
      btnsEl.appendChild(b);
    });
  }

  async function callWebhook(message){
    const res = await fetch(N8N_WEBHOOK,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ session_id:sessionId, message, history:chatHistory })
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  function handleResponse(data){
    // Accept history under either field name n8n might return
    const newHistory = data.history || data.updatedHistory;
    if(newHistory){ chatHistory=newHistory; saveHistory(chatHistory); }
    addMsg("bot", data.reply);
    renderButtons(data.buttons);
    setStage(data.stage||1);
  }

  async function startChat(){
    showTyping();
    try{
      const data = await callWebhook("START_CONVERSATION");
      hideTyping(); handleResponse(data);
    }catch(e){
      hideTyping();
      addMsg("bot","Hi! I'm having trouble connecting right now. Please call us at +1 (703) 679-7028.");
    }
  }

  async function send(text){
    text=(text||inputEl.value).trim();
    if(!text||isLoading) return;
    inputEl.value=""; inputEl.style.height="auto";
    sendBtn.disabled=true; isLoading=true;
    btnsEl.innerHTML="";
    addMsg("user",text); showTyping();
    try{
      const data = await callWebhook(text);
      hideTyping(); handleResponse(data);
    }catch(e){
      hideTyping();
      addMsg("bot","Sorry, I lost connection. Please try again or call +1 (703) 679-7028.");
    }finally{
      isLoading=false;
      sendBtn.disabled=inputEl.value.trim().length===0;
    }
  }

  function openChat(){
    isOpen=true; win.classList.remove("bw-closed");
    icOpen.style.display="none"; icClose.style.display="block";
    notif.style.display="none";
    if(!started){ started=true; setTimeout(startChat,300); }
    setTimeout(()=>inputEl.focus(),350);
  }
  function closeChat(){
    isOpen=false; win.classList.add("bw-closed");
    icOpen.style.display="block"; icClose.style.display="none";
  }

  inputEl.addEventListener("input",()=>{
    inputEl.style.height="auto";
    inputEl.style.height=Math.min(inputEl.scrollHeight,90)+"px";
    sendBtn.disabled=inputEl.value.trim().length===0||isLoading;
  });
  inputEl.addEventListener("keydown",e=>{
    if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}
  });
  sendBtn.addEventListener("click",()=>send());
  launcher.addEventListener("click",()=>isOpen?closeChat():openChat());
  document.getElementById("bw-x").addEventListener("click",closeChat);
  document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&isOpen) closeChat(); });

  setTimeout(()=>{ if(!started) notif.style.display="block"; }, 8000);

  window.BridgewaterChat={ open:openChat, close:closeChat };
})();
