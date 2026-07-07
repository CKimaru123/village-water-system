import i18n from '../i18n';
import { apiFetch, authHeaders } from './api';

export async function setAppLanguage(lang: string, options: { persistBackend?: boolean } = {}) {
  if (!lang) return;
  const normalized = lang.slice(0,2);
  try {
    await i18n.changeLanguage(normalized);
  } catch (e) {
    // ignore
  }
  try { localStorage.setItem('i18nextLng', normalized); } catch(e){}
  try { localStorage.setItem('language', normalized); } catch(e){}

  if (options.persistBackend) {
    try {
      await apiFetch('/client/language_settings', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ settings: { language: normalized } }),
      });
    } catch (e) {
      // swallow — backend persistence is best-effort
    }
  }
}

export function getAppLanguage() {
  return (i18n.language && i18n.language.slice(0,2)) || (localStorage.getItem('i18nextLng') || localStorage.getItem('language') || 'en');
}

export default { setAppLanguage, getAppLanguage };
