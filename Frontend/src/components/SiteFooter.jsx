import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';
import Logo, { BRAND_NAME } from './Logo';

export const CONTACT_EMAIL = 'support@travelloop.app';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Discover with AI', to: '/create-trip' },
      { label: 'Sign in', to: '/auth' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About us', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'FAQ', to: '/faq' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms & Conditions', to: '/terms' },
      { label: 'Cookie Policy', to: '/cookies' },
    ],
  },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#111111] border-t border-[#1f1f1f] mt-16 text-gray-400">
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <Link to="/dashboard" className="group inline-block" aria-label={`${BRAND_NAME} home`}>
            <Logo size={36} textClassName="text-[#c6e3b6] text-2xl" />
          </Link>
          <p className="text-sm mt-4 max-w-xs leading-relaxed">
            Plan smarter trips: find the best place for your dates, dodge the crowds, and keep your itinerary, budget and packing in one place.
          </p>
          <div className="mt-5 space-y-2 text-sm">
            <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail size={15} /> {CONTACT_EMAIL}
            </a>
            <p className="flex items-center gap-2"><MapPin size={15} /> Made in India</p>
          </div>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-white font-bold text-sm uppercase tracking-wider mb-4">{col.title}</p>
            <ul className="space-y-3 text-sm">
              {col.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-[#a3ff00] transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-[#1f1f1f]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs">
          <p>© {year} {BRAND_NAME}. All rights reserved.</p>
          <p>Crowd levels are forecasts based on seasons, holidays and weekends.</p>
        </div>
      </div>
    </footer>
  );
}
