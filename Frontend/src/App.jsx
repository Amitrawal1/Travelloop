import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Signup from './Signup';
import Landing from './Landing';
import IntroPage from './IntroPage';
import CreateTrip from './pages/CreateTrip';
import InfoPage from './pages/InfoPage';

import './index.css';

const INFO_PAGES = ['about', 'contact', 'faq', 'privacy', 'terms', 'cookies'];

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IntroPage />} />
        <Route path="/auth" element={<Signup />} />
        <Route path="/dashboard" element={<Landing />} />
        <Route path="/create-trip" element={<CreateTrip />} />
        {INFO_PAGES.map((page) => (
          <Route key={page} path={`/${page}`} element={<InfoPage page={page} />} />
        ))}
      </Routes>
    </Router>
  );
}

export default App;
