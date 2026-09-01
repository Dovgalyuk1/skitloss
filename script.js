/* =========================================================
   SKITLOSS — script.js
   Замени CONTRACT_ADDRESS на реальный CA после минта — цифры
   в блоке "LIVE STATS" подтянутся с DEXScreener автоматически.
   ========================================================= */

const CONTRACT_ADDRESS = ""; // <-- вставь сюда адрес контракта (Solana)

/* ---------------------------------------------------------
   1. ДОЖДЬ ИЗ ТАБЛЕТОК (canvas)
   --------------------------------------------------------- */
(function pillRain(){
  const cv = document.getElementById('pillCanvas');
  const ctx = cv.getContext('2d');
  const img = new Image();
  img.src = 'pill.webp';

  let W, H, pills = [], dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize(){
    W = cv.width = innerWidth * dpr;
    H = cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + 'px';
    cv.style.height = innerHeight + 'px';
    build();
  }

  function count(){
    const a = innerWidth * innerHeight;
    return Math.min(140, Math.max(45, Math.round(a / 9000)));
  }

  function mk(seedTop){
    const s = (14 + Math.random() * 40) * dpr;
    return {
      x: Math.random() * W,
      y: seedTop ? Math.random() * H : -s * 2,
      s,
      vy: (0.35 + Math.random() * 1.5) * dpr,
      vx: (Math.random() - .5) * 0.7 * dpr,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - .5) * 0.04,
      a: 0.6 + Math.random() * 0.4,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.008 + Math.random() * 0.02
    };
  }

  function build(){
    const n = count();
    pills = [];
    for (let i = 0; i < n; i++) pills.push(mk(true));
  }

  // взрыв таблеток в точке (используется при выдаче дозы / кликах)
  window.pillBurst = function(cx, cy, n = 26){
    for (let i = 0; i < n; i++){
      const p = mk(false);
      p.x = cx * dpr; p.y = cy * dpr;
      const ang = Math.random() * Math.PI * 2;
      const spd = (2 + Math.random() * 7) * dpr;
      p.vx = Math.cos(ang) * spd;
      p.vy = Math.sin(ang) * spd - 3 * dpr;
      p.burst = true;
      p.a = 1;
      pills.push(p);
    }
  };

  let raf;
  function loop(){
    ctx.clearRect(0, 0, W, H);
    if (img.complete && img.naturalWidth){
      const ar = img.naturalHeight / img.naturalWidth;
      for (let i = pills.length - 1; i >= 0; i--){
        const p = pills[i];
        p.sway += p.swaySpeed;
        p.x += p.vx + Math.sin(p.sway) * 0.5 * dpr;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.burst){
          p.vy += 0.16 * dpr;   // гравитация для взрыва
          p.vx *= 0.99;
          p.a -= 0.008;
        }
        if (p.y > H + p.s * 2 || p.a <= 0){
          if (p.burst) { pills.splice(i, 1); continue; }
          Object.assign(p, mk(false));
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.a);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.drawImage(img, -p.s / 2, -(p.s * ar) / 2, p.s, p.s * ar);
        ctx.restore();
      }
    }
    raf = requestAnimationFrame(loop);
  }

  addEventListener('resize', resize);
  resize();
  img.onload = loop;
  if (img.complete) loop();

  // клик по странице — маленький всплеск
  addEventListener('click', e => {
    if (e.target.closest('input')) return;
    window.pillBurst(e.clientX, e.clientY, 8);
  });
})();

/* ---------------------------------------------------------
   2. ЗВУК (WebAudio, без внешних файлов)
   --------------------------------------------------------- */
const Sound = (function(){
  let ctx = null, on = false;
  function ensure(){ if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); }
  return {
    toggle(){ on = !on; if (on) ensure(); return on; },
    get isOn(){ return on; },
    pop(freq = 520, dur = 0.12, type = 'triangle'){
      if (!on) return;
      ensure();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(freq * 0.4, ctx.currentTime + dur);
      g.gain.setValueAtTime(0.16, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + dur);
    },
    chime(){
      if (!on) return;
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.pop(f, 0.18, 'square'), i * 90));
    }
  };
})();

const soundBtn = document.getElementById('soundBtn');
soundBtn.addEventListener('click', () => {
  const s = Sound.toggle();
  soundBtn.textContent = 'SOUND: ' + (s ? 'ON' : 'OFF');
  Sound.pop(660, .1);
});

/* ---------------------------------------------------------
   3. ТОСТ
   --------------------------------------------------------- */
const toast = document.createElement('div');
toast.className = 'toast';
document.body.appendChild(toast);
let toastT;
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ---------------------------------------------------------
   4. КОПИРОВАНИЕ КОНТРАКТА
   --------------------------------------------------------- */
const caValue = document.getElementById('caValue');
if (CONTRACT_ADDRESS) caValue.textContent = CONTRACT_ADDRESS;

document.getElementById('caBox').addEventListener('click', e => {
  const txt = CONTRACT_ADDRESS || 'SKITLOSS — contract not minted yet';
  navigator.clipboard?.writeText(txt).then(() => {
    showToast(CONTRACT_ADDRESS ? 'CONTRACT COPIED' : 'NOTHING TO COPY YET');
    Sound.pop(880, .1);
    window.pillBurst(e.clientX, e.clientY, 14);
  }).catch(() => showToast('COPY FAILED'));
});

/* ---------------------------------------------------------
   5. МАРКИ (бегущие строки)
   --------------------------------------------------------- */
const MQ1 = ['TASTE THE LOSS', 'YOU\'RE NOT YOU WHEN YOU\'RE DOWN BAD', 'ONE PILL PER LIQUIDATION',
             'RAINBOW IN, RED OUT', 'CLINICALLY RAINBOW', '$SKITLOSS'];
const MQ2 = ['DOSE RESPONSIBLY', 'NOW IN SIX COLOURS OF REGRET', 'FEED A FRIEND',
             'SIDE EFFECTS INCLUDE COLOUR', 'THE CHART DIDN\'T MOVE. YOU DID.', '$SKITLOSS'];

function fillMarquee(el, arr){
  const chunk = arr.map(t => `<span>${t}<img src="pill.webp" alt=""></span>`).join('');
  el.innerHTML = chunk + chunk; // дублируем для бесшовной прокрутки
}
fillMarquee(document.getElementById('mq1'), MQ1);
fillMarquee(document.getElementById('mq2'), MQ2);

/* ---------------------------------------------------------
   6. ВКУСЫ
   --------------------------------------------------------- */
const FLAVORS = [
  { c:'#ED1C24', name:'RUG CHERRY',       desc:'Deep, sudden, gone in one second. The classic.', dose:'1 PILL / EVENT' },
  { c:'#F7941E', name:'TOP SIGNAL ORANGE',desc:'For the ones who bought the exact candle. Zesty.', dose:'2 PILLS / WICK' },
  { c:'#FFF200', name:'SLIPPAGE LEMON',   desc:'Sharp. You set 1%. It filled at 34%.', dose:'HALF A PILL', dark:true },
  { c:'#00A651', name:'LIQUIDATION LIME', desc:'25x. Held for eleven minutes. Very refreshing.', dose:'THE WHOLE BAG' },
  { c:'#92278F', name:'BAGHOLDER GRAPE',  desc:'Matured over 14 months. Still holding. Still grape.', dose:'DAILY, FOREVER' }
];

document.getElementById('flavorGrid').innerHTML = FLAVORS.map(f => `
  <div class="flavor" style="background:${f.c};${f.dark ? 'color:#160305' : ''}">
    <img src="pill.webp" alt="">
    <h4>${f.name}</h4>
    <p>${f.desc}</p>
    <span class="dose"${f.dark ? ' style="background:rgba(0,0,0,.15)"' : ''}>${f.dose}</span>
  </div>`).join('');

/* ---------------------------------------------------------
   7. ФИДЕР — выдача дозы
   --------------------------------------------------------- */
const DIAGNOSES = [
  'ACUTE CHART STARING',
  'SEVERE GREEN CANDLE DEFICIENCY',
  'CHRONIC ROUND-TRIPPING',
  'STAGE 4 GROUP-CHAT INFLUENCE',
  'MASSIVE HOPIUM OVERDOSE',
  'TERMINAL "IT\'LL BOUNCE"',
  'INFLAMED PORTFOLIO',
  'RECURRING 3AM ENTRY SYNDROME',
  'DANGEROUSLY LOW CONVICTION',
  'ADVANCED EXIT-LIQUIDITY CONDITION',
  'HISTORIC TOP-BUYING REFLEX',
  'PERSISTENT COPIUM RESIDUE'
];

const RX_LINES = [
  'Take <b>%N% pill%S%</b>. Chew. Do not look at the chart for %M% minutes.',
  'One (1) <b>%F%</b> pill, taken under the tongue during every red candle.',
  '<b>%N% pills</b> daily. Discontinue when green. Green will not come. Continue.',
  'Dissolve <b>%N%</b> in water. Drink. The number is still negative but now it\'s colourful.',
  'Apply <b>%F%</b> directly to the portfolio. Do not swallow the loss, swallow the pill.',
  '<b>%N% pill%S%</b> before opening the wallet app. Two if you already opened it.'
];

const NAMES = ['ANON','SER','WHALE_0x','DEGEN','CHAD','THE GROUP CHAT','YOUR PORTFOLIO','A FRIEND','MY BOT','SOMEBODY'];

const patientInput = document.getElementById('patientInput');
const dispenseBtn  = document.getElementById('dispenseBtn');
const screenIdle   = document.getElementById('screenIdle');
const screenResult = document.getElementById('screenResult');

let cured = parseInt(localStorage.getItem('skitloss_cured') || '0', 10);
let lossTreated = parseInt(localStorage.getItem('skitloss_loss') || '0', 10);
const curedEl = document.getElementById('curedCount');
const lossEl  = document.getElementById('lossCount');

// базовое число, чтобы счётчик не был пустым на первом визите
const BASE_CURED = 41207;
const BASE_LOSS  = 8934120;

function renderStats(){
  curedEl.textContent = (BASE_CURED + cured).toLocaleString('en-US');
  lossEl.textContent  = '$' + (BASE_LOSS + lossTreated).toLocaleString('en-US');
}
renderStats();

function pick(a){ return a[Math.floor(Math.random() * a.length)]; }

function typeOut(el, html, done){
  // печатаем построчно с эффектом
  el.innerHTML = '';
  el.classList.add('type-caret');
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const nodes = Array.from(tmp.children);
  let i = 0;
  (function next(){
    if (i >= nodes.length){ el.classList.remove('type-caret'); done && done(); return; }
    el.appendChild(nodes[i]);
    Sound.pop(400 + i * 120, .06, 'square');
    i++;
    setTimeout(next, 260);
  })();
}

let busy = false;
function dispense(){
  if (busy) return;
  busy = true;
  dispenseBtn.disabled = true;

  const raw = patientInput.value.trim();
  const patient = raw || pick(NAMES);
  const n = 1 + Math.floor(Math.random() * 4);
  const flavor = pick(FLAVORS).name;
  const diag = pick(DIAGNOSES);
  const amount = (Math.floor(Math.random() * 900) + 50) * 10;
  const rx = pick(RX_LINES)
    .replace('%N%', n)
    .replace('%S%', n > 1 ? 's' : '')
    .replace('%M%', [20, 45, 90, 240][Math.floor(Math.random() * 4)])
    .replace('%F%', flavor);

  // "загрузка"
  screenIdle.hidden = true;
  screenResult.hidden = false;
  screenResult.innerHTML = '<p class="diag">ANALYSING PATIENT…</p>';
  Sound.pop(220, .3, 'sawtooth');

  const rect = document.querySelector('.slot-mouth').getBoundingClientRect();

  setTimeout(() => {
    typeOut(screenResult, `
      <h3>${diag}</h3>
      <p class="patient">PATIENT: ${escapeHtml(patient.slice(0, 40))}</p>
      <p class="diag">Estimated damage: <b style="color:#ED1C24">−$${amount.toLocaleString('en-US')}</b>. Condition: treatable with colour.</p>
      <div class="rx"><img src="pill.webp" alt=""><span><b>Rx:</b> ${rx}</span></div>
    `, () => {
      window.pillBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 34);
      Sound.chime();
      cured += n;
      lossTreated += amount;
      localStorage.setItem('skitloss_cured', cured);
      localStorage.setItem('skitloss_loss', lossTreated);
      renderStats();
      addLog(patient, diag, n);
      busy = false;
      dispenseBtn.disabled = false;
      patientInput.value = '';
    });
  }, 750);
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

dispenseBtn.addEventListener('click', dispense);
patientInput.addEventListener('keydown', e => { if (e.key === 'Enter') dispense(); });

/* ---------------------------------------------------------
   8. ЖИВОЙ ЛОГ ПАЛАТЫ
   --------------------------------------------------------- */
const logBox = document.getElementById('logBox');
const LOG_ACTS = [
  'received %N% pill%S% for',
  'was dosed after',
  'entered the ward with',
  'is being treated for',
  'requested emergency rainbow —'
];

function ts(){
  const d = new Date();
  return d.toTimeString().slice(0, 8);
}

function addLog(who, why, n){
  const line = document.createElement('div');
  line.className = 'log-line';
  const act = pick(LOG_ACTS).replace('%N%', n || 1).replace('%S%', (n || 1) > 1 ? 's' : '');
  line.innerHTML = `<span class="t">[${ts()}]</span><span><b>${escapeHtml(String(who).slice(0, 24))}</b> ${act} ${why.toLowerCase()}</span>`;
  logBox.prepend(line);
  while (logBox.children.length > 9) logBox.lastChild.remove();
}

// стартовый лог + автогенерация
for (let i = 0; i < 7; i++) addLog(pick(NAMES), pick(DIAGNOSES), 1 + Math.floor(Math.random() * 3));
setInterval(() => addLog(pick(NAMES), pick(DIAGNOSES), 1 + Math.floor(Math.random() * 3)), 4200);

// счётчики тихо растут сами
setInterval(() => {
  cured += Math.floor(Math.random() * 3);
  lossTreated += Math.floor(Math.random() * 4000);
  renderStats();
}, 3500);

/* ---------------------------------------------------------
   9. ЖИВЫЕ ДАННЫЕ ТОКЕНА (DEXScreener)
   --------------------------------------------------------- */
(function liveStats(){
  const price = document.getElementById('statPrice');
  const mcap  = document.getElementById('statMcap');
  const chg   = document.getElementById('statChange');
  const hold  = document.getElementById('statHolders');

  if (!CONTRACT_ADDRESS){
    price.textContent = 'SOON';
    mcap.textContent  = 'SOON';
    chg.textContent   = 'SOON';
    hold.textContent  = 'SOON';
    return;
  }

  async function load(){
    try{
      const r = await fetch('https://api.dexscreener.com/latest/dex/tokens/' + CONTRACT_ADDRESS);
      const j = await r.json();
      const p = j.pairs && j.pairs[0];
      if (!p) return;
      price.textContent = '$' + Number(p.priceUsd).toPrecision(4);
      mcap.textContent  = p.fdv ? '$' + Math.round(p.fdv).toLocaleString('en-US') : '—';
      const c = p.priceChange && p.priceChange.h24;
      chg.textContent = (c > 0 ? '+' : '') + c + '%';
      chg.style.color = c >= 0 ? '#00E676' : '#FFF200';
      hold.textContent = p.txns && p.txns.h24 ? (p.txns.h24.buys + p.txns.h24.sells).toLocaleString('en-US') : '—';
    }catch(e){ /* тихо игнорируем — сайт остаётся рабочим */ }
  }
  load();
  setInterval(load, 30000);
})();

/* ---------------------------------------------------------
   10. ПАРАЛЛАКС ПАЧКИ
   --------------------------------------------------------- */
const heroPack = document.getElementById('heroPack');
addEventListener('mousemove', e => {
  if (!heroPack) return;
  const x = (e.clientX / innerWidth - .5) * 22;
  const y = (e.clientY / innerHeight - .5) * 14;
  heroPack.style.translate = `${x}px ${y}px`;
});
