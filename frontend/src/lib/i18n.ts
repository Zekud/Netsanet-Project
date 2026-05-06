// i18n.ts — Initializes i18next with cookie-based language detection.
// Language is stored in a cookie (netsanet_lang) via i18next-browser-languagedetector.
// No URL or routing involvement — purely cookie-based.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Survivor portal translations
import enSurvivorHome    from '../locales/en/survivorHome.json';
import amSurvivorHome    from '../locales/am/survivorHome.json';
import enSurvivorLayout  from '../locales/en/survivorLayout.json';
import amSurvivorLayout  from '../locales/am/survivorLayout.json';
import enReportCase      from '../locales/en/reportCase.json';
import amReportCase      from '../locales/am/reportCase.json';
import enMyCases         from '../locales/en/myCases.json';
import amMyCases         from '../locales/am/myCases.json';
import enCaseDetail      from '../locales/en/caseDetail.json';
import amCaseDetail      from '../locales/am/caseDetail.json';
import enAiGuide         from '../locales/en/aiGuide.json';
import amAiGuide         from '../locales/am/aiGuide.json';
import enEvidenceLocker  from '../locales/en/evidenceLocker.json';
import amEvidenceLocker  from '../locales/am/evidenceLocker.json';

// Auth & Dashboard translations
import enAuth from '../locales/en/auth.json';
import amAuth from '../locales/am/auth.json';
import enDashboard from '../locales/en/dashboard.json';
import amDashboard from '../locales/am/dashboard.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        auth:           enAuth,
        dashboard:      enDashboard,
        survivorHome:   enSurvivorHome,
        survivorLayout: enSurvivorLayout,
        reportCase:     enReportCase,
        myCases:        enMyCases,
        caseDetail:     enCaseDetail,
        aiGuide:        enAiGuide,
        evidenceLocker: enEvidenceLocker,
      },
      am: {
        auth:           amAuth,
        dashboard:      amDashboard,
        survivorHome:   amSurvivorHome,
        survivorLayout: amSurvivorLayout,
        reportCase:     amReportCase,
        myCases:        amMyCases,
        caseDetail:     amCaseDetail,
        aiGuide:        amAiGuide,
        evidenceLocker: amEvidenceLocker,
      },
    },

    // Detect from cookie only — no URL, no path, no subdomain
    detection: {
      order: ['cookie'],
      lookupCookie: 'netsanet_lang',
      caches: ['cookie'],
    } as object,

    fallbackLng: 'en',
    supportedLngs: ['en', 'am'],

    ns: [
      'auth',
      'dashboard',
      'survivorHome',
      'survivorLayout',
      'reportCase',
      'myCases',
      'caseDetail',
      'aiGuide',
      'evidenceLocker',
    ],
    defaultNS: 'survivorHome',

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
