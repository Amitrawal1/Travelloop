import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Logo, { BRAND_NAME } from '../components/Logo';
import SiteFooter from '../components/SiteFooter';
import TripReadOnly from '../components/TripReadOnly';
import { getPublicTrip } from '../api';

// Public, read-only page for a trip shared via link (/t/:shareCode). No login required.
export default function SharedTrip() {
  const { shareCode } = useParams();
  const [state, setState] = useState({ status: 'loading', trip: null });

  useEffect(() => {
    getPublicTrip(shareCode)
      .then((res) => setState({ status: 'ready', trip: res.data }))
      .catch(() => setState({ status: 'missing', trip: null }));
  }, [shareCode]);

  return (
    <div className="min-h-screen bg-[#E5F0E0] text-gray-900 font-sans flex flex-col">
      <header className="h-[80px] flex items-center justify-between px-6 md:px-8 border-b border-[#d6e7cc]">
        <Link to="/" className="group" aria-label={`${BRAND_NAME} home`}>
          <Logo size={36} textClassName="text-[#1a1a1a] text-2xl md:text-3xl" />
        </Link>
        <Link to="/auth" className="px-4 py-2 rounded-full bg-[#152010] text-white text-sm font-semibold hover:bg-[#749962] transition-colors">
          Plan your own trip
        </Link>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-10">
        {state.status === 'loading' && <div className="h-64 rounded-3xl bg-white/60 animate-pulse" />}
        {state.status === 'missing' && (
          <div className="bg-white border border-[#d6e7cc] rounded-3xl p-10 text-center">
            <h1 className="text-2xl font-black text-[#152010]">This trip isn’t available</h1>
            <p className="text-gray-600 mt-2">The link may be wrong, or the owner stopped sharing it.</p>
          </div>
        )}
        {state.status === 'ready' && <TripReadOnly trip={state.trip} />}
      </main>

      <SiteFooter />
    </div>
  );
}
