
export const BRAND_NAME = 'Travelloop';

// Four-point star mark used across the app (same as the sign-in page).
export function LogoMark({ size = 40, className = '' }) {
  return (
    <div
      className={`bg-black rounded-xl flex items-center justify-center shadow-lg shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size / 2} height={size / 2} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="white" />
      </svg>
    </div>
  );
}

export default function Logo({ size = 40, textClassName = 'text-[#1a1a1a]', className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark size={size} className="transition-transform duration-500 group-hover:rotate-90" />
      <span className={`font-black tracking-tight ${textClassName}`}>{BRAND_NAME}</span>
    </div>
  );
}
