import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useInView, useMotionValueEvent } from 'framer-motion';
import StickyStepCard, { STEPS } from './components/landing/StickyStepCard';
import Particles from './components/landing/Particles';
import ShinyText from './components/landing/ShinyText';
import CpuArchitecture from './components/landing/CpuArchitecture';

const DOJO_STEPS = [
  { label: 'Smart Itineraries' },
  { label: 'Discover & Explore' },
  { label: 'Auto-Budgeting' },
  { label: 'Share the Journey' },
];

export default function IntroPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const cardsRef = useRef(null);
  const ctaRef = useRef(null);

  const [activeStep, setActiveStep] = useState(0);

  // Scroll progress through the hero DOJO section
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end end'],
  });

  // Update active step based on scroll
  useMotionValueEvent(heroProgress, 'change', (latest) => {
    const step = Math.min(
      Math.floor(latest * DOJO_STEPS.length),
      DOJO_STEPS.length - 1
    );
    setActiveStep(step);
  });

  // Scroll progress through sticky cards
  const { scrollYProgress: cardsProgress } = useScroll({
    target: cardsRef,
    offset: ['start start', 'end end'],
  });

  // Page background: dark green → light green as 4th card approaches
  const backgroundColor = useTransform(
    cardsProgress,
    [0.7, 1],
    ['#152010', '#c6e3b6']
  );

  // Detect CTA section to switch the button
  const ctaInView = useInView(ctaRef, { margin: '-40% 0px -40% 0px' });

  return (
    <motion.div className="min-h-screen text-white relative" style={{ backgroundColor }}>
      {/* Global gradient overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(134,185,155,0.13) 0%, rgba(58,81,47,0.07) 40%, transparent 70%)',
        }}
      />

      {/* ─── HERO: Scroll through DOJO 1–4 (one at a time) ─── */}
      {/* Each step gets 150vh → total 600vh */}
      <section ref={heroRef} className="relative" style={{ height: `${DOJO_STEPS.length * 150}vh` }}>
        <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">

          {/* Particles backdrop */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_20%,rgba(134,185,155,0.14)_0%,rgba(58,81,47,0.08)_38%,transparent_72%)]" />
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <Particles
                particleColors={['#a3ff00']}
                particleCount={300}
                particleSpread={10}
                speed={0.08}
                particleBaseSize={80}
                moveParticlesOnHover
                alphaParticles={false}
                disableRotation={false}
                pixelRatio={1}
              />
            </div>
          </div>

          {/* AnimatePresence: only ONE step visible at a time */}
          <div className="relative w-full h-full flex items-center justify-center z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, scale: 0.88, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.12, y: -30 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
              >
                <h1 className="text-6xl md:text-[9rem] font-black tracking-tighter text-white leading-none mb-6">
                  {DOJO_STEPS[activeStep].label}
                </h1>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Scroll hint */}
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
            animate={{ opacity: activeStep === 0 ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-white/40 text-xs tracking-widest uppercase">Scroll</span>
            <div className="w-px h-10 bg-white/20 animate-pulse" />
          </motion.div>

          {/* Step indicator dots */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
            {DOJO_STEPS.map((_, i) => (
              <motion.div
                key={i}
                animate={{ scale: i === activeStep ? 1.4 : 1, opacity: i === activeStep ? 1 : 0.3 }}
                transition={{ duration: 0.3 }}
                className="w-2 h-2 rounded-full bg-white"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── STICKY STEP CARDS ─── */}
      <section ref={cardsRef} className="relative pt-16 md:pt-20">
        <div className="relative" style={{ height: `${STEPS.length * 100}vh` }}>
          {STEPS.map((step, i) => (
            <StickyStepCard
              key={i}
              step={step}
              index={i}
              total={STEPS.length}
              scrollYProgress={cardsProgress}
            />
          ))}
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section
        ref={ctaRef}
        className="relative bg-[#749962] px-8 pb-48 pt-28 flex flex-col items-center justify-center text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
            Your next trip is<br />one click away
          </h2>
          <p className="text-white/70 text-xl md:text-2xl">
            Start with a blank canvas — we'll handle the budget math.
          </p>
        </motion.div>
      </section>

      {/* ─── FIXED FLOATING BUTTON ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={() => navigate('/auth')}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] cursor-pointer group bg-[#1a1a1a] border border-white/10 rounded-full p-2 pl-6 flex items-center shadow-2xl shadow-black/50 transition-all hover:scale-105 active:scale-95 overflow-hidden"
        style={{ minWidth: 260 }}
      >
  {/* Default: Travelloop + Enter */}
        <motion.div
          animate={{ opacity: ctaInView ? 0 : 1, y: ctaInView ? -8 : 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-8 w-full"
          style={{ position: ctaInView ? 'absolute' : 'relative', pointerEvents: ctaInView ? 'none' : 'auto' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-lg border border-white/20">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="white" />
              </svg>
            </div>
            <span className="text-white font-medium text-2xl tracking-tight">Travelloop</span>
          </div>
          <div className="bg-[#a3ff00] text-black px-8 py-3 rounded-full font-bold text-lg group-hover:bg-[#b5ff33] transition-colors">
            Enter
          </div>
        </motion.div>

        {/* CTA mode: Start Planning */}
        <motion.div
          animate={{ opacity: ctaInView ? 1 : 0, y: ctaInView ? 0 : 8 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-4"
          style={{ position: ctaInView ? 'relative' : 'absolute', pointerEvents: ctaInView ? 'auto' : 'none' }}
        >
          <span className="text-white font-medium text-2xl tracking-tight">Start planning</span>
          <div className="bg-[#a3ff00] text-black px-6 py-3 rounded-full font-bold text-lg flex items-center gap-2 group-hover:bg-[#b5ff33] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
