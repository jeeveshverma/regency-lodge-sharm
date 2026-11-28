/** Facts about the hotel (Regency Royal Sharm; first briefed as Regency Lodge). Owner-supplied unless marked; see README for what is still to confirm. */
export const SITE = {
  name: { ar: 'ريجينسي رويال شرم', en: 'Regency Royal Sharm' },
  phone: '+201036654930',
  phoneDisplay: '0103 665 4930',
  whatsapp: '201122776555',
  whatsappDisplay: '+20 112 277 6555',
  email: 'Regencylodge@royalhils.com',
  street: { ar: 'شارع مجلس المدينة، الهضبة', en: 'Magles El-Madina St, El Hadaba' },
  city: { ar: 'شرم الشيخ، جنوب سيناء', en: 'Sharm El Sheikh, South Sinai' },
  geo: { lat: 27.865, lng: 34.295 }, // El Hadaba, approximate: used only for the sunset time
  keys: 20, // keys drawn on the hero's key board; decoration, not a room count
  checkIn: '14:00', // as on the lodge's Booking.com listing
  checkOut: '12:00', // as on the lodge's Booking.com listing
};

export type PlanId = 'ro' | 'bb' | 'hb';
/** EGP per room per night. */
export const PLANS: { id: PlanId; price: number }[] = [
  { id: 'ro', price: 1500 },
  { id: 'bb', price: 1600 },
  { id: 'hb', price: 1800 },
];
/** The lowest nightly price: the one the headline and the page description quote. */
export const FROM_PRICE = Math.min(...PLANS.map((p) => p.price));
/** Last night the published prices cover. */
export const RATES_UNTIL = '2026-12-21';

/** Walking minutes from the door (Tripadvisor's figures for the listing). */
export const WALKS: { min: number; ar: string; en: string; kindAr: string; kindEn: string }[] = [
  { min: 7, ar: 'شرم سكوبا سيرفس', en: 'Sharm Scuba Service', kindAr: 'مركز غوص', kindEn: 'dive centre' },
  { min: 11, ar: 'تيخانوس جريل هاوس', en: "Tejano's Grill House", kindAr: 'مشويات', kindEn: 'grill' },
  { min: 13, ar: 'فيردي بازيليكو', en: 'Verde Basilico', kindAr: 'مطعم إيطالي', kindEn: 'Italian' },
  { min: 14, ar: 'مانجو ماركت', en: 'Mango Market', kindAr: 'سوق', kindEn: 'market' },
];

/** Nearest beach, walking time from the lodge's Booking.com listing. */
export const BEACH = { min: 14, ar: 'شاطئ خليج شرم المايه', en: 'Sharm El Maya Bay beach' };

/** Real guest reviews, quoted from the lodge's Google listing ("Regency Hotel Sharm"). Arabic is a translation. */
export const REVIEWS: { name: string; ctxEn: string; ctxAr: string; en: string; ar: string }[] = [
  {
    name: 'Rambo',
    ctxEn: 'Fifth stay, October 2026',
    ctxAr: 'الإقامة الخامسة، أكتوبر 2026',
    en: 'The rooms are very spacious, and the air conditioning is excellent. The swimming pool is clean and well maintained. This was already my fifth visit — a fact that speaks for itself!',
    ar: 'الغرف واسعة جدًا والتكييف ممتاز. المسبح نظيف ومُعتنى به. هذه كانت زيارتي الخامسة، وهذا يكفي دليلًا!',
  },
  {
    name: 'Saltanat A.',
    ctxEn: 'Family holiday',
    ctxAr: 'إجازة عائلية',
    en: 'My children were very happy here. The staff always smiled, were positive and friendly. The location is very convenient — close to the famous Sharm Old Market.',
    ar: 'أطفالي كانوا سعداء جدًا هنا. العاملون مبتسمون دائمًا وودودون. الموقع مناسب جدًا، قريب من السوق القديم المشهور في شرم.',
  },
  {
    name: 'Shams F.',
    ctxEn: 'Guest',
    ctxAr: 'ضيف',
    en: 'This hotel provided excellent value for money. Everything we received was worth more than we paid.',
    ar: 'الفندق قيمة ممتازة مقابل السعر. كل ما حصلنا عليه كان يساوي أكثر مما دفعنا.',
  },
  {
    name: 'Ibrahim S.',
    ctxEn: 'Couple',
    ctxAr: 'زوجان',
    en: 'Really good service and the chefs are amazing.',
    ar: 'خدمة جيدة فعلًا والطهاة رائعون.',
  },
];

/** Average Red Sea surface temperature at Sharm by month, °C (Jan..Dec). */
export const SEA_TEMP = [22, 21, 22, 23, 25, 27, 28, 29, 28, 27, 25, 23];
