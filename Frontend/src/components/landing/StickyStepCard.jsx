export default function StickyStepCard({ step, index }) {
  const isLast = index === 3;

  return (
    <div 
      className={`flex items-start justify-center sticky ${isLast ? 'px-0' : 'px-4 md:px-8'} ${isLast ? 'h-screen' : 'h-[80vh]'}`}
      style={{ top: isLast ? '0' : `calc(5vh + ${index * 30}px)` }}
    >
      <div className={`bg-[#749962] ${isLast ? 'rounded-t-[40px] rounded-b-none' : 'rounded-[40px]'} p-8 md:p-24 flex flex-col md:flex-row items-center justify-between shadow-[0_-20px_50px_rgba(0,0,0,0.4)] w-full ${isLast ? 'h-[110vh]' : 'h-[90vh]'} overflow-hidden relative`}>
        
        {/* Subtle background gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/20 pointer-events-none"></div>

        {/* Text Content */}
        <div className="md:w-1/2 mb-8 md:mb-0 pr-0 md:pr-12 text-left w-full -mt-8 md:-mt-16 relative z-10">
          <h2 className={`text-4xl md:text-7xl font-bold mb-4 md:mb-6 tracking-tight leading-tight text-white drop-shadow-md`}>
            {step.title}
          </h2>
          <p className={`text-lg md:text-3xl font-medium leading-relaxed text-[#f0f0f0] drop-shadow-sm`}>
            {step.description}
          </p>
        </div>

        {/* Graphic Content */}
        <div className="md:w-1/2 h-full min-h-[250px] w-full relative flex items-center justify-center z-10">
          {step.graphic}
        </div>

      </div>
    </div>
  );
}

