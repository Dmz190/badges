/* ==========================================================================
   جسر الحرير — التوجيه والواجهة العامة (الرئيسية + نموذج طلب عرض السعر)
   ========================================================================== */

const ACTIONS = {};
const STATE = { unlocked:false, tab:'inbox', quoteId:null, poId:null, reqFilter:'all', catFilter:'all', q:'' };

/* ---------- توزيع الأحداث ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if(!el) return;
  const fn = ACTIONS[el.dataset.act];
  if(fn){ e.preventDefault(); fn(el, e); }
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-change]');
  if(el && ACTIONS[el.dataset.change]) ACTIONS[el.dataset.change](el, e);
});
document.addEventListener('input', e => {
  const el = e.target.closest('[data-input]');
  if(el && ACTIONS[el.dataset.input]) ACTIONS[el.dataset.input](el, e);
});
document.addEventListener('submit', e => {
  const el = e.target.closest('[data-submit]');
  if(el && ACTIONS[el.dataset.submit]){ e.preventDefault(); ACTIONS[el.dataset.submit](el, e); }
});

/* ---------- التوجيه ---------- */
function route(){ return (location.hash.replace(/^#\/?/, '') || 'home').split('?')[0]; }
function go(path){ location.hash = '#/' + path; }
ACTIONS.go = el => go(el.dataset.to);

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', () => { brandUp(); render(); });

function brandUp(){
  const st = getSettings();
  document.title = st.brandAr + ' — ' + st.tagline;
  const b1 = document.getElementById('brandAr'), b2 = document.getElementById('brandEn');
  if(b1) b1.textContent = st.brandAr;
  if(b2) b2.textContent = st.brandEn;
  const f = document.getElementById('footBrand');
  if(f) f.textContent = st.brandAr + ' · ' + st.brandEn;
}

function render(){
  const r = route();
  const view = document.getElementById('view');
  document.querySelectorAll('.nav a').forEach(a => {
    a.classList.toggle('on', a.getAttribute('href') === '#/' + r);
  });
  if(r === 'request')      view.innerHTML = viewRequest();
  else if(r === 'app')     { view.innerHTML = viewApp(); afterApp(); }
  else if(r === 'services')view.innerHTML = viewServices();
  else                     view.innerHTML = viewHome();
  window.scrollTo({top:0, behavior:'instant'});
}

/* ==========================================================================
   الصفحة الرئيسية
   ========================================================================== */
function viewHome(){
  const st = getSettings();
  const cats = CATEGORIES.map(c => `
    <div class="card">
      <div class="ic">${c.icon}</div>
      <h3>${esc(c.name)}</h3>
      <p>${esc(c.desc)}</p>
      <div class="tags">${c.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    </div>`).join('');

  return `
  <section class="hero">
    <div class="wrap">
      <div class="eyebrow">◆ وساطة إنتاج تسويقي · ${esc(st.city || 'السعودية')}</div>
      <h1>اطلب مرة واحدة…<br>ونحن <span>نتكفّل بالباقي</span></h1>
      <p class="lead">${esc(st.tagline)}. تقول لنا وش تحتاج — طباعة، هدايا دعائية، جناح معرض، فيديو، أو حملة — ونرجع لك بعرض سعر واضح خلال ٢٤ ساعة، ونتابع التنفيذ مع الموردين لين التسليم.</p>
      <div class="cta">
        <a class="btn btn-gold" href="#/request">اطلب عرض سعر</a>
        <a class="btn btn-ghost" href="#/services">شوف الخدمات</a>
      </div>
      <div class="stats">
        <div class="s"><div class="n">٢٤ ساعة</div><div class="l">متوسط الرد بعرض سعر</div></div>
        <div class="s"><div class="n">${CATEGORIES.length}</div><div class="l">أقسام خدمات</div></div>
        <div class="s"><div class="n">مورد واحد</div><div class="l">تتعامل معه بدل عشرة</div></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <h2>ليش تتعامل معنا</h2>
      <div class="sub">الوساطة مو بس وسيط سعر — هي إدارة كاملة للطلب من أوله لآخره.</div>
      <div class="grid g4">
        <div class="card"><div class="ic">🧭</div><h3>جهة اتصال واحدة</h3><p>بدل ما تلاحق مطبعة ومصنع هدايا ومصور، نجمع لك كل شيء تحت طلب واحد وفاتورة واحدة.</p></div>
        <div class="card"><div class="ic">💰</div><h3>سعر مدروس</h3><p>نقارن أكثر من مورد قبل ما نعطيك السعر، ورسوم الوساطة واضحة ومكتوبة في العرض.</p></div>
        <div class="card"><div class="ic">⏱️</div><h3>التزام بالمواعيد</h3><p>كل بند له مدة تنفيذ معروفة مسبقاً، ونتابع الإنتاج يومياً حتى التسليم.</p></div>
        <div class="card"><div class="ic">🛡️</div><h3>ضمان الجودة</h3><p>نراجع العينة قبل الإنتاج الكامل، وأي عيب في التنفيذ نحن مسؤولين عن حله مع المورد.</p></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <h2>الخدمات</h2>
      <div class="sub">كل اللي تحتاجه في إنتاج التسويق والفعاليات.</div>
      <div class="grid g4">${cats}</div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <h2>كيف نشتغل</h2>
      <div class="sub">أربع خطوات، بدون تعقيد.</div>
      <div class="grid g2">
        <div class="steps">
          <div class="step"><h4>ترسل طلبك</h4><p>تعبّي النموذج أو ترسل لنا رسالة بالمطلوب والكميات والموعد.</p></div>
          <div class="step"><h4>نسعّر ونقارن</h4><p>نطلب أسعار من موردين معتمدين ونختار الأنسب سعراً وجودة.</p></div>
        </div>
        <div class="steps" style="counter-reset:st 2">
          <div class="step"><h4>تعتمد العرض</h4><p>يوصلك عرض سعر مفصّل بالأسعار والمدة والشروط، تعتمده وندخل التنفيذ.</p></div>
          <div class="step"><h4>ننفّذ ونسلّم</h4><p>نتابع الإنتاج والتركيب والتوصيل، ونسلّمك جاهز في الموعد.</p></div>
        </div>
      </div>
      <div class="cta" style="margin-top:34px">
        <a class="btn btn-gold" href="#/request">ابدأ طلبك الآن</a>
      </div>
    </div>
  </section>`;
}

function viewServices(){
  const rows = CATEGORIES.map(c => {
    const items = getItems().filter(i => i.cat === c.id);
    return `
    <div class="panel">
      <div class="panel-head">
        <div class="ic" style="width:38px;height:38px;border-radius:10px;background:var(--gold-dim);display:flex;align-items:center;justify-content:center">${c.icon}</div>
        <div><h3>${esc(c.name)}</h3><div style="font-size:13px;color:var(--muted)">${esc(c.desc)}</div></div>
        <div class="spacer"></div>
        <a class="btn btn-sm" href="#/request">اطلب من هذا القسم</a>
      </div>
      <div class="grid g3">
        ${items.map(i => `<div class="list-item"><div class="li-main"><div class="li-t">${esc(i.name)}</div><div class="li-s">الوحدة: ${esc(i.unit)} · مدة التنفيذ ~${esc(i.lead)} يوم</div></div></div>`).join('') || '<div class="hint">لا توجد أصناف مسجلة بعد في هذا القسم.</div>'}
      </div>
    </div>`;
  }).join('');
  return `<section class="section" style="border:none"><div class="wrap">
    <h2>دليل الخدمات</h2>
    <div class="sub">الأصناف المتوفرة حسب القسم. الأسعار تُحدد حسب الكمية والمواصفات في عرض السعر.</div>
    ${rows}
  </div></section>`;
}

/* ==========================================================================
   نموذج طلب عرض سعر
   ========================================================================== */
let REQ_LINES = [{id:uid('rl'), name:'', qty:1, unit:'حبة', spec:''}];

function reqLineRow(l){
  return `
  <tr data-rl="${l.id}">
    <td><input class="cell-inp" data-input="reqEdit" data-f="name" value="${esc(l.name)}" placeholder="مثال: رول أب 80×200"></td>
    <td class="w-sm"><input class="cell-inp" type="number" min="1" data-input="reqEdit" data-f="qty" value="${esc(l.qty)}"></td>
    <td class="w-md"><select class="cell-inp" data-change="reqEdit" data-f="unit">${UNITS.map(u => `<option ${u === l.unit ? 'selected' : ''}>${u}</option>`).join('')}</select></td>
    <td><input class="cell-inp" data-input="reqEdit" data-f="spec" value="${esc(l.spec)}" placeholder="المقاس، الخامة، الألوان…"></td>
    <td class="w-xs"><button class="btn btn-sm btn-danger" data-act="reqDel" data-id="${l.id}">حذف</button></td>
  </tr>`;
}

function viewRequest(){
  const st = getSettings();
  return `
  <section class="section" style="border:none">
    <div class="wrap-narrow">
      <h2>طلب عرض سعر</h2>
      <div class="sub">عبّي المطلوب ونرجع لك بعرض سعر مفصّل. كل الحقول اللي عليها <span style="color:var(--gold)">*</span> مطلوبة.</div>

      <form data-submit="reqSubmit">
        <div class="panel">
          <h3>بيانات مقدّم الطلب</h3>
          <div class="psub">عشان نقدر نتواصل معك ونرسل العرض.</div>
          <div class="row r2">
            <div class="field"><label>الاسم <span class="req">*</span></label><input class="inp" name="name" required placeholder="الاسم الكامل"></div>
            <div class="field"><label>الجهة / الشركة</label><input class="inp" name="org" placeholder="اسم الشركة أو الجهة"></div>
          </div>
          <div class="row r3">
            <div class="field"><label>الجوال <span class="req">*</span></label><input class="inp" name="phone" required inputmode="tel" placeholder="05xxxxxxxx"></div>
            <div class="field"><label>البريد الإلكتروني</label><input class="inp" name="email" type="email" placeholder="name@company.com"></div>
            <div class="field"><label>المدينة</label><input class="inp" name="city" value="${esc(st.city)}"></div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <div><h3>تفاصيل المطلوب</h3><div style="font-size:13px;color:var(--muted)">أضف كل صنف في سطر مستقل.</div></div>
            <div class="spacer"></div>
            <button type="button" class="btn btn-sm" data-act="reqAddFromCat">اختر من الكتالوج</button>
            <button type="button" class="btn btn-sm" data-act="reqAdd">+ سطر جديد</button>
          </div>
          <div class="field"><label>عنوان الطلب / المناسبة</label><input class="inp" name="title" placeholder="مثال: مستلزمات جناح معرض الصحة ٢٠٢٦"></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>الصنف / الخدمة</th><th>الكمية</th><th>الوحدة</th><th>المواصفات</th><th></th></tr></thead>
              <tbody id="reqLines">${REQ_LINES.map(reqLineRow).join('')}</tbody>
            </table>
          </div>
        </div>

        <div class="panel">
          <h3>الموعد والميزانية</h3>
          <div class="psub">تساعدنا نرشّح لك الخيار المناسب.</div>
          <div class="row r3">
            <div class="field"><label>تاريخ التسليم المطلوب</label><input class="inp" name="due" type="date"></div>
            <div class="field"><label>الميزانية التقريبية (ر.س)</label><input class="inp" name="budget" type="number" min="0" placeholder="اختياري"></div>
            <div class="field"><label>درجة الاستعجال</label>
              <select class="inp" name="urgency"><option>عادي</option><option>مستعجل</option><option>عاجل جداً</option></select>
            </div>
          </div>
          <div class="field"><label>ملاحظات إضافية</label><textarea class="inp" name="notes" placeholder="روابط ملفات التصميم، تفاصيل المكان، أي شيء يهمنا نعرفه…"></textarea></div>
          <div class="btn-row" style="margin-top:6px">
            <button class="btn btn-gold" type="submit">إرسال الطلب</button>
            <a class="btn btn-ghost" href="#/">إلغاء</a>
          </div>
          <div class="hint">الطلب يُحفظ في هذا الجهاز وتقدر ترسله لنا مباشرة عبر واتساب أو البريد بعد الإرسال.</div>
        </div>
      </form>
    </div>
  </section>`;
}

ACTIONS.reqAdd = () => {
  REQ_LINES.push({id:uid('rl'), name:'', qty:1, unit:'حبة', spec:''});
  document.getElementById('reqLines').innerHTML = REQ_LINES.map(reqLineRow).join('');
};
ACTIONS.reqDel = el => {
  if(REQ_LINES.length === 1) return toast('لازم يكون فيه سطر واحد على الأقل');
  REQ_LINES = REQ_LINES.filter(l => l.id !== el.dataset.id);
  document.getElementById('reqLines').innerHTML = REQ_LINES.map(reqLineRow).join('');
};
ACTIONS.reqEdit = el => {
  const id = el.closest('[data-rl]').dataset.rl;
  const l = REQ_LINES.find(x => x.id === id);
  if(l) l[el.dataset.f] = el.value;
};
ACTIONS.reqAddFromCat = () => {
  const items = getItems();
  const body = `
    <div class="field"><label>ابحث في الكتالوج</label>
      <input class="inp" id="catSearch" placeholder="اكتب اسم الصنف…"></div>
    <div id="catResults" style="max-height:320px;overflow:auto"></div>
    <div class="btn-row" style="margin-top:16px"><button class="btn" data-act="closeModal">إغلاق</button></div>`;
  modal('اختر من الكتالوج', body, bg => {
    const draw = q => {
      const list = items.filter(i => !q || i.name.includes(q));
      bg.querySelector('#catResults').innerHTML = list.map(i => `
        <div class="list-item">
          <div class="li-main"><div class="li-t">${esc(i.name)}</div>
            <div class="li-s">${esc((CATEGORIES.find(c => c.id === i.cat) || {}).name || '')} · ${esc(i.unit)}</div></div>
          <button class="btn btn-sm" data-act="reqPick" data-name="${esc(i.name)}" data-unit="${esc(i.unit)}">إضافة</button>
        </div>`).join('') || '<div class="hint">لا توجد نتائج.</div>';
    };
    draw('');
    bg.querySelector('#catSearch').addEventListener('input', e => draw(e.target.value.trim()));
  });
};
ACTIONS.reqPick = el => {
  const blank = REQ_LINES.find(l => !l.name);
  if(blank){ blank.name = el.dataset.name; blank.unit = el.dataset.unit; }
  else REQ_LINES.push({id:uid('rl'), name:el.dataset.name, qty:1, unit:el.dataset.unit, spec:''});
  document.getElementById('reqLines').innerHTML = REQ_LINES.map(reqLineRow).join('');
  toast('أُضيف الصنف ✓', 'ok');
};
ACTIONS.closeModal = () => closeModal();

ACTIONS.reqSubmit = form => {
  const f = Object.fromEntries(new FormData(form).entries());
  const lines = REQ_LINES.filter(l => String(l.name).trim());
  if(!lines.length) return toast('أضف صنف واحد على الأقل', 'err');

  const req = {
    id: uid('r'),
    ref: nextRef('request', 'RQ'),
    createdAt: new Date().toISOString(),
    status: 'new',
    client: {name:f.name, org:f.org, phone:f.phone, email:f.email, city:f.city},
    title: f.title || lines[0].name,
    lines: lines.map(l => ({name:l.name, qty:num(l.qty) || 1, unit:l.unit, spec:l.spec})),
    due: f.due, budget: num(f.budget), urgency: f.urgency, notes: f.notes,
    quoteId: ''
  };
  const all = getRequests(); all.unshift(req); saveRequests(all);
  REQ_LINES = [{id:uid('rl'), name:'', qty:1, unit:'حبة', spec:''}];
  document.getElementById('view').innerHTML = viewRequestDone(req);
  window.scrollTo({top:0});
};

function requestText(req){
  const st = getSettings();
  const L = req.lines.map((l, i) => `${i + 1}. ${l.name} — ${l.qty} ${l.unit}${l.spec ? ' (' + l.spec + ')' : ''}`).join('\n');
  return `طلب عرض سعر — ${st.brandAr}
رقم الطلب: ${req.ref}
التاريخ: ${fmtDate(req.createdAt)}

المرسل: ${req.client.name}${req.client.org ? ' — ' + req.client.org : ''}
الجوال: ${req.client.phone}${req.client.email ? '\nالبريد: ' + req.client.email : ''}
المدينة: ${req.client.city || '—'}

الموضوع: ${req.title}
المطلوب:
${L}

التسليم المطلوب: ${req.due ? fmtDate(req.due) : 'غير محدد'}
الاستعجال: ${req.urgency || 'عادي'}${req.budget ? '\nالميزانية التقريبية: ' + money(req.budget) : ''}${req.notes ? '\nملاحظات: ' + req.notes : ''}`;
}

function viewRequestDone(req){
  const st = getSettings();
  const txt = requestText(req);
  const wa = st.phone ? 'https://wa.me/' + String(st.phone).replace(/\D/g, '') + '?text=' + encodeURIComponent(txt) : '';
  const mail = st.email ? 'mailto:' + st.email + '?subject=' + encodeURIComponent('طلب عرض سعر ' + req.ref) + '&body=' + encodeURIComponent(txt) : '';
  return `
  <section class="section" style="border:none">
    <div class="wrap-narrow">
      <div class="panel" style="text-align:center">
        <div style="font-size:42px">✅</div>
        <h3 style="font-size:20px;margin-top:8px">تم استلام طلبك</h3>
        <div class="psub">رقم الطلب <b style="color:var(--gold-2)">${esc(req.ref)}</b> — احتفظ به للمتابعة.</div>
        <div class="btn-row" style="justify-content:center">
          ${wa ? `<a class="btn btn-gold" href="${wa}" target="_blank" rel="noopener">إرسال عبر واتساب</a>` : ''}
          ${mail ? `<a class="btn" href="${mail}">إرسال بالبريد</a>` : ''}
          <button class="btn" data-act="copyReq" data-id="${req.id}">نسخ نص الطلب</button>
          <a class="btn btn-ghost" href="#/">الرئيسية</a>
        </div>
        ${(!wa && !mail) ? '<div class="hint">أضف رقم الجوال والبريد من إعدادات مساحة العمل لتفعيل أزرار الإرسال المباشر.</div>' : ''}
      </div>
      <div class="panel">
        <h3>ملخص الطلب</h3>
        <div class="table-wrap">
          <table><thead><tr><th>#</th><th>الصنف</th><th class="num">الكمية</th><th>الوحدة</th><th>المواصفات</th></tr></thead>
          <tbody>${req.lines.map((l, i) => `<tr><td>${i + 1}</td><td>${esc(l.name)}</td><td class="num">${fmtInt(l.qty)}</td><td>${esc(l.unit)}</td><td>${esc(l.spec) || '—'}</td></tr>`).join('')}</tbody></table>
        </div>
      </div>
    </div>
  </section>`;
}
ACTIONS.copyReq = el => {
  const req = getRequests().find(r => r.id === el.dataset.id);
  if(req) copyText(requestText(req));
};
