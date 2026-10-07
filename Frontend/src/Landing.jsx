import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Calendar, User, Plus, Map as MapIcon, Share2, Copy, Send, ArrowUpDown, Settings, LogOut, NotebookPen, ListChecks, Globe2, ClipboardCheck, BarChart3, Sparkles, Mail, Pencil, Award, Plane, Clock, Wallet, Compass, Lock, CalendarDays, Check, Backpack, Route, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import * as api from './api';
import Logo from './components/Logo';
import TripReadOnly from './components/TripReadOnly';
import HeroCollage from './components/HeroCollage';
import { formatINR } from './utils/format';
import SiteFooter from './components/SiteFooter';

// Whole days from today until a YYYY-MM-DD date (negative if in the past).
const daysUntil = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.round((target - today) / 86400000);
};



export default function Landing() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'trip' | 'profile'
  const [tripTab, setTripTab] = useState('itinerary'); // itinerary | budget | share | create | mytrips | itineraryview | citysearch | activitysearch | packing | notes | settings | public
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });
  const navigate = useNavigate();

  // Hero collage fades, shrinks slightly and blurs into the background as the page scrolls over it.
  const { scrollY } = useScroll();
  const heroFade = (y) => Math.min(1, y / (window.innerHeight * 0.6));
  const heroOpacity = useTransform(scrollY, (y) => 1 - heroFade(y));
  const heroScale = useTransform(scrollY, (y) => 1 - heroFade(y) * 0.08);
  const heroBlur = useTransform(scrollY, (y) => `blur(${heroFade(y) * 8}px)`);
  const heroPointer = useTransform(scrollY, (y) => (heroFade(y) > 0.5 ? 'none' : 'auto'));

  // ─── Dynamic State ──────────────────────────────────────
  const [trips, setTrips] = useState([]);
  const [previousTrips, setPreviousTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Create Trip Form
  const [newTrip, setNewTrip] = useState({ name: '', destination: '', startDate: '', endDate: '', description: '' });

  // Settings Form
  const [settingsForm, setSettingsForm] = useState({ name: '', email: '' });

  // Share
  const [shareStatus, setShareStatus] = useState('');

  // Packing
  const [newPackingItem, setNewPackingItem] = useState('');

  // Notes
  const [newNote, setNewNote] = useState('');

  // Budget
  const [newBudget, setNewBudget] = useState({ category: 'transport', name: '', amount: '' });

  // Itinerary
  const [stopDrafts, setStopDrafts] = useState({}); // per-day "add stop" form state, keyed by day id

  // Dashboard sorting
  const [tripSort, setTripSort] = useState('soonest');

  // Explore places
  const [destinations, setDestinations] = useState([]);
  const [placeQuery, setPlaceQuery] = useState('');

  // Password change
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [settingsStatus, setSettingsStatus] = useState(null);

  // Profile
  const [profileDetails, setProfileDetails] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState(null);

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  // ─── Data Fetching ──────────────────────────────────────
  const fetchTrips = useCallback(() =>
    Promise.all([api.getUpcomingTrips(), api.getPreviousTrips()])
      .then(([upRes, prevRes]) => {
        setTrips(upRes.data);
        setPreviousTrips(prevRes.data);
      })
      .catch((err) => {
        // Expired/invalid session: send the user back to sign in
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/auth');
        } else {
          console.error('Failed to fetch trips:', err);
        }
      }), [navigate]);

  useEffect(() => {
    if (user) fetchTrips();
  }, [user, fetchTrips]);

  useEffect(() => {
    if (tripTab !== 'citysearch' || destinations.length) return;
    api.getDestinations()
      .then((res) => setDestinations(res.data.destinations || []))
      .catch((err) => console.error('Failed to load destinations:', err));
  }, [tripTab, destinations.length]);

  useEffect(() => {
    if (currentView !== 'profile') return;
    api.getProfile()
      .then((res) => setProfileDetails(res.data))
      .catch((err) => console.error('Failed to load profile:', err));
  }, [currentView]);

  // ─── Handlers ───────────────────────────────────────────

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const handleTripClick = async (id) => {
    try {
      setLoading(true);
      const res = await api.getTripById(id);
      setSelectedTrip(res.data);
      setShareStatus('');
      setCurrentView('trip');
      setTripTab('itinerary');
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Failed to load trip:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async () => {
    if (!newTrip.name) return alert('Trip name is required');
    try {
      setLoading(true);
      const res = await api.createTrip(newTrip);
      setNewTrip({ name: '', destination: '', startDate: '', endDate: '', description: '' });
      await fetchTrips();
      // Open the new trip straight in the builder
      setSelectedTrip(res.data);
      setTripTab('itinerary');
      window.scrollTo(0, 0);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    try {
      await api.deleteTrip(id);
      await fetchTrips();
      if (selectedTrip?._id === id) {
        setSelectedTrip(null);
        setCurrentView('dashboard');
      }
    } catch {
      alert('Failed to delete trip');
    }
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const res = await api.searchTrips(q);
      setSearchResults(res.data);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleAddDay = async () => {
    if (!selectedTrip) return;
    // Default the new day's date to the next calendar day after the trip start
    let date = '';
    if (selectedTrip.startDate) {
      const d = new Date(`${selectedTrip.startDate}T00:00:00`);
      d.setDate(d.getDate() + selectedTrip.days.length);
      date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    try {
      const res = await api.addDay(selectedTrip._id, { date });
      setSelectedTrip(res.data);
    } catch {
      alert('Failed to add day');
    }
  };

  const handleDeleteDay = async (dayId) => {
    if (!window.confirm('Remove this day and all its stops?')) return;
    try {
      const res = await api.deleteDay(selectedTrip._id, dayId);
      setSelectedTrip(res.data);
    } catch {
      alert('Failed to remove day');
    }
  };

  const draftFor = (dayId) => stopDrafts[dayId] || { title: '', time: '', type: 'activity' };
  const updateDraft = (dayId, patch) =>
    setStopDrafts((d) => ({ ...d, [dayId]: { ...draftFor(dayId), ...patch } }));

  const handleAddStop = async (dayId) => {
    const draft = draftFor(dayId);
    if (!draft.title.trim()) return;
    try {
      const res = await api.addStop(selectedTrip._id, dayId, draft);
      setSelectedTrip(res.data);
      setStopDrafts((d) => ({ ...d, [dayId]: { title: '', time: '', type: draft.type } }));
    } catch {
      alert('Failed to add stop');
    }
  };

  const handleDeleteStop = async (dayId, stopId) => {
    try {
      const res = await api.deleteStop(selectedTrip._id, dayId, stopId);
      setSelectedTrip(res.data);
    } catch {
      alert('Failed to delete stop');
    }
  };

  const handleAddBudgetItem = async () => {
    if (!newBudget.name || !newBudget.amount) return alert('Name and amount required');
    try {
      const res = await api.addBudgetItem(selectedTrip._id, { category: newBudget.category, name: newBudget.name, amount: Number(newBudget.amount) });
      setSelectedTrip(res.data);
      setNewBudget({ category: 'transport', name: '', amount: '' });
    } catch {
      alert('Failed to add budget item');
    }
  };

  const handleDeleteBudgetItem = async (category, itemId) => {
    try {
      const res = await api.deleteBudgetItem(selectedTrip._id, category, itemId);
      setSelectedTrip(res.data);
    } catch {
      alert('Failed to delete budget item');
    }
  };

  const handleAddPackingItem = async () => {
    if (!newPackingItem) return;
    try {
      const res = await api.addPackingItem(selectedTrip._id, { item: newPackingItem });
      setSelectedTrip(res.data);
      setNewPackingItem('');
    } catch {
      alert('Failed to add packing item');
    }
  };

  const handleTogglePacking = async (itemId) => {
    try {
      const res = await api.togglePackingItem(selectedTrip._id, itemId);
      setSelectedTrip(res.data);
    } catch {
      alert('Failed to toggle item');
    }
  };

  const handleDeletePackingItem = async (itemId) => {
    try {
      const res = await api.deletePackingItem(selectedTrip._id, itemId);
      setSelectedTrip(res.data);
    } catch {
      alert('Failed to delete packing item');
    }
  };

  const handleAddNote = async () => {
    if (!newNote) return;
    try {
      const res = await api.addNote(selectedTrip._id, { content: newNote });
      setSelectedTrip(res.data);
      setNewNote('');
    } catch {
      alert('Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const res = await api.deleteNote(selectedTrip._id, noteId);
      setSelectedTrip(res.data);
    } catch {
      alert('Failed to delete note');
    }
  };

  const handleGenerateShareLink = async () => {
    if (!selectedTrip) return;
    try {
      const res = await api.generateShareLink(selectedTrip._id);
      setSelectedTrip((t) => ({ ...t, shareCode: res.data.shareCode, isPublic: true }));
    } catch {
      alert('Failed to generate share link');
    }
  };

  const shareUrl = selectedTrip?.isPublic && selectedTrip?.shareCode
    ? `${window.location.origin}/t/${selectedTrip.shareCode}`
    : '';

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus('Link copied!');
    } catch {
      setShareStatus('Copy failed — select the link and copy it manually.');
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || passwordForm.newPassword.length < 6) {
      setSettingsStatus({ type: 'error', text: 'Enter your current password and a new password of at least 6 characters.' });
      return;
    }
    try {
      await api.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setSettingsStatus({ type: 'success', text: 'Password updated.' });
    } catch (err) {
      setSettingsStatus({ type: 'error', text: err.response?.data?.message || 'Failed to update password.' });
    }
  };

  const openCreateTab = (prefill = {}) => {
    setNewTrip({ name: '', destination: '', startDate: '', endDate: '', description: '', ...prefill });
    setCurrentView('trip');
    setTripTab('create');
    window.scrollTo(0, 0);
  };

  const handleUpdateProfile = async () => {
    const payload = {
      name: settingsForm.name.trim() || user?.name,
      email: settingsForm.email.trim() || user?.email,
    };
    try {
      const res = await api.updateProfile(payload);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setSettingsStatus({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setSettingsStatus({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    }
  };

  const sortedTrips = [...trips].sort((a, b) => {
    if (tripSort === 'name') return a.name.localeCompare(b.name);
    if (tripSort === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
    // soonest first; trips without dates go last
    return (a.startDate || '9999') .localeCompare(b.startDate || '9999');
  });

  // Helper: compute total budget for selectedTrip
  const getTotalBudget = () => {
    if (!selectedTrip?.budget) return 0;
    const { transport, accommodation, activities } = selectedTrip.budget;
    const sum = (arr) => (arr || []).reduce((s, i) => s + (i.amount || 0), 0);
    return sum(transport) + sum(accommodation) + sum(activities);
  };

  const getCategoryTotal = (category) => {
    if (!selectedTrip?.budget?.[category]) return 0;
    return selectedTrip.budget[category].reduce((s, i) => s + (i.amount || 0), 0);
  };


  // Static suggested trips data (not user-specific)
  const suggestedTrips = [
    { id: 101, name: 'Bali Paradise', type: 'Tropical', duration: '7 Days', price: '$850', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1000', highlights: [{ name: 'Ubud Rice Terrace', image: 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?q=80&w=800' }, { name: 'Ulun Danu Temple', image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?q=80&w=800' }, { name: 'Nusa Penida', image: 'https://images.unsplash.com/photo-1558005530-a7958896ec60?q=80&w=800' }] },
    { id: 102, name: 'Tokyo Lights', type: 'City', duration: '5 Days', price: '$1200', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000', highlights: [{ name: 'Shibuya Crossing', image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?q=80&w=800' }, { name: 'Kyoto Day Trip', image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=800' }, { name: 'Tokyo Tower', image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800' }] },
    { id: 103, name: 'Santorini Escape', type: 'Coastal', duration: '6 Days', price: '$1500', image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=1000', highlights: [{ name: 'Oia Sunset', image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?q=80&w=800' }, { name: 'Blue Domes', image: 'https://images.unsplash.com/photo-1571731956672-f2b94d7dd0cb?q=80&w=800' }, { name: 'Red Beach', image: 'https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?q=80&w=800' }] },
    { id: 104, name: 'Machu Picchu', type: 'Adventure', duration: '10 Days', price: '$950', image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=1000', highlights: [{ name: 'Sun Gate', image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=800' }, { name: 'Lima Coastline', image: 'https://images.unsplash.com/photo-1531968455001-5c5272a41129?q=80&w=800' }, { name: 'Huayna Peak', image: 'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?q=80&w=800' }] },
    { id: 105, name: 'Northern Lights', type: 'Winter', duration: '4 Days', price: '$1100', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=1000', highlights: [{ name: 'Aurora Camp', image: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?q=80&w=800' }, { name: 'Ice Cave', image: 'https://images.unsplash.com/photo-1517329782449-810562a4ec2f?q=80&w=800' }, { name: 'Frozen Lake', image: 'https://images.unsplash.com/photo-1478059299873-f047d8c5fe1a?q=80&w=800' }] }
  ];

  const renderDashboard = () => (
    <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
      {/* AI destination discovery entry point */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-[#152010] text-white px-6 py-5 shadow-lg">
        <div>
          <p className="font-bold text-lg">Not sure where to go?</p>
          <p className="text-sm text-white/70">Find the best Indian destinations for your dates, with crowd forecasts.</p>
        </div>
        <button
          onClick={() => navigate('/create-trip')}
          className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#a3ff00] text-black font-bold hover:scale-105 active:scale-95 transition-transform"
        >
          <Sparkles size={16} /> Discover with AI
        </button>
      </div>
      {/* Search and Sort Row */}
      <div className="flex flex-col md:flex-row gap-4 mb-12">
         <div className="flex-1 relative z-30">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search your trips by name or destination..."
              aria-label="Search your trips"
              className="w-full bg-white border border-gray-200 rounded-full py-3.5 pl-12 pr-6 text-sm text-gray-800 outline-none focus:border-[#749962] focus:ring-2 focus:ring-[#749962]/20 transition-all shadow-sm"
            />
            {searchQuery.trim() && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden p-2">
                {searchResults.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-500">No trips match “{searchQuery}”.</p>
                ) : searchResults.map((trip) => (
                  <button
                    key={trip._id}
                    onClick={() => { handleSearch(''); handleTripClick(trip._id); }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#edf6e7] text-[#608250] flex items-center justify-center shrink-0"><MapPin size={14} /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{trip.name}</p>
                      <p className="text-xs text-gray-400 truncate">{trip.destination || 'No destination'}{trip.startDate ? ` · ${trip.startDate}` : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
         </div>
         <label className="shrink-0 flex items-center gap-2 px-5 py-2 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
            <ArrowUpDown size={16} className="text-[#608250]" />
            <span className="sr-only">Sort trips</span>
            <select value={tripSort} onChange={(e) => setTripSort(e.target.value)} className="bg-transparent outline-none py-1.5 cursor-pointer">
              <option value="soonest">Soonest first</option>
              <option value="recent">Recently added</option>
              <option value="name">Name (A–Z)</option>
            </select>
         </label>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black text-[#152010] tracking-tight">My Upcoming Trips</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {trips.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-500">
            <p className="text-lg font-bold mb-2">No upcoming trips yet</p>
            <p className="text-sm mb-5">Create one yourself, or let us suggest a place for your dates.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => openCreateTab()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#152010] text-white font-semibold hover:bg-[#749962] transition-colors"><Plus size={16} /> New trip</button>
              <button onClick={() => navigate('/create-trip')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#152010] text-[#152010] font-semibold hover:bg-white transition-colors"><Sparkles size={16} /> Discover with AI</button>
            </div>
          </div>
        )}
        {sortedTrips.map(trip => (
          <div 
            key={trip._id} 
            onClick={() => handleTripClick(trip._id)}
            className={`bg-[#152010] aspect-[9/16] rounded-2xl p-6 cursor-pointer relative group shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between border ${trip.isActive ? 'border-[#749962]' : 'border-white/10'}`}
          >
            <img
              src={trip.image || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200'}
              alt={trip.name}
              className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-40 group-hover:opacity-50 transition-opacity duration-300"
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-black/20 via-black/35 to-black/85"></div>

            {/* Top Section */}
            <div className="relative z-10">
              {trip.isActive && (
                <div className="inline-block bg-[#749962] text-white text-[10px] font-black px-3 py-1 rounded-full mb-4">
                  ACTIVE
                </div>
              )}
              <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-[#749962] transition-colors">{trip.name}</h3>
            </div>

            {/* Bottom Section */}
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-[#c6e3b6] text-sm mb-3">
                <Calendar size={14} className="text-[#749962]" /> <span>{trip.startDate || 'No date'}{trip.endDate ? ` - ${trip.endDate}` : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-[#c6e3b6] text-sm mb-6">
                <MapPin size={14} className="text-[#749962]" /> <span>{trip.destination || 'No destination'}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-auto">
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     handleTripClick(trip._id);
                   }}
                   className="text-sm font-bold text-[#c6e3b6] hover:text-white transition-colors"
                 >
                   Explore
                 </button>
                 <div className="w-8 h-8 rounded-full bg-[#749962] flex items-center justify-center text-white opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                   <span className="font-bold">&rarr;</span>
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Suggested Trips Section (Slider) */}
      <div className="mt-20 mb-8 w-[100vw] relative left-1/2 -translate-x-1/2">
        <div className="max-w-6xl mx-auto px-6 w-full">
           <h2 className="text-2xl font-black text-[#152010] tracking-tight mb-8">Suggested Trips For You</h2>
        </div>
        
        {/* Slider Container */}
        <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
          {suggestedTrips.map(trip => (
            <div 
              key={trip.id}
              onClick={() => openCreateTab({ name: trip.name, destination: trip.name })}
              title={`Plan a trip: ${trip.name}`}
              className="w-[100vw] min-w-[100vw] h-[400px] md:h-[500px] lg:h-[600px] relative overflow-hidden group cursor-pointer snap-center shrink-0"
            >
              <img src={trip.image} alt={trip.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#152010] via-[#152010]/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="absolute top-6 right-6 w-[260px] max-w-[70vw] bg-black/35 backdrop-blur-md border border-white/20 rounded-2xl p-3 z-20">
                 <p className="text-[11px] uppercase tracking-wider text-[#c6e3b6] font-bold mb-2">Best Spots</p>
                 <div className="grid grid-cols-3 gap-2">
                    {trip.highlights.map((spot) => (
                      <div key={spot.name} className="group/spot">
                        <div className="h-16 rounded-lg overflow-hidden border border-white/15">
                          <img src={spot.image} alt={spot.name} className="w-full h-full object-cover group-hover/spot:scale-105 transition-transform duration-300" />
                        </div>
                        <p className="text-[10px] text-white/90 mt-1 truncate">{spot.name}</p>
                      </div>
                    ))}
                 </div>
              </div>
              
              <div className="absolute bottom-0 left-0 w-full flex flex-col justify-end h-full">
                 <div className="max-w-6xl mx-auto px-6 w-full pb-12">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                          <span className="text-xs font-black bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full mb-4 inline-block uppercase tracking-wider text-[#a3ff00]">{trip.type}</span>
                          <h3 className="text-4xl lg:text-5xl font-black mb-2 text-white group-hover:text-[#a3ff00] transition-colors">{trip.name}</h3>
                          <div className="flex items-center gap-4 text-lg text-[#c6e3b6]">
                             <span className="flex items-center gap-2"><Calendar size={20}/> {trip.duration}</span>
                          </div>
                        </div>
                        <div className="text-left md:text-right">
                           <p className="text-sm text-[#c6e3b6] mb-1">Starting from</p>
                           <p className="text-3xl lg:text-4xl font-black text-[#a3ff00]">{trip.price}</p>
                        </div>
                     </div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Previous Trips Section */}
      <div className="max-w-6xl mx-auto px-6 w-full mb-12">
        <h2 className="text-2xl font-black text-[#152010] tracking-tight mb-8">My Previous Trips</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {previousTrips.map(trip => (
            <div 
              key={trip._id} 
              onClick={() => handleTripClick(trip._id)}
              className="bg-[#152010] aspect-[3/4] rounded-2xl p-6 cursor-pointer relative group shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between border border-white/10"
            >
              <img
                src={trip.image || 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=1200'}
                alt={trip.name}
                className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 grayscale group-hover:grayscale-0"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-black/20 via-black/35 to-black/85"></div>

              {/* Top Section */}
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-[#749962] transition-colors">{trip.name}</h3>
              </div>

              {/* Bottom Section */}
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-[#c6e3b6] text-sm mb-3">
                  <Calendar size={14} className="text-[#749962]" /> <span>{trip.startDate || 'No date'}{trip.endDate ? ` - ${trip.endDate}` : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-[#c6e3b6] text-sm mb-6">
                  <MapPin size={14} className="text-[#749962]" /> <span>{trip.destination || 'No destination'}</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-auto">
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       handleTripClick(trip._id);
                     }}
                     className="text-sm font-bold text-[#c6e3b6] hover:text-white transition-colors"
                   >
                     History
                   </button>
                   <div className="w-8 h-8 rounded-full bg-[#749962] flex items-center justify-center text-white opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                     <span className="font-bold">&rarr;</span>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => openCreateTab()}
        className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-[#152010] text-[#c6e3b6] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-[#152010]/30"
        aria-label="Create New Trip"
        title="Create New Trip"
      >
        <Plus size={24} strokeWidth={3} />
      </button>
    </div>
  );

  const STOP_TYPES = [
    ['activity', 'Activity'],
    ['food', 'Food'],
    ['accommodation', 'Stay'],
    ['transport', 'Transport'],
    ['flight', 'Flight'],
  ];

  const renderItinerary = () => {
    const days = selectedTrip.days || [];
    const stopCount = days.reduce((n, d) => n + d.stops.length, 0);
    return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-[#152010]">Itinerary Builder</h2>
            <p className="text-sm text-gray-500">Plan each day: add the places, meals, stays and transport in order.</p>
          </div>
          <button onClick={handleAddDay} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#152010] text-white font-semibold hover:bg-[#749962] transition-colors">
            <Plus size={16} /> Add day
          </button>
        </div>

        {days.length === 0 && (
          <div className="border-2 border-dashed border-[#c9dcbd] rounded-2xl p-10 text-center bg-white/50">
            <p className="font-bold text-[#152010]">No days yet</p>
            <p className="text-sm text-gray-500 mt-1">Click “Add day” to start planning. Days are dated from your trip’s start date.</p>
          </div>
        )}

        {days.map((day) => {
          const draft = draftFor(day._id);
          return (
            <div key={day._id} className="bg-white border border-[#d6e7cc] rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 bg-[#f8fcf5] border-b border-[#d6e7cc]">
                <h3 className="text-[#152010] font-bold">
                  Day {day.dayNumber}
                  {day.date && <span className="text-gray-500 font-medium ml-2 text-sm">{new Date(`${day.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>}
                </h3>
                <button onClick={() => handleDeleteDay(day._id)} className="text-xs font-semibold text-red-400 hover:text-red-600">Remove day</button>
              </div>

              <div className="p-5">
                {day.stops.length > 0 ? (
                  <ol className="relative pl-6 border-l-2 border-[#d6e7cc] space-y-3 mb-5">
                    {day.stops.map((stop) => (
                      <li key={stop._id} className="relative">
                        <span className="absolute -left-[31px] top-3 w-3 h-3 bg-[#749962] rounded-full border-[3px] border-white" />
                        <div className="bg-[#f8fcf5] p-3.5 rounded-xl border border-[#d6e7cc] flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[#152010] text-sm font-bold truncate">{stop.title}</p>
                            <p className="text-xs text-[#608250] font-semibold mt-0.5">
                              {stop.time || 'Any time'} · {(STOP_TYPES.find(([k]) => k === stop.type) || [null, stop.type])[1]}
                            </p>
                          </div>
                          <button onClick={() => handleDeleteStop(day._id, stop._id)} className="text-xs text-red-400 hover:text-red-600 shrink-0">Remove</button>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-gray-400 mb-4">No stops yet for this day.</p>
                )}

                <form
                  onSubmit={(e) => { e.preventDefault(); handleAddStop(day._id); }}
                  className="flex flex-wrap gap-2"
                >
                  <input
                    value={draft.title}
                    onChange={(e) => updateDraft(day._id, { title: e.target.value })}
                    placeholder="Add a stop, e.g. Sunset at Baga Beach"
                    aria-label={`New stop for day ${day.dayNumber}`}
                    className="flex-1 min-w-[180px] bg-white border border-[#d6e7cc] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#749962]"
                  />
                  <input
                    type="time"
                    value={draft.time}
                    onChange={(e) => updateDraft(day._id, { time: e.target.value })}
                    aria-label="Time"
                    className="bg-white border border-[#d6e7cc] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#749962]"
                  />
                  <select
                    value={draft.type}
                    onChange={(e) => updateDraft(day._id, { type: e.target.value })}
                    aria-label="Stop type"
                    className="bg-white border border-[#d6e7cc] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#749962]"
                  >
                    {STOP_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <button type="submit" disabled={!draft.title.trim()} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#749962] text-white text-sm font-bold hover:bg-[#608250] disabled:opacity-40 transition-colors">
                    <Plus size={15} /> Add
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-[150px] self-start">
        <div className="bg-[#152010] text-white rounded-2xl p-6 shadow-lg">
          <p className="text-[#a3ff00] text-xs font-bold uppercase tracking-widest">Trip at a glance</p>
          <h3 className="text-xl font-black mt-2">{selectedTrip.name}</h3>
          {selectedTrip.destination && <p className="text-white/70 text-sm flex items-center gap-1.5 mt-1"><MapPin size={14} /> {selectedTrip.destination}</p>}
          <div className="grid grid-cols-3 gap-3 mt-5 text-center">
            <div><p className="text-2xl font-black">{days.length}</p><p className="text-xs text-white/60">Days</p></div>
            <div><p className="text-2xl font-black">{stopCount}</p><p className="text-xs text-white/60">Stops</p></div>
            <div><p className="text-2xl font-black">{(selectedTrip.packingList || []).length}</p><p className="text-xs text-white/60">To pack</p></div>
          </div>
          <p className="mt-5 text-sm text-white/70">Budget planned</p>
          <p className="text-2xl font-black text-[#a3ff00]">{formatINR(getTotalBudget())}</p>
        </div>
        <div className="bg-white border border-[#d6e7cc] rounded-2xl p-4 grid grid-cols-2 gap-2 text-sm font-semibold">
          {[['budget', 'Budget', BarChart3], ['packing', 'Packing', ClipboardCheck], ['notes', 'Notes', NotebookPen], ['share', 'Share', Share2]].map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTripTab(key)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-[#edf6e7] text-[#152010] transition-colors">
              <Icon size={15} className="text-[#608250]" /> {label}
            </button>
          ))}
        </div>
      </aside>
    </div>
    );
  };

  const renderBudget = () => {
    const total = getTotalBudget();
    const transportTotal = getCategoryTotal('transport');
    const accommodationTotal = getCategoryTotal('accommodation');
    const activitiesTotal = getCategoryTotal('activities');
    const maxCat = Math.max(transportTotal, accommodationTotal, activitiesTotal, 1);

    return (
    <div className="max-w-5xl mx-auto px-6 py-12">
       <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-10 mb-10 text-center relative overflow-hidden shadow-lg">
          <div className="absolute top-0 left-0 w-2 h-full bg-[#749962]"></div>
          <h2 className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-3">Total Estimated Cost</h2>
          <div className="text-5xl md:text-7xl font-black text-white tracking-tighter">{formatINR(total)}</div>
       </div>
       <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-4">Add Expense</h3>
          <div className="flex flex-wrap gap-3">
             <select value={newBudget.category} onChange={(e) => setNewBudget({...newBudget, category: e.target.value})} className="bg-[#111] border border-gray-700 text-white rounded-lg px-4 py-3 outline-none">
               <option value="transport">Transport</option>
               <option value="accommodation">Accommodation</option>
               <option value="activities">Activities</option>
             </select>
             <input value={newBudget.name} onChange={(e) => setNewBudget({...newBudget, name: e.target.value})} placeholder="Item name" className="flex-1 min-w-[150px] bg-[#111] border border-gray-700 text-white rounded-lg px-4 py-3 outline-none placeholder-gray-500" />
             <input value={newBudget.amount} onChange={(e) => setNewBudget({...newBudget, amount: e.target.value})} type="number" placeholder="Amount (₹)" className="w-32 bg-[#111] border border-gray-700 text-white rounded-lg px-4 py-3 outline-none placeholder-gray-500" />
             <button onClick={handleAddBudgetItem} className="bg-[#749962] text-white px-5 py-3 rounded-lg font-bold hover:bg-[#608250] transition">Add</button>
          </div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-2xl hover:border-gray-700 transition">
             <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-6 flex items-center justify-between">Flights/Transport<Wallet size={16} className="text-gray-500" /></h3>
             <div className="text-4xl font-bold text-[#749962] mb-6">{formatINR(transportTotal)}</div>
             <div className="w-full bg-[#111] h-2.5 rounded-full overflow-hidden mb-6"><div className="bg-[#749962] h-full rounded-full" style={{ width: `${(transportTotal / maxCat) * 100}%` }}></div></div>
             <div className="space-y-4">
                {(selectedTrip?.budget?.transport || []).map(item => (
                  <div key={item._id} className="flex justify-between text-sm border-b border-gray-800 pb-3">
                     <span className="text-gray-400">{item.name}</span>
                     <div className="flex items-center gap-2"><span className="text-white font-bold">{formatINR(item.amount)}</span><button onClick={() => handleDeleteBudgetItem('transport', item._id)} className="text-red-400 text-xs hover:text-red-500">×</button></div>
                  </div>
                ))}
             </div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-2xl hover:border-gray-700 transition">
             <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-6 flex items-center justify-between">Accommodation<Wallet size={16} className="text-gray-500" /></h3>
             <div className="text-4xl font-bold text-[#a3ff00] mb-6">{formatINR(accommodationTotal)}</div>
             <div className="w-full bg-[#111] h-2.5 rounded-full overflow-hidden mb-6"><div className="bg-[#a3ff00] h-full rounded-full shadow-[0_0_10px_rgba(163,255,0,0.3)]" style={{ width: `${(accommodationTotal / maxCat) * 100}%` }}></div></div>
             <div className="space-y-4">
                {(selectedTrip?.budget?.accommodation || []).map(item => (
                  <div key={item._id} className="flex justify-between text-sm border-b border-gray-800 pb-3">
                     <span className="text-gray-400">{item.name}</span>
                     <div className="flex items-center gap-2"><span className="text-white font-bold">{formatINR(item.amount)}</span><button onClick={() => handleDeleteBudgetItem('accommodation', item._id)} className="text-red-400 text-xs hover:text-red-500">×</button></div>
                  </div>
                ))}
             </div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-2xl hover:border-gray-700 transition">
             <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-6 flex items-center justify-between">Activities & Meals<Wallet size={16} className="text-gray-500" /></h3>
             <div className="text-4xl font-bold text-[#e6b333] mb-6">{formatINR(activitiesTotal)}</div>
             <div className="w-full bg-[#111] h-2.5 rounded-full overflow-hidden mb-6"><div className="bg-[#e6b333] h-full rounded-full" style={{ width: `${(activitiesTotal / maxCat) * 100}%` }}></div></div>
             <div className="space-y-4">
                {(selectedTrip?.budget?.activities || []).map(item => (
                  <div key={item._id} className="flex justify-between text-sm border-b border-gray-800 pb-3">
                     <span className="text-gray-400">{item.name}</span>
                     <div className="flex items-center gap-2"><span className="text-white font-bold">{formatINR(item.amount)}</span><button onClick={() => handleDeleteBudgetItem('activities', item._id)} className="text-red-400 text-xs hover:text-red-500">×</button></div>
                  </div>
                ))}
             </div>
          </div>
       </div>
    </div>
    );
  };

  const renderShare = () => {
    const shareText = `Check out my trip plan "${selectedTrip.name}" on Travelloop: ${shareUrl}`;
    return (
    <div className="max-w-xl mx-auto px-6 py-16 text-center">
       <div className="bg-[#1a1a1a] border border-gray-800 p-10 rounded-3xl flex flex-col items-center shadow-xl">
          <div className="w-20 h-20 bg-[#111] border border-gray-800 rounded-full flex items-center justify-center mb-8 relative">
             <div className="absolute inset-0 bg-[#749962] rounded-full opacity-10 animate-pulse"></div>
             <Share2 size={32} className="text-[#749962]" />
          </div>
          <h2 className="text-3xl font-black text-white mb-3">Share the Journey</h2>
          <p className="text-gray-400 text-sm mb-10 leading-relaxed">Create a link to “{selectedTrip.name}” that friends and family can open without an account. They get read-only access to the itinerary, budget total and packing list.</p>

          {!shareUrl ? (
            <button onClick={handleGenerateShareLink} className="w-full bg-[#749962] hover:bg-[#608250] text-white py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm">
               <Share2 size={18} /> Generate Share Link
            </button>
          ) : (
            <>
              <div className="w-full bg-[#111] border border-gray-700 rounded-xl p-2.5 flex items-center gap-3 mb-3">
                 <input type="text" readOnly value={shareUrl} onFocus={(e) => e.target.select()} aria-label="Share link" className="flex-1 min-w-0 bg-transparent text-gray-300 text-sm outline-none px-3 font-mono" />
                 <button onClick={handleCopyShareLink} className="bg-[#749962] hover:bg-[#608250] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-sm shrink-0">
                    <Copy size={16} /> Copy
                 </button>
              </div>
              <p className="text-xs text-[#a3ff00] h-4 mb-6" role="status">{shareStatus}</p>
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" className="border-2 border-[#749962] text-[#749962] hover:bg-[#749962] hover:text-white transition-colors py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm">
                   <Send size={16} /> WhatsApp
                </a>
                <a href={`mailto:?subject=${encodeURIComponent(`Trip plan: ${selectedTrip.name}`)}&body=${encodeURIComponent(shareText)}`} className="border-2 border-[#749962] text-[#749962] hover:bg-[#749962] hover:text-white transition-colors py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm">
                   <Mail size={16} /> Email
                </a>
                <a href={shareUrl} target="_blank" rel="noreferrer" className="border-2 border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm">
                   <Globe2 size={16} /> Open
                </a>
              </div>
            </>
          )}
       </div>
    </div>
    );
  };

  const renderCreateTrip = () => (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="bg-white border border-[#d6e7cc] rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h2 className="text-2xl font-black text-[#152010]">Create New Trip</h2>
          <button onClick={() => navigate('/create-trip')} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#152010] text-[#a3ff00] text-sm font-bold hover:bg-[#22331a] transition-colors">
            <Sparkles size={14} /> Find the best place for your dates
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <input value={newTrip.name} onChange={(e) => setNewTrip({...newTrip, name: e.target.value})} className="bg-[#f8fcf5] border border-[#d6e7cc] rounded-xl px-4 py-3 outline-none focus:border-[#749962]" placeholder="Trip name" />
          <input value={newTrip.destination} onChange={(e) => setNewTrip({...newTrip, destination: e.target.value})} className="bg-[#f8fcf5] border border-[#d6e7cc] rounded-xl px-4 py-3 outline-none focus:border-[#749962]" placeholder="Destination / Region" />
          <input value={newTrip.startDate} onChange={(e) => setNewTrip({...newTrip, startDate: e.target.value})} type="date" className="bg-[#f8fcf5] border border-[#d6e7cc] rounded-xl px-4 py-3 outline-none focus:border-[#749962]" placeholder="Start date" />
          <input value={newTrip.endDate} onChange={(e) => setNewTrip({...newTrip, endDate: e.target.value})} type="date" className="bg-[#f8fcf5] border border-[#d6e7cc] rounded-xl px-4 py-3 outline-none focus:border-[#749962]" placeholder="End date" />
          <textarea value={newTrip.description} onChange={(e) => setNewTrip({...newTrip, description: e.target.value})} className="md:col-span-2 bg-[#f8fcf5] border border-[#d6e7cc] rounded-xl px-4 py-3 outline-none focus:border-[#749962] min-h-28" placeholder="Trip description..." />
        </div>
        <button onClick={handleCreateTrip} disabled={loading} className="mt-6 px-6 py-3 rounded-xl bg-[#749962] text-white font-bold hover:bg-[#608250] transition-colors disabled:opacity-50">
          {loading ? 'Saving...' : 'Save Trip'}
        </button>
      </div>
    </div>
  );

  const renderMyTrips = () => (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h2 className="text-2xl font-black text-[#152010] mb-6">My Trips</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...trips, ...previousTrips].map((trip) => (
          <div key={trip._id} className="bg-white border border-[#d6e7cc] rounded-2xl p-4 shadow-sm">
            <div className="h-40 rounded-xl overflow-hidden mb-4"><img src={trip.image || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800'} alt={trip.name} className="w-full h-full object-cover" /></div>
            <h3 className="font-bold text-[#152010]">{trip.name}</h3>
            <p className="text-sm text-[#608250] mt-1">{trip.startDate || 'No date'}{trip.endDate ? ` - ${trip.endDate}` : ''}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => handleTripClick(trip._id)} className="px-4 py-2 rounded-lg bg-[#edf6e7] text-[#152010] font-semibold">View</button>
              <button onClick={() => handleDeleteTrip(trip._id)} className="px-4 py-2 rounded-lg border border-red-200 text-red-500 font-semibold hover:bg-red-50">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderItineraryView = () => (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h2 className="text-2xl font-black text-[#152010] mb-6">Itinerary View{selectedTrip ? ` — ${selectedTrip.name}` : ''}</h2>
      <div className="space-y-4">
        {(selectedTrip?.days || []).map((day) => (
          <div key={day._id} className="bg-white border border-[#d6e7cc] rounded-2xl p-5">
            <h3 className="font-bold text-[#152010] mb-3">Day {day.dayNumber} {day.date ? `— ${day.date}` : ''}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              {day.stops.map((stop) => (
                <div key={stop._id} className="flex items-center justify-between">
                  <p>{stop.time ? `${stop.time} - ` : ''}{stop.title}</p>
                  <button onClick={() => handleDeleteStop(day._id, stop._id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                </div>
              ))}
              {day.stops.length === 0 && <p className="text-gray-400">No stops added yet</p>}
            </div>
          </div>
        ))}
        {(!selectedTrip?.days || selectedTrip.days.length === 0) && (
          <p className="text-gray-500 text-center py-8">No days added yet. Click "Add Day" in the Builder tab.</p>
        )}
      </div>
    </div>
  );

  const renderCitySearch = () => {
    const q = placeQuery.trim().toLowerCase();
    const matches = destinations.filter((d) =>
      !q || d.name.toLowerCase().includes(q) || d.state.toLowerCase().includes(q) || d.types.some((t) => t.includes(q))
    );
    return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-black text-[#152010]">Explore places</h2>
          <p className="text-sm text-gray-500">Popular spots and quieter alternatives across India.</p>
        </div>
        <button onClick={() => navigate('/create-trip')} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#152010] text-[#a3ff00] text-sm font-bold hover:bg-[#22331a] transition-colors">
          <Sparkles size={14} /> Which is best for my dates?
        </button>
      </div>
      <div className="bg-white border border-[#d6e7cc] rounded-2xl p-4 mb-5">
        <input value={placeQuery} onChange={(e) => setPlaceQuery(e.target.value)} aria-label="Search places" className="w-full bg-[#f8fcf5] border border-[#d6e7cc] rounded-xl px-4 py-3 outline-none focus:border-[#749962]" placeholder="Search by place, state or vibe (beach, mountains, heritage...)" />
      </div>
      {destinations.length === 0 ? (
        <p className="text-gray-500 text-center py-10">Loading places…</p>
      ) : matches.length === 0 ? (
        <p className="text-gray-500 text-center py-10">No places match “{placeQuery}”.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((place) => (
            <div key={place.name} className="bg-white border border-[#d6e7cc] rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-[#749962] hover:-translate-y-0.5 transition-all">
              <div>
                <p className="font-bold text-[#152010]">{place.name}</p>
                <p className="text-xs text-[#608250]">{place.state}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {place.types.slice(0, 3).map((t) => <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-[#edf6e7] text-[#3A512F] capitalize">{t}</span>)}
                </div>
              </div>
              <button onClick={() => openCreateTab({ name: `Trip to ${place.name}`, destination: `${place.name}, ${place.state}` })} className="self-start px-4 py-2 rounded-lg bg-[#749962] text-white text-sm font-semibold hover:bg-[#608250] transition-colors">
                Plan a trip here
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
    );
  };

  const renderPackingChecklist = () => (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h2 className="text-2xl font-black text-[#152010] mb-6">Packing Checklist{selectedTrip ? ` — ${selectedTrip.name}` : ''}</h2>
      <div className="bg-white border border-[#d6e7cc] rounded-2xl p-6">
        <div className="flex gap-3 mb-6">
          <input value={newPackingItem} onChange={(e) => setNewPackingItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddPackingItem()} className="flex-1 bg-[#f8fcf5] border border-[#d6e7cc] rounded-xl px-4 py-3 outline-none focus:border-[#749962]" placeholder="Add item (e.g. Passport, Charger...)" />
          <button onClick={handleAddPackingItem} className="px-5 py-3 rounded-xl bg-[#749962] text-white font-bold">Add</button>
        </div>
        <div className="space-y-3">
          {(selectedTrip?.packingList || []).map((item) => (
            <div key={item._id} className="flex items-center justify-between">
              <label className="flex items-center gap-3 text-[#152010] cursor-pointer">
                <input type="checkbox" checked={item.checked} onChange={() => handleTogglePacking(item._id)} className="accent-[#749962]" />
                <span className={item.checked ? 'line-through text-gray-400' : ''}>{item.item}</span>
              </label>
              <button onClick={() => handleDeletePackingItem(item._id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
            </div>
          ))}
          {(!selectedTrip?.packingList || selectedTrip.packingList.length === 0) && <p className="text-gray-400 text-center py-4">No items yet. Add your first packing item above!</p>}
        </div>
      </div>
    </div>
  );

  const renderTripNotes = () => (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h2 className="text-2xl font-black text-[#152010] mb-6">Trip Notes / Journal{selectedTrip ? ` — ${selectedTrip.name}` : ''}</h2>
      <div className="flex gap-3 mb-6">
        <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} className="flex-1 bg-white border border-[#d6e7cc] rounded-xl px-4 py-3 outline-none focus:border-[#749962] min-h-20" placeholder="Write a note..." />
        <button onClick={handleAddNote} className="px-5 py-3 rounded-xl bg-[#749962] text-white font-bold self-end">Add</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(selectedTrip?.notes || []).map((note) => (
          <div key={note._id} className="bg-white border border-[#d6e7cc] rounded-xl p-4">
            <p className="text-[#152010]">{note.content}</p>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-[#608250]">{new Date(note.updatedAt).toLocaleDateString()}</p>
              <button onClick={() => handleDeleteNote(note._id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
            </div>
          </div>
        ))}
        {(!selectedTrip?.notes || selectedTrip.notes.length === 0) && <p className="col-span-full text-gray-400 text-center py-8">No notes yet.</p>}
      </div>
    </div>
  );

  const renderUserSettings = () => (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
      <h2 className="text-2xl font-black text-[#152010]">Account settings</h2>
      {settingsStatus && (
        <p role="status" className={`text-sm font-medium ${settingsStatus.type === 'error' ? 'text-red-600' : 'text-[#608250]'}`}>{settingsStatus.text}</p>
      )}
      <div className="bg-white border border-[#d6e7cc] rounded-2xl p-6">
        <h3 className="font-bold text-[#152010] mb-4">Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="settings-name" className="text-xs font-bold text-[#608250] uppercase tracking-wider mb-1 block">Name</label>
            <input id="settings-name" value={settingsForm.name} onChange={(e) => setSettingsForm({...settingsForm, name: e.target.value})} className="w-full bg-[#f8fcf5] border border-[#d6e7cc] rounded-xl px-4 py-3 outline-none focus:border-[#749962]" placeholder={user?.name || 'Your name'} />
          </div>
          <div>
            <label htmlFor="settings-email" className="text-xs font-bold text-[#608250] uppercase tracking-wider mb-1 block">Email</label>
            <input id="settings-email" type="email" value={settingsForm.email} onChange={(e) => setSettingsForm({...settingsForm, email: e.target.value})} className="w-full bg-[#f8fcf5] border border-[#d6e7cc] rounded-xl px-4 py-3 outline-none focus:border-[#749962]" placeholder={user?.email || 'Your email'} />
          </div>
        </div>
        <button onClick={handleUpdateProfile} className="mt-5 px-5 py-3 rounded-xl bg-[#749962] text-white font-bold hover:bg-[#608250] transition-colors">Save profile</button>
      </div>
      <div className="bg-white border border-[#d6e7cc] rounded-2xl p-6">
        <h3 className="font-bold text-[#152010] mb-4">Change password</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="settings-current-pw" className="text-xs font-bold text-[#608250] uppercase tracking-wider mb-1 block">Current password</label>
            <input id="settings-current-pw" type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})} className="w-full bg-[#f8fcf5] border border-[#d6e7cc] rounded-xl px-4 py-3 outline-none focus:border-[#749962]" />
          </div>
          <div>
            <label htmlFor="settings-new-pw" className="text-xs font-bold text-[#608250] uppercase tracking-wider mb-1 block">New password</label>
            <input id="settings-new-pw" type="password" autoComplete="new-password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full bg-[#f8fcf5] border border-[#d6e7cc] rounded-xl px-4 py-3 outline-none focus:border-[#749962]" placeholder="At least 6 characters" />
          </div>
        </div>
        <button onClick={handleChangePassword} className="mt-5 px-5 py-3 rounded-xl bg-[#152010] text-white font-bold hover:bg-[#749962] transition-colors">Update password</button>
      </div>
    </div>
  );

  const renderPublicItinerary = () => (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#608250]">This is what people see when you share this trip.</p>
        <button onClick={() => setTripTab('share')} className="text-sm font-semibold text-[#152010] underline">Get the share link</button>
      </div>
      <TripReadOnly trip={selectedTrip} />
    </div>
  );

  // Trip-specific tabs need a selected trip; otherwise let the user pick or create one.
  const renderPickTrip = () => (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="bg-white border border-[#d6e7cc] rounded-3xl p-8 text-center shadow-sm">
        <h2 className="text-2xl font-black text-[#152010]">Pick a trip to work on</h2>
        <p className="text-gray-500 mt-2">This tab works on one trip at a time.</p>
        <div className="mt-6 grid gap-2 text-left">
          {[...trips, ...previousTrips].map((trip) => (
            <button key={trip._id} onClick={() => { const tab = tripTab; handleTripClick(trip._id).then(() => setTripTab(tab)); }} className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#d6e7cc] hover:border-[#749962] hover:bg-[#f8fcf5] transition-colors">
              <span className="font-semibold text-[#152010]">{trip.name}</span>
              <span className="text-xs text-gray-500">{trip.destination}</span>
            </button>
          ))}
        </div>
        <button onClick={() => openCreateTab()} className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#152010] text-white font-semibold hover:bg-[#749962] transition-colors"><Plus size={16} /> Create a new trip</button>
      </div>
    </div>
  );

  const withTrip = (render) => (selectedTrip ? render() : renderPickTrip());

  // ─── Profile helpers ────────────────────────────────────
  const tripDays = (trip) => {
    if (!trip.startDate || !trip.endDate) return 0;
    const diff = (new Date(trip.endDate) - new Date(trip.startDate)) / 86400000;
    return Number.isFinite(diff) && diff >= 0 ? Math.round(diff) + 1 : 0;
  };

  const tripBudgetTotal = (trip) =>
    ['transport', 'accommodation', 'activities'].reduce(
      (sum, cat) => sum + (trip.budget?.[cat] || []).reduce((s, i) => s + (i.amount || 0), 0),
      0
    );

  const formatTripDates = (trip) => {
    if (!trip.startDate) return 'Dates not set';
    const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return trip.endDate ? `${fmt(trip.startDate)} – ${fmt(trip.endDate)}` : fmt(trip.startDate);
  };

  const startEditingProfile = () => {
    setSettingsForm({ name: user?.name || '', email: user?.email || '' });
    setProfileStatus(null);
    setIsEditingProfile(true);
  };

  const saveProfile = async () => {
    if (!settingsForm.name.trim() || !settingsForm.email.trim()) {
      setProfileStatus({ type: 'error', text: 'Name and email cannot be empty.' });
      return;
    }
    try {
      const res = await api.updateProfile(settingsForm);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setIsEditingProfile(false);
      setProfileStatus({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setProfileStatus({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    }
  };

  const renderProfileTripCard = (trip, past = false) => (
    <div
      key={trip._id}
      onClick={() => handleTripClick(trip._id)}
      className="group bg-white border border-[#d6e7cc] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-[#749962]"
    >
      <div className="h-36 relative overflow-hidden bg-gradient-to-br from-[#749962] to-[#152010]">
        {trip.image ? (
          <img
            src={trip.image}
            alt={trip.name}
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${past ? 'grayscale group-hover:grayscale-0' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40"><MapIcon size={40} /></div>
        )}
        {!past && trip.startDate && daysUntil(trip.startDate) >= 0 && (
          <span className="absolute top-3 left-3 bg-white/90 text-[#152010] text-xs font-bold px-2.5 py-1 rounded-full">
            {daysUntil(trip.startDate) === 0 ? 'Today' : `In ${daysUntil(trip.startDate)} days`}
          </span>
        )}
      </div>
      <div className="p-4">
        <h4 className="text-[#152010] font-bold truncate">{trip.name}</h4>
        {trip.destination && <p className="text-sm text-gray-500 flex items-center gap-1 mt-1 truncate"><MapPin size={13} /> {trip.destination}</p>}
        <p className="text-xs text-[#608250] font-semibold mt-2 flex items-center gap-1"><CalendarDays size={13} /> {formatTripDates(trip)}</p>
      </div>
    </div>
  );

  const renderProfileDashboard = () => {
    const allTrips = [...trips, ...previousTrips];
    const destinations = new Set(allTrips.map((t) => (t.destination || '').split(',')[0].trim().toLowerCase()).filter(Boolean));
    const totalDays = allTrips.reduce((s, t) => s + tripDays(t), 0);
    const totalBudget = allTrips.reduce((s, t) => s + tripBudgetTotal(t), 0);
    const nextTrip = [...trips]
      .filter((t) => t.startDate && daysUntil(t.startDate) >= 0)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];
    const memberSince = profileDetails?.createdAt
      ? new Date(profileDetails.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      : null;

    const stats = [
      { label: 'Trips planned', value: allTrips.length, icon: Plane },
      { label: 'Upcoming', value: trips.length, icon: Clock },
      { label: 'Destinations', value: destinations.size, icon: Compass },
      { label: 'Days of travel', value: totalDays, icon: CalendarDays },
      { label: 'Budget planned', value: `₹${totalBudget.toLocaleString('en-IN')}`, icon: Wallet },
    ];

    const badges = [
      { name: 'First Steps', desc: 'Plan your first trip', icon: Plane, earned: allTrips.length >= 1 },
      { name: 'Explorer', desc: 'Plan trips to 3 destinations', icon: Compass, earned: destinations.size >= 3 },
      { name: 'Globetrotter', desc: 'Plan 5 trips', icon: Award, earned: allTrips.length >= 5 },
      { name: 'Budget Pro', desc: 'Add a budget to a trip', icon: Wallet, earned: allTrips.some((t) => tripBudgetTotal(t) > 0) },
      { name: 'Itinerary Builder', desc: 'Add a day plan to a trip', icon: Route, earned: allTrips.some((t) => (t.days || []).length > 0) },
      { name: 'Ready to Go', desc: 'Start a packing list', icon: Backpack, earned: allTrips.some((t) => (t.packingList || []).length > 0) },
    ];

    const emptyState = (text) => (
      <div className="border-2 border-dashed border-[#c9dcbd] rounded-2xl p-8 text-center bg-white/50">
        <p className="text-gray-500 mb-4">{text}</p>
        <button
          onClick={() => navigate('/create-trip')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#152010] text-white font-semibold hover:bg-[#749962] transition-colors"
        >
          <Sparkles size={16} /> Discover with AI
        </button>
      </div>
    );

    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <button
          onClick={() => setCurrentView('dashboard')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#608250] hover:text-[#152010] transition-colors"
        >
          <span>&larr;</span> Back to dashboard
        </button>

        {/* Header card with cover */}
        <div className="bg-white border border-[#d6e7cc] rounded-3xl shadow-xl overflow-hidden">
          <div className="h-36 md:h-44 relative bg-gradient-to-br from-[#152010] via-[#3A512F] to-[#749962] overflow-hidden">
            <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(#fff 1.5px, transparent 1.5px)', backgroundSize: '22px 22px' }} />
            <svg className="absolute -right-6 -top-6 w-48 h-48 text-[#a3ff00]/15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
          </div>

          <div className="px-6 md:px-8 pb-6 md:pb-8">
            <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
              <div className="relative -mt-14 w-28 h-28 rounded-full border-4 border-white bg-gradient-to-br from-[#a3ff00] to-[#749962] flex items-center justify-center text-4xl font-black text-[#152010] shadow-lg shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>

              <div className="flex-1 min-w-0 md:pb-1">
                {isEditingProfile ? (
                  <div className="grid sm:grid-cols-2 gap-3 max-w-xl pt-2 md:pt-0">
                    <div>
                      <label htmlFor="profile-name" className="text-xs font-bold text-[#608250] uppercase tracking-wider">Name</label>
                      <input id="profile-name" value={settingsForm.name} onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })} className="w-full mt-1 bg-[#f8fcf5] border border-[#d6e7cc] rounded-xl px-3 py-2 outline-none focus:border-[#749962]" />
                    </div>
                    <div>
                      <label htmlFor="profile-email" className="text-xs font-bold text-[#608250] uppercase tracking-wider">Email</label>
                      <input id="profile-email" type="email" value={settingsForm.email} onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })} className="w-full mt-1 bg-[#f8fcf5] border border-[#d6e7cc] rounded-xl px-3 py-2 outline-none focus:border-[#749962]" />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl md:text-4xl font-black text-[#152010] tracking-tight truncate">{user?.name || 'Explorer'}</h2>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5"><Mail size={14} /> {user?.email}</span>
                      {memberSince && <span className="flex items-center gap-1.5"><CalendarDays size={14} /> Member since {memberSince}</span>}
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2 md:pb-1">
                {isEditingProfile ? (
                  <>
                    <button onClick={saveProfile} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#749962] text-white font-semibold hover:bg-[#608250] transition-colors"><Check size={16} /> Save</button>
                    <button onClick={() => { setIsEditingProfile(false); setProfileStatus(null); }} className="px-4 py-2.5 rounded-xl border border-[#d6e7cc] text-gray-600 font-semibold hover:bg-[#f3f8ef] transition-colors">Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={startEditingProfile} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#d6e7cc] text-[#152010] font-semibold hover:border-[#749962] hover:bg-[#f3f8ef] transition-colors"><Pencil size={15} /> Edit profile</button>
                    <button onClick={() => navigate('/create-trip')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#152010] text-white font-semibold hover:bg-[#749962] transition-colors"><Sparkles size={15} /> Plan a trip</button>
                  </>
                )}
              </div>
            </div>
            {profileStatus && (
              <p role="status" className={`mt-4 text-sm font-medium ${profileStatus.type === 'error' ? 'text-red-600' : 'text-[#608250]'}`}>{profileStatus.text}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mt-6">
          {stats.map(({ label, value, icon: Icon }, i) => (
            <div key={label} className={`bg-white border border-[#d6e7cc] rounded-2xl p-4 md:p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${i === stats.length - 1 ? 'col-span-2 md:col-span-1' : ''}`}>
              <div className="w-9 h-9 rounded-xl bg-[#edf6e7] text-[#608250] flex items-center justify-center mb-3"><Icon size={18} /></div>
              <p className="text-2xl md:text-3xl font-black text-[#152010] truncate">{value}</p>
              <p className="text-xs md:text-sm text-gray-500 font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          {/* Next trip */}
          <div className="lg:col-span-2 rounded-3xl overflow-hidden relative min-h-[220px] bg-gradient-to-br from-[#152010] to-[#3A512F] text-white shadow-xl">
            {nextTrip ? (
              <>
                {nextTrip.image && <img src={nextTrip.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />}
                <div className="relative p-6 md:p-8 h-full flex flex-col justify-between gap-6">
                  <div>
                    <p className="text-[#a3ff00] text-xs font-bold uppercase tracking-widest">Next adventure</p>
                    <h3 className="text-2xl md:text-3xl font-black mt-2">{nextTrip.name}</h3>
                    {nextTrip.destination && <p className="text-white/80 flex items-center gap-1.5 mt-1"><MapPin size={15} /> {nextTrip.destination}</p>}
                    <p className="text-white/70 text-sm mt-1">{formatTripDates(nextTrip)}</p>
                  </div>
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-5xl font-black leading-none">{daysUntil(nextTrip.startDate)}</p>
                      <p className="text-white/70 text-sm mt-1">{daysUntil(nextTrip.startDate) === 1 ? 'day to go' : 'days to go'}</p>
                    </div>
                    <button onClick={() => handleTripClick(nextTrip._id)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#a3ff00] text-[#152010] font-bold hover:bg-[#b5ff33] transition-colors">
                      Open trip <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="relative p-6 md:p-8 h-full flex flex-col justify-center">
                <p className="text-[#a3ff00] text-xs font-bold uppercase tracking-widest">Next adventure</p>
                <h3 className="text-2xl md:text-3xl font-black mt-2">Nothing planned yet</h3>
                <p className="text-white/70 mt-2 max-w-md">Tell us your dates and we will find the best places to go, without the crowds.</p>
                <button onClick={() => navigate('/create-trip')} className="mt-5 self-start inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#a3ff00] text-[#152010] font-bold hover:bg-[#b5ff33] transition-colors">
                  <Sparkles size={16} /> Find a destination
                </button>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="bg-white border border-[#d6e7cc] rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-[#152010]">Travel badges</h3>
              <span className="text-xs font-bold text-[#608250] bg-[#edf6e7] px-2.5 py-1 rounded-full">{badges.filter((b) => b.earned).length}/{badges.length}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {badges.map(({ name, desc, icon: Icon, earned }) => (
                <div key={name} title={`${name}: ${desc}`} className="flex flex-col items-center text-center gap-1.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 hover:scale-110 ${earned ? 'bg-gradient-to-br from-[#a3ff00] to-[#749962] text-[#152010] shadow-md' : 'bg-gray-100 text-gray-300'}`}>
                    {earned ? <Icon size={20} /> : <Lock size={16} />}
                  </div>
                  <p className={`text-[11px] font-semibold leading-tight ${earned ? 'text-[#152010]' : 'text-gray-400'}`}>{name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trips */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-2xl font-black text-[#152010]">Upcoming trips</h3>
            <button onClick={() => { setCurrentView('trip'); setTripTab('create'); }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#608250] hover:text-[#152010]"><Plus size={16} /> New trip</button>
          </div>
          {trips.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {trips.map((trip) => renderProfileTripCard(trip))}
            </div>
          ) : emptyState('No upcoming trips yet.')}
        </div>

        <div className="mt-10">
          <h3 className="text-2xl font-black text-[#152010] mb-5">Past trips</h3>
          {previousTrips.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {previousTrips.map((trip) => renderProfileTripCard(trip, true))}
            </div>
          ) : (
            <p className="text-gray-500 bg-white/60 border border-[#d6e7cc] rounded-2xl p-6">Your completed trips will appear here.</p>
          )}
        </div>

        {/* Account */}
        <div className="mt-10 bg-white border border-[#d6e7cc] rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-[#152010]">Account</h3>
            <p className="text-sm text-gray-500">Signed in as {user?.email}</p>
          </div>
          <button onClick={handleLogout} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-500 font-semibold hover:bg-red-50 transition-colors self-start sm:self-auto">
            <LogOut size={16} /> Log out
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#E5F0E0] text-gray-900 font-sans selection:bg-[#749962] selection:text-white relative">
      
      {/* Fixed Profile Circle with high z-index */}
      <div className="fixed top-6 right-6 z-[100] w-12 h-12 rounded-full bg-white border-2 border-gray-200 shadow-md flex items-center justify-center text-lg font-bold text-gray-700 cursor-pointer group hover:border-[#749962] transition-colors">
        {user?.name?.charAt(0).toUpperCase() || 'U'}
        {/* Dropdown menu */}
        <div 
          className="absolute top-14 right-0 bg-white border border-gray-200 rounded-xl shadow-xl py-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col"
        >
          {/* Username / Header */}
          <div className="px-4 py-3 border-b border-gray-100 mb-1">
            <p className="text-sm font-bold text-gray-800 truncate">{user?.name || 'Explorer'}</p>
            <p className="text-xs font-medium text-gray-400 truncate">{user?.email || 'user@example.com'}</p>
          </div>
          
          {/* Menu Items */}
          <div className="px-2">
            <div
              onClick={() => setCurrentView('profile')}
              className="px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#749962] rounded-lg cursor-pointer flex items-center gap-3 font-medium transition-colors"
            >
              <User size={16} /> Profile
            </div>
            <div className="px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#749962] rounded-lg cursor-pointer flex items-center gap-3 font-medium transition-colors">
              <Settings size={16} /> Settings
            </div>
          </div>
          
          {/* Logout Divider & Button */}
          <div className="border-t border-gray-100 mt-1 px-2 pt-1">
            <div 
              onClick={handleLogout}
              className="px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg cursor-pointer flex items-center gap-3 font-medium transition-colors"
            >
              <LogOut size={16} /> Logout
            </div>
          </div>
        </div>
      </div>

      {/* Navbar - Centered Logo, No Border */}
      <header className="h-[80px] bg-[#E5F0E0] flex items-center justify-center px-8 sticky top-0 z-40">
         <button
           type="button"
           className="group cursor-pointer"
           onClick={() => setCurrentView('dashboard')}
           aria-label="Travelloop home"
         >
           <Logo size={40} textClassName="text-[#1a1a1a] text-3xl tracking-tighter" />
         </button>
      </header>

      {/* Main Content Area */}
      <main>
        {currentView === 'trip' && (
          <div className="sticky top-[80px] z-30 bg-[#E5F0E0]/95 backdrop-blur border-b border-[#d6e7cc]">
            <div className="max-w-6xl mx-auto px-6 pt-3 flex items-center gap-3 text-sm">
              <button onClick={() => { setCurrentView('dashboard'); window.scrollTo(0, 0); }} className="font-semibold text-[#608250] hover:text-[#152010]">&larr; Dashboard</button>
              {selectedTrip && <span className="text-gray-400">/</span>}
              {selectedTrip && <span className="font-bold text-[#152010] truncate">{selectedTrip.name}</span>}
            </div>
            <div className="max-w-6xl mx-auto px-6 py-3 flex gap-2 overflow-x-auto hide-scrollbar">
              {[
                { key: 'create', label: 'Create', icon: Plus },
                { key: 'mytrips', label: 'My Trips', icon: Globe2 },
                { key: 'itinerary', label: 'Builder', icon: MapIcon },
                { key: 'itineraryview', label: 'Itinerary View', icon: Calendar },
                { key: 'citysearch', label: 'Explore places', icon: Search },
                { key: 'budget', label: 'Budget', icon: BarChart3 },
                { key: 'packing', label: 'Packing', icon: ClipboardCheck },
                { key: 'notes', label: 'Notes', icon: NotebookPen },
                { key: 'share', label: 'Share', icon: Share2 },
                { key: 'public', label: 'Public View', icon: ListChecks },
                { key: 'settings', label: 'Settings', icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = tripTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setTripTab(tab.key)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border flex items-center gap-2 transition-colors ${active ? 'bg-[#749962] border-[#749962] text-white' : 'bg-white border-[#d6e7cc] text-[#152010] hover:border-[#749962]'}`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Hero: full-width tilted collage. Row is wider than the screen and clipped, so the skew never leaves gaps or causes side-scroll; tiles pop out on hover */}
        {currentView === 'dashboard' && (
          <div className="w-full overflow-hidden sticky top-[80px] z-0">
            <motion.div
              className="py-6 md:py-8 h-[52vh] md:h-[70vh] min-h-[340px] max-h-[760px] origin-top"
              style={{ opacity: heroOpacity, scale: heroScale, filter: heroBlur, pointerEvents: heroPointer }}
            >
              <HeroCollage />
            </motion.div>
          </div>
        )}

        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'profile' && renderProfileDashboard()}
        {currentView === 'trip' && tripTab === 'create' && renderCreateTrip()}
        {currentView === 'trip' && tripTab === 'mytrips' && renderMyTrips()}
        {currentView === 'trip' && tripTab === 'itinerary' && withTrip(renderItinerary)}
        {currentView === 'trip' && tripTab === 'itineraryview' && withTrip(renderItineraryView)}
        {currentView === 'trip' && tripTab === 'citysearch' && renderCitySearch()}
        {currentView === 'trip' && tripTab === 'budget' && withTrip(renderBudget)}
        {currentView === 'trip' && tripTab === 'packing' && withTrip(renderPackingChecklist)}
        {currentView === 'trip' && tripTab === 'notes' && withTrip(renderTripNotes)}
        {currentView === 'trip' && tripTab === 'share' && withTrip(renderShare)}
        {currentView === 'trip' && tripTab === 'public' && withTrip(renderPublicItinerary)}
        {currentView === 'trip' && tripTab === 'settings' && renderUserSettings()}
      </main>

      <SiteFooter />

    </div>
  );
}
