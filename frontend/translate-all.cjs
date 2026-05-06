const fs = require('fs');
const path = require('path');

const locales = ['ti', 'om'];

const tiTranslations = {
  survivorLayout: {
    "nav": {
      "home": "ዳስ",
      "report": "ጸብጻብ",
      "myCases": "ጉዳየይ",
      "legalGuide": "ናይ ሕጊ መምርሒ"
    },
    "signOut": "ውጻእ",
    "footer": "ውልቃዊነትኩም ሕሉው እዩ። ኩሉ ዳታ ዝተመሰጠረን ምስጢራውን እዩ።"
  },
  myCases: {
    "heading": "ጉዳየይ",
    "newReport": "+ ሓድሽ ጸብጻብ",
    "error": "ጉዳይኩም ክጽዓን ኣይከኣለን። በጃኹም ነታ ገጽ እንደገና ጽዓንዋ።",
    "empty": {
      "title": "ዛጊት ጉዳይ የለን",
      "body": "ዘቕረብኩሞ ጸብጻብ ኣካይዳኡ ንምክትታል ኣብዚ ክረአ እዩ።",
      "cta": "ቀዳማይ ጸብጻብኩም ኣቕርቡ"
    },
    "urgency": { "critical": "ህጹጽ" },
    "dates": {
      "today": "ሎሚ",
      "yesterday": "ትማሊ",
      "daysAgo": "ቅድሚ {{count}} መዓልታት"
    }
  },
  evidenceLocker: {
    "title": "መኽዘን መረዳእታ",
    "uploadButton": "+ መረዳእታ ስቀል",
    "emptyState": {
      "title": "መረዳእታ የለን",
      "description": "ስእልታት፣ ድምጺ ወይ ካልእ ሰነዳት ብውሕስነት ኣቐምጡ።"
    },
    "fileTypes": {
      "image": "ስእሊ",
      "audio": "ድምጺ",
      "document": "ሰነድ"
    },
    "toast": {
      "uploadSuccess": "መረዳእታ ብዓወት ተሰቒሉ"
    }
  },
  auth: {
    "login": {
      "title": "እቶ",
      "email": "ኢሜይል",
      "password": "ፓስዎርድ",
      "submit": "እቶ",
      "forgotPassword": "ፓስዎርድ ረስዒየ"
    },
    "errors": {
      "invalid": "ዘይትኽክል ኢሜይል ወይ ፓስዎርድ",
      "required": "እዚ ግዴታ እዩ"
    }
  },
  aiGuide: {
    "title": "ሓገዝቲ ሓበሬታ",
    "placeholder": "ሕቶኹም ኣብዚ ጸሓፉ...",
    "send": "ስደድ",
    "disclaimer": "እዚ ሓበሬታ ብኣርቲፊሻል ኢንተለጀንስ ዝተዳለወ እዩ።"
  },
  survivorHome: {
    "greeting": "ሰላም",
    "emergency": {
      "title": "ህጹጽ ሓገዝ",
      "button": "ደውል"
    },
    "quickLinks": {
      "report": "ጸብጻብ ኣቕርብ",
      "guide": "መምርሒ ሕጊ"
    }
  },
  caseDetail: {
    "title": "ዝርዝር ጉዳይ",
    "status": "ኩነታት",
    "messages": "መልእኽትታት",
    "evidence": "መረዳእታ"
  },
  reportCase: {
    "title": "ሓድሽ ጸብጻብ",
    "submit": "ስደድ",
    "fields": {
      "title": "ኣርእስቲ",
      "description": "መግለጺ"
    }
  },
  dashboard: {
    "layout": {
      "nav": {
        "overview": "ሓፈሻዊ ትሕዝቶ",
        "cases": "ጉዳያት",
        "referrals": "መወከሲታት",
        "notifications": "መፍለጢታት",
        "staff": "ሰራሕተኛታት",
        "analytics": "ትሕዝቶ ጸብጻብ",
        "institutions": "ትካላት"
      },
      "badge": "ሰራሕተኛ",
      "fallbackName": "ሰራሕተኛ",
      "signOut": "ውጻእ"
    },
    "home": {
      "greeting": "ሰላም",
      "stats": {
        "active": "ንጡፍ",
        "pending": "ዝጽበ",
        "resolved": "ዝተፈትሐ"
      }
    },
    "notifications": {
      "title": "መፍለጢታት",
      "empty": "ሓድሽ መፍለጢ የለን"
    },
    "staff": {
      "title": "ኣመራርሓ ሰራሕተኛታት",
      "addStaff": "ሰራሕተኛ ወስኽ",
      "empty": "ሰራሕተኛ የለን",
      "roles": {
        "case_worker": "ሰዓብ ጉዳይ",
        "institution_admin": "ኣማሓዳሪ ትካል"
      },
      "modal": {
        "title": "ሰራሕተኛ ወስኽ",
        "desc": "ናይ መእተዊ ሊንክ ክስደደሎም እዩ።",
        "fullName": "ምሉእ ሽም",
        "email": "ኢሜይል",
        "phone": "ስልኪ",
        "role": "ተራ",
        "cancel": "ስረዝ",
        "submit": "ወስኽ"
      },
      "table": {
        "name": "ሽም",
        "role": "ተራ",
        "cases": "ጉዳያት",
        "status": "ኩነታት",
        "actions": "ስጉምትታት"
      },
      "status": {
        "active": "ንጡፍ",
        "suspended": "ግዝያዊ ደው"
      },
      "actions": {
        "activate": "ኣንጥፍ",
        "suspend": "ግዝያዊ ደው"
      }
    },
    "referrals": {
      "title": "መወከሲታት",
      "subtitle": "ኣብ መንጎ ትካላት ጉዳያት ምምሕዳር",
      "tabs": {
        "incoming": "ዝመጸ",
        "outgoing": "ዝተላእከ"
      },
      "status": {
        "pending": "ዝጽበ",
        "accepted": "ተቐቢሉ",
        "rejected": "ተነጺጉ"
      },
      "actions": {
        "review": "ገምግም"
      },
      "emptyTitle": "መወከሲ የለን",
      "emptyIncoming": "ናብ ትካልኩም ዝተላእከ መወከሲ የለን።",
      "emptyOutgoing": "ናብ ካልእ ትካል ዝላኣኽኩሞ መወከሲ የለን።",
      "loading": "ይጽዕን ኣሎ..."
    },
    "institutions": {
      "title": "ትካላት",
      "subtitle": "መሻርኽቲ ትካላት ምምሕዳር",
      "addInstitution": "ትካል ወስኽ",
      "empty": "ትካል የለን",
      "table": {
        "institution": "ትካል",
        "services": "ኣገልግሎታት",
        "status": "ኩነታት",
        "actions": "ስጉምትታት"
      },
      "modal": {
        "name": "ሽም ትካል",
        "namePlaceholder": "ሚኒስትሪ...",
        "services": "ኣገልግሎታት",
        "email": "ኢሜይል",
        "cancel": "ስረዝ",
        "submit": "ፍጠር"
      }
    },
    "shared": {
      "status": {
        "active": "ንጡፍ",
        "inactive": "ዘይንጡፍ"
      },
      "urgency": {
        "critical": "ህጹጽ",
        "high": "ልዑል",
        "medium": "ማእከላይ",
        "low": "ትሑት"
      }
    }
  }
};

const omTranslations = {
  survivorLayout: {
    "nav": {
      "home": "Mana",
      "report": "Gabaasa",
      "myCases": "Dhimmoota koo",
      "legalGuide": "Qajeelfama Seeraa"
    },
    "signOut": "Ba'i",
    "footer": "Icciitiin kee eegamaadha. Daataan hundi iccitiidhan eegameera."
  },
  myCases: {
    "heading": "Dhimmoota koo",
    "newReport": "+ Gabaasa Haaraa",
    "error": "Dhimmoota kee fe'uu hin dandeenye. Maaloo irra deebi'ii yaali.",
    "empty": {
      "title": "Dhimmi hin jiru",
      "body": "Gabaasonni ati dhiheessitu asitti mul'atu.",
      "cta": "Gabaasa jalqabaa dhiheessi"
    },
    "urgency": { "critical": "ARIFAATAA" },
    "dates": {
      "today": "Har'a",
      "yesterday": "Kaleessa",
      "daysAgo": "Guyyaa {{count}} dura"
    }
  },
  evidenceLocker: {
    "title": "Kuusaa Ragaa",
    "uploadButton": "+ Ragaa Fe'i",
    "emptyState": {
      "title": "Ragaan hin jiru",
      "description": "Fakkii, sagalee ykn sanada of eeggannoon olkaa'i."
    },
    "fileTypes": {
      "image": "Fakkii",
      "audio": "Sagalee",
      "document": "Sanada"
    },
    "toast": {
      "uploadSuccess": "Ragaan milkiin fe'ameera"
    }
  },
  auth: {
    "login": {
      "title": "Seeni",
      "email": "Imeeyilii",
      "password": "Iggitii",
      "submit": "Seeni",
      "forgotPassword": "Iggitii dagadheera"
    },
    "errors": {
      "invalid": "Imeeyilii ykn Iggitii sirrii miti",
      "required": "Dirqama"
    }
  },
  aiGuide: {
    "title": "Qajeelfama AI",
    "placeholder": "Gaaffii kee asitti barreessi...",
    "send": "Ergi",
    "disclaimer": "Deebiin kun AI dhaan kan kennameedha."
  },
  survivorHome: {
    "greeting": "Akkam",
    "emergency": {
      "title": "Balaafama",
      "button": "Bilbili"
    },
    "quickLinks": {
      "report": "Gabaasa dhiheessi",
      "guide": "Qajeelfama seeraa"
    }
  },
  caseDetail: {
    "title": "Bal'ina Dhimmaa",
    "status": "Sadarkaa",
    "messages": "Ergaawwan",
    "evidence": "Ragaa"
  },
  reportCase: {
    "title": "Gabaasa Haaraa",
    "submit": "Ergi",
    "fields": {
      "title": "Mata duree",
      "description": "Ibsa"
    }
  },
  dashboard: {
    "layout": {
      "nav": {
        "overview": "Waliigala",
        "cases": "Dhimmoota",
        "referrals": "Dabarsuu",
        "notifications": "Beeksisoota",
        "staff": "Hojjattoota",
        "analytics": "Ragaa",
        "institutions": "Dhaabbilee"
      },
      "badge": "Hojjetaa",
      "fallbackName": "Hojjetaa",
      "signOut": "Ba'i"
    },
    "home": {
      "greeting": "Akkam",
      "stats": {
        "active": "Hojjatarra",
        "pending": "Eegumsa",
        "resolved": "Xumurame"
      }
    },
    "notifications": {
      "title": "Beeksisoota",
      "empty": "Beeksisa haaraa hin jiru"
    },
    "staff": {
      "title": "Bulchiinsa Hojjattootaa",
      "addStaff": "Hojjetaa Dabali",
      "empty": "Hojjetaan hin jiru",
      "roles": {
        "case_worker": "Hojjetaa Dhimmaa",
        "institution_admin": "Bulchaa Dhaabbataa"
      },
      "modal": {
        "title": "Hojjetaa Dabali",
        "desc": "Imeeyiliidhaan ergaan ni ergama.",
        "fullName": "Maqaa Guutuu",
        "email": "Imeeyilii",
        "phone": "Bilbila",
        "role": "Gahee",
        "cancel": "Haqi",
        "submit": "Dabali"
      },
      "table": {
        "name": "Maqaa",
        "role": "Gahee",
        "cases": "Dhimmoota",
        "status": "Sadarkaa",
        "actions": "Tarkaanfii"
      },
      "status": {
        "active": "Nishaasaa",
        "suspended": "Dhaabate"
      },
      "actions": {
        "activate": "Kaasi",
        "suspend": "Dhaabi"
      }
    },
    "referrals": {
      "title": "Dabarsuu",
      "subtitle": "Dhimmoota dhaabbilee gidduutti bulchi",
      "tabs": {
        "incoming": "Dhufe",
        "outgoing": "Ergame"
      },
      "status": {
        "pending": "Eegumsa",
        "accepted": "Fudhatame",
        "rejected": "Kufaa ta'e"
      },
      "actions": {
        "review": "Gamaaggami"
      },
      "emptyTitle": "Dabarsi hin jiru",
      "emptyIncoming": "Dhaabbata keessaniif dhimmi dhufe hin jiru.",
      "emptyOutgoing": "Dhimmi isin dhaabbata biraatiif dabarsitan hin jiru.",
      "loading": "Fe'amaa jira..."
    },
    "institutions": {
      "title": "Dhaabbilee",
      "subtitle": "Dhaabbilee michuu bulchi",
      "addInstitution": "Dhaabbata Dabali",
      "empty": "Dhaabbanni hin jiru",
      "table": {
        "institution": "Dhaabbata",
        "services": "Tajaajila",
        "status": "Sadarkaa",
        "actions": "Tarkaanfii"
      },
      "modal": {
        "name": "Maqaa Dhaabbataa",
        "namePlaceholder": "Ministeera...",
        "services": "Tajaajiloota",
        "email": "Imeeyilii",
        "cancel": "Haqi",
        "submit": "Uumi"
      }
    },
    "shared": {
      "status": {
        "active": "Hojjetaa jira",
        "inactive": "Hojjetaa hin jiru"
      },
      "urgency": {
        "critical": "Arifaataa",
        "high": "Olaanaa",
        "medium": "Giddugaleessa",
        "low": "Gadi aanaa"
      }
    }
  }
};

const enPath = path.join(__dirname, 'src', 'locales', 'en');

const targetDirs = {
  ti: path.join(__dirname, 'src', 'locales', 'ti'),
  om: path.join(__dirname, 'src', 'locales', 'om')
};

// Ensure directories exist
if (!fs.existsSync(targetDirs.ti)) fs.mkdirSync(targetDirs.ti, { recursive: true });
if (!fs.existsSync(targetDirs.om)) fs.mkdirSync(targetDirs.om, { recursive: true });

const files = [
  'survivorLayout.json', 'myCases.json', 'evidenceLocker.json',
  'auth.json', 'aiGuide.json', 'survivorHome.json',
  'caseDetail.json', 'reportCase.json', 'dashboard.json'
];

// Helper to deeply merge a partial translation over a base template
function deepMerge(target, source) {
  const result = Array.isArray(target) ? [] : {};
  for (const key in target) {
    if (source && source[key] !== undefined) {
      if (typeof target[key] === 'object' && target[key] !== null) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    } else {
      // If we don't have a translation, keep the english one with a prefix
      if (typeof target[key] === 'object' && target[key] !== null) {
        result[key] = deepMerge(target[key], {});
      } else {
        result[key] = typeof target[key] === 'string' ? `[TR] ${target[key]}` : target[key];
      }
    }
  }
  return result;
}

files.forEach(file => {
  const enContent = JSON.parse(fs.readFileSync(path.join(enPath, file), 'utf8'));
  const key = file.replace('.json', '');

  const tiMerged = deepMerge(enContent, tiTranslations[key]);
  const omMerged = deepMerge(enContent, omTranslations[key]);

  fs.writeFileSync(path.join(targetDirs.ti, file), JSON.stringify(tiMerged, null, 2));
  fs.writeFileSync(path.join(targetDirs.om, file), JSON.stringify(omMerged, null, 2));
  console.log(`Generated translations for ${file}`);
});
