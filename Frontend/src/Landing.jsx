import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Calendar, User, Plus, Map as MapIcon, DollarSign, Share2, Copy, Send, ChevronDown, Layers, SlidersHorizontal, ArrowUpDown, Settings, LogOut, X, NotebookPen, ListChecks, Globe2, Activity, ClipboardCheck, BarChart3, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as api from './api';

export default function Landing() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'trip' | 'profile'
  const [tripTab, setTripTab] = useState('itinerary'); // itinerary | budget | share | create | mytrips | itineraryview | citysearch | activitysearch | packing | notes | settings | public
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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
    { id: 102, name: 'Tokyo Lights', type: 'City', duration: '5 Days', price: '$1200', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000', highlights: [{ name: 'Shibuya Crossing', image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?q=80&w=800' }, { name: 'Senso-ji Temple', image: 'https://images.unsplash.com/photo-1526481280695-3c4691d8d69e?q=80&w=800' }, { name: 'Tokyo Tower', image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800' }] },
    { id: 103, name: 'Santorini Escape', type: 'Coastal', duration: '6 Days', price: '$1500', image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5f1?q=80&w=1000', highlights: [{ name: 'Oia Sunset', image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?q=80&w=800' }, { name: 'Blue Domes', image: 'https://images.unsplash.com/photo-1571731956672-f2b94d7dd0cb?q=80&w=800' }, { name: 'Red Beach', image: 'https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?q=80&w=800' }] },
    { id: 104, name: 'Machu Picchu', type: 'Adventure', duration: '10 Days', price: '$950', image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=1000', highlights: [{ name: 'Sun Gate', image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=800' }, { name: 'Temple of Sun', image: 'https://images.unsplash.com/photo-1622396488040-23ea2f7033f1?q=80&w=800' }, { name: 'Huayna Peak', image: 'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?q=80&w=800' }] },
    { id: 105, name: 'Northern Lights', type: 'Winter', duration: '4 Days', price: '$1100', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=1000', highlights: [{ name: 'Aurora Camp', image: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?q=80&w=800' }, { name: 'Ice Cave', image: 'https://images.unsplash.com/photo-1517329782449-810562a4ec2f?q=80&w=800' }, { name: 'Frozen Lake', image: 'https://images.unsplash.com/photo-1478059299873-f047d8c5fe1a?q=80&w=800' }] }
  ];

  const renderDashboard = () => (
    <div className="max-w-6xl mx-auto px-6 py-12">
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

  const renderProfileDashboard = () => (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="bg-white border border-[#d6e7cc] rounded-3xl p-6 md:p-8 shadow-xl">
        <button
          onClick={() => setCurrentView('dashboard')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#608250] hover:text-[#152010] transition-colors"
        >
          <span>&larr;</span> Back to Landing
        </button>
        <h2 className="text-3xl md:text-4xl font-black text-[#152010] tracking-tight mb-8">User Profile</h2>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 mb-10">
          <div className="bg-[#f3f8ef] border border-[#d6e7cc] rounded-2xl p-6 flex flex-col items-center justify-center">
            <div className="w-28 h-28 rounded-full border-2 border-[#749962] bg-white flex items-center justify-center text-4xl font-black text-[#152010]">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <p className="text-[#608250] text-xs uppercase tracking-wider mt-4">Traveler</p>
          </div>

          <div className="bg-[#f3f8ef] border border-[#d6e7cc] rounded-2xl p-6 md:p-8">
            <h3 className="text-xl md:text-2xl text-[#152010] font-black mb-4">Your Details</h3>
            <div className="space-y-3 text-sm md:text-base">
              <p className="text-gray-700"><span className="text-[#608250] font-semibold">Name:</span> {user?.name || 'Explorer'}</p>
              <p className="text-gray-700"><span className="text-[#608250] font-semibold">Email:</span> {user?.email || 'user@example.com'}</p>
              <p className="text-gray-700"><span className="text-[#608250] font-semibold">Membership:</span> Premium Explorer</p>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-2xl font-black text-[#152010] mb-5">Preplanned Trips</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.slice(0, 3).map((trip) => (
              <div
                key={trip.id}
                onClick={() => handleTripClick(trip.id)}
                className="bg-[#f3f8ef] border border-[#d6e7cc] rounded-2xl p-4 cursor-pointer hover:border-[#749962] transition-colors"
              >
                <div className="h-36 rounded-xl overflow-hidden mb-4">
                  <img src={trip.image} alt={trip.name} className="w-full h-full object-cover" />
                </div>
                <h4 className="text-[#152010] font-bold mb-3">{trip.name}</h4>
                <button className="w-full py-2.5 rounded-lg border border-[#749962] text-[#608250] font-semibold hover:bg-[#749962] hover:text-white transition-colors">
                  View
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-black text-[#152010] mb-5">Previous Trips</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {previousTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => handleTripClick(trip.id)}
                className="bg-[#f3f8ef] border border-[#d6e7cc] rounded-2xl p-4 cursor-pointer hover:border-[#749962] transition-colors"
              >
                <div className="h-36 rounded-xl overflow-hidden mb-4">
                  <img src={trip.image} alt={trip.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" />
                </div>
                <h4 className="text-[#152010] font-bold mb-3">{trip.name}</h4>
                <button className="w-full py-2.5 rounded-lg border border-[#749962] text-[#608250] font-semibold hover:bg-[#749962] hover:text-white transition-colors">
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

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
         <div 
          className="text-3xl font-black tracking-tighter text-[#1a1a1a] cursor-pointer flex items-center gap-2"
           onClick={() => setCurrentView('dashboard')}
         >
            <div className="w-8 h-8 bg-[#749962] rounded-md shadow-sm"></div>
            TRAVERSEHUB
         </div>
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

        {/* Banner Image 50vh */}
        {/* Banner Image 55vh with Skewed Masonry Layout */}
        {currentView === 'dashboard' && (
          <div className="w-full h-[55vh] bg-[#E5F0E0] relative overflow-hidden flex items-center justify-center">
             
             {/* Skewed Grid Container */}
             <div className="flex gap-4 w-[120%] md:w-[110%] max-w-[1600px] h-[90%] mt-[-5%]" style={{ transform: 'skewX(-15deg)' }}>
                
                {/* Column 1 (Left) */}
                <div className="flex flex-col gap-4 w-[22%] h-full justify-start pt-8">
                   <div className="relative h-[45%] w-full overflow-hidden shadow-sm bg-gray-200">
                      <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800" alt="Mountains" className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'skewX(15deg) scale(1.25)' }} />
                   </div>
                   <div className="relative h-[45%] w-[85%] ml-auto overflow-hidden shadow-sm bg-gray-200">
                      <img src="https://images.unsplash.com/photo-1551641506-ee5bf4cb45f1?q=80&w=800" alt="Japan Night" className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'skewX(15deg) scale(1.25)' }} />
                   </div>
                </div>

                {/* Column 2 (Center Large) */}
                <div className="relative w-[32%] h-full overflow-hidden shadow-sm mt-4 bg-gray-200">
                   <img src="https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=800" alt="Kerala Backwaters" className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'skewX(15deg) scale(1.25)' }} />
                </div>

                {/* Column 3 (Right) */}
                <div className="flex flex-col gap-4 w-[26%] h-full justify-start">
                   <div className="relative h-[48%] w-[95%] overflow-hidden shadow-sm bg-gray-200">
                      <img src="https://images.unsplash.com/photo-1499678329028-101435549a4e?q=80&w=800" alt="Cinque Terre" className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'skewX(15deg) scale(1.25)' }} />
                   </div>
                   <div className="relative h-[45%] w-[80%] overflow-hidden shadow-sm mr-auto bg-gray-200">
                      <img src="https://images.unsplash.com/photo-1548661710-7f540c9c56d6?q=80&w=800" alt="Market" className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'skewX(15deg) scale(1.25)' }} />
                   </div>
                </div>

                {/* Column 4 (Far Right) */}
                <div className="relative w-[16%] h-[35%] overflow-hidden shadow-sm mt-[20%] bg-gray-200">
                   <img src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=800" alt="Paris" className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'skewX(15deg) scale(1.25)' }} />
                </div>
                
             </div>

             {/* Strong Gradient Overlay for bottom fade */}
             <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#E5F0E0] via-[#E5F0E0]/90 to-transparent pointer-events-none z-10"></div>
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

      <footer className="bg-[#111111] border-t border-[#1f1f1f] mt-16">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
          <div>
            <p className="text-[#c6e3b6] text-2xl md:text-3xl font-black tracking-wider">TRAVERSEHUB</p>
            <p className="text-sm text-gray-400 mt-1">Plan smarter trips with itinerary, budget, and sharing in one place.</p>
          </div>
          <div className="flex items-center gap-5 text-sm text-gray-400">
            <span className="hover:text-white transition-colors cursor-pointer">About</span>
            <span className="hover:text-white transition-colors cursor-pointer">Contact</span>
            <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
          </div>
        </div>
      </footer>

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
