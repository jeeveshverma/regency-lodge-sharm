import ar from './ar.json';
import en from './en.json';

export type Lang = 'ar' | 'en';

/** Arabic is the site's first language and lives at the root; English lives under /en/. */
export const LANGS: { code: Lang; name: string; dir: 'ltr' | 'rtl'; ogLocale: string }[] = [
  { code: 'ar', name: 'العربية', dir: 'rtl', ogLocale: 'ar_EG' },
  { code: 'en', name: 'English', dir: 'ltr', ogLocale: 'en_GB' },
];
export const dirOf = (lang: Lang) => LANGS.find((l) => l.code === lang)!.dir;

export type PageKey = 'home' | 'book' | 'mine';
const SLUG: Record<PageKey, string> = { home: '', book: 'book/', mine: 'booking/' };
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '') + '/';

export const path = (lang: Lang, page: PageKey = 'home') => `${BASE}${lang === 'en' ? 'en/' : ''}${SLUG[page]}`;
export const switchLang = (lang: Lang, page: PageKey = 'home') => path(lang === 'ar' ? 'en' : 'ar', page);

type Dict = Record<string, unknown>;
const DICTS: Record<Lang, Dict> = { ar: ar as Dict, en: en as Dict };
const lookup = (d: Dict, key: string) => {
  const v = key.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Dict)[k] : undefined), d);
  return typeof v === 'string' ? v : undefined;
};

/** `t('key.path', { n: 3 })` with {placeholders}. A key missing from a language fails the build. */
export function useT(lang: Lang) {
  const t = (key: string, vars: Record<string, string | number> = {}): string => {
    const raw = lookup(DICTS[lang], key);
    if (raw === undefined) throw new Error(`Missing text "${key}" for ${lang}`);
    return raw.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
  };
  /** A whole dictionary branch, for the page script. */
  const branch = (key: string) => key.split('.').reduce<unknown>((o, k) => (o as Dict)?.[k], DICTS[lang]) as Record<string, string>;
  return { t, branch };
}
