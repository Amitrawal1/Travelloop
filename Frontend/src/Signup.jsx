import React, { useState, useMemo } from 'react';
import { registerUser, loginUser } from './api';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Grid, MapPin, Eye, EyeOff, Check, X, Navigation, Mountain } from 'lucide-react';
import forestImg from './assets/forest.png';
import vanImg from './assets/van.png';

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
  const navigate = useNavigate();

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      alert("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const response = await registerUser({ name, email, password });
      console.log(response.data);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      alert("Signup Successful!");
      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Signup failed. Please check if the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const response = await loginUser({ identifier: email, password });
      console.log(response.data);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      alert("Login Successful!");
      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
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
              <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
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
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 rounded-full py-1.5 text-sm font-medium transition ${!isLogin ? 'bg-[#0E190A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 bg-transparent shadow-none'}`}
                >
                  Register
                </button>
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 rounded-full py-1.5 text-sm font-medium transition ${isLogin ? 'bg-[#0E190A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 bg-transparent shadow-none'}`}
                >
                  Login
                </button>
              </div>

              {/* Social Logins */}
              <div className="flex gap-3 justify-center w-full mb-4">
                <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition shadow-sm bg-white text-blue-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 16.84 5.44 20.87 10 21.8V15H7.96V12H10V9.5C10 7.37 11.44 6.2 13.3 6.2C14.28 6.2 15.31 6.38 15.31 6.38V8.6H14.18C13.06 8.6 12.71 9.29 12.71 10.02V12H15.22L14.82 15H12.71V21.8C17.27 20.87 20.72 16.84 20.72 12H22Z" /></svg>
                </button>
                <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition shadow-sm bg-white text-black">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16.32 12.92C16.32 9.87 18.79 8.35 18.9 8.28C17.48 6.22 15.28 5.92 14.52 5.82C12.63 5.63 10.82 6.94 9.85 6.94C8.88 6.94 7.39 5.84 5.83 5.86C3.81 5.89 1.93 6.97 0.9 8.78C-1.18 12.4 0.37 17.75 2.41 20.69C3.41 22.12 4.56 23.73 6.09 23.68C7.57 23.63 8.12 22.73 9.89 22.73C11.66 22.73 12.16 23.68 13.7 23.63C15.28 23.58 16.28 22.14 17.27 20.69C18.42 19.01 18.89 17.38 18.94 17.3C18.89 17.26 16.32 16.29 16.32 12.92V12.92ZM13.88 3.86C14.7 2.87 15.25 1.54 15.1 0.2C13.97 0.25 12.55 0.96 11.71 1.94C11.02 2.73 10.36 4.12 10.54 5.43C11.8 5.53 13.06 4.85 13.88 3.86V3.86Z" /></svg>
                </button>
                <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition shadow-sm bg-white">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.8 15.72 17.58V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25V12.25Z" fill="#4285F4" /><path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.72 17.58C14.74 18.24 13.48 18.64 12 18.64C9.14 18.64 6.7 16.71 5.82 14.13H2.15V16.98C3.96 20.58 7.68 23 12 23V23Z" fill="#34A853" /><path d="M5.82 14.13C5.59 13.47 5.47 12.75 5.47 12C5.47 11.25 5.59 10.53 5.82 9.87V7.02H2.15C1.4 8.52 1 10.21 1 12C1 13.79 1.4 15.48 2.15 16.98L5.82 14.13V14.13Z" fill="#FBBC05" /><path d="M12 5.36C13.62 5.36 15.06 5.92 16.2 7.02L19.36 3.86C17.46 2.1 14.97 1 12 1C7.68 1 3.96 3.42 2.15 7.02L5.82 9.87C6.7 7.29 9.14 5.36 12 5.36V5.36Z" fill="#EA4335" /></svg>
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center w-full mb-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="px-4 text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Form Fields */}
              <div className="w-full space-y-3">
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

              {/* Remember Me */}
              <div className="flex items-center justify-start w-full my-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="w-4 h-4 rounded bg-gray-200 border border-gray-300 group-hover:border-gray-400 transition"></div>
                  <span className="text-sm text-gray-500 font-medium">Remember me</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-[#0E190A] text-white rounded-2xl py-3 font-bold relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition disabled:opacity-60 disabled:cursor-not-allowed"
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
                Discover the best RV, camper van or travel trailer rental for your next vacation.
              </p>

              {/* Destinations Tags */}
              <div className="flex flex-col items-center gap-3">
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Banff
                  </span>
                  <span className="bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Jasper
                  </span>
                  <span className="bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Pacific Rim
                  </span>
                  <span className="bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Gwaii Haanas
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
