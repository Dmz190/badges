/* ==========================================================================
   جسر الحرير — مساحة عمل الوسيط
   الطلبات · بناء عروض الأسعار · قائمة التسوق/الشراء · الأصناف · الإعدادات
   ========================================================================== */

/* ---------- البوابة ---------- */
function viewApp(){
  if(!STATE.unlocked) return viewLock();
  return `
  <section class="section" style="border:none;padding-top:34px">
    <div class="wrap">
      ${kpiRow()}
      <div class="tabs">
        ${tabBtn('inbox','الطلبات')}
        ${tabBtn('quotes','عروض الأسعار')}
        ${tabBtn('buy','قائمة التسوق')}
        ${tabBtn('catalog','الأصناف والموردين')}
        ${tabBtn('settings','الإعدادات')}
      </div>
      <div id="tabBody">${tabBody()}</div>
    </div>
  </section>`;
}
function tabBtn(id, label){
  const n = id === 'inbox' ? getRequests().filter(r => r.status === 'new').length : 0;
  return `<button class="${STATE.tab === id ? 'on' : ''}" data-act="tab" data-id="${id}">${label}${n ? ' <span class="badge b-new" style="margin-inline-start:6px">' + n + '</span>' : ''}</button>`;
}
ACTIONS.tab = el => { STATE.tab = el.dataset.id; STATE.quoteId = null; STATE.poId = null; render(); };

function viewLock(){
  return `
  <div class="lock">
    <div class="panel">
      <div class="lk-ic">🔐</div>
      <h3>مساحة العمل</h3>
      <div class="psub">هذه المساحة خاصة بالوسيط. أدخل رمز الدخول.</div>
      <form data-submit="unlock">
        <div class="field"><input class="inp" name="code" type="password" placeholder="رمز الدخول" autofocus style="text-align:center;letter-spacing:6px"></div>
        <button class="btn btn-gold" style="width:100%">دخول</button>
      </form>
      <div class="hint">الرمز الافتراضي 1234 — غيّره من الإعدادات بعد الدخول.</div>
    </div>
  </div>`;
}
ACTIONS.unlock = form => {
  const code = new FormData(form).get('code');
  if(String(code) === String(getSettings().passcode)){ STATE.unlocked = true; render(); }
  else toast('رمز غير صحيح', 'err');
};

/* ---------- مؤشرات سريعة ---------- */
function kpiRow(){
  const reqs = getRequests(), quotes = getQuotes();
  const newReqs = reqs.filter(r => r.status === 'new').length;
  const open = quotes.filter(q => q.status === 'draft' || q.status === 'sent');
  const openVal = open.reduce((s, q) => s + calcQuote(q).total, 0);
  const won = quotes.filter(q => q.status === 'won');
  const profit = won.reduce((s, q) => s + calcQuote(q).profit, 0);
  return `<div class="kpis">
    <div class="kpi"><div class="l">طلبات جديدة</div><div class="n">${newReqs}</div></div>
    <div class="kpi"><div class="l">عروض مفتوحة</div><div class="n">${open.length}</div></div>
    <div class="kpi"><div class="l">قيمة العروض المفتوحة</div><div class="n gold">${money(openVal)}</div></div>
    <div class="kpi"><div class="l">أرباح العروض المعتمدة</div><div class="n green">${money(profit)}</div></div>
  </div>`;
}

function tabBody(){
  if(STATE.tab === 'quotes')   return STATE.quoteId ? quoteEditor() : quotesList();
  if(STATE.tab === 'buy')      return STATE.poId ? poEditor() : poList();
  if(STATE.tab === 'catalog')  return catalogTab();
  if(STATE.tab === 'settings') return settingsTab();
  return inboxTab();
}
function repaint(){ const b = document.getElementById('tabBody'); if(b) b.innerHTML = tabBody(); }
function afterApp(){}

/* ==========================================================================
   ١) الطلبات
   ========================================================================== */
function inboxTab(){
  const all = getRequests();
  const f = STATE.reqFilter;
  const q = STATE.q.trim();
  let list = f === 'all' ? all : all.filter(r => r.status === f);
  if(q) list = list.filter(r => (r.ref + ' ' + r.title + ' ' + r.client.name + ' ' + (r.client.org || '')).includes(q));

  const chips = ['all'].concat(Object.keys(REQ_STATUS)).map(k => {
    const label = k === 'all' ? 'الكل' : REQ_STATUS[k].label;
    const n = k === 'all' ? all.length : all.filter(r => r.status === k).length;
    return `<button class="btn btn-sm ${STATE.reqFilter === k ? 'btn-gold' : 'btn-ghost'}" data-act="reqFilter" data-id="${k}">${label} (${n})</button>`;
  }).join('');

  const rows = list.map(r => `
    <div class="list-item">
      <div class="li-main">
        <div class="li-t">${esc(r.title)} <span class="badge ${REQ_STATUS[r.status].cls}">${REQ_STATUS[r.status].label}</span></div>
        <div class="li-s">${esc(r.ref)} · ${esc(r.client.name)}${r.client.org ? ' — ' + esc(r.client.org) : ''} · ${esc(r.client.phone || '')} · ${r.lines.length} بند · ${fmtDate(r.createdAt)}${r.due ? ' · التسليم ' + fmtDate(r.due) : ''}</div>
      </div>
      ${r.budget ? `<div class="li-n">${money(r.budget)}</div>` : ''}
      <div class="btn-row">
        <button class="btn btn-sm" data-act="reqView" data-id="${r.id}">تفاصيل</button>
        <button class="btn btn-sm btn-gold" data-act="reqToQuote" data-id="${r.id}">${r.quoteId ? 'فتح العرض' : 'حوّل لعرض سعر'}</button>
        <select class="inp btn-sm" style="width:130px;padding:6px 8px" data-change="reqStatus" data-id="${r.id}">
          ${Object.keys(REQ_STATUS).map(k => `<option value="${k}" ${r.status === k ? 'selected' : ''}>${REQ_STATUS[k].label}</option>`).join('')}
        </select>
        <button class="btn btn-sm btn-danger" data-act="reqRemove" data-id="${r.id}">✕</button>
      </div>
    </div>`).join('');

  return `
  <div class="panel">
    <div class="panel-head">
      <h3>الطلبات الواردة</h3>
      <div class="spacer"></div>
      <input class="inp" style="width:200px" placeholder="بحث…" value="${esc(STATE.q)}" data-input="reqSearch">
      <a class="btn btn-sm" href="#/request">+ تسجيل طلب يدوي</a>
    </div>
    <div class="btn-row" style="margin-bottom:18px">${chips}</div>
    ${rows || `<div class="empty"><div class="e-ic">📥</div>لا توجد طلبات ${f === 'all' ? 'بعد' : 'بهذه الحالة'}.<br><span class="hint">أي طلب يُرسل من نموذج الموقع يظهر هنا مباشرة.</span></div>`}
  </div>`;
}
ACTIONS.reqFilter = el => { STATE.reqFilter = el.dataset.id; repaint(); };
ACTIONS.reqSearch = el => { STATE.q = el.value; const b = document.getElementById('tabBody'); const pos = el.selectionStart; b.innerHTML = tabBody(); const n = b.querySelector('[data-input="reqSearch"]'); if(n){ n.focus(); n.setSelectionRange(pos, pos); } };
ACTIONS.reqStatus = el => {
  const all = getRequests(); const r = all.find(x => x.id === el.dataset.id);
  if(r){ r.status = el.value; saveRequests(all); repaint(); toast('تم تحديث الحالة ✓', 'ok'); }
};
ACTIONS.reqRemove = el => {
  if(!confirm('حذف الطلب نهائياً؟')) return;
  saveRequests(getRequests().filter(r => r.id !== el.dataset.id));
  repaint(); toast('تم الحذف', 'ok');
};
ACTIONS.reqView = el => {
  const r = getRequests().find(x => x.id === el.dataset.id);
  if(!r) return;
  modal('الطلب ' + r.ref, `
    <div class="row r2">
      <div><div class="hint">العميل</div><b>${esc(r.client.name)}</b><div class="hint">${esc(r.client.org || '')}</div></div>
      <div><div class="hint">التواصل</div><b>${esc(r.client.phone || '—')}</b><div class="hint">${esc(r.client.email || '')}</div></div>
    </div>
    <div class="row r3" style="margin-top:14px">
      <div><div class="hint">المدينة</div><b>${esc(r.client.city || '—')}</b></div>
      <div><div class="hint">التسليم المطلوب</div><b>${r.due ? fmtDate(r.due) : '—'}</b></div>
      <div><div class="hint">الاستعجال</div><b>${esc(r.urgency || 'عادي')}</b></div>
    </div>
    <div class="table-wrap" style="margin-top:18px">
      <table><thead><tr><th>الصنف</th><th class="num">الكمية</th><th>الوحدة</th><th>المواصفات</th></tr></thead>
      <tbody>${r.lines.map(l => `<tr><td>${esc(l.name)}</td><td class="num">${fmtInt(l.qty)}</td><td>${esc(l.unit)}</td><td>${esc(l.spec) || '—'}</td></tr>`).join('')}</tbody></table>
    </div>
    ${r.notes ? `<div style="margin-top:14px"><div class="hint">ملاحظات</div>${esc(r.notes)}</div>` : ''}
    <div class="btn-row" style="margin-top:18px">
      <button class="btn btn-gold" data-act="reqToQuote" data-id="${r.id}">تحويل إلى عرض سعر</button>
      <button class="btn" data-act="copyReq" data-id="${r.id}">نسخ النص</button>
      <button class="btn btn-ghost" data-act="closeModal">إغلاق</button>
    </div>`);
};

/* تحويل الطلب إلى عرض سعر مع تعبئة التكاليف من الكتالوج */
ACTIONS.reqToQuote = el => {
  closeModal();
  const reqs = getRequests(); const r = reqs.find(x => x.id === el.dataset.id);
  if(!r) return;
  const quotes = getQuotes();
  if(r.quoteId && quotes.some(q => q.id === r.quoteId)){
    STATE.tab = 'quotes'; STATE.quoteId = r.quoteId; render(); return;
  }
  const items = getItems();
  const q = emptyQuote();
  q.ref = nextRef('quote', 'QT');
  q.requestId = r.id;
  q.client = Object.assign({}, r.client);
  q.title = r.title;
  q.lines = r.lines.map(l => {
    const it = items.find(i => i.name === l.name);
    return {
      id: uid('l'), name: l.name, spec: l.spec || '',
      qty: num(l.qty) || 1, unit: l.unit || (it ? it.unit : 'حبة'),
      cost: it ? it.cost : 0, margin: it ? it.margin : getSettings().defaultMargin,
      supplier: it ? it.supplier : ''
    };
  });
  quotes.unshift(q); saveQuotes(quotes);
  r.quoteId = q.id; r.status = 'pricing'; saveRequests(reqs);
  STATE.tab = 'quotes'; STATE.quoteId = q.id; render();
  toast('تم إنشاء العرض ' + q.ref + ' — عبّي التكاليف ✓', 'ok');
};

/* ==========================================================================
   ٢) عروض الأسعار
   ========================================================================== */
function quotesList(){
  const quotes = getQuotes();
  const rows = quotes.map(q => {
    const c = calcQuote(q);
    return `<div class="list-item">
      <div class="li-main">
        <div class="li-t">${esc(q.title || 'عرض بدون عنوان')} <span class="badge ${QUOTE_STATUS[q.status].cls}">${QUOTE_STATUS[q.status].label}</span></div>
        <div class="li-s">${esc(q.ref)} · ${esc(q.client.name || '—')}${q.client.org ? ' — ' + esc(q.client.org) : ''} · ${q.lines.length} بند · ${fmtDate(q.date)} · ربح ${money(c.profit)} (${c.marginPct}%)</div>
      </div>
      <div class="li-n">${money(c.total)}</div>
      <div class="btn-row">
        <button class="btn btn-sm btn-gold" data-act="qOpen" data-id="${q.id}">فتح</button>
        <button class="btn btn-sm" data-act="qPrint" data-id="${q.id}">طباعة</button>
        <button class="btn btn-sm btn-danger" data-act="qDelete" data-id="${q.id}">✕</button>
      </div>
    </div>`;
  }).join('');
  return `<div class="panel">
    <div class="panel-head"><h3>عروض الأسعار</h3><div class="spacer"></div>
      <button class="btn btn-sm btn-gold" data-act="qNew">+ عرض جديد</button></div>
    ${rows || '<div class="empty"><div class="e-ic">📄</div>ما عندك عروض بعد.<br><span class="hint">ابدأ من طلب وارد أو أنشئ عرضاً جديداً.</span></div>'}
  </div>`;
}
ACTIONS.qNew = () => {
  const q = emptyQuote(); q.ref = nextRef('quote', 'QT'); q.lines = [emptyLine()];
  const all = getQuotes(); all.unshift(q); saveQuotes(all);
  STATE.quoteId = q.id; repaint();
};
ACTIONS.qOpen = el => { STATE.quoteId = el.dataset.id; repaint(); };
ACTIONS.qBack = () => { STATE.quoteId = null; repaint(); };
ACTIONS.qDelete = el => {
  if(!confirm('حذف العرض نهائياً؟')) return;
  saveQuotes(getQuotes().filter(q => q.id !== el.dataset.id));
  STATE.quoteId = null; repaint(); toast('تم الحذف', 'ok');
};

function curQuote(){ return getQuotes().find(q => q.id === STATE.quoteId); }
function saveQuote(q){
  const all = getQuotes(); const i = all.findIndex(x => x.id === q.id);
  if(i > -1) all[i] = q; else all.unshift(q);
  saveQuotes(all);
}

function qLineRow(l, c){
  const cl = c.lines.find(x => x.id === l.id) || {unitPrice:0, lineTotal:0};
  return `<tr data-ql="${l.id}">
    <td><input class="cell-inp" data-input="qLine" data-f="name" value="${esc(l.name)}" placeholder="اسم الصنف"></td>
    <td><input class="cell-inp" data-input="qLine" data-f="spec" value="${esc(l.spec)}" placeholder="المواصفات"></td>
    <td class="w-xs"><input class="cell-inp" type="number" min="0" step="1" data-input="qLine" data-f="qty" value="${esc(l.qty)}"></td>
    <td class="w-md"><select class="cell-inp" data-change="qLine" data-f="unit">${UNITS.map(u => `<option ${u === l.unit ? 'selected' : ''}>${u}</option>`).join('')}</select></td>
    <td class="w-sm"><input class="cell-inp" type="number" min="0" step="0.01" data-input="qLine" data-f="cost" value="${esc(l.cost)}"></td>
    <td class="w-xs"><input class="cell-inp" type="number" min="0" step="1" data-input="qLine" data-f="margin" value="${esc(l.margin)}"></td>
    <td class="num" data-cell="unit">${money(cl.unitPrice, false)}</td>
    <td class="num" data-cell="total">${money(cl.lineTotal, false)}</td>
    <td class="w-md"><input class="cell-inp" data-input="qLine" data-f="supplier" value="${esc(l.supplier)}" placeholder="المورد"></td>
    <td class="w-xs"><button class="btn btn-sm btn-danger" data-act="qLineDel" data-id="${l.id}">✕</button></td>
  </tr>`;
}

function quoteEditor(){
  const q = curQuote(); if(!q) return quotesList();
  const c = calcQuote(q);
  const st = getSettings();
  return `
  <div class="panel">
    <div class="panel-head">
      <button class="btn btn-sm btn-ghost" data-act="qBack">← رجوع</button>
      <h3>${esc(q.ref)}</h3>
      <span class="badge ${QUOTE_STATUS[q.status].cls}">${QUOTE_STATUS[q.status].label}</span>
      <div class="spacer"></div>
      <select class="inp btn-sm" style="width:130px;padding:7px 9px" data-change="qField" data-f="status">
        ${Object.keys(QUOTE_STATUS).map(k => `<option value="${k}" ${q.status === k ? 'selected' : ''}>${QUOTE_STATUS[k].label}</option>`).join('')}
      </select>
      <button class="btn btn-sm" data-act="qPrint" data-id="${q.id}">طباعة / PDF</button>
      <button class="btn btn-sm" data-act="qCopy" data-id="${q.id}">نسخ للواتساب</button>
      <button class="btn btn-sm" data-act="qCsv" data-id="${q.id}">CSV</button>
      <button class="btn btn-sm btn-gold" data-act="qToPO" data-id="${q.id}">تحويل لقائمة شراء</button>
    </div>

    <div class="row r4">
      <div class="field"><label>عنوان العرض</label><input class="inp" data-input="qField" data-f="title" value="${esc(q.title)}"></div>
      <div class="field"><label>التاريخ</label><input class="inp" type="date" data-input="qField" data-f="date" value="${esc(q.date)}"></div>
      <div class="field"><label>صلاحية العرض (يوم)</label><input class="inp" type="number" min="1" data-input="qField" data-f="validity" value="${esc(q.validity)}"></div>
      <div class="field"><label>ينتهي في</label><input class="inp" value="${fmtDate(addDays(q.date, q.validity))}" disabled></div>
    </div>
    <div class="row r4">
      <div class="field"><label>اسم العميل</label><input class="inp" data-input="qClient" data-f="name" value="${esc(q.client.name)}"></div>
      <div class="field"><label>الجهة</label><input class="inp" data-input="qClient" data-f="org" value="${esc(q.client.org)}"></div>
      <div class="field"><label>الجوال</label><input class="inp" data-input="qClient" data-f="phone" value="${esc(q.client.phone)}"></div>
      <div class="field"><label>المدينة</label><input class="inp" data-input="qClient" data-f="city" value="${esc(q.client.city)}"></div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-head">
      <div><h3>بنود العرض</h3><div style="font-size:13px;color:var(--muted)">اكتب تكلفة المورد وهامشك — سعر البيع يُحسب تلقائياً.</div></div>
      <div class="spacer"></div>
      <button class="btn btn-sm" data-act="qFromCat">اختر من الكتالوج</button>
      <button class="btn btn-sm" data-act="qLineAdd">+ بند</button>
      <button class="btn btn-sm" data-act="qMarginAll">تطبيق هامش موحّد</button>
    </div>
    <div class="table-wrap">
      <table class="wide">
        <thead><tr>
          <th>الصنف</th><th>المواصفات</th><th>الكمية</th><th>الوحدة</th>
          <th>تكلفة الوحدة</th><th>هامش %</th><th class="num">سعر الوحدة</th><th class="num">الإجمالي</th><th>المورد</th><th></th>
        </tr></thead>
        <tbody id="qLines">${q.lines.map(l => qLineRow(l, c)).join('')}</tbody>
      </table>
    </div>
    ${q.lines.length ? '' : '<div class="empty"><div class="e-ic">🧾</div>أضف أول بند للعرض.</div>'}
  </div>

  <div class="grid g2" style="align-items:start">
    <div class="panel">
      <h3>الرسوم والخصم</h3>
      <div class="psub">رسوم إدارة المشروع تُضاف فوق أسعار البنود.</div>
      <div class="row r2">
        <div class="field"><label>نوع رسوم الخدمة</label>
          <select class="inp" data-change="qField" data-f="feeType">
            <option value="pct" ${q.feeType === 'pct' ? 'selected' : ''}>نسبة % من قيمة البنود</option>
            <option value="fixed" ${q.feeType === 'fixed' ? 'selected' : ''}>مبلغ ثابت</option>
          </select></div>
        <div class="field"><label>قيمة الرسوم</label><input class="inp" type="number" min="0" step="0.01" data-input="qField" data-f="feeValue" value="${esc(q.feeValue)}"></div>
      </div>
      <div class="row r2">
        <div class="field"><label>شحن وتوصيل (ر.س)</label><input class="inp" type="number" min="0" step="0.01" data-input="qField" data-f="delivery" value="${esc(q.delivery)}"></div>
        <div class="field"><label>ضريبة القيمة المضافة</label>
          <select class="inp" data-change="qField" data-f="vat">
            <option value="1" ${q.vat !== false ? 'selected' : ''}>تُحتسب ${st.vatRate}%</option>
            <option value="0" ${q.vat === false ? 'selected' : ''}>بدون ضريبة</option>
          </select></div>
      </div>
      <div class="row r2">
        <div class="field"><label>نوع الخصم</label>
          <select class="inp" data-change="qField" data-f="discType">
            <option value="fixed" ${q.discType === 'fixed' ? 'selected' : ''}>مبلغ ثابت</option>
            <option value="pct" ${q.discType === 'pct' ? 'selected' : ''}>نسبة %</option>
          </select></div>
        <div class="field"><label>قيمة الخصم</label><input class="inp" type="number" min="0" step="0.01" data-input="qField" data-f="discValue" value="${esc(q.discValue)}"></div>
      </div>
      <div class="field"><label>ملاحظات تظهر في العرض</label><textarea class="inp" data-input="qField" data-f="notes">${esc(q.notes)}</textarea></div>
      <div class="field"><label>الشروط والأحكام</label><textarea class="inp" style="min-height:130px" data-input="qField" data-f="terms">${esc(q.terms)}</textarea></div>
    </div>

    <div class="panel">
      <h3>الملخص المالي</h3>
      <div class="psub">أرقام التكلفة والربح لك أنت فقط — لا تظهر للعميل في الطباعة.</div>
      <div id="qTotals">${totalsBox(c)}</div>
    </div>
  </div>`;
}

function totalsBox(c){
  return `<div class="totals">
    <div class="t-row muted"><span>تكلفة الموردين (سرّي)</span><span>${money(c.cost)}</span></div>
    <div class="t-row"><span>إجمالي البنود</span><span>${money(c.sell)}</span></div>
    <div class="t-row"><span>رسوم الخدمة</span><span>${money(c.fee)}</span></div>
    <div class="t-row"><span>شحن وتوصيل</span><span>${money(c.delivery)}</span></div>
    <div class="t-row"><span>الخصم</span><span>- ${money(c.discount)}</span></div>
    <div class="t-row"><span>الإجمالي قبل الضريبة</span><span>${money(c.subtotal)}</span></div>
    <div class="t-row"><span>ضريبة القيمة المضافة (${c.vatRate}%)</span><span>${money(c.vat)}</span></div>
    <div class="t-row grand"><span>الإجمالي شامل الضريبة</span><span>${money(c.total)}</span></div>
    <div class="t-row profit" style="margin-top:10px"><span>ربحك المتوقع</span><span>${money(c.profit)}</span></div>
    <div class="t-row muted"><span>نسبة الربح من قيمة العرض</span><span>${c.marginPct}%</span></div>
  </div>`;
}

/* تعديلات حيّة بدون إعادة رسم كامل */
function liveRefresh(q){
  const c = calcQuote(q);
  const box = document.getElementById('qTotals');
  if(box) box.innerHTML = totalsBox(c);
  c.lines.forEach(l => {
    const tr = document.querySelector('[data-ql="' + l.id + '"]');
    if(!tr) return;
    tr.querySelector('[data-cell="unit"]').textContent = money(l.unitPrice, false);
    tr.querySelector('[data-cell="total"]').textContent = money(l.lineTotal, false);
  });
}
ACTIONS.qLine = el => {
  const q = curQuote(); if(!q) return;
  const id = el.closest('[data-ql]').dataset.ql;
  const l = q.lines.find(x => x.id === id); if(!l) return;
  const f = el.dataset.f;
  l[f] = (f === 'qty' || f === 'cost' || f === 'margin') ? num(el.value) : el.value;
  saveQuote(q); liveRefresh(q);
};
ACTIONS.qField = el => {
  const q = curQuote(); if(!q) return;
  const f = el.dataset.f;
  if(f === 'vat') q.vat = el.value === '1';
  else if(['feeValue','delivery','discValue','validity'].includes(f)) q[f] = num(el.value);
  else q[f] = el.value;
  saveQuote(q);
  if(f === 'status' || f === 'date' || f === 'validity'){ repaint(); }
  else liveRefresh(q);
};
ACTIONS.qClient = el => {
  const q = curQuote(); if(!q) return;
  q.client[el.dataset.f] = el.value; saveQuote(q);
};
ACTIONS.qLineAdd = () => {
  const q = curQuote(); q.lines.push(emptyLine()); saveQuote(q); repaint();
};
ACTIONS.qLineDel = el => {
  const q = curQuote(); q.lines = q.lines.filter(l => l.id !== el.dataset.id); saveQuote(q); repaint();
};
ACTIONS.qMarginAll = () => {
  const q = curQuote();
  modal('تطبيق هامش موحّد', `
    <div class="field"><label>الهامش % على كل البنود</label>
      <input class="inp" id="mAll" type="number" min="0" step="1" value="${getSettings().defaultMargin}"></div>
    <div class="btn-row"><button class="btn btn-gold" data-act="qMarginApply">تطبيق</button>
    <button class="btn btn-ghost" data-act="closeModal">إلغاء</button></div>`);
};
ACTIONS.qMarginApply = () => {
  const v = num(document.getElementById('mAll').value);
  const q = curQuote(); q.lines.forEach(l => l.margin = v); saveQuote(q);
  closeModal(); repaint(); toast('تم تطبيق الهامش ✓', 'ok');
};
ACTIONS.qFromCat = () => {
  const items = getItems();
  modal('إضافة من الكتالوج', `
    <div class="field"><input class="inp" id="qSearch" placeholder="ابحث عن صنف…"></div>
    <div id="qResults" style="max-height:340px;overflow:auto"></div>
    <div class="btn-row" style="margin-top:14px"><button class="btn" data-act="closeModal">إغلاق</button></div>`, bg => {
    const draw = s => {
      bg.querySelector('#qResults').innerHTML = items.filter(i => !s || i.name.includes(s)).map(i => `
        <div class="list-item"><div class="li-main"><div class="li-t">${esc(i.name)}</div>
          <div class="li-s">تكلفة ${money(i.cost)} · هامش ${i.margin}% · ${esc(i.unit)}</div></div>
          <button class="btn btn-sm" data-act="qPick" data-id="${i.id}">إضافة</button></div>`).join('') || '<div class="hint">لا توجد نتائج.</div>';
    };
    draw('');
    bg.querySelector('#qSearch').addEventListener('input', e => draw(e.target.value.trim()));
  });
};
ACTIONS.qPick = el => {
  const it = getItems().find(i => i.id === el.dataset.id); if(!it) return;
  const q = curQuote();
  q.lines.push({id:uid('l'), name:it.name, spec:'', qty:1, unit:it.unit, cost:it.cost, margin:it.margin, supplier:it.supplier || ''});
  saveQuote(q); repaint(); toast('أُضيف البند ✓', 'ok');
};

/* نص الواتساب و CSV */
function quoteText(q){
  const st = getSettings(), c = calcQuote(q);
  const L = c.lines.map((l, i) => `${i + 1}. ${l.name}${l.spec ? ' — ' + l.spec : ''}\n   ${fmtInt(l.qty)} ${l.unit} × ${money(l.unitPrice)} = ${money(l.lineTotal)}`).join('\n');
  return `${st.brandAr} — عرض سعر ${q.ref}
التاريخ: ${fmtDate(q.date)} · صالح حتى ${fmtDate(addDays(q.date, q.validity))}
العميل: ${q.client.name || '—'}${q.client.org ? ' — ' + q.client.org : ''}
الموضوع: ${q.title || '—'}

${L}

إجمالي البنود: ${money(c.sell)}${c.fee ? '\nرسوم الخدمة: ' + money(c.fee) : ''}${c.delivery ? '\nشحن وتوصيل: ' + money(c.delivery) : ''}${c.discount ? '\nخصم: -' + money(c.discount) : ''}
الإجمالي قبل الضريبة: ${money(c.subtotal)}
ضريبة القيمة المضافة (${c.vatRate}%): ${money(c.vat)}
الإجمالي شامل الضريبة: ${money(c.total)}
${q.notes ? '\nملاحظات: ' + q.notes : ''}
${st.phone ? '\nللتواصل: ' + st.phone : ''}`;
}
ACTIONS.qCopy = el => { const q = getQuotes().find(x => x.id === el.dataset.id); if(q) copyText(quoteText(q)); };
ACTIONS.qCsv = el => {
  const q = getQuotes().find(x => x.id === el.dataset.id); if(!q) return;
  const c = calcQuote(q);
  const rows = [['الصنف','المواصفات','الكمية','الوحدة','تكلفة الوحدة','هامش %','سعر الوحدة','الإجمالي','المورد']]
    .concat(c.lines.map(l => [l.name, l.spec, l.qty, l.unit, l.cost, l.margin, l.unitPrice, l.lineTotal, l.supplier]));
  const csv = '﻿' + rows.map(r => r.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  downloadFile(q.ref + '.csv', csv, 'text/csv;charset=utf-8');
};

/* الطباعة */
ACTIONS.qPrint = el => {
  const q = getQuotes().find(x => x.id === el.dataset.id); if(!q) return;
  const st = getSettings(), c = calcQuote(q);
  const rows = c.lines.map((l, i) => `<tr>
    <td>${i + 1}</td><td>${esc(l.name)}${l.spec ? '<br><span style="color:#777;font-size:10px">' + esc(l.spec) + '</span>' : ''}</td>
    <td class="num">${fmtInt(l.qty)}</td><td>${esc(l.unit)}</td>
    <td class="num">${money(l.unitPrice, false)}</td><td class="num">${money(l.lineTotal, false)}</td></tr>`).join('');
  document.getElementById('printDoc').innerHTML = `
    <div class="p-head">
      <div class="p-brand">${esc(st.brandAr)}<small>${esc(st.brandEn)}</small></div>
      <div class="p-meta">
        <b>عرض سعر</b> · ${esc(q.ref)}<br>
        التاريخ: ${fmtDate(q.date)}<br>
        صالح حتى: ${fmtDate(addDays(q.date, q.validity))}
        ${st.vatNo ? '<br>الرقم الضريبي: ' + esc(st.vatNo) : ''}
        ${st.crNo ? '<br>س.ت: ' + esc(st.crNo) : ''}
      </div>
    </div>
    <table style="margin-bottom:14px"><tr>
      <td style="width:50%"><b>العميل:</b> ${esc(q.client.name || '—')}${q.client.org ? '<br>' + esc(q.client.org) : ''}${q.client.city ? '<br>' + esc(q.client.city) : ''}</td>
      <td><b>الموضوع:</b> ${esc(q.title || '—')}${q.client.phone ? '<br><b>جوال:</b> ' + esc(q.client.phone) : ''}</td>
    </tr></table>
    <h2>بنود العرض <span style="font-weight:400;font-size:10.5px;color:#777">(جميع المبالغ بالريال السعودي)</span></h2>
    <table>
      <thead><tr><th>#</th><th>الصنف</th><th class="num">الكمية</th><th>الوحدة</th><th class="num">سعر الوحدة</th><th class="num">الإجمالي</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="p-tot">
      <div class="r"><span>إجمالي البنود</span><span>${money(c.sell, false)}</span></div>
      ${c.fee ? `<div class="r"><span>رسوم الخدمة والإشراف</span><span>${money(c.fee, false)}</span></div>` : ''}
      ${c.delivery ? `<div class="r"><span>شحن وتوصيل</span><span>${money(c.delivery, false)}</span></div>` : ''}
      ${c.discount ? `<div class="r"><span>خصم</span><span>- ${money(c.discount, false)}</span></div>` : ''}
      <div class="r"><span>الإجمالي قبل الضريبة</span><span>${money(c.subtotal, false)}</span></div>
      <div class="r"><span>ضريبة القيمة المضافة (${c.vatRate}%)</span><span>${money(c.vat, false)}</span></div>
      <div class="r g"><span>الإجمالي شامل الضريبة</span><span>${money(c.total)}</span></div>
    </div>
    ${q.notes ? `<div class="p-terms"><b>ملاحظات:</b>\n${esc(q.notes)}</div>` : ''}
    <div class="p-terms"><b>الشروط والأحكام:</b>\n${esc(q.terms)}</div>
    <div class="p-sign">
      <div>مقدّم العرض: ${esc(st.owner || st.brandAr)}<br>${esc(st.phone || '')} ${st.email ? ' · ' + esc(st.email) : ''}</div>
      <div>اعتماد العميل: ______________________</div>
    </div>`;
  window.print();
};

/* ==========================================================================
   ٣) قائمة التسوق / أوامر الشراء
   ========================================================================== */
ACTIONS.qToPO = el => {
  const q = getQuotes().find(x => x.id === el.dataset.id); if(!q) return;
  const pos = getPOs();
  const exist = pos.find(p => p.quoteId === q.id);
  if(exist){ STATE.tab = 'buy'; STATE.poId = exist.id; render(); return toast('القائمة موجودة مسبقاً'); }
  const c = calcQuote(q);
  const po = {
    id: uid('p'), ref: nextRef('po', 'PO'), createdAt: new Date().toISOString(),
    quoteId: q.id, title: q.title || q.ref, client: q.client.name || '',
    revenue: c.subtotal,
    lines: c.lines.map(l => ({
      id: uid('pl'), name:l.name, spec:l.spec, qty:l.qty, unit:l.unit,
      supplier:l.supplier || '', est:r2(l.lineCost), actual:0, status:'todo', note:''
    })),
    notes: ''
  };
  pos.unshift(po); savePOs(pos);
  STATE.tab = 'buy'; STATE.poId = po.id; render();
  toast('تم إنشاء قائمة الشراء ' + po.ref + ' ✓', 'ok');
};

function poCalc(p){
  const est = r2((p.lines || []).reduce((s, l) => s + num(l.est), 0));
  const actual = r2((p.lines || []).reduce((s, l) => s + (num(l.actual) || 0), 0));
  const spent = r2((p.lines || []).reduce((s, l) => s + (num(l.actual) || num(l.est)), 0));
  const done = (p.lines || []).filter(l => l.status === 'received').length;
  const diff = r2(est - actual);
  const profit = p.revenue ? r2(num(p.revenue) - spent) : null;
  return {est, actual, spent, diff, done, count:(p.lines || []).length, profit};
}

function poList(){
  const pos = getPOs();
  const rows = pos.map(p => {
    const c = poCalc(p);
    return `<div class="list-item">
      <div class="li-main">
        <div class="li-t">${esc(p.title)} <span class="badge b-mute">${c.done}/${c.count} مستلم</span></div>
        <div class="li-s">${esc(p.ref)}${p.client ? ' · ' + esc(p.client) : ''} · تقديري ${money(c.est)} · فعلي ${money(c.actual)} · ${fmtDate(p.createdAt)}</div>
      </div>
      <div class="li-n">${c.profit !== null ? 'ربح ' + money(c.profit) : money(c.spent)}</div>
      <div class="btn-row">
        <button class="btn btn-sm btn-gold" data-act="poOpen" data-id="${p.id}">فتح</button>
        <button class="btn btn-sm" data-act="poCopy" data-id="${p.id}">نسخ للمورد</button>
        <button class="btn btn-sm btn-danger" data-act="poDelete" data-id="${p.id}">✕</button>
      </div>
    </div>`;
  }).join('');
  return `<div class="panel">
    <div class="panel-head"><div><h3>قوائم التسوق والشراء</h3>
      <div style="font-size:13px;color:var(--muted)">وش تحتاج تشتري من الموردين لكل مشروع — وكم صرفت فعلياً.</div></div>
      <div class="spacer"></div>
      <button class="btn btn-sm btn-gold" data-act="poNew">+ قائمة جديدة</button></div>
    ${rows || '<div class="empty"><div class="e-ic">🛒</div>ما فيه قوائم شراء.<br><span class="hint">حوّل أي عرض سعر معتمد إلى قائمة شراء بضغطة واحدة.</span></div>'}
  </div>`;
}
ACTIONS.poNew = () => {
  const p = {id:uid('p'), ref:nextRef('po', 'PO'), createdAt:new Date().toISOString(), quoteId:'', title:'قائمة تسوق', client:'', revenue:0, lines:[], notes:''};
  const all = getPOs(); all.unshift(p); savePOs(all);
  STATE.poId = p.id; repaint();
};
ACTIONS.poOpen = el => { STATE.poId = el.dataset.id; repaint(); };
ACTIONS.poBack = () => { STATE.poId = null; repaint(); };
ACTIONS.poDelete = el => {
  if(!confirm('حذف القائمة نهائياً؟')) return;
  savePOs(getPOs().filter(p => p.id !== el.dataset.id));
  STATE.poId = null; repaint(); toast('تم الحذف', 'ok');
};
function curPO(){ return getPOs().find(p => p.id === STATE.poId); }
function savePO(p){
  const all = getPOs(); const i = all.findIndex(x => x.id === p.id);
  if(i > -1) all[i] = p; else all.unshift(p);
  savePOs(all);
}

function poEditor(){
  const p = curPO(); if(!p) return poList();
  const c = poCalc(p);
  const suppliers = [...new Set(p.lines.map(l => l.supplier || 'بدون مورد محدد'))];
  const groups = suppliers.map(s => {
    const ls = p.lines.filter(l => (l.supplier || 'بدون مورد محدد') === s);
    const sum = r2(ls.reduce((a, l) => a + (num(l.actual) || num(l.est)), 0));
    return `<div class="panel" style="background:var(--bg-2)">
      <div class="panel-head" style="margin-bottom:12px">
        <h3 style="font-size:14.5px">🏭 ${esc(s)}</h3>
        <div class="spacer"></div>
        <span class="li-n">${money(sum)}</span>
        <button class="btn btn-sm" data-act="poCopyGroup" data-id="${p.id}" data-sup="${esc(s)}">نسخ طلبية المورد</button>
      </div>
      <div class="table-wrap">
        <table class="wide"><thead><tr>
          <th>الصنف</th><th>المواصفات</th><th>الكمية</th><th>الوحدة</th>
          <th>تقديري</th><th>فعلي</th><th>المورد</th><th>الحالة</th><th>ملاحظة</th><th></th>
        </tr></thead><tbody>
        ${ls.map(l => `<tr data-pl="${l.id}">
          <td><input class="cell-inp" data-input="poLine" data-f="name" value="${esc(l.name)}"></td>
          <td><input class="cell-inp" data-input="poLine" data-f="spec" value="${esc(l.spec)}"></td>
          <td class="w-xs"><input class="cell-inp" type="number" min="0" data-input="poLine" data-f="qty" value="${esc(l.qty)}"></td>
          <td class="w-md"><select class="cell-inp" data-change="poLine" data-f="unit">${UNITS.map(u => `<option ${u === l.unit ? 'selected' : ''}>${u}</option>`).join('')}</select></td>
          <td class="w-sm"><input class="cell-inp" type="number" min="0" step="0.01" data-input="poLine" data-f="est" value="${esc(l.est)}"></td>
          <td class="w-sm"><input class="cell-inp" type="number" min="0" step="0.01" data-input="poLine" data-f="actual" value="${esc(l.actual)}"></td>
          <td class="w-md"><input class="cell-inp" data-input="poLine" data-f="supplier" value="${esc(l.supplier)}" placeholder="المورد"></td>
          <td class="w-md"><select class="cell-inp" data-change="poLineStatus" data-f="status">
            ${Object.keys(PO_STATUS).map(k => `<option value="${k}" ${l.status === k ? 'selected' : ''}>${PO_STATUS[k].label}</option>`).join('')}
          </select></td>
          <td><input class="cell-inp" data-input="poLine" data-f="note" value="${esc(l.note)}" placeholder="رقم الفاتورة، موعد الاستلام…"></td>
          <td class="w-xs"><button class="btn btn-sm btn-danger" data-act="poLineDel" data-id="${l.id}">✕</button></td>
        </tr>`).join('')}
        </tbody></table>
      </div>
    </div>`;
  }).join('');

  return `
  <div class="panel">
    <div class="panel-head">
      <button class="btn btn-sm btn-ghost" data-act="poBack">← رجوع</button>
      <h3>${esc(p.ref)}</h3>
      <div class="spacer"></div>
      <button class="btn btn-sm" data-act="poLineAdd">+ صنف</button>
      <button class="btn btn-sm" data-act="poCopy" data-id="${p.id}">نسخ القائمة</button>
      <button class="btn btn-sm" data-act="poCsv" data-id="${p.id}">CSV</button>
    </div>
    <div class="row r3">
      <div class="field"><label>عنوان القائمة</label><input class="inp" data-input="poField" data-f="title" value="${esc(p.title)}"></div>
      <div class="field"><label>العميل / المشروع</label><input class="inp" data-input="poField" data-f="client" value="${esc(p.client)}"></div>
      <div class="field"><label>إيراد المشروع قبل الضريبة (ر.س)</label><input class="inp" type="number" min="0" step="0.01" data-input="poField" data-f="revenue" value="${esc(p.revenue)}"></div>
    </div>
    <div class="kpis" style="margin-top:6px">
      <div class="kpi"><div class="l">عدد الأصناف</div><div class="n">${c.count}</div></div>
      <div class="kpi"><div class="l">التكلفة التقديرية</div><div class="n">${money(c.est)}</div></div>
      <div class="kpi"><div class="l">المصروف الفعلي</div><div class="n gold">${money(c.actual)}</div></div>
      <div class="kpi"><div class="l">${c.profit !== null ? 'الربح الفعلي' : 'الفرق عن التقدير'}</div>
        <div class="n ${(c.profit !== null ? c.profit : c.diff) >= 0 ? 'green' : ''}">${money(c.profit !== null ? c.profit : c.diff)}</div></div>
    </div>
  </div>
  ${p.lines.length ? groups : '<div class="panel"><div class="empty"><div class="e-ic">🛒</div>القائمة فاضية — أضف أصناف.</div></div>'}
  <div class="panel">
    <div class="field"><label>ملاحظات القائمة</label><textarea class="inp" data-input="poField" data-f="notes">${esc(p.notes)}</textarea></div>
  </div>`;
}
ACTIONS.poField = el => {
  const p = curPO(); if(!p) return;
  p[el.dataset.f] = el.dataset.f === 'revenue' ? num(el.value) : el.value;
  savePO(p);
};
ACTIONS.poLine = el => {
  const p = curPO(); if(!p) return;
  const l = p.lines.find(x => x.id === el.closest('[data-pl]').dataset.pl); if(!l) return;
  const f = el.dataset.f;
  l[f] = ['qty','est','actual'].includes(f) ? num(el.value) : el.value;
  savePO(p);
};
ACTIONS.poLineStatus = el => {
  const p = curPO(); if(!p) return;
  const l = p.lines.find(x => x.id === el.closest('[data-pl]').dataset.pl); if(!l) return;
  l.status = el.value; savePO(p); repaint();
};
ACTIONS.poLineAdd = () => {
  const p = curPO();
  p.lines.push({id:uid('pl'), name:'', spec:'', qty:1, unit:'حبة', supplier:'', est:0, actual:0, status:'todo', note:''});
  savePO(p); repaint();
};
ACTIONS.poLineDel = el => {
  const p = curPO(); p.lines = p.lines.filter(l => l.id !== el.dataset.id); savePO(p); repaint();
};
function poText(p, supplier){
  const st = getSettings();
  const ls = supplier ? p.lines.filter(l => (l.supplier || 'بدون مورد محدد') === supplier) : p.lines;
  const L = ls.map((l, i) => `${i + 1}. ${l.name}${l.spec ? ' — ' + l.spec : ''} : ${fmtInt(l.qty)} ${l.unit}`).join('\n');
  return `${st.brandAr} — طلب توريد
المرجع: ${p.ref}${supplier ? '\nالمورد: ' + supplier : ''}
المشروع: ${p.title}${p.client ? ' — ' + p.client : ''}

${L}

${p.notes ? 'ملاحظات: ' + p.notes + '\n' : ''}يرجى تزويدنا بالسعر ومدة التنفيذ.
${st.phone ? 'للتواصل: ' + st.phone : ''}`;
}
ACTIONS.poCopy = el => { const p = getPOs().find(x => x.id === el.dataset.id); if(p) copyText(poText(p)); };
ACTIONS.poCopyGroup = el => { const p = getPOs().find(x => x.id === el.dataset.id); if(p) copyText(poText(p, el.dataset.sup)); };
ACTIONS.poCsv = el => {
  const p = getPOs().find(x => x.id === el.dataset.id); if(!p) return;
  const rows = [['الصنف','المواصفات','الكمية','الوحدة','المورد','تقديري','فعلي','الحالة','ملاحظة']]
    .concat(p.lines.map(l => [l.name, l.spec, l.qty, l.unit, l.supplier, l.est, l.actual, PO_STATUS[l.status].label, l.note]));
  const csv = '﻿' + rows.map(r => r.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  downloadFile(p.ref + '.csv', csv, 'text/csv;charset=utf-8');
};

/* ==========================================================================
   ٤) الأصناف والموردين
   ========================================================================== */
function catalogTab(){
  const items = getItems();
  const list = items.filter(i => (STATE.catFilter === 'all' || i.cat === STATE.catFilter) && (!STATE.q || i.name.includes(STATE.q)));
  const chips = ['all'].concat(CATEGORIES.map(c => c.id)).map(k => {
    const label = k === 'all' ? 'الكل' : CATEGORIES.find(c => c.id === k).name;
    return `<button class="btn btn-sm ${STATE.catFilter === k ? 'btn-gold' : 'btn-ghost'}" data-act="catFilter" data-id="${k}">${label}</button>`;
  }).join('');
  const rows = list.map(i => `<tr data-it="${i.id}">
    <td><input class="cell-inp" data-input="itEdit" data-f="name" value="${esc(i.name)}"></td>
    <td class="w-md"><select class="cell-inp" data-change="itEdit" data-f="cat">${CATEGORIES.map(c => `<option value="${c.id}" ${i.cat === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select></td>
    <td class="w-md"><select class="cell-inp" data-change="itEdit" data-f="unit">${UNITS.map(u => `<option ${u === i.unit ? 'selected' : ''}>${u}</option>`).join('')}</select></td>
    <td class="w-sm"><input class="cell-inp" type="number" min="0" step="0.01" data-input="itEdit" data-f="cost" value="${esc(i.cost)}"></td>
    <td class="w-xs"><input class="cell-inp" type="number" min="0" step="1" data-input="itEdit" data-f="margin" value="${esc(i.margin)}"></td>
    <td class="num">${money(num(i.cost) * (1 + num(i.margin) / 100), false)}</td>
    <td class="w-xs"><input class="cell-inp" type="number" min="0" data-input="itEdit" data-f="lead" value="${esc(i.lead)}"></td>
    <td class="w-md"><input class="cell-inp" data-input="itEdit" data-f="supplier" value="${esc(i.supplier || '')}" placeholder="المورد"></td>
    <td class="w-xs"><button class="btn btn-sm btn-danger" data-act="itDel" data-id="${i.id}">✕</button></td>
  </tr>`).join('');

  const sups = getSuppliers();
  const supRows = sups.map(s => `<tr data-sp="${s.id}">
    <td><input class="cell-inp" data-input="spEdit" data-f="name" value="${esc(s.name)}"></td>
    <td class="w-md"><input class="cell-inp" data-input="spEdit" data-f="phone" value="${esc(s.phone)}"></td>
    <td class="w-md"><input class="cell-inp" data-input="spEdit" data-f="city" value="${esc(s.city)}"></td>
    <td><input class="cell-inp" data-input="spEdit" data-f="note" value="${esc(s.note)}" placeholder="تخصصه، شروط الدفع، ملاحظات…"></td>
    <td class="w-xs"><button class="btn btn-sm btn-danger" data-act="spDel" data-id="${s.id}">✕</button></td>
  </tr>`).join('');

  return `
  <div class="panel">
    <div class="panel-head">
      <div><h3>كتالوج الأصناف والأسعار</h3>
      <div style="font-size:13px;color:var(--muted)">تكلفة المورد + هامشك = سعر البيع. هذي الأسعار تُستخدم تلقائياً في العروض.</div></div>
      <div class="spacer"></div>
      <input class="inp" style="width:180px" placeholder="بحث…" value="${esc(STATE.q)}" data-input="catSearchIn">
      <button class="btn btn-sm btn-gold" data-act="itAdd">+ صنف</button>
    </div>
    <div class="btn-row" style="margin-bottom:16px">${chips}</div>
    <div class="table-wrap">
      <table class="wide"><thead><tr>
        <th>الصنف</th><th>القسم</th><th>الوحدة</th><th>تكلفة المورد</th><th>هامش %</th>
        <th class="num">سعر البيع</th><th>مدة (يوم)</th><th>المورد</th><th></th>
      </tr></thead><tbody>${rows}</tbody></table>
    </div>
    ${list.length ? '' : '<div class="empty"><div class="e-ic">📦</div>لا توجد أصناف مطابقة.</div>'}
  </div>

  <div class="panel">
    <div class="panel-head"><div><h3>الموردين</h3>
      <div style="font-size:13px;color:var(--muted)">دفتر موردينك — مين يسوي وش، وكيف توصله.</div></div>
      <div class="spacer"></div><button class="btn btn-sm btn-gold" data-act="spAdd">+ مورد</button></div>
    ${sups.length ? `<div class="table-wrap"><table><thead><tr><th>الاسم</th><th>الجوال</th><th>المدينة</th><th>ملاحظات</th><th></th></tr></thead><tbody>${supRows}</tbody></table></div>`
      : '<div class="empty"><div class="e-ic">🏭</div>ما سجلت موردين بعد.</div>'}
  </div>`;
}
ACTIONS.catFilter = el => { STATE.catFilter = el.dataset.id; repaint(); };
ACTIONS.catSearchIn = el => {
  STATE.q = el.value; const pos = el.selectionStart;
  const b = document.getElementById('tabBody'); b.innerHTML = tabBody();
  const n = b.querySelector('[data-input="catSearchIn"]'); if(n){ n.focus(); n.setSelectionRange(pos, pos); }
};
ACTIONS.itAdd = () => {
  const items = getItems();
  items.unshift({id:uid('it'), cat:(STATE.catFilter === 'all' ? 'print' : STATE.catFilter), name:'صنف جديد', unit:'حبة', cost:0, margin:getSettings().defaultMargin, lead:3, supplier:''});
  saveItems(items); repaint();
};
ACTIONS.itEdit = el => {
  const items = getItems();
  const it = items.find(x => x.id === el.closest('[data-it]').dataset.it); if(!it) return;
  const f = el.dataset.f;
  it[f] = ['cost','margin','lead'].includes(f) ? num(el.value) : el.value;
  saveItems(items);
  if(f === 'cost' || f === 'margin'){
    const tr = el.closest('[data-it]');
    tr.querySelector('td.num').textContent = money(num(it.cost) * (1 + num(it.margin) / 100), false);
  }
};
ACTIONS.itDel = el => {
  if(!confirm('حذف الصنف من الكتالوج؟')) return;
  saveItems(getItems().filter(i => i.id !== el.dataset.id)); repaint();
};
ACTIONS.spAdd = () => {
  const s = getSuppliers(); s.unshift({id:uid('sp'), name:'مورد جديد', phone:'', city:'', note:''});
  saveSuppliers(s); repaint();
};
ACTIONS.spEdit = el => {
  const s = getSuppliers(); const sp = s.find(x => x.id === el.closest('[data-sp]').dataset.sp);
  if(sp){ sp[el.dataset.f] = el.value; saveSuppliers(s); }
};
ACTIONS.spDel = el => {
  saveSuppliers(getSuppliers().filter(s => s.id !== el.dataset.id)); repaint();
};

/* ==========================================================================
   ٥) الإعدادات
   ========================================================================== */
function settingsTab(){
  const s = getSettings();
  return `
  <form data-submit="setSave">
    <div class="panel">
      <h3>هوية النشاط</h3>
      <div class="psub">تظهر في الموقع وفي عروض الأسعار المطبوعة.</div>
      <div class="row r2">
        <div class="field"><label>الاسم بالعربي</label><input class="inp" name="brandAr" value="${esc(s.brandAr)}"></div>
        <div class="field"><label>الاسم بالإنجليزي</label><input class="inp" name="brandEn" value="${esc(s.brandEn)}"></div>
      </div>
      <div class="field"><label>الجملة التعريفية</label><input class="inp" name="tagline" value="${esc(s.tagline)}"></div>
      <div class="row r4">
        <div class="field"><label>اسم المسؤول</label><input class="inp" name="owner" value="${esc(s.owner)}"></div>
        <div class="field"><label>الجوال / واتساب</label><input class="inp" name="phone" value="${esc(s.phone)}" placeholder="9665xxxxxxxx"></div>
        <div class="field"><label>البريد</label><input class="inp" name="email" value="${esc(s.email)}"></div>
        <div class="field"><label>المدينة</label><input class="inp" name="city" value="${esc(s.city)}"></div>
      </div>
      <div class="row r2">
        <div class="field"><label>الرقم الضريبي</label><input class="inp" name="vatNo" value="${esc(s.vatNo)}"></div>
        <div class="field"><label>السجل التجاري</label><input class="inp" name="crNo" value="${esc(s.crNo)}"></div>
      </div>
    </div>

    <div class="panel">
      <h3>قواعد التسعير</h3>
      <div class="psub">القيم الافتراضية لأي عرض جديد.</div>
      <div class="row r4">
        <div class="field"><label>ضريبة القيمة المضافة %</label><input class="inp" name="vatRate" type="number" min="0" step="0.5" value="${esc(s.vatRate)}"></div>
        <div class="field"><label>هامش الوساطة الافتراضي %</label><input class="inp" name="defaultMargin" type="number" min="0" step="1" value="${esc(s.defaultMargin)}"></div>
        <div class="field"><label>نوع رسوم الخدمة</label>
          <select class="inp" name="serviceFeeType">
            <option value="pct" ${s.serviceFeeType === 'pct' ? 'selected' : ''}>نسبة %</option>
            <option value="fixed" ${s.serviceFeeType === 'fixed' ? 'selected' : ''}>مبلغ ثابت</option>
          </select></div>
        <div class="field"><label>قيمة رسوم الخدمة</label><input class="inp" name="serviceFeeValue" type="number" min="0" step="0.01" value="${esc(s.serviceFeeValue)}"></div>
      </div>
      <div class="row r2">
        <div class="field"><label>صلاحية العرض (يوم)</label><input class="inp" name="validityDays" type="number" min="1" value="${esc(s.validityDays)}"></div>
        <div class="field"><label>رمز الدخول لمساحة العمل</label><input class="inp" name="passcode" value="${esc(s.passcode)}"></div>
      </div>
      <div class="field"><label>الشروط والأحكام الافتراضية</label><textarea class="inp" name="terms" style="min-height:150px">${esc(s.terms)}</textarea></div>
      <div class="btn-row"><button class="btn btn-gold" type="submit">حفظ الإعدادات</button></div>
    </div>
  </form>

  <div class="panel">
    <h3>النسخ الاحتياطي</h3>
    <div class="psub">البيانات محفوظة في هذا المتصفح فقط. نزّل نسخة بشكل دوري، خصوصاً قبل تغيير الجهاز أو مسح بيانات المتصفح.</div>
    <div class="btn-row">
      <button class="btn btn-gold" data-act="backupOut">تنزيل نسخة احتياطية</button>
      <button class="btn" data-act="backupIn">استرجاع من ملف</button>
      <button class="btn btn-danger" data-act="wipe">مسح كل البيانات</button>
    </div>
    <input type="file" id="fileIn" accept="application/json" style="display:none">
  </div>`;
}
ACTIONS.setSave = form => {
  const f = Object.fromEntries(new FormData(form).entries());
  const s = getSettings();
  ['brandAr','brandEn','tagline','owner','phone','email','city','vatNo','crNo','serviceFeeType','passcode','terms'].forEach(k => s[k] = f[k]);
  ['vatRate','defaultMargin','serviceFeeValue','validityDays'].forEach(k => s[k] = num(f[k]));
  saveSettings(s); brandUp(); render();
  toast('تم حفظ الإعدادات ✓', 'ok');
};
ACTIONS.backupOut = () => {
  downloadFile('silk-bridge-backup-' + today() + '.json', JSON.stringify(exportAll(), null, 2));
  toast('تم تنزيل النسخة ✓', 'ok');
};
ACTIONS.backupIn = () => {
  const inp = document.getElementById('fileIn');
  inp.onchange = () => {
    const file = inp.files[0]; if(!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      try{ importAll(JSON.parse(rd.result)); brandUp(); render(); toast('تم الاسترجاع ✓', 'ok'); }
      catch(e){ toast('الملف غير صالح: ' + e.message, 'err'); }
    };
    rd.readAsText(file);
  };
  inp.click();
};
ACTIONS.wipe = () => {
  if(!confirm('سيتم مسح كل الطلبات والعروض والأصناف. متأكد؟')) return;
  if(!confirm('تأكيد أخير — هل نزّلت نسخة احتياطية؟')) return;
  ['settings','items','suppliers','requests','quotes','pos'].forEach(k => DB.drop(k));
  STATE.tab = 'inbox'; STATE.quoteId = null; STATE.poId = null;
  brandUp(); render(); toast('تم المسح', 'ok');
};
