import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Calendar, User, Plus, Map as MapIcon, DollarSign, Share2, Copy, Send, ChevronDown, Layers, SlidersHorizontal, ArrowUpDown, Settings, LogOut, X, NotebookPen, ListChecks, Globe2, Activity, ClipboardCheck, BarChart3, Sparkles, Mail, Pencil, Award, Plane, Clock, Wallet, Compass, Lock, CalendarDays, Check, Backpack, Route, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import * as api from './api';
import Logo from './components/Logo';
import SiteFooter from './components/SiteFooter';

// Whole days from today until a YYYY-MM-DD date (negative if in the past).
const daysUntil = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.round((target - today) / 86400000);
};

const HERO_PHOTOS = [
  ['1464822759023-fed622ff2c3b', 'Mountains'],
  ['1602216056096-3b40cc0c9944', 'Kerala backwaters'],
  ['1477587458883-47145ed94245', 'Hawa Mahal, Jaipur'],
  ['1551641506-ee5bf4cb45f1', 'Tokyo at night'],
  ['1512343879784-a960bf40e7f2', 'Goa beach'],
  ['1499678329028-101435549a4e', 'Cinque Terre'],
  ['1564507592333-c60657eea523', 'Taj Mahal'],
  ['1626621341517-bbf3d9990a23', 'Snow trek'],
  ['1537996194471-e657df975ab4', 'Bali temple'],
  ['1514222134-b57cbb8ce073', 'Golden Temple, Amritsar'],
  ['1499856871958-5b9627545d1a', 'Paris'],
  ['1470071459604-3b5ec3a7fe05', 'Green valley'],
  ['1573843981267-be1999ff37cd', 'Maldives'],
  ['1599661046289-e31897846e41', 'Amber Fort'],
  ['1493976040374-85c8e12f0c0e', 'Kyoto street'],
  ['1501785888041-af3ef285b470', 'Mountain lake'],
  ['1548661710-7f540c9c56d6', 'Singapore skyline'],
  ['1531366936337-7c912a4589a7', 'Northern lights'],
  ['1593693411515-c20261bcad6e', 'Houseboat'],
  ['1587595431973-160d0d94add1', 'Machu Picchu'],
  ['1507525428034-b723cf961d3e', 'Beach sunset'],
  ['1540959733332-eab4deabeeaf', 'Tokyo crossing'],
  ['1469474968028-56623f02e42e', 'Misty hills'],
  ['1533105079780-92b9be482077', 'Santorini'],
  ['1561361513-2d000a50f0dc', 'Road trip'],
];

// Small seeded PRNG so the "random" collage looks organic but stays identical on every render.
const seededRandom = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Tilted full-width hero collage: columns of varying width, each with 1–3 tiles of varying height/width/offset.
const HERO_COLUMNS = (() => {
  const rand = seededRandom(20261006);
  let photo = 0;
  const total = 7;
  return Array.from({ length: total }, (_, c) => {
    const r = rand();
    const count = r < 0.4 ? 1 : 2;
    return {
      grow: 0.85 + rand() * 0.6,
      // Spacer weights relative to tiles (~1 each) give each column a random vertical offset.
      padTop: rand() * 0.3,
      padBottom: rand() * 0.25,
      mobile: c < 4,
      tiles: Array.from({ length: count }, () => {
        const [id, alt] = HERO_PHOTOS[photo++ % HERO_PHOTOS.length];
        return {
          src: `https://images.unsplash.com/photo-${id}?q=75&w=600`,
          alt,
          grow: 0.6 + rand(),
          width: 92 + Math.round(rand() * 8),
          align: rand() < 0.5 ? 'self-start' : 'self-end',
        };
      }),
    };
  });
})();


export default function Landing() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'trip' | 'profile'
  const [tripTab, setTripTab] = useState('itinerary'); // itinerary | budget | share | create | mytrips | itineraryview | citysearch | activitysearch | packing | notes | settings | public
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [user, setUser] = useState(null);
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
  const [shareUrl, setShareUrl] = useState('');

  // Packing
  const [newPackingItem, setNewPackingItem] = useState('');

  // Notes
  const [newNote, setNewNote] = useState('');

  // Budget
  const [newBudget, setNewBudget] = useState({ category: 'transport', name: '', amount: '' });

  // Itinerary
  const [newStop, setNewStop] = useState({ title: '', time: '', type: 'activity' });

  // Profile
  const [profileDetails, setProfileDetails] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/auth');
    }
  }, [navigate]);

  // ─── Data Fetching ──────────────────────────────────────
  const fetchTrips = useCallback(async () => {
    try {
      const [upRes, prevRes] = await Promise.all([
        api.getUpcomingTrips(),
        api.getPreviousTrips()
      ]);
      setTrips(upRes.data);
      setPreviousTrips(prevRes.data);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
    }
  }, []);

  useEffect(() => {
    if (user) fetchTrips();
  }, [user, fetchTrips]);

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
      setCurrentView('trip');
      setTripTab('itinerary');
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
      await api.createTrip(newTrip);
      setNewTrip({ name: '', destination: '', startDate: '', endDate: '', description: '' });
      await fetchTrips();
      setCurrentView('dashboard');
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
    } catch (err) {
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
    try {
      const res = await api.addDay(selectedTrip._id, { date: '' });
      setSelectedTrip(res.data);
    } catch (err) {
      alert('Failed to add day');
    }
  };

  const handleAddStop = async (dayId) => {
    if (!newStop.title) return alert('Stop title is required');
    try {
      const res = await api.addStop(selectedTrip._id, dayId, newStop);
      setSelectedTrip(res.data);
      setNewStop({ title: '', time: '', type: 'activity' });
    } catch (err) {
      alert('Failed to add stop');
    }
  };

  const handleDeleteStop = async (dayId, stopId) => {
    try {
      const res = await api.deleteStop(selectedTrip._id, dayId, stopId);
      setSelectedTrip(res.data);
    } catch (err) {
      alert('Failed to delete stop');
    }
  };

  const handleAddBudgetItem = async () => {
    if (!newBudget.name || !newBudget.amount) return alert('Name and amount required');
    try {
      const res = await api.addBudgetItem(selectedTrip._id, { category: newBudget.category, name: newBudget.name, amount: Number(newBudget.amount) });
      setSelectedTrip(res.data);
      setNewBudget({ category: 'transport', name: '', amount: '' });
    } catch (err) {
      alert('Failed to add budget item');
    }
  };

  const handleDeleteBudgetItem = async (category, itemId) => {
    try {
      const res = await api.deleteBudgetItem(selectedTrip._id, category, itemId);
      setSelectedTrip(res.data);
    } catch (err) {
      alert('Failed to delete budget item');
    }
  };

  const handleAddPackingItem = async () => {
    if (!newPackingItem) return;
    try {
      const res = await api.addPackingItem(selectedTrip._id, { item: newPackingItem });
      setSelectedTrip(res.data);
      setNewPackingItem('');
    } catch (err) {
      alert('Failed to add packing item');
    }
  };

  const handleTogglePacking = async (itemId) => {
    try {
      const res = await api.togglePackingItem(selectedTrip._id, itemId);
      setSelectedTrip(res.data);
    } catch (err) {
      alert('Failed to toggle item');
    }
  };

  const handleDeletePackingItem = async (itemId) => {
    try {
      const res = await api.deletePackingItem(selectedTrip._id, itemId);
      setSelectedTrip(res.data);
    } catch (err) {
      alert('Failed to delete packing item');
    }
  };

  const handleAddNote = async () => {
    if (!newNote) return;
    try {
      const res = await api.addNote(selectedTrip._id, { content: newNote });
      setSelectedTrip(res.data);
      setNewNote('');
    } catch (err) {
      alert('Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const res = await api.deleteNote(selectedTrip._id, noteId);
      setSelectedTrip(res.data);
    } catch (err) {
      alert('Failed to delete note');
    }
  };

  const handleGenerateShareLink = async () => {
    if (!selectedTrip) return;
    try {
      const res = await api.generateShareLink(selectedTrip._id);
      setShareUrl(res.data.shareUrl);
    } catch (err) {
      alert('Failed to generate share link');
    }
  };

  const handleCopyShareLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await api.updateProfile(settingsForm);
      const updatedUser = res.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      alert('Profile updated!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

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
      {/* Search and Filter Row */}
      <div className="flex flex-col md:flex-row gap-4 mb-12">
         {/* Search Bar */}
         <div className="flex-1 relative group z-30">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#749962] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search destinations, trips, or travel companions..." 
              className="w-full bg-white border border-gray-200 rounded-full py-3.5 pl-12 pr-6 text-sm text-gray-800 outline-none focus:border-[#749962] focus:ring-2 focus:ring-[#749962]/20 transition-all shadow-sm" 
            />
            {/* Search Dropdown / Filters */}
            <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-gray-100 rounded-2xl shadow-xl opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 overflow-hidden">
               <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Suggested Filters</span>
                 <span className="text-xs font-bold text-[#749962] cursor-pointer hover:underline">Clear all</span>
               </div>
               <div className="p-2 flex flex-col">
                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer rounded-xl flex items-center justify-between group/item transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                           <MapPin size={14} />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-gray-800 group-hover/item:text-[#749962] transition-colors">Tropical Destinations</p>
                           <p className="text-xs text-gray-400 mt-0.5">Bali, Maldives, Hawaii</p>
                        </div>
                     </div>
                     <span className="text-xs font-bold text-gray-300 group-hover/item:text-[#749962] transition-colors">Apply</span>
                  </div>

                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer rounded-xl flex items-center justify-between group/item transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                           <Calendar size={14} />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-gray-800 group-hover/item:text-[#749962] transition-colors">Upcoming This Month</p>
                           <p className="text-xs text-gray-400 mt-0.5">2 Trips scheduled in May</p>
                        </div>
                     </div>
                     <span className="text-xs font-bold text-gray-300 group-hover/item:text-[#749962] transition-colors">Apply</span>
                  </div>

                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer rounded-xl flex items-center justify-between group/item transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                           <User size={14} />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-gray-800 group-hover/item:text-[#749962] transition-colors">Travel Companions</p>
                           <p className="text-xs text-gray-400 mt-0.5">Find people travelling to your destinations</p>
                        </div>
                     </div>
                     <span className="text-xs font-bold text-gray-300 group-hover/item:text-[#749962] transition-colors">Apply</span>
                  </div>
               </div>
               <div 
                 onMouseDown={(e) => { e.preventDefault(); setIsAdvancedSearchOpen(true); }}
                 className="bg-gray-50 p-4 text-center border-t border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
               >
                  <span className="text-sm font-bold text-[#749962]">Advanced Search & Filters &rarr;</span>
               </div>
            </div>
         </div>
         {/* Filter Buttons */}
         <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 hide-scrollbar shrink-0">
            <button className="whitespace-nowrap px-6 py-3.5 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:border-[#749962] hover:text-[#749962] transition-all shadow-sm flex items-center gap-2">
               <Layers size={16} /> Group by
            </button>
            <button className="whitespace-nowrap px-6 py-3.5 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:border-[#749962] hover:text-[#749962] transition-all shadow-sm flex items-center gap-2">
               <SlidersHorizontal size={16} /> Filter
            </button>
            <button className="whitespace-nowrap px-6 py-3.5 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:border-[#749962] hover:text-[#749962] transition-all shadow-sm flex items-center gap-2">
               <ArrowUpDown size={16} /> Sort by...
            </button>
         </div>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black text-[#152010] tracking-tight">My Upcoming Trips</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {trips.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-500">
            <p className="text-lg font-bold mb-2">No upcoming trips yet</p>
            <p className="text-sm">Click the + button to create your first trip!</p>
          </div>
        )}
        {trips.map(trip => (
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
        onClick={() => { setCurrentView('trip'); setTripTab('itinerary'); }}
        className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-[#152010] text-[#c6e3b6] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-[#152010]/30"
        aria-label="Create New Trip"
        title="Create New Trip"
      >
        <Plus size={24} strokeWidth={3} />
      </button>
    </div>
  );

  const renderItinerary = () => (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      {/* Left Panel */}
      <div className="w-full md:w-1/3 md:min-w-[400px] border-r border-[#d6e7cc] overflow-y-auto p-6 bg-[#f3f8ef]">
        <h2 className="text-2xl font-bold text-[#152010] mb-6">Itinerary Builder</h2>
        
        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#608250]" size={16} />
          <input 
            type="text" 
            placeholder="Search destinations, hotels, activities..." 
            className="w-full bg-white border border-[#d6e7cc] rounded-lg py-3 pl-10 pr-4 text-sm text-[#152010] placeholder-gray-400 outline-none focus:border-[#749962] transition shadow-sm"
          />
        </div>

        {/* Days Accordion */}
        {[1, 2, 3].map(day => (
          <div key={day} className="mb-4 bg-white border border-[#d6e7cc] rounded-xl overflow-hidden shadow-sm">
             <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-[#edf6e7] transition-colors">
               <h3 className="text-[#152010] font-bold text-sm">Day {day} <span className="text-gray-500 font-medium ml-2">Jan 0{day+4}, 2024</span></h3>
               <ChevronDown size={16} className="text-[#608250]" />
             </div>
             {day === 1 && (
              <div className="p-4 border-t border-[#d6e7cc] bg-[#f8fcf5]">
                <div className="relative pl-6 border-l-2 border-[#d6e7cc] space-y-5 py-2">
                   {/* Stop 1 */}
                   <div className="relative">
                    <div className="absolute -left-[31px] top-1.5 w-3 h-3 bg-[#749962] rounded-full border-[3px] border-[#f8fcf5]"></div>
                    <div className="bg-white p-4 rounded-lg border border-[#d6e7cc] hover:border-[#749962] transition">
                      <h4 className="text-[#152010] text-sm font-bold">Arrive at Zurich Airport</h4>
                       <p className="text-[#749962] text-xs font-bold mt-1.5">10:00 AM <span className="text-gray-500 font-normal ml-1">• Flight LX 38</span></p>
                     </div>
                   </div>
                   {/* Stop 2 */}
                   <div className="relative">
                    <div className="absolute -left-[31px] top-1.5 w-3 h-3 bg-gray-500 rounded-full border-[3px] border-[#f8fcf5]"></div>
                    <div className="bg-white p-4 rounded-lg border border-[#d6e7cc] hover:border-[#749962] transition">
                      <h4 className="text-[#152010] text-sm font-bold">Check-in at Hotel Alpine</h4>
                       <p className="text-[#749962] text-xs font-bold mt-1.5">1:00 PM <span className="text-gray-500 font-normal ml-1">• Accommodation</span></p>
                     </div>
                   </div>
                 </div>
                <button className="mt-6 w-full border border-dashed border-[#b7ceb0] text-[#608250] hover:text-[#749962] hover:border-[#749962] hover:bg-[#749962]/5 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2">
                   <Plus size={16} /> Add Stop
                 </button>
               </div>
             )}
          </div>
        ))}
      </div>

      {/* Right Panel: Map & Timeline */}
      <div className="flex-1 bg-[#eaf4e4] hidden md:flex flex-col relative overflow-hidden">
         <div className="flex-1 w-full relative flex items-center justify-center">
            {/* Map Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            
            <div className="text-[#608250] flex flex-col items-center gap-3">
               <MapIcon size={48} strokeWidth={1} />
               <p className="font-bold text-sm tracking-widest uppercase">Interactive Route Map</p>
            </div>
            
            {/* Custom Map Markers (Simulated) */}
            <div className="absolute top-[40%] left-[45%] flex flex-col items-center z-10 group cursor-pointer">
               <div className="w-8 h-8 bg-[#749962] text-white rounded-full flex items-center justify-center font-bold text-xs shadow-[0_0_15px_rgba(116,153,98,0.5)] group-hover:scale-110 transition-transform">1</div>
               <div className="w-0.5 h-6 bg-[#749962]"></div>
               <div className="w-2 h-2 bg-white rounded-full shadow-md"></div>
               {/* Line connecting to marker 2 */}
               <svg className="absolute top-4 left-4 w-32 h-24 pointer-events-none -z-10 overflow-visible">
                 <path d="M 0 0 Q 50 20 80 80" fill="none" stroke="#749962" strokeWidth="2" strokeDasharray="4 4" />
               </svg>
            </div>
            <div className="absolute top-[55%] left-[53%] flex flex-col items-center z-10 group cursor-pointer">
               <div className="w-8 h-8 bg-white text-[#152010] border-2 border-[#749962] rounded-full flex items-center justify-center font-bold text-xs shadow-lg group-hover:bg-[#749962] group-hover:text-white transition-colors">2</div>
            </div>
         </div>
         
         {/* Horizontal Timeline Block */}
         <div className="h-[140px] bg-[#f3f8ef] border-t border-[#d6e7cc] p-5 overflow-x-auto whitespace-nowrap">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Day 1 Timeline</h4>
            <div className="flex items-center gap-4 relative">
               <div className="absolute left-0 right-0 top-1/2 h-px bg-[#d6e7cc] -z-10"></div>
               
               <div className="bg-white border border-[#749962] px-5 py-3 rounded-lg text-sm font-bold text-[#749962] shadow-sm flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-[#749962]"></div>
                 10:00 AM - Arrival
               </div>
               
               <div className="bg-white border border-[#d6e7cc] px-5 py-3 rounded-lg text-sm text-gray-700 font-medium hover:border-[#749962] transition cursor-pointer flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                 1:00 PM - Hotel
               </div>
               
               <button className="w-10 h-10 rounded-full bg-white border border-[#d6e7cc] flex items-center justify-center text-[#608250] hover:text-[#749962] hover:border-[#749962] transition shadow-sm">
                 <Plus size={16}/>
               </button>
            </div>
         </div>
      </div>
    </div>
  );

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
          <div className="text-5xl md:text-7xl font-black text-white tracking-tighter">${total.toLocaleString()}<span className="text-3xl text-gray-600 font-medium">.00</span></div>
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
             <input value={newBudget.amount} onChange={(e) => setNewBudget({...newBudget, amount: e.target.value})} type="number" placeholder="Amount ($)" className="w-32 bg-[#111] border border-gray-700 text-white rounded-lg px-4 py-3 outline-none placeholder-gray-500" />
             <button onClick={handleAddBudgetItem} className="bg-[#749962] text-white px-5 py-3 rounded-lg font-bold hover:bg-[#608250] transition">Add</button>
          </div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-2xl hover:border-gray-700 transition">
             <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-6 flex items-center justify-between">Flights/Transport<DollarSign size={16} className="text-gray-500" /></h3>
             <div className="text-4xl font-bold text-[#749962] mb-6">${transportTotal.toLocaleString()}</div>
             <div className="w-full bg-[#111] h-2.5 rounded-full overflow-hidden mb-6"><div className="bg-[#749962] h-full rounded-full" style={{ width: `${(transportTotal / maxCat) * 100}%` }}></div></div>
             <div className="space-y-4">
                {(selectedTrip?.budget?.transport || []).map(item => (
                  <div key={item._id} className="flex justify-between text-sm border-b border-gray-800 pb-3">
                     <span className="text-gray-400">{item.name}</span>
                     <div className="flex items-center gap-2"><span className="text-white font-bold">${item.amount}</span><button onClick={() => handleDeleteBudgetItem('transport', item._id)} className="text-red-400 text-xs hover:text-red-500">×</button></div>
                  </div>
                ))}
             </div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-2xl hover:border-gray-700 transition">
             <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-6 flex items-center justify-between">Accommodation<DollarSign size={16} className="text-gray-500" /></h3>
             <div className="text-4xl font-bold text-[#a3ff00] mb-6">${accommodationTotal.toLocaleString()}</div>
             <div className="w-full bg-[#111] h-2.5 rounded-full overflow-hidden mb-6"><div className="bg-[#a3ff00] h-full rounded-full shadow-[0_0_10px_rgba(163,255,0,0.3)]" style={{ width: `${(accommodationTotal / maxCat) * 100}%` }}></div></div>
             <div className="space-y-4">
                {(selectedTrip?.budget?.accommodation || []).map(item => (
                  <div key={item._id} className="flex justify-between text-sm border-b border-gray-800 pb-3">
                     <span className="text-gray-400">{item.name}</span>
                     <div className="flex items-center gap-2"><span className="text-white font-bold">${item.amount}</span><button onClick={() => handleDeleteBudgetItem('accommodation', item._id)} className="text-red-400 text-xs hover:text-red-500">×</button></div>
                  </div>
                ))}
             </div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-2xl hover:border-gray-700 transition">
             <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-6 flex items-center justify-between">Activities & Meals<DollarSign size={16} className="text-gray-500" /></h3>
             <div className="text-4xl font-bold text-[#e6b333] mb-6">${activitiesTotal.toLocaleString()}</div>
             <div className="w-full bg-[#111] h-2.5 rounded-full overflow-hidden mb-6"><div className="bg-[#e6b333] h-full rounded-full" style={{ width: `${(activitiesTotal / maxCat) * 100}%` }}></div></div>
             <div className="space-y-4">
                {(selectedTrip?.budget?.activities || []).map(item => (
                  <div key={item._id} className="flex justify-between text-sm border-b border-gray-800 pb-3">
                     <span className="text-gray-400">{item.name}</span>
                     <div className="flex items-center gap-2"><span className="text-white font-bold">${item.amount}</span><button onClick={() => handleDeleteBudgetItem('activities', item._id)} className="text-red-400 text-xs hover:text-red-500">×</button></div>
                  </div>
                ))}
             </div>
          </div>
       </div>
    </div>
    );
  };

  const renderShare = () => (
    <div className="max-w-xl mx-auto px-6 py-24 text-center">
       <div className="bg-[#1a1a1a] border border-gray-800 p-12 rounded-3xl flex flex-col items-center shadow-xl">
          <div className="w-20 h-20 bg-[#111] border border-gray-800 rounded-full flex items-center justify-center mb-8 relative">
             <div className="absolute inset-0 bg-[#749962] rounded-full opacity-10 animate-pulse"></div>
             <Share2 size={32} className="text-[#749962]" />
          </div>
          <h2 className="text-3xl font-black text-white mb-3">Share the Journey</h2>
          <p className="text-gray-400 text-sm mb-10 leading-relaxed">Generate a unique link to share your itinerary and budget with friends, family, or travel companions. They will have read-only access.</p>
          
          {!shareUrl ? (
            <button onClick={handleGenerateShareLink} className="w-full bg-[#749962] hover:bg-[#608250] text-white py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm">
               <Share2 size={18} /> Generate Share Link
            </button>
          ) : (
            <>
              <div className="w-full bg-[#111] border border-gray-700 rounded-xl p-2.5 flex items-center gap-3 mb-8">
                 <input type="text" readOnly value={shareUrl} className="flex-1 bg-transparent text-gray-300 text-sm outline-none px-3 font-mono" />
                 <button onClick={handleCopyShareLink} className="bg-[#749962] hover:bg-[#608250] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-sm">
                    <Copy size={16} /> Copy
                 </button>
              </div>
              <button className="w-full border-2 border-[#749962] text-[#749962] hover:bg-[#749962] hover:text-white transition-colors py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-sm">
                 <Send size={18} /> Share to WhatsApp / Email
              </button>
            </>
          )}
       </div>
    </div>
  );

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

  const renderCitySearch = () => (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h2 className="text-2xl font-black text-[#152010] mb-6">City Search</h2>
      <div className="bg-white border border-[#d6e7cc] rounded-2xl p-5 mb-5">
        <input className="w-full bg-[#f8fcf5] border border-[#d6e7cc] rounded-xl px-4 py-3 outline-none focus:border-[#749962]" placeholder="Search city, country, region..." />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['Bali, Indonesia', 'Kyoto, Japan', 'Santorini, Greece', 'Cusco, Peru'].map((city) => (
          <div key={city} className="bg-white border border-[#d6e7cc] rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-[#152010]">{city}</p>
              <p className="text-xs text-[#608250]">Cost index: Moderate</p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-[#749962] text-white text-sm font-semibold">Add to Trip</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActivitySearch = () => (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h2 className="text-2xl font-black text-[#152010] mb-6">Activity Search</h2>
      <div className="flex flex-wrap gap-2 mb-5">
        {['Sightseeing', 'Adventure', 'Food', 'Culture', 'Budget Friendly'].map((f) => (
          <button key={f} className="px-4 py-2 rounded-full bg-white border border-[#d6e7cc] text-[#152010] text-sm font-semibold">{f}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['Temple Tour', 'Mountain Hike', 'Street Food Walk'].map((item) => (
          <div key={item} className="bg-white border border-[#d6e7cc] rounded-xl p-4">
            <p className="font-bold text-[#152010]">{item}</p>
            <p className="text-sm text-gray-600 mt-2">Duration: 2-4 hours • Cost: $$</p>
            <button className="mt-4 px-4 py-2 rounded-lg bg-[#749962] text-white text-sm font-semibold">Add Activity</button>
          </div>
        ))}
      </div>
    </div>
  );

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
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h2 className="text-2xl font-black text-[#152010] mb-6">User Settings</h2>
      <div className="bg-white border border-[#d6e7cc] rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="text-xs font-bold text-[#608250] uppercase tracking-wider mb-1 block">Name</label>
          <input value={settingsForm.name} onChange={(e) => setSettingsForm({...settingsForm, name: e.target.value})} className="w-full bg-[#f8fcf5] border border-[#d6e7cc] rounded-xl px-4 py-3 outline-none focus:border-[#749962]" placeholder={user?.name || 'Your name'} />
        </div>
        <div>
          <label className="text-xs font-bold text-[#608250] uppercase tracking-wider mb-1 block">Email</label>
          <input value={settingsForm.email} onChange={(e) => setSettingsForm({...settingsForm, email: e.target.value})} className="w-full bg-[#f8fcf5] border border-[#d6e7cc] rounded-xl px-4 py-3 outline-none focus:border-[#749962]" placeholder={user?.email || 'Your email'} />
        </div>
        <select className="bg-[#f8fcf5] border border-[#d6e7cc] rounded-xl px-4 py-3 outline-none focus:border-[#749962]">
          <option>English</option>
          <option>Hindi</option>
        </select>
        <button onClick={handleUpdateProfile} className="px-5 py-3 rounded-xl bg-[#749962] text-white font-bold hover:bg-[#608250] transition-colors">Save Changes</button>
      </div>
    </div>
  );

  const renderPublicItinerary = () => (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="bg-white border border-[#d6e7cc] rounded-2xl p-6">
        <h2 className="text-2xl font-black text-[#152010] mb-3">Shared Itinerary</h2>
        <p className="text-[#608250] mb-5">Public read-only view for friends and community.</p>
        <div className="space-y-3 mb-5">
          <p className="text-[#152010]">Day 1: Arrival and city orientation</p>
          <p className="text-[#152010]">Day 2: Activities and local cuisine</p>
          <p className="text-[#152010]">Day 3: Scenic spots and departure</p>
        </div>
        <button className="px-5 py-3 rounded-xl bg-[#749962] text-white font-bold">Copy Trip</button>
      </div>
    </div>
  );

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
            <div className="max-w-6xl mx-auto px-6 py-3 flex gap-2 overflow-x-auto hide-scrollbar">
              {[
                { key: 'create', label: 'Create', icon: Plus },
                { key: 'mytrips', label: 'My Trips', icon: Globe2 },
                { key: 'itinerary', label: 'Builder', icon: MapIcon },
                { key: 'itineraryview', label: 'Itinerary View', icon: Calendar },
                { key: 'citysearch', label: 'City Search', icon: Search },
                { key: 'activitysearch', label: 'Activities', icon: Activity },
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
              <div className="flex gap-2.5 md:gap-4 h-full w-[116%] -ml-[8%]" style={{ transform: 'skewX(-12deg)' }}>
                {HERO_COLUMNS.map((col, c) => (
                  <div
                    key={c}
                    className={`${col.mobile ? 'flex' : 'hidden md:flex'} flex-col gap-2.5 md:gap-4 min-w-0`}
                    style={{ flex: `${col.grow} 1 0` }}
                  >
                    <div aria-hidden="true" style={{ flex: `${col.padTop} 1 0` }} />
                    {col.tiles.map((tile, t) => (
                      <div
                        key={t}
                        className={`hero-tile relative overflow-hidden bg-[#d6e7cc] shadow-md cursor-pointer transition-all duration-500 ease-out hover:z-20 hover:scale-[1.08] hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#152010]/30 group/tile ${tile.align}`}
                        style={{ flex: `${tile.grow} 1 0`, width: `${tile.width}%`, minHeight: 0 }}
                      >
                        <img
                          src={tile.src}
                          alt={tile.alt}
                          className="absolute top-0 h-full max-w-none -left-1/2 w-[200%] object-cover"
                          style={{ transform: 'skewX(12deg)' }}
                        />
                        <div className="absolute inset-0 bg-[#152010]/0 group-hover/tile:bg-[#152010]/10 transition-colors duration-500" />
                      </div>
                    ))}
                    <div aria-hidden="true" style={{ flex: `${col.padBottom} 1 0` }} />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'profile' && renderProfileDashboard()}
        {currentView === 'trip' && tripTab === 'create' && renderCreateTrip()}
        {currentView === 'trip' && tripTab === 'mytrips' && renderMyTrips()}
        {currentView === 'trip' && tripTab === 'itinerary' && renderItinerary()}
        {currentView === 'trip' && tripTab === 'itineraryview' && renderItineraryView()}
        {currentView === 'trip' && tripTab === 'citysearch' && renderCitySearch()}
        {currentView === 'trip' && tripTab === 'activitysearch' && renderActivitySearch()}
        {currentView === 'trip' && tripTab === 'budget' && renderBudget()}
        {currentView === 'trip' && tripTab === 'packing' && renderPackingChecklist()}
        {currentView === 'trip' && tripTab === 'notes' && renderTripNotes()}
        {currentView === 'trip' && tripTab === 'share' && renderShare()}
        {currentView === 'trip' && tripTab === 'public' && renderPublicItinerary()}
        {currentView === 'trip' && tripTab === 'settings' && renderUserSettings()}
      </main>

      <SiteFooter />

      {/* Advanced Search Modal */}
      {isAdvancedSearchOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 md:p-12">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-[#000000]/70 backdrop-blur-xl transition-opacity"
            onClick={() => setIsAdvancedSearchOpen(false)}
          ></div>
          
          {/* Modal Container */}
          <div className="relative w-full max-w-4xl max-h-full bg-[#f3f8ef] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-[#d6e7cc] animate-in fade-in zoom-in-95 duration-200">
             {/* Header */}
             <div className="p-6 md:p-8 flex justify-between items-center border-b border-[#d6e7cc]">
                <h2 className="text-3xl font-black text-[#152010] tracking-tight">Advanced Search</h2>
                <button 
                  onClick={() => setIsAdvancedSearchOpen(false)}
                  className="w-10 h-10 rounded-full bg-white border border-[#d6e7cc] hover:bg-[#edf6e7] flex items-center justify-center text-[#152010] transition-colors"
                >
                  <X size={20} />
                </button>
             </div>
             
             {/* Body */}
             <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   
                   {/* Destination Input */}
                   <div className="space-y-2 col-span-1 md:col-span-2">
                    <label className="text-sm font-bold text-[#608250] uppercase tracking-wider">Destination</label>
                     <div className="relative">
                       <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#608250]" size={20} />
                       <input type="text" placeholder="Where do you want to go?" className="w-full bg-white border border-[#d6e7cc] rounded-xl py-4 pl-12 pr-4 text-[#152010] placeholder-gray-400 focus:outline-none focus:border-[#749962] transition-colors" />
                     </div>
                   </div>

                   {/* Date Range */}
                   <div className="space-y-2">
                    <label className="text-sm font-bold text-[#608250] uppercase tracking-wider">Dates</label>
                     <div className="relative">
                       <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#608250]" size={20} />
                       <input type="text" placeholder="Select dates" className="w-full bg-white border border-[#d6e7cc] rounded-xl py-4 pl-12 pr-4 text-[#152010] placeholder-gray-400 focus:outline-none focus:border-[#749962] transition-colors" />
                     </div>
                   </div>

                   {/* Budget Range (Dummy) */}
                   <div className="space-y-2">
                    <label className="text-sm font-bold text-[#608250] uppercase tracking-wider flex justify-between">
                       <span>Budget (Per Person)</span>
                      <span className="text-[#152010]">$500 - $2500+</span>
                     </label>
                     <div className="h-14 flex items-center px-2">
                       <div className="w-full h-2 bg-[#d6e7cc] rounded-full relative">
                          <div className="absolute left-[20%] right-[30%] h-full bg-[#749962] rounded-full"></div>
                           <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow cursor-grab"></div>
                           <div className="absolute right-[30%] top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow cursor-grab"></div>
                        </div>
                     </div>
                   </div>

                   {/* Trip Style Badges */}
                   <div className="space-y-3 col-span-1 md:col-span-2 mt-4">
                    <label className="text-sm font-bold text-[#608250] uppercase tracking-wider">Trip Style</label>
                     <div className="flex flex-wrap gap-3">
                        {['Adventure', 'Relaxation', 'Cultural', 'Nature', 'City Break', 'Road Trip', 'Luxury'].map((style, i) => (
                         <button key={style} className={`px-5 py-2.5 rounded-full text-sm font-bold border transition-colors ${i === 0 || i === 3 ? 'bg-[#749962] border-[#749962] text-white' : 'bg-white border-[#d6e7cc] text-[#152010] hover:border-[#749962]'}`}>
                            {style}
                          </button>
                        ))}
                     </div>
                   </div>

                </div>
             </div>
             
             {/* Footer */}
             <div className="p-6 border-t border-[#d6e7cc] flex justify-end gap-4 bg-white">
                <button 
                  onClick={() => setIsAdvancedSearchOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:text-[#152010] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setIsAdvancedSearchOpen(false)}
                  className="px-8 py-3 rounded-xl font-black bg-[#749962] text-white hover:bg-[#608250] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#749962]/20 flex items-center gap-2"
                >
                  <Search size={18} /> Show Results
                </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
