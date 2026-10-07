import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#E5F0E0] flex flex-col items-center justify-center px-6 text-center font-sans">
      <Link to="/" className="group mb-10" aria-label="Travelloop home">
        <Logo size={40} textClassName="text-[#1a1a1a] text-3xl" />
      </Link>
      <h1 className="text-6xl font-black text-[#152010]">404</h1>
      <p className="mt-3 text-lg text-gray-600">This page took a wrong turn.</p>
      <div className="mt-8 flex gap-3">
        <Link to="/" className="px-5 py-3 rounded-full bg-[#152010] text-white font-semibold hover:bg-[#749962] transition-colors">Go home</Link>
        <Link to="/dashboard" className="px-5 py-3 rounded-full border border-[#152010] text-[#152010] font-semibold hover:bg-white transition-colors">My trips</Link>
      </div>
    </div>
  );
}
