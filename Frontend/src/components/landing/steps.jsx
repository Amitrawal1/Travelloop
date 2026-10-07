// Feature cards shown on the intro page.
import img1 from '../../assets/onboarding/img1.jpg';
import img2 from '../../assets/onboarding/img2.jpg';
import img3 from '../../assets/onboarding/img3.jpg';
import img4 from '../../assets/onboarding/img4.jpg';
import img5 from '../../assets/onboarding/img5.jpg';
import img6 from '../../assets/onboarding/img6.jpg';
import img7 from '../../assets/onboarding/img7.jpg';
import img8 from '../../assets/onboarding/img8.jpg';
import img9 from '../../assets/onboarding/img9.jpg';
import img10 from '../../assets/onboarding/img10.jpg';
import img11 from '../../assets/onboarding/img11.jpg';

export const STEPS = [
  { 
    title: "Smart Itineraries", 
    description: "Plan each day with stops, times and stays, then see the whole trip at a glance.",
    graphic: (
      <div className="flex justify-center items-center h-full w-full relative">
        {/* Main circular image */}
        <div className="relative w-48 md:w-64 h-48 md:h-64 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.3)]">
          <div className="absolute inset-0 rounded-full border-[6px] md:border-[8px] border-black/20 border-t-[#a3ff00] animate-[spin_8s_linear_infinite]"></div>
          <img src={img1} className="w-full h-full object-cover rounded-full p-1 md:p-2" alt="Itinerary Main" />
        </div>
        {/* Top Right Floating Card */}
        <div className="absolute w-32 md:w-48 h-24 md:h-36 rounded-2xl border border-white/20 top-4 md:top-8 right-0 md:right-4 overflow-hidden shadow-2xl hover:scale-105 transition-transform duration-500 z-10 rotate-6 hover:rotate-0 bg-[#222]">
          <img src={img2} className="w-full h-full object-cover" alt="Itinerary Detail 1" />
        </div>
        {/* Bottom Left Floating Card */}
        <div className="absolute w-36 md:w-52 h-28 md:h-40 rounded-2xl border border-white/20 bottom-4 md:bottom-8 left-0 md:left-4 overflow-hidden shadow-2xl hover:scale-105 transition-transform duration-500 z-10 -rotate-6 hover:rotate-0 bg-[#222]">
          <img src={img3} className="w-full h-full object-cover" alt="Itinerary Detail 2" />
        </div>
      </div>
    )
  },
  { 
    title: "Discover & Explore", 
    description: "Find the best places for your dates, with crowd forecasts and quieter alternatives.",
    graphic: (
      <div className="flex justify-center items-center h-full w-full relative flex-col gap-4 md:gap-6 px-4">
        {/* Top pill */}
        <div className="w-full max-w-[220px] md:max-w-sm h-20 md:h-28 rounded-[2rem] overflow-hidden shadow-xl hover:scale-105 transition-all duration-500 border border-white/20 self-start md:ml-10 bg-[#222]">
          <img src={img4} className="w-full h-full object-cover" alt="Discover 1" />
        </div>
        {/* Middle pill */}
        <div className="w-full max-w-[220px] md:max-w-sm h-20 md:h-28 rounded-[2rem] overflow-hidden shadow-2xl hover:scale-105 transition-all duration-500 border-2 border-[#a3ff00]/60 self-center bg-[#222]">
          <img src={img5} className="w-full h-full object-cover" alt="Discover 2" />
        </div>
        {/* Bottom pill */}
        <div className="w-full max-w-[220px] md:max-w-sm h-20 md:h-28 rounded-[2rem] overflow-hidden shadow-xl hover:scale-105 transition-all duration-500 border border-white/20 self-end md:mr-10 bg-[#222]">
          <img src={img6} className="w-full h-full object-cover" alt="Discover 3" />
        </div>
      </div>
    )
  },
  { 
    title: "Budget Tracking", 
    description: "Track transport, stays and activities in ₹ and always know your total.",
    graphic: (
      <div className="flex justify-center items-center h-full w-full relative">
        {/* Left card */}
        <div className="w-28 md:w-44 h-40 md:h-60 rounded-2xl absolute border border-white/20 rotate-[-12deg] left-2 md:left-8 overflow-hidden shadow-2xl hover:rotate-0 hover:scale-110 transition-all duration-500 hover:z-20 bg-[#222]">
          <img src={img7} className="w-full h-full object-cover" alt="Budget 1" />
        </div>
        {/* Center Main Card */}
        <div className="w-36 md:w-56 h-48 md:h-72 rounded-3xl absolute border-[3px] border-[#a3ff00]/50 rotate-[4deg] z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden hover:rotate-0 hover:scale-105 transition-all duration-500 bg-[#222]">
          <img src={img8} className="w-full h-full object-cover" alt="Budget 2" />
        </div>
        {/* Right card */}
        <div className="w-28 md:w-44 h-40 md:h-60 rounded-2xl absolute border border-white/20 rotate-[15deg] right-2 md:right-8 top-12 md:top-20 overflow-hidden shadow-2xl hover:rotate-0 hover:scale-110 transition-all duration-500 hover:z-20 bg-[#222]">
          <img src={img9} className="w-full h-full object-cover" alt="Budget 3" />
        </div>
      </div>
    )
  },
  { 
    title: "Share the Journey", 
    description: "Share a read-only link to your plan on WhatsApp or email. No sign-up needed to view it.",
    graphic: (
      <div className="flex justify-center items-center h-full w-full relative gap-4 md:gap-8 px-4">
        {/* Left Tall Card */}
        <div className="w-1/2 max-w-[160px] md:max-w-[220px] aspect-[2/3] rounded-[2rem] md:rounded-[3rem] border-[3px] border-[#a3ff00]/60 shadow-[0_0_30px_rgba(163,255,0,0.15)] overflow-hidden hover:-translate-y-2 md:hover:-translate-y-4 transition-transform duration-500 bg-[#222]">
          <img src={img10} className="w-full h-full object-cover" alt="Share 1" />
        </div>
        {/* Right Tall Card */}
        <div className="w-1/2 max-w-[160px] md:max-w-[220px] aspect-[2/3] rounded-[2rem] md:rounded-[3rem] border border-white/20 shadow-2xl overflow-hidden hover:translate-y-2 md:hover:translate-y-4 transition-transform duration-500 mt-16 md:mt-24 bg-[#222]">
          <img src={img11} className="w-full h-full object-cover" alt="Share 2" />
        </div>
      </div>
    )
  }
];
