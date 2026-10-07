import { useState, useMemo, useEffect } from 'react';
import { registerUser, loginUser, googleLogin } from './api';
import { loadGoogleScript, requestGoogleAccessToken } from './utils/googleAuth';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Eye, EyeOff, Check, X } from 'lucide-react';
import forestImg from './assets/forest.jpg';

// Password strength checker
function getPasswordStrength(password) {
  if (!password) return { label: '', color: '', bgColor: '', score: 0 };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: 'Weak', color: 'text-red-500', bgColor: 'bg-red-50', barColor: 'bg-red-500', score };
  if (score <= 2) return { label: 'Fair', color: 'text-orange-500', bgColor: 'bg-orange-50', barColor: 'bg-orange-500', score };
  if (score <= 3) return { label: 'Good', color: 'text-yellow-600', bgColor: 'bg-yellow-50', barColor: 'bg-yellow-500', score };
  if (score <= 4) return { label: 'Strong', color: 'text-green-600', bgColor: 'bg-green-50', barColor: 'bg-green-500', score };
  return { label: 'Very Strong', color: 'text-emerald-600', bgColor: 'bg-emerald-50', barColor: 'bg-emerald-500', score };
}

export default function Signup() {

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // Already signed in? Go straight to the dashboard.
  useEffect(() => {
    if (localStorage.getItem('token') && localStorage.getItem('user')) navigate('/dashboard', { replace: true });
  }, [navigate]);

  // Preload Google's script so the popup opens immediately on click
  useEffect(() => {
    loadGoogleScript().catch(() => {});
  }, []);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const response = await registerUser({ name, email, password });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/dashboard");
    } catch (error) {
      setError(error.response?.data?.message || "Sign up failed. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const response = await loginUser({ identifier: email, password });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/dashboard");
    } catch (error) {
      setError(error.response?.data?.message || "Sign in failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const accessToken = await requestGoogleAccessToken();
      const response = await googleLogin(accessToken);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/dashboard");
    } catch (error) {
      setError(error.response?.data?.message || error.message || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = () => {
    setError('');
    if (isLogin) {
      handleLogin();
    } else {
      handleSignup();
    }
  };

  return (
    <div className="h-screen bg-[#3A512F] p-4 md:p-6 flex items-center justify-center font-sans overflow-hidden">
      <div className="max-w-[1200px] w-full h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] max-h-[800px] bg-white rounded-[40px] shadow-2xl flex flex-col lg:flex-row overflow-hidden relative">

        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 p-4 lg:p-6 flex flex-col relative bg-cover bg-no-repeat z-10 overflow-hidden" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='topo' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 100 Q 25 75 50 100 T 100 100 M0 50 Q 25 25 50 50 T 100 50 M0 0 Q 25 -25 50 0 T 100 0' fill='none' stroke='%23f0f0f0' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23topo)'/%3E%3C/svg%3E")` }}>

          {/* back btn */}
          <div className="flex justify-between items-center w-full mb-1">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/')} aria-label="Back to home" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Form Container */}
          <div className="flex-1 flex items-center justify-center py-2">
            <div className="w-full max-w-[360px] flex flex-col items-center">

              {/* Logo */}
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="white" />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">
                {isLogin ? 'Welcome Back' : 'Join Travelloop'}
              </h1>
              <p className="text-gray-500 text-sm mb-4">
                {isLogin ? 'Please enter your details to sign in.' : 'This is the start of something good.'}
              </p>

              {/* Tabs */}
              <div className="w-full bg-gray-100 p-1 rounded-full flex mb-4">
                <button
                  onClick={() => { setIsLogin(false); setError(''); }}
                  className={`flex-1 rounded-full py-1.5 text-sm font-medium transition ${!isLogin ? 'bg-[#0E190A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 bg-transparent shadow-none'}`}
                >
                  Register
                </button>
                <button
                  onClick={() => { setIsLogin(true); setError(''); }}
                  className={`flex-1 rounded-full py-1.5 text-sm font-medium transition ${isLogin ? 'bg-[#0E190A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 bg-transparent shadow-none'}`}
                >
                  Login
                </button>
              </div>

              {/* Form Fields */}
              <div className="w-full space-y-3" onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}>
                {!isLogin && (
                  <div className="relative border border-gray-200 rounded-2xl px-4 py-1.5 bg-white focus-within:border-gray-400 transition shadow-sm">
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Username</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full bg-transparent outline-none text-gray-900 text-sm font-medium pt-0.5 pb-1 placeholder:text-gray-300"
                    />
                  </div>
                )}

                <div className="relative border border-gray-200 rounded-2xl px-4 py-1.5 bg-white focus-within:border-gray-400 transition shadow-sm">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{isLogin ? 'User ID / Email' : 'Email'}</label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isLogin ? 'Username or email' : 'you@example.com'}
                    className="w-full bg-transparent outline-none text-gray-900 text-sm font-medium pt-0.5 pb-1 placeholder:text-gray-300"
                  />
                </div>

                <div className="relative border border-gray-200 rounded-2xl px-4 py-1.5 bg-white focus-within:border-gray-400 transition shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Password</label>
                      <input
                        type={passwordVisible ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full bg-transparent outline-none text-gray-900 text-sm font-medium pt-0.5 pb-1 placeholder:text-gray-300"
                      />
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {/* Dynamic password strength badge — only on signup */}
                      {!isLogin && password.length > 0 && (
                        <div className={`flex items-center gap-1 ${passwordStrength.bgColor} ${passwordStrength.color} px-2 py-1 rounded-md text-[10px] font-bold tracking-wide whitespace-nowrap transition-all duration-300`}>
                          {passwordStrength.label}
                          {passwordStrength.score >= 4 ? <Check size={12} strokeWidth={3} /> : passwordStrength.score <= 1 ? <X size={12} strokeWidth={3} /> : null}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        className="text-gray-400 hover:text-gray-600 transition"
                      >
                        {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Password strength bar — only on signup */}
                  {!isLogin && password.length > 0 && (
                    <div className="flex gap-1 mt-1.5 mb-0.5">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            level <= passwordStrength.score ? passwordStrength.barColor : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <p role="alert" className="w-full mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading || googleLoading}
                className="w-full mt-5 bg-[#0E190A] text-white rounded-2xl py-3 font-bold relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAiPjwvcmVjdD4KPGNpcmNsZSBjeD0iNCIgY3k9IjQiIHI9IjAuNSIgZmlsbD0iI2ZmZiI+PC9jaXJjbGU+Cjwvc3ZnPg==')]"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    isLogin ? 'Sign In' : 'Start your adventure'
                  )}
                </span>
              </button>

              <div className="w-full flex items-center gap-3 my-3 text-xs text-gray-400">
                <span className="h-px flex-1 bg-gray-200" /> or <span className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading || googleLoading}
                className="w-full bg-white text-gray-800 border border-gray-200 rounded-2xl py-3 font-bold flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
                  </svg>
                )}
                Continue with Google
              </button>

            </div>
          </div>
        </div>

        {/* Right Side - Image & Overlay Content */}
        <div className="hidden lg:block w-1/2 p-3">
          <div
            className="w-full h-full rounded-[32px] bg-gray-200 relative overflow-hidden flex flex-col justify-between"
            style={{
              backgroundImage: `url(${forestImg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Dark gradient overlay at bottom for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 pointer-events-none"></div>

            {/* Top Row Overlays */}
            <div className="relative z-10 flex justify-between p-6 w-full">

              {/* Right Location Pill Removed */}
            </div>

            {/* Bottom Content Area */}
            <div className="relative z-10 p-10 pt-0 text-center">
              <h2 className="text-5xl md:text-6xl font-serif text-white mb-6 leading-tight drop-shadow-md">
                Your next adventure<br />starts <span className="inline-block bg-[#86b99b] text-white px-4 py-1 rounded-2xl italic font-serif shadow-sm transform -rotate-2">here</span>
              </h2>
              <p className="text-white/90 text-sm max-w-md mx-auto mb-12 drop-shadow">
                Find the best places for your dates, dodge the crowds, and keep every trip plan in one place.
              </p>

              {/* Destinations Tags */}
              <div className="flex flex-col items-center gap-3">
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Jibhi
                  </span>
                  <span className="bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Gokarna
                  </span>
                  <span className="bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Ziro Valley
                  </span>
                  <span className="bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Hampi
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
