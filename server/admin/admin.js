/* Regency Royal Sharm dashboard: reservation requests, rooms and prices, photos, site texts, settings. Plain JavaScript, no build step. */
(() => {
  'use strict';
  const API = '../api/';

  const T = {
    ar: {
      title: 'لوحة التحكم', signIn: 'تسجيل الدخول', email: 'البريد الإلكتروني', password: 'كلمة المرور', signOut: 'خروج', lang: 'English',
      firstTime: 'أول مرة؟ أنشئ المستخدم الأول', installKey: 'مفتاح التثبيت (من ملف config.php)', yourName: 'اسمك', create: 'إنشاء المستخدم', backToLogin: 'رجوع لتسجيل الدخول',
      passRule: 'كلمة المرور 10 أحرف على الأقل.',
      tabRequests: 'الطلبات', tabRooms: 'الغرف والأسعار', tabPhotos: 'الصور', tabTexts: 'نصوص الموقع', tabSettings: 'الإعدادات',
      all: 'الكل', pending: 'في الانتظار', confirmed: 'مؤكد', declined: 'مرفوض', cancelled: 'ملغى', paid: 'مدفوع', unpaid: 'لم يُدفع بعد',
      noRequests: 'لا توجد طلبات هنا.', refresh: 'تحديث',
      guest: 'النزيل', phone: 'الهاتف', room: 'الغرفة', checkIn: 'الوصول', checkOut: 'المغادرة', stay: 'الإقامة', nights: 'ليالٍ', rooms: 'غرف',
      plan: 'الوجبات', party: 'الأشخاص', adults: 'بالغون', children: 'أطفال', bed: 'السرير', arrival: 'وقت الوصول', pay: 'الدفع', total: 'الإجمالي', egp: 'جنيه',
      guestNote: 'ملاحظات النزيل', hotelNote: 'رسالتك إلى النزيل', noteToGuest: 'رسالة إلى النزيل (اختياري)، تُرسل معه بالبريد',
      ro: 'بدون وجبات', bb: 'مع الإفطار', hb: 'إفطار وعشاء', double: 'سرير مزدوج', twin: 'سريران',
      arr1: 'قبل 2 ظهرًا', arr2: '2 ظهرًا - 6 مساءً', arr3: '6 - 10 مساءً', arr4: 'بعد 10 مساءً', payArrival: 'عند الوصول', payOnline: 'أونلاين (Paymob)',
      doConfirmed: 'تأكيد الحجز', doDeclined: 'اعتذار', doCancelled: 'إلغاء الحجز', doPending: 'إعادة إلى الانتظار',
      waGuest: 'راسل النزيل على واتساب', call: 'اتصال', copyPay: 'انسخ رابط الدفع', copied: 'تم النسخ', saved: 'تم الحفظ', done: 'تم',
      waConfirmed: 'مرحبًا {name}، حجزك {ref} في {hotel} مؤكد: من {in} إلى {out}. الإجمالي {total} جنيه.',
      waPayLink: 'للدفع أونلاين: {url}', waPayArrival: 'الدفع عند الوصول في الاستقبال.',
      waDeclined: 'مرحبًا {name}، نعتذر: لم نتمكن من قبول طلبك {ref} للتواريخ {in} - {out}.', waPending: 'مرحبًا {name}، بخصوص طلب الحجز {ref} في {hotel}:',
      addRoom: 'أضف غرفة', newRoom: 'غرفة جديدة', nameAr: 'الاسم بالعربية', nameEn: 'الاسم بالإنجليزية', descAr: 'الوصف بالعربية', descEn: 'الوصف بالإنجليزية',
      facAr: 'المرافق بالعربية (سطر لكل بند، مثل «الإطلالة: المسبح»)', facEn: 'المرافق بالإنجليزية (سطر لكل بند، مثل «View: The pool»)',
      maxAdults: 'أقصى عدد بالغين', maxChildren: 'أقصى عدد أطفال', priceRo: 'السعر بدون وجبات', priceBb: 'السعر مع الإفطار', priceHb: 'السعر إفطار وعشاء',
      perNight: 'السعر للغرفة في الليلة بالجنيه', sort: 'الترتيب', active: 'ظاهرة في الموقع', save: 'حفظ', del: 'حذف', sure: 'اضغط مرة أخرى للتأكيد',
      roomPhotos: 'صور هذه الغرفة', saveFirst: 'احفظ الغرفة أولًا ثم أضف صورها.', upload: 'ارفع صورًا', uploading: 'جارٍ الرفع…',
      gallery: 'صور قسم «تفرّج على المكان»', capAr: 'التعليق بالعربية', capEn: 'التعليق بالإنجليزية', wide: 'صورة عريضة', up: 'قدّم', down: 'أخّر',
      textsLead: 'اترك الخانة فارغة لاستخدام نص الموقع الأصلي (الظاهر بالرمادي). {price} يُستبدل بأقل سعر.', saveTexts: 'احفظ النصوص',
      hotelName: 'اسم الفندق', logo: 'الشعار', logoHint: 'PNG بخلفية شفافة أفضل. يظهر أعلى الموقع مكان الاسم.', removeLogo: 'احذف الشعار', noLogo: 'لا يوجد شعار. الموقع يعرض الاسم مكتوبًا.',
      contact: 'بيانات التواصل', sitePhone: 'الهاتف الظاهر في الموقع', siteWa: 'رقم واتساب (بكود الدولة)', siteEmail: 'البريد الظاهر في الموقع',
      bookingEmail: 'بريد فريق الحجز (تصله الطلبات الجديدة)', addressAr: 'العنوان بالعربية', addressEn: 'العنوان بالإنجليزية',
      timeIn: 'الدخول من الساعة', timeOut: 'الخروج حتى الساعة', ratesUntil: 'آخر ليلة تسري عليها الأسعار (فارغ = بلا حد)', saveSettings: 'احفظ الإعدادات',
      emailTitle: 'البريد', mailFrom: 'الرسائل تُرسل من', testMail: 'أرسل رسالة تجريبية إلى بريد فريق الحجز', mailSent: 'أُرسلت إلى {to}', mailFailed: 'فشل الإرسال: {error}',
      mailLog: 'آخر الرسائل', to: 'إلى', subject: 'الموضوع', result: 'النتيجة', sentOk: 'أُرسلت', when: 'الوقت',
      payTitle: 'الدفع أونلاين', payOn: 'يعمل', payOff: 'متوقف: أدخل مفاتيح Paymob في ملف config.php', payFake: 'وضع الاختبار: صفحة دفع تجريبية، لا تُخصم أموال',
      changePass: 'تغيير كلمة المرور', curPass: 'كلمة المرور الحالية', newPass: 'كلمة المرور الجديدة', viewSite: 'افتح الموقع',
      errors: { bad_login: 'البريد أو كلمة المرور غير صحيحة.', signed_out: 'انتهت الجلسة. سجّل الدخول من جديد.', too_many: 'محاولات كثيرة. انتظر قليلًا.', bad_key: 'مفتاح التثبيت غير صحيح.',
        already_installed: 'يوجد مستخدم بالفعل. سجّل الدخول.', bad_field: 'قيمة غير صحيحة: {field}', not_an_image: 'الملف ليس صورة (JPG أو PNG أو WebP).', file_too_big: 'الصورة أكبر من 15 ميجابايت.',
        uploads_not_writable: 'مجلد الصور غير قابل للكتابة على الخادم.', no_booking_email: 'اكتب بريد فريق الحجز واحفظ أولًا.', bad_move: 'حالة الطلب تغيّرت. حدّث الصفحة.', not_configured: 'ملف config.php غير موجود على الخادم.' },
      unknown: 'حدث خطأ: {msg}',
    },
    en: {
      title: 'Dashboard', signIn: 'Sign in', email: 'Email', password: 'Password', signOut: 'Sign out', lang: 'العربية',
      firstTime: 'First time? Create the first user', installKey: 'Install key (from config.php)', yourName: 'Your name', create: 'Create user', backToLogin: 'Back to sign in',
      passRule: 'Password: at least 10 characters.',
      tabRequests: 'Requests', tabRooms: 'Rooms and prices', tabPhotos: 'Photos', tabTexts: 'Site texts', tabSettings: 'Settings',
      all: 'All', pending: 'Pending', confirmed: 'Confirmed', declined: 'Declined', cancelled: 'Cancelled', paid: 'Paid', unpaid: 'Not paid yet',
      noRequests: 'No requests here.', refresh: 'Refresh',
      guest: 'Guest', phone: 'Phone', room: 'Room', checkIn: 'Check-in', checkOut: 'Check-out', stay: 'Stay', nights: 'nights', rooms: 'rooms',
      plan: 'Meals', party: 'Guests', adults: 'adults', children: 'children', bed: 'Bed', arrival: 'Arrival', pay: 'Payment', total: 'Total', egp: 'EGP',
      guestNote: "Guest's notes", hotelNote: 'Your message to the guest', noteToGuest: 'Message to the guest (optional), emailed with the decision',
      ro: 'Room only', bb: 'With breakfast', hb: 'Breakfast and dinner', double: 'One double', twin: 'Two singles',
      arr1: 'Before 2 pm', arr2: '2 pm - 6 pm', arr3: '6 pm - 10 pm', arr4: 'After 10 pm', payArrival: 'On arrival', payOnline: 'Online (Paymob)',
      doConfirmed: 'Confirm', doDeclined: 'Decline', doCancelled: 'Cancel reservation', doPending: 'Move back to pending',
      waGuest: 'Message the guest on WhatsApp', call: 'Call', copyPay: 'Copy payment link', copied: 'Copied', saved: 'Saved', done: 'Done',
      waConfirmed: 'Hello {name}, your reservation {ref} at {hotel} is confirmed: {in} to {out}. Total EGP {total}.',
      waPayLink: 'To pay online: {url}', waPayArrival: 'You pay at reception on arrival.',
      waDeclined: 'Hello {name}, we are sorry: we could not accept your request {ref} for {in} - {out}.', waPending: 'Hello {name}, about your reservation request {ref} at {hotel}:',
      addRoom: 'Add a room', newRoom: 'New room', nameAr: 'Name in Arabic', nameEn: 'Name in English', descAr: 'Description in Arabic', descEn: 'Description in English',
      facAr: 'Facilities in Arabic (one per line, like "الإطلالة: المسبح")', facEn: 'Facilities in English (one per line, like "View: The pool")',
      maxAdults: 'Most adults', maxChildren: 'Most children', priceRo: 'Price, room only', priceBb: 'Price, with breakfast', priceHb: 'Price, breakfast and dinner',
      perNight: 'Prices are per room per night, in EGP', sort: 'Order', active: 'Shown on the site', save: 'Save', del: 'Delete', sure: 'Press again to confirm',
      roomPhotos: 'Photos of this room', saveFirst: 'Save the room first, then add its photos.', upload: 'Upload photos', uploading: 'Uploading…',
      gallery: 'Photos for "Have a look around"', capAr: 'Caption in Arabic', capEn: 'Caption in English', wide: 'Wide photo', up: 'Earlier', down: 'Later',
      textsLead: "Leave a box empty to use the site's own wording (shown in grey). {price} is replaced by the lowest price.", saveTexts: 'Save texts',
      hotelName: 'Hotel name', logo: 'Logo', logoHint: 'A PNG with a transparent background works best. It replaces the written name at the top of the site.', removeLogo: 'Remove logo', noLogo: 'No logo. The site shows the name in writing.',
      contact: 'Contact details', sitePhone: 'Phone shown on the site', siteWa: 'WhatsApp number (with country code)', siteEmail: 'Email shown on the site',
      bookingEmail: 'Booking team email (new requests arrive here)', addressAr: 'Address in Arabic', addressEn: 'Address in English',
      timeIn: 'Check-in from', timeOut: 'Check-out by', ratesUntil: 'Last night the prices cover (empty = no limit)', saveSettings: 'Save settings',
      emailTitle: 'Email', mailFrom: 'Emails are sent from', testMail: 'Send a test email to the booking team address', mailSent: 'Sent to {to}', mailFailed: 'Sending failed: {error}',
      mailLog: 'Latest emails', to: 'To', subject: 'Subject', result: 'Result', sentOk: 'Sent', when: 'Time',
      payTitle: 'Online payment', payOn: 'Working', payOff: 'Off: put the Paymob keys in config.php', payFake: 'Test mode: a stand-in payment page, no money moves',
      changePass: 'Change password', curPass: 'Current password', newPass: 'New password', viewSite: 'Open the site',
      errors: { bad_login: 'Wrong email or password.', signed_out: 'You were signed out. Sign in again.', too_many: 'Too many tries. Wait a little.', bad_key: 'The install key is not right.',
        already_installed: 'A user already exists. Sign in.', bad_field: 'Not valid: {field}', not_an_image: 'That file is not a picture (JPG, PNG or WebP).', file_too_big: 'The picture is larger than 15 MB.',
        uploads_not_writable: 'The server cannot write to the uploads folder.', no_booking_email: 'Enter the booking team email and save first.', bad_move: 'This request has changed. Refresh the page.', not_configured: 'config.php is missing on the server.' },
      unknown: 'Something went wrong: {msg}',
    },
  };

  let lang = localStorage.getItem('rr-admin-lang') === 'en' ? 'en' : 'ar';
  let L = T[lang];
  let tab = 'requests';
  let filter = 'pending';
  let me = null;

  const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => (k in v ? v[k] : `{${k}}`));
  const money = (n) => Number(n).toLocaleString('en-US');
  const app = document.getElementById('app');

  /** h('div', { class: 'x', onclick: fn }, child, 'text') */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === false || v == null) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid);
    return el;
  }

  /** Replace an element's content; arrays and missing pieces are fine. */
  const mount = (el, ...kids) => el.replaceChildren(...kids.flat(Infinity).filter((k) => k != null && k !== false));

  let toastTimer;
  function toast(msg, bad = false) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.toggle('bad', bad);
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, bad ? 9000 : 3000);
  }

  class ApiError extends Error {
    constructor(code, data) { super(code); this.code = code; this.data = data || {}; }
  }
  async function api(path, body, isForm = false) {
    const opt = { credentials: 'same-origin', headers: {} };
    if (body !== undefined) {
      opt.method = 'POST';
      opt.headers['X-RR'] = '1';
      if (isForm) opt.body = body;
      else { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    }
    const res = await fetch(API + path, opt);
    let data = null;
    try { data = await res.json(); } catch { /* not JSON: reported below by status */ }
    if (!res.ok) throw new ApiError((data && data.error) || `HTTP ${res.status}`, data);
    return data;
  }
  /** Every failed action is shown to the person using the dashboard. */
  function report(e) {
    if (e instanceof ApiError && e.code === 'signed_out') { me = null; render(); }
    const known = e instanceof ApiError && L.errors[e.code];
    toast(known ? fill(known, e.data) : fill(L.unknown, { msg: (e.data && e.data.detail) || e.message }), true);
    if (!(e instanceof ApiError)) throw e;
  }
  /** Run an action from a button: the button waits, errors are shown. */
  const act = (fn) => async (ev) => {
    const btn = ev.currentTarget;
    btn.disabled = true;
    try { await fn(ev); } catch (e) { report(e); } finally { btn.disabled = false; }
  };
  /** A delete button that needs two presses. */
  function sureButton(label, fn, cls = 'btn danger small') {
    const b = h('button', { class: cls, type: 'button' }, label);
    let armed = false;
    b.addEventListener('click', async (ev) => {
      if (!armed) { armed = true; b.textContent = L.sure; setTimeout(() => { armed = false; b.textContent = label; }, 5000); return; }
      await act(fn)(ev);
    });
    return b;
  }
  const field = (label, input, cls) => h('label', { class: cls }, label, input);
  const input = (name, value, extra = {}) => h('input', { name, value: value ?? '', ...extra });
  const area = (name, value, rows = 3, extra = {}) => h('textarea', { name, rows, ...extra }, value ?? '');
  const formData = (form) => Object.fromEntries([...form.elements].filter((e) => e.name).map((e) => [e.name, e.type === 'checkbox' ? e.checked : e.value]));

  // ---------- signed out ----------

  function loginView(install = false) {
    const form = h('form', { class: 'card grid' },
      h('h2', {}, install ? L.firstTime : L.signIn),
      install && field(L.installKey, input('key', '', { required: true, autocomplete: 'off', dir: 'ltr' })),
      install && field(L.yourName, input('name', '', { required: true })),
      field(L.email, input('email', '', { type: 'email', required: true, autocomplete: 'username', dir: 'ltr' })),
      field(L.password, input('password', '', { type: 'password', required: true, autocomplete: install ? 'new-password' : 'current-password', dir: 'ltr', minlength: install ? 10 : null })),
      install && h('p', { class: 'muted' }, L.passRule),
      h('button', { class: 'btn', type: 'submit' }, install ? L.create : L.signIn),
      h('button', { class: 'btn ghost', type: 'button', onclick: () => { app.replaceChildren(loginView(!install)); } }, install ? L.backToLogin : L.firstTime),
      h('button', { class: 'btn ghost', type: 'button', onclick: switchLang }, L.lang));
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const d = formData(form);
      try {
        if (install) await api('install', d);
        me = await api('admin/login', { email: d.email, password: d.password });
        render();
      } catch (e) { report(e); }
    });
    return h('div', { class: 'login' }, h('h1', { style: 'margin-bottom:16px' }, 'Regency Royal Sharm'), form);
  }

  function switchLang() {
    lang = lang === 'ar' ? 'en' : 'ar';
    L = T[lang];
    localStorage.setItem('rr-admin-lang', lang);
    render();
  }

  // ---------- requests ----------

  const fmtWhen = (iso) => new Date(iso).toLocaleString(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Cairo' });
  const waNumber = (phone) => { const d = phone.replace(/\D/g, '').replace(/^00/, ''); return d.startsWith('0') ? '20' + d.slice(1) : d; };

  function waText(r, hotel) {
    const G = T[r.lang === 'en' ? 'en' : 'ar']; // the guest's language, not the dashboard's
    const v = { name: r.name, ref: r.ref, hotel, in: r.in, out: r.out, total: money(r.total) };
    if (r.status === 'confirmed') return [fill(G.waConfirmed, v), r.paid ? '' : r.pay === 'online' && r.payLink ? fill(G.waPayLink, { url: r.payLink }) : G.waPayArrival, r.hotelNote].filter(Boolean).join('\n');
    if (r.status === 'declined') return [fill(G.waDeclined, v), r.hotelNote].filter(Boolean).join('\n');
    return fill(G.waPending, v);
  }

  function requestCard(r, hotel, reload) {
    const fact = (k, v) => h('div', {}, h('dt', {}, k), h('dd', v.dir ? { dir: v.dir } : {}, v.text ?? v));
    const note = area('note', r.hotelNote, 2, { placeholder: L.noteToGuest, 'aria-label': L.noteToGuest });
    const move = (to) => h('button', { class: `btn ${to === 'confirmed' ? 'ok' : to === 'pending' ? 'ghost' : 'danger'}`, type: 'button', 'data-move': to,
      onclick: act(async () => { await api(`admin/requests/${r.id}/status`, { status: to, note: note.value }); toast(L.done); await reload(); }) }, L['do' + to[0].toUpperCase() + to.slice(1)]);
    return h('article', { class: 'card', 'data-ref': r.ref },
      h('div', { class: 'req-head' },
        h('b', { dir: 'ltr' }, r.ref), h('span', { class: `badge ${r.status}` }, L[r.status]),
        r.pay === 'online' && r.status === 'confirmed' && h('span', { class: `badge ${r.paid ? 'paid' : 'pending'}` }, r.paid ? L.paid : L.unpaid),
        h('time', {}, fmtWhen(r.created))),
      h('dl', { class: 'facts' },
        fact(L.guest, r.name), fact(L.phone, { text: r.phone, dir: 'ltr' }), r.email && fact(L.email, { text: r.email, dir: 'ltr' }),
        fact(L.room, r.roomName[lang]), fact(L.checkIn, { text: r.in, dir: 'ltr' }), fact(L.checkOut, { text: r.out, dir: 'ltr' }),
        fact(L.stay, `${r.nights} ${L.nights} × ${r.rooms} ${L.rooms}`), fact(L.plan, L[r.plan]),
        fact(L.party, `${r.adults} ${L.adults} · ${r.children} ${L.children}`), fact(L.bed, L[r.bed]), fact(L.arrival, L[r.arrival]),
        fact(L.pay, r.pay === 'online' ? L.payOnline : L.payArrival), fact(L.total, `${money(r.total)} ${L.egp}`)),
      r.note && h('p', { class: 'note' }, h('b', {}, `${L.guestNote}: `), r.note),
      r.moves.length > 0 && note,
      h('div', { class: 'row', style: 'margin-top:10px' },
        r.moves.map(move),
        h('a', { class: 'btn ghost', target: '_blank', rel: 'noopener', 'data-wa': '1', href: `https://wa.me/${waNumber(r.phone)}?text=${encodeURIComponent(waText(r, hotel))}` }, L.waGuest),
        h('a', { class: 'btn ghost', href: `tel:${r.phone.replace(/[^\d+]/g, '')}` }, L.call),
        r.payLink && r.status === 'confirmed' && !r.paid && h('button', { class: 'btn ghost', type: 'button', onclick: act(async () => { await navigator.clipboard.writeText(r.payLink); toast(L.copied); }) }, L.copyPay)));
  }

  async function requestsView(root) {
    const [data, settings] = await Promise.all([api('admin/requests' + (filter === 'all' ? '' : `?status=${filter}`)), api('admin/settings')]);
    const reload = () => requestsView(root);
    const total = Object.values(data.counts).reduce((a, b) => a + b, 0);
    mount(root, 
      h('div', { class: 'chips' },
        ['pending', 'confirmed', 'declined', 'cancelled', 'all'].map((s) => h('button', { type: 'button', 'aria-pressed': String(filter === s), onclick: () => { filter = s; reload().catch(report); } }, `${L[s]} (${s === 'all' ? total : data.counts[s]})`)),
        h('button', { type: 'button', onclick: () => reload().catch(report) }, L.refresh)),
      data.requests.length ? data.requests.map((r) => requestCard(r, settings.name[r.lang === 'en' ? 'en' : 'ar'], reload)) : h('p', { class: 'muted' }, L.noRequests));
  }

  // ---------- photos (shared by rooms and the gallery) ----------

  function photoGrid(photos, reload, withWide) {
    const ids = photos.map((p) => p.id);
    const shift = (i, by) => act(async () => { const a = [...ids]; [a[i], a[i + by]] = [a[i + by], a[i]]; await api('admin/photos/order', { ids: a }); await reload(); });
    return h('div', { class: 'thumbs' }, photos.map((p, i) => {
      const ar = input('cap_ar', p.cap.ar, { placeholder: L.capAr, 'aria-label': L.capAr, dir: 'rtl' });
      const en = input('cap_en', p.cap.en, { placeholder: L.capEn, 'aria-label': L.capEn, dir: 'ltr' });
      const wide = h('input', { type: 'checkbox', checked: p.wide });
      return h('div', { class: 'thumb', 'data-photo': p.id },
        h('img', { src: p.small, alt: p.cap[lang], loading: 'lazy' }), ar, en,
        withWide && h('label', { class: 'check' }, wide, L.wide),
        h('div', { class: 'row' },
          h('button', { class: 'btn small', type: 'button', onclick: act(async () => { await api(`admin/photos/${p.id}`, { cap_ar: ar.value, cap_en: en.value, wide: wide.checked }); toast(L.saved); }) }, L.save),
          i > 0 && h('button', { class: 'btn ghost small', type: 'button', onclick: shift(i, -1) }, L.up),
          i < ids.length - 1 && h('button', { class: 'btn ghost small', type: 'button', onclick: shift(i, 1) }, L.down),
          sureButton(L.del, async () => { await api(`admin/photos/${p.id}/delete`, {}); await reload(); })));
    }));
  }

  function uploader(roomId, reload) {
    const status = h('span', { class: 'muted' });
    const file = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', multiple: true, 'aria-label': L.upload });
    file.addEventListener('change', async () => {
      const files = [...file.files];
      try {
        for (const [i, f] of files.entries()) {
          status.textContent = `${L.uploading} ${i + 1}/${files.length}`;
          const fd = new FormData();
          fd.append('file', f);
          if (roomId) fd.append('room', String(roomId));
          await api('admin/photos/upload', fd, true);
        }
        await reload();
      } catch (e) { status.textContent = ''; file.value = ''; report(e); await reload(); }
    });
    return h('label', { style: 'margin-top:12px' }, L.upload, file, status);
  }

  // ---------- rooms ----------

  function roomCard(r, reload) {
    const isNew = !r.id;
    const form = h('form', { class: 'grid' },
      h('div', { class: 'grid c2' }, field(L.nameAr, input('name_ar', r.name.ar, { required: true, dir: 'rtl' })), field(L.nameEn, input('name_en', r.name.en, { required: true, dir: 'ltr' }))),
      h('div', { class: 'grid c2' }, field(L.descAr, area('desc_ar', r.desc.ar, 3, { dir: 'rtl' })), field(L.descEn, area('desc_en', r.desc.en, 3, { dir: 'ltr' }))),
      h('div', { class: 'grid c2' }, field(L.facAr, area('facilities_ar', r.facilities.ar.join('\n'), 6, { dir: 'rtl' })), field(L.facEn, area('facilities_en', r.facilities.en.join('\n'), 6, { dir: 'ltr' }))),
      h('p', { class: 'muted' }, L.perNight),
      h('div', { class: 'grid c3' },
        field(L.priceRo, input('price_ro', r.prices.ro, { type: 'number', min: 1, required: true, inputmode: 'numeric' })),
        field(L.priceBb, input('price_bb', r.prices.bb, { type: 'number', min: 1, required: true, inputmode: 'numeric' })),
        field(L.priceHb, input('price_hb', r.prices.hb, { type: 'number', min: 1, required: true, inputmode: 'numeric' }))),
      h('div', { class: 'grid c3' },
        field(L.maxAdults, input('adults', r.adults, { type: 'number', min: 1, max: 10, required: true })),
        field(L.maxChildren, input('children', r.children, { type: 'number', min: 0, max: 10, required: true })),
        field(L.sort, input('sort', r.sort ?? 0, { type: 'number' }))),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', name: 'active', checked: r.active }), L.active),
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'submit' }, L.save),
        !isNew && sureButton(L.del, async () => { await api(`admin/rooms/${r.id}/delete`, {}); await reload(); }, 'btn danger')));
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      try { await api('admin/rooms', { ...formData(form), id: r.id || 0 }); toast(L.saved); await reload(); } catch (e) { report(e); }
    });
    return h('section', { class: 'card', 'data-room': r.id || 'new' },
      h('h2', {}, isNew ? L.newRoom : r.name[lang]), form,
      h('h3', { style: 'margin-top:22px' }, L.roomPhotos),
      isNew ? h('p', { class: 'muted' }, L.saveFirst) : [photoGrid(r.photos, reload, false), uploader(r.id, reload)]);
  }

  async function roomsView(root, adding = false) {
    const { rooms } = await api('admin/rooms');
    const reload = () => roomsView(root);
    const blank = { id: 0, name: { ar: '', en: '' }, desc: { ar: '', en: '' }, facilities: { ar: [], en: [] }, adults: 2, children: 2, prices: { ro: '', bb: '', hb: '' }, active: true, sort: rooms.length, photos: [] };
    mount(root, 
      rooms.map((r, i) => roomCard({ ...r, sort: i }, reload)),
      adding ? roomCard(blank, reload) : h('button', { class: 'btn', type: 'button', id: 'add-room', onclick: () => roomsView(root, true).catch(report) }, L.addRoom));
  }

  // ---------- gallery ----------

  async function photosView(root) {
    const { photos } = await api('admin/photos');
    const reload = () => photosView(root);
    mount(root, h('section', { class: 'card' }, h('h2', {}, L.gallery), uploader(null, reload), photoGrid(photos.filter((p) => p.room === null), reload, true)));
  }

  // ---------- site texts ----------

  async function textsView(root) {
    const s = await api('admin/settings');
    const form = h('form', {},
      h('p', { class: 'muted' }, L.textsLead),
      Object.entries(s.textDefaults).map(([key, def]) => h('div', { class: 'text-row' },
        h('code', { dir: 'ltr' }, key),
        h('div', { class: 'grid c2' },
          area(`${key}|ar`, s.texts[key]?.ar, 2, { placeholder: def.ar, dir: 'rtl', 'aria-label': `${key} (العربية)` }),
          area(`${key}|en`, s.texts[key]?.en, 2, { placeholder: def.en, dir: 'ltr', 'aria-label': `${key} (English)` })))),
      h('button', { class: 'btn', type: 'submit', style: 'margin-top:16px' }, L.saveTexts));
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const texts = {};
      for (const [name, value] of Object.entries(formData(form))) { const [key, l] = name.split('|'); (texts[key] ||= {})[l] = value; }
      try { await api('admin/settings', { texts }); toast(L.saved); } catch (e) { report(e); }
    });
    mount(root, h('section', { class: 'card' }, h('h2', {}, L.tabTexts), form));
  }

  // ---------- settings ----------

  async function settingsView(root) {
    const s = await api('admin/settings');
    const reload = () => settingsView(root);
    const c = s.contact;
    const form = h('form', { class: 'grid' },
      h('h2', {}, L.hotelName),
      h('div', { class: 'grid c2' }, field(L.nameAr, input('name_ar', s.name.ar, { required: true, dir: 'rtl' })), field(L.nameEn, input('name_en', s.name.en, { required: true, dir: 'ltr' }))),
      h('h2', { style: 'margin-top:14px' }, L.contact),
      h('div', { class: 'grid c2' },
        field(L.sitePhone, input('phone', c.phone, { dir: 'ltr', inputmode: 'tel' })), field(L.siteWa, input('whatsapp', c.whatsapp, { dir: 'ltr', inputmode: 'tel' })),
        field(L.siteEmail, input('email', c.email, { type: 'email', dir: 'ltr' })), field(L.bookingEmail, input('bookingEmail', c.bookingEmail, { type: 'email', dir: 'ltr' })),
        field(L.addressAr, input('address_ar', s.address.ar, { dir: 'rtl' })), field(L.addressEn, input('address_en', s.address.en, { dir: 'ltr' }))),
      h('div', { class: 'grid c3' },
        field(L.timeIn, input('checkIn', s.checkIn, { type: 'time', required: true })), field(L.timeOut, input('checkOut', s.checkOut, { type: 'time', required: true })),
        field(L.ratesUntil, input('ratesUntil', s.ratesUntil, { type: 'date' }))),
      h('div', {}, h('button', { class: 'btn', type: 'submit' }, L.saveSettings)));
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const d = formData(form);
      try {
        await api('admin/settings', { name: { ar: d.name_ar, en: d.name_en }, address: { ar: d.address_ar, en: d.address_en },
          contact: { phone: d.phone, whatsapp: d.whatsapp, email: d.email, bookingEmail: d.bookingEmail }, checkIn: d.checkIn, checkOut: d.checkOut, ratesUntil: d.ratesUntil });
        toast(L.saved);
      } catch (e) { report(e); }
    });

    const logoFile = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp', 'aria-label': L.logo });
    logoFile.addEventListener('change', async () => {
      const fd = new FormData();
      fd.append('file', logoFile.files[0]);
      try { await api('admin/logo', fd, true); toast(L.saved); await reload(); } catch (e) { logoFile.value = ''; report(e); }
    });

    const pass = h('form', { class: 'grid c3' },
      field(L.curPass, input('current', '', { type: 'password', required: true, autocomplete: 'current-password', dir: 'ltr' })),
      field(L.newPass, input('next', '', { type: 'password', required: true, minlength: 10, autocomplete: 'new-password', dir: 'ltr' })),
      h('div', { style: 'align-self:end' }, h('button', { class: 'btn', type: 'submit' }, L.changePass)));
    pass.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      try { await api('admin/password', formData(pass)); pass.reset(); toast(L.saved); } catch (e) { report(e); }
    });

    mount(root, 
      h('section', { class: 'card' }, form),
      h('section', { class: 'card', id: 'logo-card' }, h('h2', {}, L.logo), h('p', { class: 'muted' }, L.logoHint),
        s.logo ? h('img', { class: 'logo-box', src: s.logo, alt: L.logo }) : h('p', { class: 'muted' }, L.noLogo),
        h('div', { class: 'row', style: 'margin-top:12px' }, h('label', {}, L.upload, logoFile), s.logo && sureButton(L.removeLogo, async () => { await api('admin/logo/delete', {}); await reload(); }, 'btn danger'))),
      h('section', { class: 'card' }, h('h2', {}, L.payTitle), h('p', { id: 'pay-state' }, s.paymobMode === 'fake' ? L.payFake : s.payOnline ? L.payOn : L.payOff)),
      h('section', { class: 'card' }, h('h2', {}, L.emailTitle),
        h('p', {}, `${L.mailFrom}: `, h('b', { dir: 'ltr' }, s.mailFrom || '–')),
        h('button', { class: 'btn ghost', type: 'button', onclick: act(async () => { const r = await api('admin/mail-test', {}); toast(r.ok ? fill(L.mailSent, r) : fill(L.mailFailed, r), !r.ok); await reload(); }) }, L.testMail),
        s.mailLog.length > 0 && [h('h3', { style: 'margin:18px 0 8px' }, L.mailLog), h('table', {},
          h('thead', {}, h('tr', {}, [L.when, L.to, L.subject, L.result].map((x) => h('th', {}, x)))),
          h('tbody', {}, s.mailLog.map((m) => h('tr', {}, h('td', {}, fmtWhen(m.at.replace(' ', 'T') + 'Z')), h('td', { dir: 'ltr' }, m.sent_to), h('td', {}, m.subject), h('td', {}, m.ok ? L.sentOk : m.error)))))]),
      h('section', { class: 'card' }, h('h2', {}, L.changePass), pass, h('p', { class: 'muted', style: 'margin-top:8px' }, L.passRule)));
  }

  // ---------- frame ----------

  const VIEWS = { requests: requestsView, rooms: roomsView, photos: photosView, texts: textsView, settings: settingsView };
  const TAB_LABEL = { requests: 'tabRequests', rooms: 'tabRooms', photos: 'tabPhotos', texts: 'tabTexts', settings: 'tabSettings' };

  function render() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = `Regency Royal Sharm · ${L.title}`;
    if (!me) { app.replaceChildren(loginView()); return; }
    const root = h('main', { class: 'main', id: 'view' });
    app.replaceChildren(
      h('header', { class: 'hdr' },
        h('div', { class: 'hdr-in' },
          h('h1', {}, `Regency Royal Sharm · ${L.title}`),
          h('a', { class: 'btn small', href: '../', target: '_blank', rel: 'noopener' }, L.viewSite),
          h('button', { class: 'btn small', type: 'button', onclick: switchLang }, L.lang),
          h('button', { class: 'btn small', type: 'button', id: 'sign-out', onclick: act(async () => { await api('admin/logout', {}); me = null; render(); }) }, L.signOut)),
        h('nav', { class: 'tabs', role: 'tablist' }, Object.keys(VIEWS).map((k) => h('button', { type: 'button', role: 'tab', 'data-tab': k, 'aria-selected': String(tab === k), onclick: () => { tab = k; render(); } }, L[TAB_LABEL[k]])))),
      root);
    VIEWS[tab](root).catch(report);
  }

  api('admin/me').then((u) => { me = u; }, (e) => { if (!(e instanceof ApiError) || e.code !== 'signed_out') report(e); }).finally(render);
})();
