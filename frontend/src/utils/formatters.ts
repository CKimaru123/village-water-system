import i18n from '../i18n';

export const getLocale = (locale?: string) => {
  const lng = (locale || i18n.language || 'en').slice(0,2);
  // Map to BCP-47 where needed
  if (lng === 'sw') return 'sw';
  if (lng === 'fr') return 'fr-FR';
  if (lng === 'ar') return 'ar';
  return 'en-US';
};

export const formatNumber = (value: number | string | null | undefined, locale?: string) => {
  const n = Number(value || 0);
  return new Intl.NumberFormat(getLocale(locale)).format(n);
};

export const formatCurrency = (value: number | string | null | undefined, currency = 'KES', locale?: string) => {
  const n = Number(value || 0);
  return new Intl.NumberFormat(getLocale(locale), { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);
};

export const formatDate = (value: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions, locale?: string) => {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(getLocale(locale), options || { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
};

export default { getLocale, formatNumber, formatCurrency, formatDate };
