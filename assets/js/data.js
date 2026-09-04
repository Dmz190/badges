/* ==========================================================================
   جسر الحرير — البيانات الافتراضية (الهوية، الخدمات، كتالوج الأصناف)
   عدّل الأسعار من داخل الموقع: مساحة العمل ← الأصناف
   ========================================================================== */

const DEFAULT_SETTINGS = {
  brandAr: 'جسر الحرير',
  brandEn: 'SILK BRIDGE',
  tagline: 'وسيطك في إنتاج التسويق — من الفكرة إلى التسليم',
  owner: '',
  phone: '',
  email: '',
  city: 'الرياض',
  vatNo: '',
  crNo: '',
  vatRate: 15,          // نسبة ضريبة القيمة المضافة %
  defaultMargin: 20,    // هامش الوساطة الافتراضي على كل بند %
  serviceFeeType: 'pct',// pct | fixed
  serviceFeeValue: 0,   // رسوم إدارة المشروع
  validityDays: 14,     // صلاحية العرض بالأيام
  passcode: '1234',     // رمز الدخول لمساحة العمل (غيّره من الإعدادات)
  terms: 'الأسعار بالريال السعودي وشاملة أعمال التنسيق والمتابعة مع الموردين.\nمدة التنفيذ تبدأ من تاريخ اعتماد العرض واستلام المواد النهائية (ملفات التصميم).\nشروط الدفع: 50% دفعة مقدمة عند الاعتماد، و50% عند التسليم.\nأي تعديل على المواصفات أو الكميات بعد الاعتماد يُعاد تسعيره.\nالعرض ساري خلال المدة الموضحة أعلاه.',
  seq: { quote: 1, request: 1, po: 1 }
};

/* أقسام الخدمات — تظهر في الصفحة الرئيسية ونموذج الطلب */
const CATEGORIES = [
  { id:'print',   icon:'🖨️', name:'الطباعة والمطبوعات',  desc:'بروشورات، فلايرات، كروت، ملفات تعريفية، ستيكرات.', tags:['أوفست','ديجيتال','UV'] },
  { id:'signage', icon:'🪧', name:'اللوحات والدعايات',    desc:'رول أب، بانرات، ستاندات، خلفيات مسرح، لوحات فوم.', tags:['فينيل','فلكس','أكريليك'] },
  { id:'gifts',   icon:'🎁', name:'الهدايا الدعائية',      desc:'أقلام، أكواب، أجندات، شنط، دروع تكريم، فلاش ميموري.', tags:['طباعة شعار','حفر ليزر'] },
  { id:'apparel', icon:'👕', name:'الملابس واليونيفورم',   desc:'تيشيرتات، كابات، جاكيتات، مراييل فرق العمل.', tags:['تطريز','سلك سكرين'] },
  { id:'events',  icon:'🎪', name:'الفعاليات والمعارض',    desc:'أجنحة، تأثيث، تركيب وفك، تشغيل، منظمين ومضيفات.', tags:['بوث','تركيب','تشغيل'] },
  { id:'media',   icon:'🎬', name:'الإنتاج المرئي',        desc:'تصوير فوتوغرافي وفيديو، مونتاج، موشن جرافيك، تعليق صوتي.', tags:['4K','دورن','استوديو'] },
  { id:'design',  icon:'🎨', name:'التصميم والهوية',       desc:'هوية بصرية، تصاميم سوشيال ميديا، تصميم مطبوعات.', tags:['هوية','سوشيال'] },
  { id:'digital', icon:'📱', name:'التسويق الرقمي',        desc:'إدارة حسابات، إعلانات ممولة، مواقع وصفحات هبوط.', tags:['ميتا','قوقل','SEO'] }
];

/* كتالوج أولي — أسعار استرشادية بالريال، حدّثها حسب موردينك */
const SEED_ITEMS = [
  // الطباعة
  {cat:'print',   name:'بروشور A4 مطوي (طباعة وجهين)', unit:'نسخة', cost:2.20,  margin:25, lead:4, supplier:''},
  {cat:'print',   name:'فلاير A5 ورق 150 جم',          unit:'نسخة', cost:0.65,  margin:30, lead:3, supplier:''},
  {cat:'print',   name:'كرت شخصي 350 جم (علبة 100)',   unit:'علبة', cost:38,    margin:30, lead:3, supplier:''},
  {cat:'print',   name:'ملف تعريفي 16 صفحة تجليد حراري',unit:'نسخة', cost:26,    margin:25, lead:6, supplier:''},
  {cat:'print',   name:'ستيكر لاصق مقاس 10×10 سم',      unit:'حبة',  cost:1.10,  margin:35, lead:3, supplier:''},
  // اللوحات
  {cat:'signage', name:'رول أب 80×200 سم (ستاند + طباعة)',unit:'حبة',cost:135,  margin:25, lead:2, supplier:''},
  {cat:'signage', name:'بانر فلكس مطبوع',               unit:'م²',   cost:22,    margin:30, lead:2, supplier:''},
  {cat:'signage', name:'خلفية مسرح Backdrop 3×2.5 م',   unit:'حبة',  cost:850,   margin:22, lead:5, supplier:''},
  {cat:'signage', name:'لوحة فوم بورد 5 ملم مطبوعة',    unit:'م²',   cost:60,    margin:28, lead:3, supplier:''},
  {cat:'signage', name:'حرف بارز أكريليك مضيء',         unit:'حرف',  cost:180,   margin:25, lead:7, supplier:''},
  // الهدايا
  {cat:'gifts',   name:'قلم معدني بطباعة شعار',          unit:'حبة',  cost:9.50,  margin:35, lead:7, supplier:''},
  {cat:'gifts',   name:'كوب سيراميك بطباعة',             unit:'حبة',  cost:14,    margin:35, lead:7, supplier:''},
  {cat:'gifts',   name:'أجندة جلد A5 مع حفر الشعار',     unit:'حبة',  cost:38,    margin:30, lead:10,supplier:''},
  {cat:'gifts',   name:'شنطة قماش قطن مطبوعة',           unit:'حبة',  cost:16,    margin:35, lead:8, supplier:''},
  {cat:'gifts',   name:'درع تكريم كريستال + نقش',        unit:'حبة',  cost:95,    margin:35, lead:6, supplier:''},
  {cat:'gifts',   name:'فلاش ميموري 32GB بطباعة',        unit:'حبة',  cost:34,    margin:32, lead:10,supplier:''},
  // الملابس
  {cat:'apparel', name:'تيشيرت قطن بطباعة شعار',         unit:'حبة',  cost:32,    margin:32, lead:6, supplier:''},
  {cat:'apparel', name:'كاب مطرز',                       unit:'حبة',  cost:26,    margin:35, lead:7, supplier:''},
  {cat:'apparel', name:'جاكيت فريق عمل مطرز',            unit:'حبة',  cost:110,   margin:28, lead:10,supplier:''},
  // الفعاليات
  {cat:'events',  name:'تنفيذ جناح معرض 3×3 م',          unit:'جناح', cost:7500,  margin:20, lead:14,supplier:''},
  {cat:'events',  name:'طاولة استقبال + برانديج',        unit:'حبة',  cost:650,   margin:25, lead:5, supplier:''},
  {cat:'events',  name:'عامل تركيب وفك (يوم)',           unit:'يوم',  cost:350,   margin:25, lead:1, supplier:''},
  {cat:'events',  name:'مضيف/مضيفة فعالية (يوم)',        unit:'يوم',  cost:450,   margin:25, lead:3, supplier:''},
  {cat:'events',  name:'شاشة LED للعرض (يوم)',           unit:'يوم',  cost:1800,  margin:22, lead:5, supplier:''},
  // الإنتاج المرئي
  {cat:'media',   name:'تصوير فوتوغرافي (نصف يوم)',      unit:'جلسة', cost:1500,  margin:28, lead:3, supplier:''},
  {cat:'media',   name:'فيديو ترويجي 60 ثانية (تصوير ومونتاج)',unit:'فيديو',cost:9000,margin:25,lead:14,supplier:''},
  {cat:'media',   name:'موشن جرافيك 30 ثانية',           unit:'فيديو',cost:3500,  margin:28, lead:10,supplier:''},
  {cat:'media',   name:'تعليق صوتي احترافي',             unit:'مقطع', cost:600,   margin:35, lead:3, supplier:''},
  {cat:'media',   name:'تصوير جوي بدرون (نصف يوم)',      unit:'جلسة', cost:2200,  margin:25, lead:5, supplier:''},
  // التصميم
  {cat:'design',  name:'تصميم هوية بصرية متكاملة',       unit:'مشروع',cost:6500,  margin:30, lead:14,supplier:''},
  {cat:'design',  name:'تصميم منشور سوشيال ميديا',       unit:'تصميم',cost:120,   margin:40, lead:2, supplier:''},
  {cat:'design',  name:'تصميم مطبوعة (بروشور/فلاير)',    unit:'تصميم',cost:450,   margin:35, lead:3, supplier:''},
  // الرقمي
  {cat:'digital', name:'إدارة حسابات سوشيال (شهر)',      unit:'شهر',  cost:3500,  margin:30, lead:2, supplier:''},
  {cat:'digital', name:'إدارة حملة إعلانية ممولة (شهر)', unit:'شهر',  cost:2000,  margin:30, lead:2, supplier:''},
  {cat:'digital', name:'صفحة هبوط Landing Page',         unit:'صفحة', cost:2800,  margin:30, lead:10,supplier:''}
];

const REQ_STATUS = {
  new:     {label:'جديد',          cls:'b-new'},
  pricing: {label:'قيد التسعير',   cls:'b-work'},
  quoted:  {label:'أُرسل العرض',   cls:'b-sent'},
  won:     {label:'مقبول',         cls:'b-won'},
  lost:    {label:'مرفوض',         cls:'b-lost'},
  closed:  {label:'مغلق',          cls:'b-mute'}
};

const QUOTE_STATUS = {
  draft:  {label:'مسودة',   cls:'b-mute'},
  sent:   {label:'مُرسل',   cls:'b-sent'},
  won:    {label:'معتمد',   cls:'b-won'},
  lost:   {label:'خسارة',   cls:'b-lost'}
};

const PO_STATUS = {
  todo:    {label:'لم يُطلب',   cls:'b-mute'},
  ordered: {label:'تم الطلب',   cls:'b-work'},
  received:{label:'تم الاستلام',cls:'b-won'}
};

const UNITS = ['حبة','نسخة','م²','متر','علبة','يوم','شهر','مشروع','جلسة','فيديو','تصميم','صفحة','جناح','حرف','مقطع','خدمة'];
