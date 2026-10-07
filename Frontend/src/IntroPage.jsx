import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, CalendarDays, Sparkles, Route, MapPin, Users } from 'lucide-react';
import StickyStepCard from './components/landing/StickyStepCard';
import { STEPS } from './components/landing/steps';
import Logo from './components/Logo';
import SiteFooter from './components/SiteFooter';

const HOW_IT_WORKS = [
  { icon: CalendarDays, title: 'Pick your dates', text: 'Add your travel dates, budget and the kind of trip you want: mountains, beaches, heritage and more.' },
  { icon: Sparkles, title: 'Compare places', text: 'See which destinations suit those dates, how crowded each will be and why, plus the weather and quieter alternatives.' },
  { icon: Route, title: 'Plan & share', text: 'Turn a suggestion into a trip, build it day by day, track the budget and share it with your group.' },
];

export default function IntroPage() {
  const navigate = useNavigate();
  const cardsRef = useRef(null);
  const isSignedIn = Boolean(localStorage.getItem('token') && localStorage.getItem('user'));
  const startHref = isSignedIn ? '/dashboard' : '/auth';

  // Page background: dark green → light green as the last feature card arrives
  const { scrollYProgress: cardsProgress } = useScroll({ target: cardsRef, offset: ['start start', 'end end'] });
  const cardsBackground = useTransform(cardsProgress, [0.7, 1], ['#152010', '#c6e3b6']);

  return (
    <div className="min-h-screen bg-[#152010] text-white font-sans">
      {/* ─── NAV ─── */}
      <header className="sticky top-0 z-50 bg-[#152010]/85 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto h-[72px] px-5 md:px-6 flex items-center justify-between gap-4">
          <Link to="/" className="group" aria-label="Travelloop home">
            <Logo size={36} textClassName="text-white text-2xl" />
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-white/70">
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
          </nav>
          <div className="flex items-center gap-2">
            {isSignedIn ? (
              <Link to="/dashboard" className="px-5 py-2.5 rounded-full bg-[#a3ff00] text-black text-sm font-bold hover:bg-[#b5ff33] transition-colors">Open dashboard</Link>
            ) : (
              <>
                <Link to="/auth" className="hidden sm:inline-block px-4 py-2.5 rounded-full text-sm font-semibold text-white/80 hover:text-white transition-colors">Sign in</Link>
                <Link to="/auth" className="px-5 py-2.5 rounded-full bg-[#a3ff00] text-black text-sm font-bold hover:bg-[#b5ff33] transition-colors">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(163,255,0,0.12)_0%,rgba(116,153,98,0.08)_40%,transparent_75%)]" />
        <div className="relative max-w-4xl mx-auto px-6 pt-20 md:pt-32 pb-8 md:pb-12 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs md:text-sm text-[#c6e3b6]">
              <Sparkles size={14} className="text-[#a3ff00]" /> Crowd forecasts for 65+ Indian destinations
            </span>
            <h1 className="mt-6 text-5xl md:text-7xl font-black tracking-tighter leading-[0.95]">
              Go where the<br className="hidden sm:block" /> <span className="text-[#a3ff00]">crowds aren’t.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              Tell us your dates. Travelloop finds the best places to go, warns you about holiday rushes, suggests quieter alternatives, and helps you plan every day of the trip.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate(startHref)}
                className="group inline-flex items-center gap-2 px-7 py-4 rounded-full bg-[#a3ff00] text-black font-bold text-lg hover:bg-[#b5ff33] hover:scale-[1.03] active:scale-95 transition-all"
              >
                {isSignedIn ? 'Go to your trips' : 'Start planning, it’s free'}
                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
              </button>
              <a href="#how" className="px-7 py-4 rounded-full border border-white/20 text-white/90 font-semibold hover:bg-white/5 transition-colors">
                How it works
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── EXAMPLE FORECAST ─── */}
      <section className="relative max-w-6xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-[#a3ff00] text-sm font-bold uppercase tracking-widest">Know before you go</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-black tracking-tight leading-tight">Long weekend? So is everyone else’s.</h2>
          <p className="mt-5 text-lg text-white/70 leading-relaxed">
            We look at seasons, public holidays, long weekends, school vacations and festivals to forecast how busy each place will be on <em>your</em> dates, and we always show the reasons. If a place will be packed, we suggest one with the same feel and far fewer people.
          </p>
          <ul className="mt-6 space-y-2 text-white/80">
            <li className="flex items-center gap-2"><MapPin size={16} className="text-[#a3ff00]" /> Popular spots and offbeat alternatives across India</li>
            <li className="flex items-center gap-2"><CalendarDays size={16} className="text-[#a3ff00]" /> “Better dates” tips when shifting a week helps</li>
            <li className="flex items-center gap-2"><Users size={16} className="text-[#a3ff00]" /> Built for planning with friends and family</li>
          </ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <p className="absolute -top-7 right-2 text-xs text-white/40">Example forecast · Diwali long weekend</p>
          <div className="bg-white text-[#152010] rounded-3xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-2xl font-black">Manali</p>
                <p className="text-sm text-gray-500">Himachal Pradesh</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-bold"><span className="w-2 h-2 rounded-full bg-red-500" /> High crowd</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {['Very popular destination', 'Diwali long weekend', 'During Diwali holidays'].map((r) => (
                <span key={r} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">{r}</span>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-[#c6e3b6] bg-[#f3f8ef] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#608250]">Less crowded alternative</p>
              <div className="flex items-center justify-between gap-3 mt-1.5">
                <p className="font-black text-lg">Jibhi</p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-bold"><span className="w-2 h-2 rounded-full bg-green-500" /> Low crowd</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Same mountain feel, a fraction of the people.</p>
            </div>
            <p className="mt-4 text-sm text-[#3A512F] bg-[#edf6e7] rounded-xl px-4 py-2.5">💡 Going 1 week later avoids the Diwali long weekend.</p>
          </div>
        </motion.div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how" className="scroll-mt-24 max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-center">How it works</h2>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {HOW_IT_WORKS.map(({ icon: Icon, title, text }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 hover:bg-white/[0.07] hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#a3ff00] text-black flex items-center justify-center"><Icon size={22} /></div>
                <span className="text-5xl font-black text-white/10">{i + 1}</span>
              </div>
              <h3 className="mt-6 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-white/65 leading-relaxed">{text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES (sticky stacking cards) ─── */}
      <motion.section id="features" className="scroll-mt-20" style={{ backgroundColor: cardsBackground }}>
        <div ref={cardsRef} className="relative pt-8" style={{ height: `${STEPS.length * 100}vh` }}>
          {STEPS.map((step, i) => (
            <StickyStepCard key={step.title} step={step} index={i} />
          ))}
        </div>
      </motion.section>

      {/* ─── CTA ─── */}
      <section className="relative bg-[#749962] px-6 pb-28 pt-24 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
            Your next trip is<br />one click away
          </h2>
          <p className="text-white/80 text-xl md:text-2xl mb-10">Free to use. No credit card, no spam.</p>
          <button
            onClick={() => navigate(startHref)}
            className="group inline-flex items-center gap-3 bg-[#1a1a1a] rounded-full pl-7 pr-2 py-2 shadow-2xl hover:scale-105 active:scale-95 transition-transform"
          >
            <span className="text-white font-semibold text-lg">{isSignedIn ? 'Open dashboard' : 'Start planning'}</span>
            <span className="bg-[#a3ff00] text-black rounded-full w-11 h-11 flex items-center justify-center group-hover:bg-[#b5ff33] transition-colors">
              <ArrowRight size={20} />
            </span>
          </button>
        </motion.div>
      </section>

      <div className="-mt-16"><SiteFooter /></div>
    </div>
  );
}
