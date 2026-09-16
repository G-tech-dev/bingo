import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaBars, FaBullhorn, FaHandsHelping, FaInfoCircle, FaSignOutAlt, FaTimes, FaUserCog, FaUsers, FaBookOpen } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return (
      <header className="border-b border-dark-200 bg-white">
        <div className="container-custom flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2" aria-label="RW0448"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white"><FaHandsHelping /></span><span className="text-xl font-bold text-primary-700">RW0448 </span></Link>
          <div className="flex items-center gap-3 sm:gap-4"><Link to="/login" className="btn-primary px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm">Sign in</Link></div>
        </div>
      </header>
    );
  }

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: FaBookOpen },
    { to: '/stories', label: 'Stories of Change', icon: FaBookOpen },
    { to: '/announcements', label: 'Announcements', icon: FaBullhorn },
    { to: '/about', label: 'About Us', icon: FaInfoCircle },
  ];
  if (user?.role === 'admin') links.push({ to: '/admin', label: 'Admin', icon: FaUserCog }, { to: '/admin/users', label: 'Users', icon: FaUsers });

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-dark-200 bg-white shadow-sm">
      <div className="container-custom flex min-h-16 items-center justify-between gap-4 py-2">
        <Link to="/dashboard" className="flex shrink-0 items-center gap-2" aria-label="RW0448"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white"><FaHandsHelping /></span><span className="hidden text-lg font-bold text-primary-700 sm:inline">RW0448 BUSOGO</span></Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">{links.map(({ to, label, icon: Icon }) => { const active = location.pathname === to || location.pathname.startsWith(`${to}/`); return <Link key={to} to={to} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${active ? 'bg-primary-50 text-primary-700' : 'text-dark-600 hover:bg-dark-50 hover:text-primary-700'}`}><Icon className="text-xs" />{label}</Link>; })}</nav>
        <div className="flex items-center gap-2"><span className="hidden text-sm font-semibold text-dark-700 md:inline">{user?.name}</span><button type="button" onClick={handleLogout} className="rounded-lg p-2 text-dark-500 hover:bg-red-50 hover:text-red-600" aria-label="Sign out" title="Sign out"><FaSignOutAlt /></button><button type="button" onClick={() => setIsMenuOpen((current) => !current)} className="rounded-lg p-2 text-dark-700 lg:hidden" aria-label="Open navigation menu">{isMenuOpen ? <FaTimes /> : <FaBars />}</button></div>
      </div>
      {isMenuOpen && <nav className="border-t border-dark-100 bg-white px-4 py-3 lg:hidden" aria-label="Mobile navigation">{links.map(({ to, label, icon: Icon }) => <Link key={to} to={to} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-dark-700 hover:bg-primary-50 hover:text-primary-700"><Icon />{label}</Link>)}</nav>}
    </header>
  );
};

export default Navbar;
