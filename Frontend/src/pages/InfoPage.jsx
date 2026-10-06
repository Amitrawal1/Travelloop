import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import Logo, { BRAND_NAME } from '../components/Logo';
import SiteFooter, { CONTACT_EMAIL } from '../components/SiteFooter';

const LAST_UPDATED = 'October 6, 2026';

const PAGES = {
  about: {
    title: `About ${BRAND_NAME}`,
    intro: 'We help travellers pick the right place at the right time, and keep the whole trip organised in one place.',
    sections: [
      {
        heading: 'Why we built it',
        body: [
          'Planning a trip usually means juggling a group chat, a spreadsheet, a notes app and a dozen browser tabs. And after all that, you often land somewhere packed with every other tourist who had the same long weekend.',
          `${BRAND_NAME} starts from your dates. It looks at seasons, public holidays, long weekends and festivals to forecast how crowded each destination will be, and suggests quieter places with a similar feel.`,
        ],
      },
      {
        heading: 'What you can do',
        list: [
          'Find the best destinations for your dates, with crowd and weather forecasts',
          'Get less-crowded alternatives and better-date suggestions',
          'Build a day-by-day itinerary with stops and timings',
          'Track your budget across transport, stays and activities',
          'Keep a packing checklist and trip notes',
          'Share a read-only link to your trip',
        ],
      },
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    sections: [
      { heading: 'How do you know how crowded a place will be?', body: ['We forecast it. Real-time crowd data does not exist for future dates, so we combine each destination’s peak and off seasons, Indian public holidays, long weekends, school vacation periods, festivals and the share of weekend days in your trip. Every forecast shows the reasons behind it.'] },
      { heading: 'Is the weather forecast exact?', body: ['No. We show what the weather was like on the same dates last year, which is a good guide to what to expect but not a guarantee.'] },
      { heading: 'Which destinations are covered?', body: ['We currently focus on India, with popular spots and offbeat alternatives across the country. More regions are planned.'] },
      { heading: 'Is it free?', body: [`Yes, ${BRAND_NAME} is free to use.`] },
      { heading: 'Can I share my trip with friends?', body: ['Yes. Open a trip, go to the Share tab and generate a link. Anyone with the link can view the trip.'] },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: true,
    intro: `This policy explains what information ${BRAND_NAME} collects, how we use it and the choices you have.`,
    sections: [
      { heading: 'Information we collect', list: ['Account details: your name, email address and password. Passwords are stored only in hashed form; we never see them in plain text.', 'Trip content you create: destinations, dates, itineraries, budgets, packing lists, notes.', 'Search preferences you enter when discovering destinations, such as dates, interests, budget and group size.'] },
      { heading: 'How we use it', list: ['To provide the service: saving your trips and showing them back to you.', 'To generate destination suggestions for the dates and preferences you enter.', 'To keep your account secure.'] },
      { heading: 'Services we rely on', body: ['To generate suggestions we may send your trip preferences (not your name or email) to an AI provider. Destination names and coordinates are sent to Open-Meteo for weather history and to Wikipedia for destination photos. These services receive only what is needed for that request.'] },
      { heading: 'Storage on your device', body: ['We store a sign-in token and basic profile details in your browser’s local storage so you stay signed in. Signing out removes them.'] },
      { heading: 'Sharing', body: ['We do not sell your personal information. A trip becomes visible to others only if you create a share link for it.'] },
      { heading: 'Your choices', body: [`You can update your name and email from your profile at any time. To delete your account and data, contact us at ${CONTACT_EMAIL}.`] },
      { heading: 'Changes', body: ['If we change this policy we will update the date at the top of this page.'] },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    updated: true,
    intro: `By creating an account or using ${BRAND_NAME}, you agree to these terms.`,
    sections: [
      { heading: 'Using the service', list: ['You must provide accurate account information and keep your password safe.', 'You are responsible for activity on your account.', 'Do not misuse the service: no attempts to disrupt it, access other users’ data or send automated bulk requests.'] },
      { heading: 'Recommendations are guidance only', body: ['Crowd levels, weather, costs and destination suggestions are estimates based on historical patterns and AI. They can be wrong. Always check official sources for travel advisories, road and weather conditions, opening hours, permits and prices before you travel.'] },
      { heading: 'Your content', body: ['You own the trips, notes and other content you create. You give us permission to store and display it to provide the service, including to people you share a trip link with.'] },
      { heading: 'Bookings and third parties', body: [`${BRAND_NAME} does not sell tickets or accommodation. Any booking you make with an airline, hotel or other provider is between you and that provider.`] },
      { heading: 'Liability', body: [`The service is provided “as is”. To the extent permitted by law, ${BRAND_NAME} is not liable for losses arising from travel decisions made using the service.`] },
      { heading: 'Ending your account', body: [`You can stop using ${BRAND_NAME} at any time. We may suspend accounts that break these terms.`] },
      { heading: 'Contact', body: [`Questions about these terms: ${CONTACT_EMAIL}.`] },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    updated: true,
    sections: [
      { heading: 'Do we use cookies?', body: [`${BRAND_NAME} does not use advertising or tracking cookies.`] },
      { heading: 'Local storage', body: ['We use your browser’s local storage to keep you signed in (a sign-in token and your name and email). This is essential for the app to work. It is cleared when you sign out, or you can clear it from your browser settings.'] },
      { heading: 'Third-party content', body: ['Destination photos are loaded from Wikipedia/Wikimedia and Unsplash. Those services may set their own cookies under their own policies.'] },
    ],
  },
};

function ContactForm() {
  const [form, setForm] = useState({ name: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    const body = `${form.message}\n\n— ${form.name}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(form.subject || 'Hello from Travelloop')}&body=${encodeURIComponent(body)}`;
  };

  const input = 'w-full bg-white border border-[#d6e7cc] rounded-xl px-4 py-3 outline-none focus:border-[#749962] transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      <div>
        <label htmlFor="c-name" className="block text-sm font-semibold text-[#152010] mb-1">Your name</label>
        <input id="c-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
      </div>
      <div>
        <label htmlFor="c-subject" className="block text-sm font-semibold text-[#152010] mb-1">Subject</label>
        <input id="c-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={input} />
      </div>
      <div>
        <label htmlFor="c-message" className="block text-sm font-semibold text-[#152010] mb-1">Message</label>
        <textarea id="c-message" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={input} />
      </div>
      <button type="submit" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#749962] text-white font-bold hover:bg-[#608250] transition-colors">
        <Send size={16} /> Send message
      </button>
      <p className="text-xs text-gray-500">This opens your email app. You can also write to us directly at <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </form>
  );
}

export default function InfoPage({ page }) {
  const navigate = useNavigate();
  const isContact = page === 'contact';
  const content = isContact
    ? { title: 'Contact us', intro: 'Questions, feedback, a destination we should add, or a bug you found? We would love to hear from you.', sections: [] }
    : PAGES[page];

  return (
    <div className="min-h-screen bg-[#E5F0E0] text-gray-900 font-sans flex flex-col">
      <header className="h-[80px] bg-[#E5F0E0] flex items-center justify-between px-6 md:px-8 sticky top-0 z-40 border-b border-[#d6e7cc]">
        <Link to="/dashboard" className="group" aria-label={`${BRAND_NAME} home`}>
          <Logo size={36} textClassName="text-[#1a1a1a] text-2xl md:text-3xl" />
        </Link>
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-[#608250] hover:text-[#152010] transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12">
        <article className="bg-white border border-[#d6e7cc] rounded-3xl p-6 md:p-10 shadow-xl">
          <h1 className="text-3xl md:text-4xl font-black text-[#152010] tracking-tight">{content.title}</h1>
          {content.updated && <p className="text-sm text-gray-500 mt-2">Last updated: {LAST_UPDATED}</p>}
          {content.intro && <p className="text-lg text-gray-700 mt-5 leading-relaxed">{content.intro}</p>}

          {content.sections.map((s) => (
            <section key={s.heading} className="mt-8">
              <h2 className="text-xl font-bold text-[#152010] mb-3">{s.heading}</h2>
              {s.body?.map((p) => <p key={p} className="text-gray-700 leading-relaxed mb-3">{p}</p>)}
              {s.list && (
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {s.list.map((li) => <li key={li}>{li}</li>)}
                </ul>
              )}
            </section>
          ))}

          {isContact && <ContactForm />}
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
