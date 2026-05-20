// i18n.ts — Initializes i18next with cookie-based language detection.
// Language is stored in a cookie (netsanet_lang) via i18next-browser-languagedetector.
// No URL or routing involvement — purely cookie-based.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Landing page translations
import enLanding         from '../locales/en/landing.json';
import amLanding         from '../locales/am/landing.json';
import tiLanding         from '../locales/ti/landing.json';
import omLanding         from '../locales/om/landing.json';
import soLanding         from '../locales/so/landing.json';
import aaLanding         from '../locales/aa/landing.json';

// About page translations
import enAbout           from '../locales/en/about.json';
import amAbout           from '../locales/am/about.json';
import tiAbout           from '../locales/ti/about.json';
import omAbout           from '../locales/om/about.json';
import soAbout           from '../locales/so/about.json';
import aaAbout           from '../locales/aa/about.json';

// Survivor portal translations
import enSurvivorHome    from '../locales/en/survivorHome.json';
import amSurvivorHome    from '../locales/am/survivorHome.json';
import tiSurvivorHome    from '../locales/ti/survivorHome.json';
import omSurvivorHome    from '../locales/om/survivorHome.json';
import soSurvivorHome    from '../locales/so/survivorHome.json';
import aaSurvivorHome    from '../locales/aa/survivorHome.json';

import enSurvivorLayout  from '../locales/en/survivorLayout.json';
import amSurvivorLayout  from '../locales/am/survivorLayout.json';
import tiSurvivorLayout  from '../locales/ti/survivorLayout.json';
import omSurvivorLayout  from '../locales/om/survivorLayout.json';
import soSurvivorLayout  from '../locales/so/survivorLayout.json';
import aaSurvivorLayout  from '../locales/aa/survivorLayout.json';

import enReportCase      from '../locales/en/reportCase.json';
import amReportCase      from '../locales/am/reportCase.json';
import tiReportCase      from '../locales/ti/reportCase.json';
import omReportCase      from '../locales/om/reportCase.json';
import soReportCase      from '../locales/so/reportCase.json';
import aaReportCase      from '../locales/aa/reportCase.json';

import enMyCases         from '../locales/en/myCases.json';
import amMyCases         from '../locales/am/myCases.json';
import tiMyCases         from '../locales/ti/myCases.json';
import omMyCases         from '../locales/om/myCases.json';
import soMyCases         from '../locales/so/myCases.json';
import aaMyCases         from '../locales/aa/myCases.json';

import enCaseDetail      from '../locales/en/caseDetail.json';
import amCaseDetail      from '../locales/am/caseDetail.json';
import tiCaseDetail      from '../locales/ti/caseDetail.json';
import omCaseDetail      from '../locales/om/caseDetail.json';
import soCaseDetail      from '../locales/so/caseDetail.json';
import aaCaseDetail      from '../locales/aa/caseDetail.json';

import enAiGuide         from '../locales/en/aiGuide.json';
import amAiGuide         from '../locales/am/aiGuide.json';
import tiAiGuide         from '../locales/ti/aiGuide.json';
import omAiGuide         from '../locales/om/aiGuide.json';
import soAiGuide         from '../locales/so/aiGuide.json';
import aaAiGuide         from '../locales/aa/aiGuide.json';

import enEvidenceLocker  from '../locales/en/evidenceLocker.json';
import amEvidenceLocker  from '../locales/am/evidenceLocker.json';
import tiEvidenceLocker  from '../locales/ti/evidenceLocker.json';
import omEvidenceLocker  from '../locales/om/evidenceLocker.json';
import soEvidenceLocker  from '../locales/so/evidenceLocker.json';
import aaEvidenceLocker  from '../locales/aa/evidenceLocker.json';

// Auth & Dashboard translations
import enAuth from '../locales/en/auth.json';
import amAuth from '../locales/am/auth.json';
import tiAuth from '../locales/ti/auth.json';
import omAuth from '../locales/om/auth.json';
import soAuth from '../locales/so/auth.json';
import aaAuth from '../locales/aa/auth.json';

import enDashboard from '../locales/en/dashboard.json';
import amDashboard from '../locales/am/dashboard.json';
import tiDashboard from '../locales/ti/dashboard.json';
import omDashboard from '../locales/om/dashboard.json';
import soDashboard from '../locales/so/dashboard.json';
import aaDashboard from '../locales/aa/dashboard.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        landing:        enLanding,
        about:          enAbout,
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
        landing:        amLanding,
        about:          amAbout,
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
      ti: {
        landing:        tiLanding,
        about:          tiAbout,
        auth:           tiAuth,
        dashboard:      tiDashboard,
        survivorHome:   tiSurvivorHome,
        survivorLayout: tiSurvivorLayout,
        reportCase:     tiReportCase,
        myCases:        tiMyCases,
        caseDetail:     tiCaseDetail,
        aiGuide:        tiAiGuide,
        evidenceLocker: tiEvidenceLocker,
      },
      om: {
        landing:        omLanding,
        about:          omAbout,
        auth:           omAuth,
        dashboard:      omDashboard,
        survivorHome:   omSurvivorHome,
        survivorLayout: omSurvivorLayout,
        reportCase:     omReportCase,
        myCases:        omMyCases,
        caseDetail:     omCaseDetail,
        aiGuide:        omAiGuide,
        evidenceLocker: omEvidenceLocker,
      },
      so: {
        landing:        soLanding,
        about:          soAbout,
        auth:           soAuth,
        dashboard:      soDashboard,
        survivorHome:   soSurvivorHome,
        survivorLayout: soSurvivorLayout,
        reportCase:     soReportCase,
        myCases:        soMyCases,
        caseDetail:     soCaseDetail,
        aiGuide:        soAiGuide,
        evidenceLocker: soEvidenceLocker,
      },
      aa: {
        landing:        aaLanding,
        about:          aaAbout,
        auth:           aaAuth,
        dashboard:      aaDashboard,
        survivorHome:   aaSurvivorHome,
        survivorLayout: aaSurvivorLayout,
        reportCase:     aaReportCase,
        myCases:        aaMyCases,
        caseDetail:     aaCaseDetail,
        aiGuide:        aaAiGuide,
        evidenceLocker: aaEvidenceLocker,
      },
    },

    // Detect from cookie only — no URL, no path, no subdomain
    detection: {
      order: ['cookie'],
      lookupCookie: 'netsanet_lang',
      caches: ['cookie'],
    } as object,

    fallbackLng: 'en',
    supportedLngs: ['en', 'am', 'ti', 'om', 'so', 'aa'],

    ns: [
      'landing',
      'about',
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
    defaultNS: 'landing',

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
