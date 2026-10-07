import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import IntroPage from './IntroPage';
import NotFound from './pages/NotFound';

import './index.css';

// Everything except the intro page is loaded on demand, so the first visit downloads less.
const Signup = lazy(() => import('./Signup'));
const Landing = lazy(() => import('./Landing'));
const CreateTrip = lazy(() => import('./pages/CreateTrip'));
const InfoPage = lazy(() => import('./pages/InfoPage'));
const SharedTrip = lazy(() => import('./pages/SharedTrip'));

const INFO_PAGES = ['about', 'contact', 'faq', 'privacy', 'terms', 'cookies'];

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#E5F0E0] flex items-center justify-center" role="status" aria-label="Loading">
      <div className="w-10 h-10 rounded-full border-4 border-[#c6e3b6] border-t-[#152010] animate-spin" />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<IntroPage />} />
          <Route path="/auth" element={<Signup />} />
          <Route path="/dashboard" element={<Landing />} />
          <Route path="/create-trip" element={<CreateTrip />} />
          <Route path="/t/:shareCode" element={<SharedTrip />} />
          {INFO_PAGES.map((page) => (
            <Route key={page} path={`/${page}`} element={<InfoPage page={page} />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
