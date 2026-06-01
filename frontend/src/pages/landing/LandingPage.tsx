// LandingPage — cinematic dark redesign.
// Full-screen image hero, liquid glass nav, editorial DM Serif Display typography.
// Route: /

import { useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle';
import QuickExitButton from '../../components/ui/QuickExitButton';
import TestimonialShuffle from '../../components/ui/TestimonialShuffle';
import Logo from '../../components/ui/Logo';


// ─── Animation helpers ─────────────────────────────────────────────
const E = [0.215, 0.61, 0.355, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease: E } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.13 } } };

function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} variants={fadeUp} initial="hidden" animate={visible ? 'show' : 'hidden'} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('landing');

  const features = t('features.items', { returnObjects: true }) as { title: string; description: string }[];
  const steps    = t('howItWorks.steps',  { returnObjects: true }) as { step: string; title: string; description: string }[];

  return (
    <div className="bg-bg text-body transition-colors duration-300 min-h-screen">
      <QuickExitButton />

      {/* ══════════════════════════════════════════════════════════
          HERO — full-screen cinematic image with liquid glass nav
      ══════════════════════════════════════════════════════════ */}
      <section className="relative h-screen min-h-[680px] flex flex-col overflow-hidden">
        {/* Background photo */}
        <div className="absolute inset-0 select-none">
          <img
            src="https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=1920&q=80"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="w-full h-full object-cover object-center"
          />
          {/* Cinematic gradient overlay that shifts beautifully with theme background */}
          <div className="absolute inset-0 bg-gradient-to-b from-bg/15 via-transparent to-bg/35 dark:from-bg/65 dark:via-bg/45 dark:to-bg/85 transition-colors duration-300" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg/10 via-transparent to-transparent dark:from-bg/30 transition-colors duration-300" />
        </div>

        {/* ── Liquid glass navbar (!overflow-visible resolves LanguageSwitcher dropdown clipping) ── */}
        <nav className="relative z-20 px-3 pt-4 sm:px-4 sm:pt-5 md:px-8 !overflow-visible">
          <div className="liquid-glass rounded-2xl px-3 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between max-w-7xl mx-auto !overflow-visible gap-1 sm:gap-2">
            {/* Logo */}
            <button onClick={() => navigate('/')} className="focus:outline-none shrink-0">
              <Logo size="md" className="scale-[0.85] sm:scale-100 origin-left" />
            </button>

            {/* Centre links — REMOVED per user request */}

            {/* Right controls */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <div className="scale-[0.85] sm:scale-100 origin-right flex items-center gap-1 sm:gap-2">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
              <button
                onClick={() => navigate('/login')}
                className="bg-primary hover:bg-primary-hover text-primary-fg px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl text-[11px] sm:text-sm font-bold transition-all shadow-sm shrink-0 whitespace-nowrap"
              >
                {t('hero.cta')}
              </button>
            </div>
          </div>
        </nav>

        {/* ── Hero content ── */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="max-w-4xl space-y-6"
          >
            {/* Pill badge */}
            <motion.div variants={fadeUp} className="flex justify-center">
              <div className="liquid-glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 border border-white/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white/85 text-xs font-semibold tracking-wide">{t('cinematic.servingEthiopia')}</span>
              </div>
            </motion.div>

            {/* Main headline — large italic DM Serif Display */}
            <motion.h1
              variants={fadeUp}
              className="font-serif italic text-5xl sm:text-6xl md:text-7xl lg:text-[5.25rem] text-white leading-[1.06] tracking-tight"
            >
              {t('hero.title')}
            </motion.h1>

            {/* Subtitle */}
            <motion.p variants={fadeUp} className="text-white/85 text-base md:text-lg max-w-xl mx-auto leading-relaxed font-medium">
              {t('hero.subtitle')}
            </motion.p>

            {/* CTA row */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => navigate('/login')}
                className="bg-primary hover:bg-primary-hover text-primary-fg px-8 py-3.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 shadow-md active:scale-[0.97]"
              >
                {t('hero.cta')} <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#features"
                className="liquid-glass border border-white/20 text-white px-8 py-3.5 rounded-full text-sm font-bold hover:bg-white/10 transition-all shadow-sm"
              >
                {t('hero.ctaSecondary')}
              </a>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <div className="relative z-10 flex justify-center pb-7">
          <ChevronDown className="h-5 w-5 text-muted/50 animate-bounce" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════════════ */}
      <section className="border-y border-border bg-bg transition-colors duration-300">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-3 divide-x divide-y lg:divide-y-0 divide-border">
          {[
            { value: '20+',  label: t('stats.institutions') },
            { value: '6',    label: t('stats.languages') },
            { value: '24/7', label: t('stats.available') },
          ].map((s, i) => (
            <Reveal key={i} className="px-8 py-8 text-center">
              <p className="font-mono text-3xl font-extrabold text-heading sm:text-4xl">{s.value}</p>
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          EDITORIAL MISSION — asymmetric two-column
      ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-bg py-24 md:py-32 transition-colors duration-300">
        {/* Editorial watermark background image */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20 pointer-events-none select-none">
          <img
            src="https://images.unsplash.com/photo-1745962981417-45b9da55456d?w=1400&h=900&fit=crop&auto=format"
            alt=""
            className="w-full h-full object-cover object-center filter grayscale mix-blend-multiply dark:mix-blend-overlay"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-bg/75 via-bg/30 to-bg/75 transition-colors duration-300 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-12 grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#1A7A6E] mb-5">{t('cinematic.ourMission')}</p>
            <h2 className="font-serif italic text-4xl md:text-5xl lg:text-[3.5rem] text-heading leading-[1.1]">
              &ldquo;{t('cinematic.missionStatement')}&rdquo;
            </h2>
          </Reveal>
          <Reveal className="space-y-6">
            <p className="text-body text-base leading-relaxed">
              {t('cinematic.missionDesc')}
            </p>
            <div className="space-y-3">
              {[
                t('cinematic.missionPoint1'),
                t('cinematic.missionPoint2'),
                t('cinematic.missionPoint3'),
                t('cinematic.missionPoint4')
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-muted">
                  <div className="h-px w-5 bg-primary shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FEATURES — numbered dark cards, no icon boxes
      ══════════════════════════════════════════════════════════ */}
      <section id="features" className="bg-surface py-24 md:py-32 border-b border-border transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-5 md:px-12">
          <Reveal className="mb-14 max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#1A7A6E] mb-3">{t('features.badge')}</p>
            <h2 className="font-serif text-4xl md:text-5xl text-heading leading-tight">{t('features.title')}</h2>
          </Reveal>

          <motion.div
            variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {features.map((f, i) => (
              <motion.div
                key={i} variants={fadeUp}
                className="bg-bg rounded-2xl p-6 border border-border hover:border-primary/20 transition-all group hover:shadow-sm"
              >
                <span className="font-mono text-[11px] text-[#1A7A6E] font-bold tracking-widest mb-4 block">
                  0{i + 1}
                </span>
                <h3 className="font-serif text-xl text-heading mb-3 leading-snug group-hover:text-[#1A7A6E] transition-colors">{f.title}</h3>
                <p className="text-body/85 text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          HOW IT WORKS — editorial large numbered steps
      ══════════════════════════════════════════════════════════ */}
      <section id="how" className="relative overflow-hidden bg-bg py-24 md:py-32 transition-colors duration-300">
        {/* Unity watermark background image */}
        <div className="absolute inset-0 opacity-35 dark:opacity-25 pointer-events-none select-none">
          <img
            src="https://images.unsplash.com/photo-1754278583641-eb643828799e?w=700&h=700&fit=crop&auto=format"
            alt=""
            className="w-full h-full object-cover object-center filter grayscale mix-blend-multiply dark:mix-blend-overlay"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-bg/75 via-bg/35 to-bg/75 transition-colors duration-300 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-12">
          <Reveal className="mb-14">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#1A7A6E] mb-3">{t('howItWorks.badge')}</p>
            <h2 className="font-serif text-4xl md:text-5xl text-heading">{t('howItWorks.title')}</h2>
          </Reveal>

          <motion.div
            variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 md:gap-12"
          >
            {steps.map((s, i) => (
              <motion.div key={i} variants={fadeUp} className="relative">
                <span className="font-mono text-[4.5rem] font-extrabold leading-none text-heading/5 select-none block mb-3">
                  {s.step}
                </span>
                <div className="h-px w-10 bg-[#1A7A6E] mb-5" />
                <h3 className="font-serif text-2xl text-heading mb-3">{s.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{s.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TESTIMONIALS — asymmetric split with interactive cards
      ══════════════════════════════════════════════════════════ */}
      <section id="stories" className="relative overflow-hidden bg-surface py-24 md:py-32 border-b border-border transition-colors duration-300">
        {/* Human connection watermark background image */}
        <div className="absolute inset-0 opacity-28 dark:opacity-15 pointer-events-none select-none">
          <img
            src="https://images.unsplash.com/photo-1774504798113-a03e2aa24789?w=800&h=700&fit=crop&auto=format"
            alt=""
            className="w-full h-full object-cover object-center filter grayscale mix-blend-multiply dark:mix-blend-overlay"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-surface/75 via-surface/35 to-surface/75 transition-colors duration-300 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-12 grid md:grid-cols-2 gap-16 items-center">
          <Reveal className="space-y-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#1A7A6E]">{t('cinematic.realStories')}</p>
            <h2 className="font-serif italic text-4xl md:text-5xl text-heading leading-tight">
              {t('cinematic.makingDifference')}
            </h2>
            <p className="text-body/85 text-sm leading-relaxed max-w-md">
              {t('cinematic.storiesDesc')}
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border">
              <div>
                <p className="font-mono text-3xl font-extrabold text-[#1A7A6E]">60%</p>
                <p className="text-muted text-xs mt-1 uppercase tracking-wide font-semibold">{t('cinematic.fasterResponse')}</p>
              </div>
              <div>
                <p className="font-mono text-3xl font-extrabold text-[#1A7A6E]">98%</p>
                <p className="text-muted text-xs mt-1 uppercase tracking-wide font-semibold">{t('cinematic.userTrust')}</p>
              </div>
            </div>
          </Reveal>

          <div className="flex justify-center">
            <TestimonialShuffle />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PARTNERS
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-bg py-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-5 md:px-12">
          <Reveal className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted">{t('cinematic.trustedBy')}</p>
          </Reveal>
          <motion.div
            variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { name: 'MoWSA',  desc: t('cinematic.mowsa') },
              { name: 'EWLA',   desc: t('cinematic.ewla') },
              { name: 'AASTU',  desc: t('cinematic.aastu') },
              { name: 'UNICEF', desc: t('cinematic.unicef') },
            ].map((p, i) => (
              <motion.div
                key={i} variants={fadeUp}
                className="rounded-2xl border border-border bg-surface p-4 text-center hover:border-primary/20 transition-all hover:shadow-sm"
              >
                <p className="font-serif text-base font-bold text-heading">{p.name}</p>
                <p className="text-[10px] text-muted mt-1 uppercase tracking-wide leading-snug font-medium">{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CTA — image-backed split panel
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-surface border-t border-border py-24 md:py-32 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-5 md:px-12">
          <Reveal className="relative rounded-[28px] overflow-hidden shadow-md">
            {/* Background image */}
            <div className="absolute inset-0 select-none">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1400&q=80"
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-surface/95 via-surface/80 to-transparent" />
            </div>
            <div className="relative z-10 p-10 md:p-16 max-w-xl">
              <h2 className="font-serif italic text-4xl md:text-5xl text-heading mb-5 leading-tight">
                {t('cta.title')}
              </h2>
              <p className="text-body text-base leading-relaxed mb-8 font-medium">
                {t('cta.subtitle')}
              </p>
              <button
                onClick={() => navigate('/login')}
                className="bg-primary hover:bg-primary-hover text-primary-fg px-8 py-3.5 rounded-full text-sm font-bold transition-colors flex items-center gap-2 shadow-md"
              >
                {t('cta.button')} <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-4 text-xs text-muted font-medium">{t('cta.note')}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="bg-bg border-t border-border py-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-5 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="focus:outline-none">
              <Logo size="sm" />
            </button>
            <span className="text-xs text-muted font-medium">{t('footer.tagline')}</span>
          </div>
          <div className="flex gap-6 text-xs font-semibold text-muted">
            <Link to="/privacy" className="hover:text-heading transition-colors">{t('footer.links.privacy')}</Link>
            <Link to="/terms" className="hover:text-heading transition-colors">{t('footer.links.terms')}</Link>
            <a href="mailto:support@netsanet.org" className="hover:text-heading transition-colors">{t('footer.links.contact')}</a>
          </div>
        </div>
        <p className="text-center text-[10px] text-muted/50 font-semibold uppercase tracking-widest mt-7">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </p>
      </footer>
    </div>
  );
}
