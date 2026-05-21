// PrivacyPage.tsx — Unified cinematic privacy policy page with multi-language support.
// Route: /privacy

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle';
import QuickExitButton from '../../components/ui/QuickExitButton';

interface PrivacyTranslation {
  title: string;
  lastUpdated: string;
  safetyNotice: string;
  sec1Title: string;
  sec1Body: string;
  sec2Title: string;
  sec2Body: string;
  sec3Title: string;
  sec3Body: string;
  sec3Bullet1: string;
  sec3Bullet2: string;
  sec3Bullet3: string;
  sec4Title: string;
  sec4Body: string;
  sec5Title: string;
  sec5Body: string;
  sec6Title: string;
  sec6Body: string;
}

const translations: Record<string, PrivacyTranslation> = {
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last Updated: May 2026",
    safetyNotice: "SURVIVOR SAFETY NOTICE: If you are concerned about your browser history or active session being monitored, please click the Quick Exit button in the bottom right. It will immediately clear all session tokens, cookie keys, and redirect your browser instantly to Google.",
    sec1Title: "1. Our Commitment to Your Privacy",
    sec1Body: "Netsanet is built on a foundation of absolute trust, safety, and survivor confidentiality. We leverage state-of-the-art secure technology to ensure you have a private space to record cases, receive legal assistance, and access local support services without leaving any traceable digital footprint.",
    sec2Title: "2. Anonymous Filing Options",
    sec2Body: "Survivors can choose to register and report cases completely anonymously. When filing anonymously, we do not require your real name, phone number, or government-issued credentials. A secure JetBrains Mono case ID is generated, allowing you to access case progress without exposing your real-world identity.",
    sec3Title: "3. Data We Collect and Store",
    sec3Body: "We strictly limit data collection to details you explicitly provide inside your secure profile:",
    sec3Bullet1: "Case records, incident summaries, and timeline details.",
    sec3Bullet2: "Secure attachments and files loaded into your private Evidence Locker.",
    sec3Bullet3: "Temporary session tokens generated exclusively to hold your secure state (cleared immediately upon logging out).",
    sec4Title: "4. Non-Ingestion AI Architecture",
    sec4Body: "Netsanet implements a strict non-ingestion pipeline for all artificial intelligence workflows (RAG Service). Case histories, chat threads, and document inquiries processed by the platform are used solely in real time to render context-aware assistance. Under no circumstances is survivor data ingested, cached, or used to retrain machine learning models.",
    sec5Title: "5. Staff Confidentiality Rules",
    sec5Body: "All legal officers, case workers, and system admins undergo rigorous training on Netsanet confidentiality standards. Cases marked with anonymous flags strictly redact survivor names, contact logs, and geolocation markers across all dashboard tables and analytics tools.",
    sec6Title: "6. Contact Information",
    sec6Body: "If you have questions regarding our data collection policies or security protocols, please reach out to us at confidential@netsanet.org."
  },
  am: {
    title: "የግላዊነት ፖሊሲ",
    lastUpdated: "የመጨረሻ ማሻሻያ፡ ግንቦት 2026",
    safetyNotice: "የደህንነት ማስጠንቀቂያ፡ የድር አሰሳ ታሪክዎ ወይም ገባሪ ክፍለ-ጊዜዎ ክትትል እየተደረገበት ነው ብለው ካሰቡ፣ እባክዎ ከታች በስተቀኝ ያለውን 'ፈጣን መውጫ' (Quick Exit) ቁልፍን ጠቅ ያድርጉ። ይህ ሁሉንም የክፍለ-ጊዜ መለያዎችን እና ኩኪዎችን ወዲያውኑ ያጠፋል እንዲሁም አሳሽዎን በቀጥታ ወደ Google ይመራዋል።",
    sec1Title: "1. ለግላዊነትዎ ያለን ቁርጠኝነት",
    sec1Body: "ነጻነት የተገነባው ፍጹም በሆነ እምነት፣ ደህንነት እና በሕይወት የተረፉ ሰዎች ሚስጥራዊነት ላይ ነው። ምንም ዓይነት ዲጂታል አሻራ ሳይተዉ ጉዳዮችን ለመመዝገብ፣ የሕግ ድጋፍ ለማግኘት እና የአካባቢ ድጋፍ አገልግሎቶችን ለማግኘት ዘመናዊ ደህንነቱ የተጠበቀ ቴክኖሎጂን እንጠቀማለን።",
    sec2Title: "2. ማንነትን ሳይገልጹ ሪፖርት የማድረግ አማራጮች",
    sec2Body: "ማንነትዎን ሙሉ በሙሉ ሳይገልጹ ጉዳይዎን መመዝገብ እና ሪፖርት ማድረግ ይችላሉ። ይህን ሲያደርጉ እውነተኛ ስምዎን፣ ስልክ ቁጥርዎን ወይም ማንነትዎን የሚገልጽ ሰነድ አንጠይቅም። ደህንነቱ የተጠበቀ የጉዳይ መለያ ቁጥር (Case ID) ይፈጠራል፣ ይህም እውነተኛ ማንነትዎን ሳይገልጹ የጉዳዩን ሂደት ለመከታተል ያስችልዎታል።",
    sec3Title: "3. የምንሰበስበው እና የምናስቀምጠው መረጃ",
    sec3Body: "የመረጃ አሰባሰባችንን ደህንነቱ በተጠበቀው የግል መገለጫዎ ውስጥ በግልፅ በሚያቀርቡት ዝርዝሮች ላይ በጥብቅ እንገድባለን፦",
    sec3Bullet1: "የጉዳይ መዛግብት፣ የክስተቱ ማጠቃለያዎች እና የጊዜ ሰሌዳ ዝርዝሮች።",
    sec3Bullet2: "በግል ማስረጃ ማስቀመጫዎ ውስጥ የሚጫኑ ሚስጥራዊ ፋይሎች እና ሰነዶች።",
    sec3Bullet3: "ደህንነቱ የተጠበቀ ክፍለ-ጊዜን ለመጠበቅ ብቻ የሚፈጠሩ ጊዜያዊ መለያዎች (ሲወጡ ወዲያውኑ የሚጠፉ)።",
    sec4Title: "4. ከውጭ መረጃን የማይወስድ የኤአይ (AI) አርክቴክቸር",
    sec4Body: "ነጻነት ለሁሉም የኤአይ የሥራ ፍሰቶች ጥብቅ የሆነ የውሂብ አለመውሰድ ፖሊሲን ተግባራዊ ያደርጋል። በስርዓቱ ውስጥ የሚከናወኑ የውይይት ክሮች እና ጥያቄዎች ለቅጽበታዊ ድጋፍ ብቻ ጥቅም ላይ ይውላሉ። የሕይወት ተረፊዎችን መረጃ ለማሽን መማሪያ ሞዴሎች ማሰልጠኛነት ፈጽሞ አንጠቀምም ወይም አናስቀምጥም።",
    sec5Title: "5. የሰራተኞች ሚስጥር የመጠበቅ ግዴታ",
    sec5Body: "ሁሉም የሕግ ባለሙያዎች፣ የጉዳይ ሠራተኞች እና የስርዓት አስተዳዳሪዎች በነጻነት ሚስጥራዊነት ደረጃዎች ላይ ጥብቅ ስልጠና ይወስዳሉ። ማንነታቸው እንዳይገለጽ የተደረጉ ጉዳዮች በተለያዩ የዳሽቦርድ ሰንጠረዦች ውስጥ እውነተኛ ስሞችን፣ የአድራሻ ታሪኮችን እና የጂኦግራፊያዊ አካባቢዎችን ይደብቃሉ።",
    sec6Title: "6. የእውቂያ መረጃ",
    sec6Body: "ስለ መረጃ አሰባሰብ ፖሊሲዎቻችን ወይም የደህንነት ፕሮቶኮሎቻችን ጥያቄዎች ካሉዎት እባክዎን confidential@netsanet.org ላይ ያግኙን።"
  },
  ti: {
    title: "ፖሊሲ ምስጢራውነት",
    lastUpdated: "ናይ መወዳእታ ምምሕያሽ፡ ግንቦት 2026",
    safetyNotice: "መጠንቀቕታ ደሕንነት፡ ታሪኽ ምብጻሕ ዌብሳይትኩም ወይ እዋናዊ ስራሕኩም ምክትታል ይግበረሉ ኣሎ ኢልኩም እንተድኣ ሰጊእኩም፣ በጃኹም ኣብ ታሕቲ ብየማን ዘሎ 'ቅልጡፍ መውጽኢ' (Quick Exit) ቁልፊ ጠውቑ። እዚ ንኹሉ ምስጢራዊ መፍለዪታትን ኩኪታትን ብቕጽበት ክድምስሶ እዩ፣ ንዕኹም ድማ ብቐጥታ ናብ Google ክመርሓኩም እዩ።",
    sec1Title: "1. ቃል ኪዳንና ንምስጢራውነትኩም",
    sec1Body: "ነጻነት ዝተገንባአሉ መሰረት ምሉእ እምነት፣ ደሕንነትን ምስጢራውነት ተረፍትን እዩ። ዝኾነ ዲጂታል ኣሰር ከይሓደግኩም ጉዳይኩም ንምምዝጋብ፣ ሕጋዊ ሓገዝ ንምርካብን ኣገልግሎት ደገፍ ንምዕቃብን ዘበናዊ ቴክኖሎጂ ንጥቀም።",
    sec2Title: "2. መንነትካ ከይገለጽካ ሪፖርት ምግባር",
    sec2Body: "መንነትኩም ከይገለጽኩም ጉዳይኩም ክትምዝግቡን ሪፖርት ክትገብሩን ትኽእሉ ኢኹም። እዚ ክትገብሩ ከለኹም እውነተኛ ስምኩም፣ ቁጽሪ ቴሌፎንኩም ወይ መንነትኩም ዝገልጽ ሰነድ ኣይንሓትትን ኢና። ንሕጋዊ መስርሕ ዝኸውን ፍሉይ Case ID ይዳሎ እዩ።",
    sec3Title: "3. ንእክቦን እነስቅጦን ሓበሬታ",
    sec3Body: "ሓበሬታ ንምእካብ ጥራይ ኢና ደረቱ ንገብር፣ እዚ ድማ ኣብቲ ውሑስ ፕሮፋይልኩም ዘእተኹምዎ ጥራይ እዩ፦",
    sec3Bullet1: "መዝገብ ጉዳይ፣ ሓፈሻዊ ትሕዝቶታት ረክብን ናይ ግዜ ሰሌዳን።",
    sec3Bullet2: "ኣብቲ ምስጢራዊ መኽዘን መርትዖኹም (Evidence Locker) ዝሰቐልኩምዎም ፋይላትን ሰነዳትን።",
    sec3Bullet3: "ንእዋናዊ ስራሕኩም ንምሕላው ጥራይ ዝድለዩ ግዝያዊ መፍለዪታት (ምስ ወጻእኩም ብቕጽበት ዝድመሰሱ)።",
    sec4Title: "4. ዳታ ዘይወስድ ኤአይ አርክቴክቸር",
    sec4Body: "ነጻነት ንኹሎም ናይ ኤአይ ስራሕቲ ጥብቂ ዝበለ ዳታ ዘይምዕቃብ ፖሊሲ ይጥቀም እዩ። ኣብቲ ስርዓት ዝካየዱ ዕላልን ሕቶታትን ንቅጽበታዊ ደገፍ ጥራይ የገልግሉ። ነቲ ዳታ ንስልጠና ሞዴላት ፈጺምና ኣይንጥቀመሉን።",
    sec5Title: "5. ግዴታ ምስጢር ምሕላው ሰራሕተኛታት",
    sec5Body: "ኩሎም ሕጋውያን ሰራሕተኛታት፣ ሰራሕተኛታት ጉዳይን ኣመሓደርቲ ስርዓትን ኣብ ነጻነት ምስጢራውነት ዓሚቝ ስልጠና ይወስዱ እዮም። መንነቶም ከይግለጽ ዝተገብሩ ጉዳያት ስሞም ይሕባእ እዩ።",
    sec6Title: "6. ናይ ርክብ ሓበሬታ",
    sec6Body: "ብዛዕባ ፖሊሲታትና ወይ ናይ ደሕንነት ስርዓትና ሕቶታት እንተሃሊዩኩም ብ confidential@netsanet.org ርኸቡና።"
  },
  om: {
    title: "Imaammata Iddoo Iftoominaa",
    lastUpdated: "Gabaasa Dhummataa: Caamsaa 2026",
    safetyNotice: "Akeekkachiisa Nageenyaa: Tarree seenaa interneetii ykn hojii keessan hordofamaa jira jedhanii yoo yaaddesstan, maaloo button 'Bahiinsa Saffisaa' (Quick Exit) gara jala mirgaa jiru cuqaasaa. Kuni kuusaa fi kookii hundumaa battalatti ni haqee fuula gara Google daddabarsa.",
    sec1Title: "1. Waadaa Nageenya Iftoomina Keessanii",
    sec1Body: "Netsanet amanannaa guutuu, nageenya fi iftoomina irratti hundaa'ee ijaarame. Ragaalee fi seenaa keessan tokkoollee utuu hin saaxilin hojii gabaasuu, deeggarsa argachuu fi ragaalee kuusuuf teeknoolojii ammayyaa ni fayyadamna.",
    sec2Title: "2. Eenyummaa Utuu Hin Saaxilin Gabaasuu",
    sec2Body: "Eenyummaa keessan utuu hin saaxilin gabaasa keessan guutuu dhiyeessuu ni dandeessu. Yeroo kana gootan maqaas ta'ee bilbila keessan hin gaafannu. Kuni Case ID dhuunfaa isiniif kenna.",
    sec3Title: "3. Ragaalee Nuti Walitti Qabnu fi Kuusnu",
    sec3Body: "Ragaalee walitti qabnu keessatti kan isin dhuunfaan galmeessitan qofa irratti daangeessina:",
    sec3Bullet1: "Ragaalee gabaasaa, seenaa dhimmootaa fi yeroo raawwii.",
    sec3Bullet2: "Ragaalee kuusaa dhuunfaa keessatti (Evidence Locker) kan isin feetan.",
    sec3Bullet3: "Token yeroo muraasaaf qofa tajaajilan kan yeroo isin baatan battalatti haqaman.",
    sec4Title: "4. AI Ragaa Hin Xuqne (Non-Ingestion AI)",
    sec4Body: "Netsanet ragaalee keessan hojii AI tiif hin fayyadamu. Ragaaleen kunniin deeggarsa yeroo qofaaf kan fayyadan ta'ee, hojii AI leenjisuuf takkaallee hin kuusaman.",
    sec5Title: "5. Hojjettoonni Iftoomina Eeguu",
    sec5Body: "Hojjettoonni keenya hundinuu nageenya fi iftoomina eeguuf leenjii cimaa fudhataniiru. Dhimmoonni eenyummaan isaanii hin saaxilamne maqaa fi bilbila isaanii daashboordii keenya irratti hin argisiisan.",
    sec6Title: "6. Quonnamaaf Ragaa",
    sec6Body: "Yoo gaaffii qabaattan confidential@netsanet.org irratti nu qunnamaa."
  },
  so: {
    title: "Shuruucda Asturnaanta",
    lastUpdated: "Cusboonaysiintii Ugu Dambaysay: May 2026",
    safetyNotice: "OGAYSIIISKA NAGEENYADA: Haddii aad ka walwalayso taariikhda aaladaada ama casharkaaga hadda la kormeeyo, fadlan guji badhanka 'Quick Exit' ee ku yaal dhanka midig ee hoose. Waxay isla markiiba tirtiri doontaa dhammaan xogta casharka waxayna kugu wareejin doontaa Google.",
    sec1Title: "1. Ballanqaadkayaga ku aaddan Asturnaantaada",
    sec1Body: "Netsanet waxaa lagu dhisay aaminad buuxda, nabadgelyo, iyo asturnaanta badbaadayaasha. Waxaan isticmaalnaa tiknoolajiyad sugan oo casri ah si aan u hubinno inaad haysato meel gaar ah oo aad ku duubto kiisaska, kuna hesho caawimaad sharci.",
    sec2Title: "2. Ikhtiyaarada Diiwaangelinta Qarsoodiga ah",
    sec2Body: "Badbaadayaashu waxay dooran karaan inay iska diiwaangeliyaan oo ay soo sheegaan kiisaska gabi ahaanba si qarsoodi ah. Markaad si qarsoodi ah u soo sheegayso, uma baahnid magacaaga rasmiga ah ama lambarkaaga taleefanka.",
    sec3Title: "3. Xogta aan Ururino ee aan Kaydino",
    sec3Body: "Waxaan si adag u xaddidnaa ururinta xogta faahfaahinta aad si cad ugu bixiso profile-kaaga sugan:",
    sec3Bullet1: "Diiwaanka kiiska, koobsashada shilka, iyo faahfaahinta jadwalka.",
    sec3Bullet2: "Lifaaqyada sugan iyo faylasha lagu shubay sanduuqaaga cadaymaha ee gaarka ah (Evidence Locker).",
    sec3Bullet3: "Calaamadaha fadhiga ee ku-meel-gaarka ah oo la tirtiro isla marka aad ka baxdo.",
    sec4Title: "4. Nidaamka AI ee aan Kaydin Xogta",
    sec4Body: "Netsanet wuxuu hirgeliyaa shuruuc adag oo ku aaddan inaan xogta la kaydin dhammaan shaqooyinka AI. Xogtaada looma isticmaalo in lagu tababaro moodooyinka AI.",
    sec5Title: "5. Shuruucda Asturnaanta Shaqaalaha",
    sec5Body: "Dhammaan saraakiisha sharciga iyo shaqaalaha kiiska waxay maraan tababar adag oo ku saabsan ilaalinta sirta Netsanet.",
    sec6Title: "6. Xogta Xiriirka",
    sec6Body: "Haddii aad qabto wax su'aalo ah oo ku saabsan shuruucdayada, fadlan nagala soo xiriir confidential@netsanet.org."
  },
  aa: {
    title: "Privacy Policy (Afar)",
    lastUpdated: "May 2026",
    safetyNotice: "SAFETY NOTICE: Macallay, aysinnih kah aydagtelem gactamkeh concern yallu, jala guba alfi 'Quick Exit' button cuqisay. Kaadu Google wadirih kaxxeela.",
    sec1Title: "1. Privacy Commitment",
    sec1Body: "Netsanet survivor safe-space confidentialityt ixxigam. Database leaksy, tamper-proof locker security fully active.",
    sec2Title: "2. Anonymous Case Reports",
    sec2Body: "Sissik case report anonymous identityt file yadih duudan. Real name kee telephone number mayalla.",
    sec3Title: "3. Collected Data",
    sec3Body: "Storage locker encryption strictly service-role call:",
    sec3Bullet1: "Case reports timelines.",
    sec3Bullet2: "Encrypted evidence documents.",
    sec3Bullet3: "Session tokens cleared immediately.",
    sec4Title: "4. AI RAG System Data Safety",
    sec4Body: "RAG AI response real-time render call. Under no circumstances vector data ingesting.",
    sec5Title: "5. Social Worker Privacy Check",
    sec5Body: "Social workers anonymous flag view redacting survivor name kee records completely.",
    sec6Title: "6. Security Inquiries",
    sec6Body: "Support email: confidential@netsanet.org."
  }
};

export default function PrivacyPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('landing');

  const currentLang = i18n.language || 'en';
  const content = translations[currentLang] || translations.en;

  return (
    <div className="relative min-h-screen bg-bg text-body flex flex-col items-center justify-start pt-28 pb-12 px-4 overflow-y-auto overflow-x-hidden transition-colors duration-300">
      <QuickExitButton />

      {/* ── Full-screen background image ── */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="w-full h-full object-cover object-center select-none"
        />
        {/* Cinematic gradient overlay linked to theme background */}
        <div className="absolute inset-0 bg-gradient-to-br from-bg/45 via-bg/25 to-bg/55 dark:from-bg/95 dark:via-bg/80 dark:to-bg/90 transition-colors duration-300" />
      </div>

      {/* ── Unified liquid glass navbar ── */}
      <nav className="absolute top-0 left-0 right-0 z-20 px-4 pt-5 md:px-8 !overflow-visible w-full">
        <div className="liquid-glass rounded-2xl px-5 py-3 flex items-center justify-between max-w-7xl mx-auto !overflow-visible">
          {/* Back Button */}
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 text-sm font-bold text-heading hover:opacity-85 transition-opacity focus:outline-none"
          >
            <ArrowLeft className="h-4 w-4 text-primary" />
            <span>{t('verify.back', { defaultValue: 'Back to Home' })}</span>
          </button>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      {/* ── Centered glass card ── */}
      <motion.div
        className="relative z-10 w-full max-w-3xl px-2"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] as const }}
      >
        <div className="liquid-glass rounded-3xl p-8 sm:p-10 border border-border">
          {/* Header */}
          <div className="mb-6 flex flex-col items-start">
            <h1 className="font-serif italic text-4xl text-heading mb-3 leading-tight">
              {content.title}
            </h1>
            <p className="text-muted text-xs uppercase tracking-widest font-semibold">
              {content.lastUpdated}
            </p>
          </div>

          {/* Safety alert */}
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-xs leading-relaxed text-red-500/90 font-medium mb-8 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              {content.safetyNotice}
            </div>
          </div>

          {/* Body content */}
          <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-3 text-sm leading-relaxed scrollbar-thin select-text text-body">
            <section>
              <h2 className="font-serif italic text-xl text-heading mb-2">{content.sec1Title}</h2>
              <p className="text-muted">
                {content.sec1Body}
              </p>
            </section>

            <section>
              <h2 className="font-serif italic text-xl text-heading mb-2">{content.sec2Title}</h2>
              <p className="text-muted">
                {content.sec2Body}
              </p>
            </section>

            <section>
              <h2 className="font-serif italic text-xl text-heading mb-2">{content.sec3Title}</h2>
              <p className="text-muted mb-2">
                {content.sec3Body}
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted">
                <li>{content.sec3Bullet1}</li>
                <li>{content.sec3Bullet2}</li>
                <li>{content.sec3Bullet3}</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif italic text-xl text-heading mb-2">{content.sec4Title}</h2>
              <p className="text-muted">
                {content.sec4Body}
              </p>
            </section>

            <section>
              <h2 className="font-serif italic text-xl text-heading mb-2">{content.sec5Title}</h2>
              <p className="text-muted">
                {content.sec5Body}
              </p>
            </section>

            <section>
              <h2 className="font-serif italic text-xl text-heading mb-2">{content.sec6Title}</h2>
              <p className="text-muted">
                {content.sec6Body}
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
