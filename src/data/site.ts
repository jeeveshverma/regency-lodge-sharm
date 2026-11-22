/** Facts about the lodge. Owner-supplied unless marked; see README for what is still to confirm. */
export const SITE = {
  name: { ar: 'ريجينسي لودج', en: 'Regency Lodge' },
  phone: '+201036654930',
  phoneDisplay: '0103 665 4930',
  whatsapp: '201122776555',
  whatsappDisplay: '+20 112 277 6555',
  email: 'Regencylodge@royalhils.com',
  street: { ar: 'شارع مجلس المدينة، الهضبة', en: 'Magles El-Madina St, El Hadaba' },
  city: { ar: 'شرم الشيخ، جنوب سيناء', en: 'Sharm El Sheikh, South Sinai' },
  geo: { lat: 27.865, lng: 34.295 }, // El Hadaba, approximate: used only for the sunset time
  rooms: 20,
  checkIn: '14:00', // to confirm with the owner
  checkOut: '12:00', // to confirm with the owner
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

/** Average Red Sea surface temperature at Sharm by month, °C (Jan..Dec). */
export const SEA_TEMP = [22, 21, 22, 23, 25, 27, 28, 29, 28, 27, 25, 23];
