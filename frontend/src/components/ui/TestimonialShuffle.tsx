import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  role: string;
}

export default function TestimonialShuffle() {
  const { t } = useTranslation('landing');
  const [order, setOrder] = useState([0, 1, 2]);

  const shuffle = () =>
    setOrder(prev => {
      const next = [...prev];
      next.push(next.shift()!);
      return next;
    });

  const testimonials: Testimonial[] = [
    {
      id: 1,
      quote: t('cinematic.testimonial1_quote'),
      author: t('cinematic.testimonial1_author'),
      role: t('cinematic.testimonial1_role'),
    },
    {
      id: 2,
      quote: t('cinematic.testimonial2_quote'),
      author: t('cinematic.testimonial2_author'),
      role: t('cinematic.testimonial2_role'),
    },
    {
      id: 3,
      quote: t('cinematic.testimonial3_quote'),
      author: t('cinematic.testimonial3_author'),
      role: t('cinematic.testimonial3_role'),
    },
  ];

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[340px]">
      <div className="relative w-[300px] sm:w-[340px] h-[320px]">
        {order.map((testimonialIndex, stackIndex) => (
          <Card
            key={testimonials[testimonialIndex].id}
            testimonial={testimonials[testimonialIndex]}
            stackIndex={stackIndex}
            onShuffle={shuffle}
          />
        ))}
      </div>
      <button
        onClick={shuffle}
        className="liquid-glass rounded-full px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted hover:text-heading transition-colors"
      >
        {t('cinematic.nextStory')}
      </button>
    </div>
  );
}

function Card({
  testimonial,
  stackIndex,
  onShuffle,
}: {
  testimonial: Testimonial;
  stackIndex: number;
  onShuffle: () => void;
}) {
  const dragX = useRef(0);
  const isFront = stackIndex === 0;

  const variants = [
    { rotate: -3, x: 0,  y: 0,  scale: 1,    opacity: 1,    zIndex: 30 },
    { rotate:  1, x: 14, y: 14, scale: 0.95,  opacity: 0.7,  zIndex: 20 },
    { rotate:  5, x: 28, y: 28, scale: 0.90,  opacity: 0.35, zIndex: 10 },
  ] as const;

  return (
    <motion.div
      animate={variants[Math.min(stackIndex, 2)]}
      transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] as const }}
      drag={isFront}
      dragElastic={0.35}
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      onDragStart={(e: any) => { dragX.current = e.clientX ?? 0; }}
      onDragEnd={(e: any) => {
        if (Math.abs(dragX.current - (e.clientX ?? 0)) > 80) onShuffle();
        dragX.current = 0;
      }}
      className={`absolute inset-0 rounded-2xl border transition-all duration-300 select-none ${
        isFront ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
      } ${
        isFront 
          ? 'dark:bg-[#111E30] bg-surface dark:border-white/10 border-border shadow-md' 
          : 'dark:bg-[#111E30]/75 bg-surface/75 dark:border-white/5 border-border/50'
      }`}
    >
      <div className={`flex flex-col justify-between h-full p-6 transition-opacity duration-300 ${isFront ? 'opacity-100' : 'opacity-0'}`}>
        <p className="dark:text-white/80 text-body text-[14px] sm:text-[15px] italic leading-relaxed">
          &ldquo;{testimonial.quote}&rdquo;
        </p>
        <div className="border-t dark:border-white/10 border-border pt-3">
          <p className="dark:text-white text-heading text-sm font-semibold">{testimonial.author}</p>
          <p className="dark:text-white/40 text-muted text-xs mt-0.5">{testimonial.role}</p>
        </div>
      </div>
    </motion.div>
  );
}
