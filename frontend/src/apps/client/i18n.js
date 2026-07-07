import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      dashboard: "Dashboard",
      tariffManagement: "Tariff Management",
      searchPlaceholder: "Search pages or text...",
      notifications: "Notifications",
      markAllRead: "Mark all as read",
      settings: "Settings",
      language: "Language",
      roleBasedAccess: "Role-Based Access",
      toggleTheme: "Toggle Theme",
      role: "Role",
      admin: "Admin",
      manager: "Manager",
      viewer: "Viewer",
      maintenanceScheduled: "Maintenance Scheduled",
    },
  },
  sw: {
    translation: {
      dashboard: "Dashibodi",
      tariffManagement: "Usimamizi wa Viwango",
      searchPlaceholder: "Tafuta kurasa au maandishi...",
      notifications: "Arifa",
      markAllRead: "Tia alama zote kuwa zimesomwa",
      settings: "Mipangilio",
      language: "Lugha",
      roleBasedAccess: "Ufikiaji Kulingana na Jukumu",
      toggleTheme: "Badilisha Mandhari",
      role: "Jukumu",
      admin: "Msimamizi",
      manager: "Meneja",
      viewer: "Mtazamaji",
      maintenanceScheduled: "Matengenezo Yamepangwa",
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
