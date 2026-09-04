/* ==========================================================================
   جسر الحرير — طبقة التخزين والأدوات المساعدة
   كل البيانات تُحفظ في متصفحك (localStorage). لا يوجد سيرفر ولا حساب.
   ========================================================================== */

const KEY = 'silkbridge.v1.';

const DB = {
  read(name, fallback){
    try{
      const raw = localStorage.getItem(KEY + name);
      return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(fallback));
    }catch(e){
      console.warn('read failed', name, e);
      return JSON.parse(JSON.stringify(fallback));
    }
  },
  write(name, value){
    try{
      localStorage.setItem(KEY + name, JSON.stringify(value));
      return true;
    }catch(e){
      toast('تعذّر الحفظ — قد تكون مساحة المتصفح ممتلئة أو الحفظ معطّل', 'err');
      return false;
    }
  },
  drop(name){ try{ localStorage.removeItem(KEY + name); }catch(e){} }
};

/* ---------- الإعدادات ---------- */
function getSettings(){
  const s = DB.read('settings', {});
  const merged = Object.assign({}, DEFAULT_SETTINGS, s);
  merged.seq = Object.assign({}, DEFAULT_SETTINGS.seq, s.seq || {});
  return merged;
}
function saveSettings(s){ DB.write('settings', s); }

/* ---------- المجموعات ---------- */
function getItems(){
  let items = DB.read('items', null);
  if(!items){
    items = SEED_ITEMS.map((it, i) => Object.assign({id:'it' + (i+1)}, it));
    DB.write('items', items);
  }
  return items;
}
function saveItems(v){ DB.write('items', v); }

const getRequests = () => DB.read('requests', []);
const saveRequests = v => DB.write('requests', v);
const getQuotes   = () => DB.read('quotes', []);
const saveQuotes  = v => DB.write('quotes', v);
const getPOs      = () => DB.read('pos', []);
const savePOs     = v => DB.write('pos', v);
const getSuppliers= () => DB.read('suppliers', []);
const saveSuppliers = v => DB.write('suppliers', v);

/* ---------- المعرّفات ---------- */
function uid(prefix){
  return (prefix || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function nextRef(kind, prefix){
  const s = getSettings();
  const n = s.seq[kind] || 1;
  s.seq[kind] = n + 1;
  saveSettings(s);
  const d = new Date();
  const ym = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0');
  return prefix + '-' + ym + '-' + String(n).padStart(3, '0');
}

/* ---------- أرقام وتنسيق ---------- */
const num = v => { const n = parseFloat(String(v).replace(/[^\d.\-]/g, '')); return isNaN(n) ? 0 : n; };
const r2  = v => Math.round((v + Number.EPSILON) * 100) / 100;

function money(v, withCur){
  const n = r2(num(v));
  const s = n.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  return withCur === false ? s : s + ' ر.س';
}
function fmtInt(v){ return Math.round(num(v)).toLocaleString('en-US'); }

function today(){ return new Date().toISOString().slice(0, 10); }
function addDays(dateStr, days){
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + num(days));
  return d.toISOString().slice(0, 10);
}
function fmtDate(s){
  if(!s) return '—';
  const d = new Date(s);
  if(isNaN(d)) return s;
  return d.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'});
}

/* ---------- HTML آمن ---------- */
function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ---------- حساب العرض ---------- */
function calcQuote(q){
  const st = getSettings();
  let cost = 0, sell = 0;
  const lines = (q.lines || []).map(l => {
    const qty = num(l.qty), c = num(l.cost), m = num(l.margin);
    const unitPrice = r2(c * (1 + m / 100));
    const lineCost  = r2(c * qty);
    const lineTotal = r2(unitPrice * qty);
    cost += lineCost; sell += lineTotal;
    return Object.assign({}, l, {unitPrice, lineCost, lineTotal});
  });
  cost = r2(cost); sell = r2(sell);

  const fee = q.feeType === 'pct' ? r2(sell * num(q.feeValue) / 100) : r2(num(q.feeValue));
  const delivery = r2(num(q.delivery));
  const beforeDisc = r2(sell + fee + delivery);
  const discount = q.discType === 'pct' ? r2(beforeDisc * num(q.discValue) / 100) : r2(num(q.discValue));
  const subtotal = r2(beforeDisc - discount);
  const vatRate = q.vat === false ? 0 : num(st.vatRate);
  const vat = r2(subtotal * vatRate / 100);
  const total = r2(subtotal + vat);
  const profit = r2(subtotal - cost);
  const marginPct = subtotal > 0 ? r2(profit / subtotal * 100) : 0;

  return {lines, cost, sell, fee, delivery, discount, subtotal, vatRate, vat, total, profit, marginPct};
}

function emptyQuote(){
  const st = getSettings();
  return {
    id: uid('q'),
    ref: '',
    date: today(),
    validity: st.validityDays,
    status: 'draft',
    requestId: '',
    client: {name:'', org:'', phone:'', email:'', city:''},
    title: '',
    lines: [],
    feeType: st.serviceFeeType,
    feeValue: st.serviceFeeValue,
    delivery: 0,
    discType: 'fixed',
    discValue: 0,
    vat: true,
    notes: '',
    terms: st.terms,
    createdAt: new Date().toISOString()
  };
}
function emptyLine(){
  return {id: uid('l'), name:'', spec:'', qty:1, unit:'حبة', cost:0, margin:getSettings().defaultMargin, supplier:''};
}

/* ---------- نسخة احتياطية ---------- */
function exportAll(){
  return {
    app:'silk-bridge', version:1, exportedAt:new Date().toISOString(),
    settings:getSettings(), items:getItems(), suppliers:getSuppliers(),
    requests:getRequests(), quotes:getQuotes(), pos:getPOs()
  };
}
function importAll(data){
  if(!data || data.app !== 'silk-bridge') throw new Error('الملف غير متوافق');
  if(data.settings)  saveSettings(Object.assign({}, DEFAULT_SETTINGS, data.settings));
  if(data.items)     saveItems(data.items);
  if(data.suppliers) saveSuppliers(data.suppliers);
  if(data.requests)  saveRequests(data.requests);
  if(data.quotes)    saveQuotes(data.quotes);
  if(data.pos)       savePOs(data.pos);
}
function downloadFile(filename, content, type){
  const blob = new Blob([content], {type: type || 'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 400);
}
function copyText(txt){
  const done = () => toast('تم النسخ ✓', 'ok');
  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(txt).then(done, () => fallbackCopy(txt, done));
  }else fallbackCopy(txt, done);
}
function fallbackCopy(txt, done){
  const ta = document.createElement('textarea');
  ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); done(); }catch(e){ toast('تعذّر النسخ', 'err'); }
  ta.remove();
}

/* ---------- تنبيهات ونوافذ ---------- */
function toast(msg, kind){
  const box = document.getElementById('toast');
  if(!box) return;
  const el = document.createElement('div');
  el.className = 'toast ' + (kind || '');
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2800);
}
function modal(title, bodyHTML, onMount){
  closeModal();
  const bg = document.createElement('div');
  bg.className = 'modal-bg'; bg.id = 'modalBg';
  bg.innerHTML = '<div class="modal"><h3>' + esc(title) + '</h3>' + bodyHTML + '</div>';
  bg.addEventListener('click', e => { if(e.target === bg) closeModal(); });
  document.body.appendChild(bg);
  if(onMount) onMount(bg);
}
function closeModal(){ const m = document.getElementById('modalBg'); if(m) m.remove(); }
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });
