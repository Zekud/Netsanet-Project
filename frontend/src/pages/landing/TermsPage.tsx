// TermsPage.tsx — Unified cinematic terms of service page with multi-language support.
// Route: /terms

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle';
import QuickExitButton from '../../components/ui/QuickExitButton';

interface TermsTranslation {
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

const translations: Record<string, TermsTranslation> = {
  en: {
    title: "Terms of Service",
    lastUpdated: "Last Updated: May 2026",
    safetyNotice: "SURVIVOR SAFETY NOTICE: If you are concerned about your browser history or active session being monitored, please click the Quick Exit button in the bottom right. It will immediately clear all session tokens, cookie keys, and redirect your browser instantly to Google.",
    sec1Title: "1. Agreement to Terms",
    sec1Body: "Welcome to Netsanet. By accessing or using our confidential platform, reporting portal, or RAG legal guide services, you signify your understanding and absolute agreement to these Terms of Service. If you do not agree to these terms, please close this platform immediately.",
    sec2Title: "2. Confidentiality & Survivor Protections",
    sec2Body: "Netsanet is dedicated to safeguarding survivors. You are authorized to create anonymous case reports under secure, generated JetBrains Mono identifiers. Any attempt to exploit case listings, breach system barriers, or map anonymous identities to real-world individuals is strictly prohibited and constitutes a direct violation of these terms.",
    sec3Title: "3. Prohibited Platform Use",
    sec3Body: "In accessing this platform, you explicitly agree not to:",
    sec3Bullet1: "Submit intentionally fraudulent or deceptive case details.",
    sec3Bullet2: "Upload viruses, trojan horses, or files intended to compromise system performance into our Evidence Lockers.",
    sec3Bullet3: "Attempt unauthorized brute-force entries into administrative dashboards or social worker modules.",
    sec4Title: "4. AI RAG System Disclaimers",
    sec4Body: "The Netsanet RAG Legal Guide provides confidential AI-powered legal guidance based on official Ethiopian penal codes and supportive framework documents. While this service is fine-tuned to deliver maximum accuracy, it does not constitute official legal advice or a binding attorney-client relationship. It should always be used as a helpful guide alongside professional legal consultations.",
    sec5Title: "5. Secure Storage Limits",
    sec5Body: "Our private Evidence Locker utilizes end-to-end service-role encryption. Netsanet reserves the right to enforce storage space caps on case files to ensure optimal operational bandwidth. We guarantee that your locked evidence stays encrypted and will never be shared with outside parties without your explicit, authenticated consent.",
    sec6Title: "6. Modifications to Service",
    sec6Body: "Netsanet is dedicated to continuous enhancement. We reserve the right to deploy security iterations, adjust layout styling, and refine legal pipelines as necessary to maximize survivor safety and operational integrity."
  },
  am: {
    title: "የአገልግሎት ውሎች",
    lastUpdated: "የመጨረሻ ማሻሻያ፡ ግንቦት 2026",
    safetyNotice: "የደህንነት ማስጠንቀቂያ፡ የድር አሰሳ ታሪክዎ ወይም ገባሪ ክፍለ-ጊዜዎ ክትትል እየተደረገበት ነው ብለው ካሰቡ፣ እባክዎ ከታች በስተቀኝ ያለውን 'ፈጣን መውጫ' (Quick Exit) ቁልፍን ጠቅ ያድርጉ። ይህ ሁሉንም የክፍለ-ጊዜ መለያዎችን እና ኩኪዎችን ወዲያውኑ ያጠፋል እንዲሁም አሳሽዎን በቀጥታ ወደ Google ይመራዋል።",
    sec1Title: "1. በውሎች ላይ መስማማት",
    sec1Body: "ወደ ነጻነት እንኳን በደህና መጡ። የእኛን ሚስጥራዊ መድረክ፣ የሪፖርት ማቅረቢያ ፖርታል ወይም የሕግ መመሪያ አገልግሎቶችን በመጠቀም፣ ለእነዚህ የአገልግሎት ውሎች ያለዎትን ግንዛቤ እና ፍጹም ስምምነት ያረጋግጣሉ። በእነዚህ ውሎች ካልተስማሙ እባክዎን ይህንን መድረክ ወዲያውኑ ይዝጉ።",
    sec2Title: "2. ሚስጥራዊነት እና የሕይወት ተረፊዎች ጥበቃ",
    sec2Body: "ነጻነት ተረፊዎችን ለመጠበቅ የተሰጠ ነው። ማንነትዎን ሙሉ በሙሉ ሳይገልጹ ጉዳዮችን ሪፖርት ለማድረግ ተፈቅዶልዎታል። ማንነታቸውን ለመግለጥ ወይም ስርዓቱን ለመጣስ የሚደረግ ማንኛውም ሙከራ በጥብቅ የተከለከለ እና እነዚህን ውሎች መጣስ ነው።",
    sec3Title: "3. የተከለከሉ አጠቃቀሞች",
    sec3Body: "ይህንን መድረክ ሲጠቀሙ የሚከተሉትን ላለማድረግ በግልጽ ተስማምተዋል፦",
    sec3Bullet1: "ሆን ተብሎ የተዛባ ወይም የተሳሳተ መረጃ አለማቅረብ።",
    sec3Bullet2: "ስርዓቱን አደጋ ላይ ሊጥሉ የሚችሉ ፋይሎችን ወይም ቫይረሶችን ወደ ማስረጃ ማስቀመጫው አለመጫን።",
    sec3Bullet3: "ወደ አስተዳደራዊ ክፍሎች ወይም የጉዳይ ሰራተኞች ዳሽቦርዶች ያለፈቃድ ለመግባት አለመሞከር።",
    sec4Title: "4. የኤአይ (AI) የሕግ መመሪያ ማስተባበያ",
    sec4Body: "የነጻነት የሕግ መመሪያ በኢትዮጵያ የወንጀል ሕግ ላይ የተመሰረተ ነው። ምንም እንኳን ስርዓቱ ከፍተኛ ጥራት ያለው መረጃ እንዲሰጥ የተደረገ ቢሆንም፣ ይህ መደበኛ የሕግ ምክርን አይተካም። ሁልጊዜም ከባለሙያ የሕግ ምክር ጋር ጎን ለጎን ጥቅም ላይ ሊውል ይገባል።",
    sec5Title: "5. ደህንነቱ የተጠበቀ የማከማቻ ገደቦች",
    sec5Body: "የማስረጃ ማስቀመጫችን የላቀ ምስጠራን ይጠቀማል። ነጻነት የማከማቻ ቦታዎችን የመገደብ መብቱ የተጠበቀ ነው። መረጃዎችዎ ያለእርስዎ ፈቃድ ለሶስተኛ ወገን ፈጽሞ እንደማይጋሩ እናረጋግጣለን።",
    sec6Title: "6. በአገልግሎቶች ላይ የሚደረጉ ማሻሻያዎች",
    sec6Body: "የሕይወት ተረፊዎችን ደህንነት ለመጠበቅ ስርዓቱን በተከታታይ እናሻሽላለን። አስፈላጊ በሚሆንበት ጊዜ ስርዓቱን የማሻሻል መብታችን የተጠበቀ ነው።"
  },
  ti: {
    title: "ውልታት ኣገልግሎት",
    lastUpdated: "ናይ መወዳእታ ምምሕያሽ፡ ግንቦት 2026",
    safetyNotice: "መጠንቀቕታ ደሕንነት፡ ታሪኽ ምብጻሕ ዌብሳይትኩም ወይ እዋናዊ ስራሕኩም ምክትታል ይግበረሉ ኣሎ ኢልኩም እንተድኣ ሰጊእኩም፣ በጃኹም ኣብ ታሕቲ ብየማን ዘሎ 'ቅልጡፍ መውጽኢ' (Quick Exit) ቁልፊ ጠውቑ። እዚ ንኹሉ ምስጢራዊ መፍለዪታትን ኩኪታትን ብቕጽበት ክድምስሶ እዩ፣ ንዕኹም ድማ ብቐጥታ ናብ Google ክመርሓኩም እዩ።",
    sec1Title: "1. ስምምዕ ውልታት",
    sec1Body: "ናብ ነጻነት እንቋዕ ብደሓን መጻእኩም። ነዚ ምስጢራዊ መድረኽና፣ ናይ ሪፖርት መቕረቢ ፖርታልና ወይ ናይ ሕጊ መምርሒ ኣገልግሎትና ብምጥቃምኩም፣ ነዞም ውልታት ኣገልግሎት ምርዳእኩምን ምሉእ ስምምዕኩምን ተረጋግጹ። በዞም ውልታት እንተዘይተሰማሚዕኩም እዚ መድረኽ ብቕጽበት ዕጸውዎ።",
    sec2Title: "2. ምስጢራውነትን ዕቝባ ተረፍትን",
    sec2Body: "ነጻነት ተረፍቲ ኣብ ምዕቃብ ዘተኮረ እዩ። መንነትኩም ከይገለጽኩም ጉዳይኩም ሪፖርት ክትገብሩ ፍቑድ እዩ። መንነቶም ንምግላጽ ወይ ንስርዓት ንምጥሓስ ዝግበር ዝኾነ ፈተነ ምሉእ ብምሉእ ዝተኸልከለ እዩ።",
    sec3Title: "3. ዝተኸልከሉ ኣጠቓቕማታት",
    sec3Body: "ነዚ መድረኽ ክትጥቀሙ ከለኹም ነዞም ዝስዕቡ ከይትገብሩ ትሰማምዑ፦",
    sec3Bullet1: "ሆን ኢልኩም ዝተበላሸወ ወይ ጌጋ ሓበሬታ ከይተእትዉ።",
    sec3Bullet2: "ነቲ ውሑስ መኽዘን መርትዖታትና አደጋ ዝፈጥሩ ቫይረሳት ከይትሰዱ።",
    sec3Bullet3: "ናብ ናይ ምሕደራ ክፍልታት ወይ ናይ ሰራሕተኛታት ዳሽቦርዳት ብዘይ ፍቓድ ክትኣትዉ ከይትፍትኑ።",
    sec4Title: "4. ናይ ኤአይ (AI) ሕጋዊ መምርሒ ማስተባበሊ",
    sec4Body: "እቲ ናይ ነጻነት ሕጋዊ መምርሒ ኣብ ናይ ኢትዮጵያ ገበን ሕጊ ዝተመስረተ እዩ። እዚ መደበኛ ሕጋዊ ምኽሪ ኣይትክእን እዩ። ኩሉ ግዜ ምስ ሞያዊ ሕጋዊ ምኽሪ ጎኒ ንጎኒ ክጥቀሙሉ ይግባእ።",
    sec5Title: "5. ውሑስ ናይ ምዕቃብ ገደብ",
    sec5Body: "ናይ መርትዖ መኽዘንና ውሑስ ምስጢራዊ ቴክኖሎጂ ይጥቀም እዩ። ነጻነት ናይ ምዕቃብ ቦታታት ናይ ምድራት መሰሉ ዝተሓለወ እዩ። ሓበሬታኹም ብዘይ ፍቓድኩም ንሳልሳይ ወገን ኣይመሓላለፍን።",
    sec6Title: "6. ምምሕያሻት ኣገልግሎት",
    sec6Body: "ደሕንነት ተረፍቲ ንምርግጋጽ ስርዓትና ብቐጻሊ እነማሓይሽ እዩ። ኣድላዪ ኮይኑ ክርከብ ከሎ ስርዓትና ናይ ምምሕያሽ መሰልና ዝተሓለወ እዩ።"
  },
  om: {
    title: "Haalawwan Tajaajilaa",
    lastUpdated: "Gabaasa Dhummataa: Caamsaa 2026",
    safetyNotice: "Akeekkachiisa Nageenyaa: Tarree seenaa interneetii ykn hojii keessan hordofamaa jira jedhanii yoo yaaddesstan, maaloo button 'Bahiinsa Saffisaa' (Quick Exit) gara jala mirgaa jiru cuqaasaa. Kuni kuusaa fi kookii hundumaa battalatti ni haqee fuula gara Google daddabarsa.",
    sec1Title: "1. Agreement to Terms",
    sec1Body: "Netsanetiin baga nagaan dhuftan. Tajaajila iftoomina keenya fi gabaasa keenya fayyadamuun keessan haalawwan tajaajilaa kana fudhachuu keessan argisiisa. Yoo itti hin agreesne hojii kana dhaabaa.",
    sec2Title: "2. Iftoomina fi Nageenya Eeguu",
    sec2Body: "Netsanetiin nageenya keessan eeguuf kan murቴeessedha. Eenyummaa keessan utuu hin saaxilin gabaasuu ni dandeessu. Eenyummaa namoota biroo saaxiluuf yaaluun dhorkaadha.",
    sec3Title: "3. Prohibited Platform Use",
    sec3Body: "Tajaajila kana fayyadamuu keessatti kanneen armaan gadii gochuu dhabuuf waadaa ni galtu:",
    sec3Bullet1: "Ragaalee sobaa fi dhimmoota fraudulent ta'an dhiyeessuu dhabuu.",
    sec3Bullet2: "Vaayirasii ykn faayila hojii keenya miidhuu danda'u kuusaa keessatti fe'uu dhabuu.",
    sec3Bullet3: "Daashboordii hojjettootaa irratti heeyyama utuu hin qabaatin seenuuf yaaluu dhabuu.",
    sec4Title: "4. AI Legal Guide Disclaimer",
    sec4Body: "Ragaan AI keenya seera adaba yakkaa Itoophiyaa irratti hundaa'e. Kuni gorsa seeraa isa dhumaa waan hin taaneef, gorsa seeraa ogummaa qabu waliin ilaalamuun qaba.",
    sec5Title: "5. Secure Storage Limits",
    sec5Body: "Kuusaan keenya ragaa dhuunfaa encryption olaanaadhaan eega. Ragaaleen keessan heeyyama keessaniin ala eenyuufiyyuu hin dabarfaman.",
    sec6Title: "6. Modifications to Service",
    sec6Body: "Nageenya keessan eeguuf tajaajila keenya yeroo yerootti ni fooyyessina. Haalawwan fooyya'iinsa tajaajilaa mirgi keenya eegamadha."
  },
  so: {
    title: "Shuruucda Adeegga",
    lastUpdated: "Cusboonaysiintii Ugu Dambaysay: May 2026",
    safetyNotice: "OGAYSIIISKA NAGEENYADA: Haddii aad ka walwalayso taariikhda aaladaada ama casharkaaga hadda la kormeeyo, fadlan guji badhanka 'Quick Exit' ee ku yaal dhanka midig ee hoose. Waxay isla markiiba tirtiri doontaa dhammaan xogta casharka waxayna kugu wareejin doontaa Google.",
    sec1Title: "1. Ku Raacitaanka Shuruucda",
    sec1Body: "Ku soo dhawaada Netsanet. Adeegsiga madashayada waxay muujinaysaa inaad aqbashay shuruucda adeegga. Haddii aadan aqbalin, fadlan xir madasha hadda.",
    sec2Title: "2. Asturnaanta & Ilaalinta Badbaadayaasha",
    sec2Body: "Netsanet waxaa ka go'an ilaalinta badbaadayaasha. Waxaa laguu ogolaaday inaad kiiskaaga u soo gudbiso si qarsoodi ah.",
    sec3Title: "3. Isticmaalka Mamnuuca ah",
    sec3Body: "Markaad isticmaalayso madashan, waxaad ogolaatay inaadan:",
    sec3Bullet1: "Gubin faahfaahin been abuur ah oo ku saabsan kiiska.",
    sec3Bullet2: "Soo upload-garayn faylal waxyeelo u geysan kara nidaamka.",
    sec3Bullet3: "Isku dayin inaad gasho qaybaha maamulka ee aan laguu ogolayn.",
    sec4Title: "4. Masuuliyad La'aanta AI",
    sec4Body: "Hagaha sharciga ee AI wuxuu ku salaysan yahay xeerka ciqaabta ee Itoobiya. Ma aha talo sharci oo rasmi ah, fadlan la tasho qareen.",
    sec5Title: "5. Xaddidnaanta Kaydinta Sugan",
    sec5Body: "Kaydka cadaymaha wuxuu isticmaalaa encryption adag. Netsanet wuxuu xaq u leeyahay inuu xaddido booska kaydka haddii loo baahdo.",
    sec6Title: "6. Wax ka Beddelka Adeegga",
    sec6Body: "Netsanet wuxuu sii wadayaa hagaajinta nidaamka si loo sugo badbaadada isticmaalayaasha."
  },
  aa: {
    title: "Terms of Service (Afar)",
    lastUpdated: "May 2026",
    safetyNotice: "SAFETY NOTICE: Macallay, aysinnih kah aydagtelem gactamkeh concern yallu, jala guba alfi 'Quick Exit' button cuqisay. Kaadu Google wadirih kaxxeela.",
    sec1Title: "1. Platform Agreement",
    sec1Body: "Netsanet anonymous safe portal accessible. Terms of use fully binding.",
    sec2Title: "2. Survivor Protection Clauses",
    sec2Body: "Survivors anonym case reports JetBrains Mono Case ID. Attempts to breach safety strictly prohibited.",
    sec3Title: "3. Prohibited Actions",
    sec3Body: "Platform security limits:",
    sec3Bullet1: "No fraudulent case reporting.",
    sec3Bullet2: "No virus uploads to Evidence Locker.",
    sec3Bullet3: "No administrative dashboard brute-force entry attempts.",
    sec4Title: "4. AI RAG System Disclaimers",
    sec4Body: "Legal guide support penal code documents. Not official binding lawyer-client relationship.",
    sec5Title: "5. Safe Storage Lockers",
    sec5Body: "Evidence Locker secure encryption. Staff redacted access active.",
    sec6Title: "6. Security Modifications",
    sec6Body: "Safety upgrades fully reserved by Netsanet engineering team."
  }
};

export default function TermsPage() {
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
