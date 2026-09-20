import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaBars, FaBullhorn, FaHandsHelping, FaInfoCircle, FaSignOutAlt, FaTimes, FaUserCog, FaUpload, FaUsers, FaBookOpen } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  const links = [
    { to: '/home', label: 'Home', icon: FaBookOpen },
    { to: '/videos', label: 'Videos', icon: FaBookOpen },
    { to: '/stories', label: 'Stories', icon: FaBookOpen },
    { to: '/announcements', label: 'Updates', icon: FaBullhorn },
    { to: '/about', label: 'About', icon: FaInfoCircle },
  ];
  const adminLinks = [
    { to: '/admin', label: 'Admin overview', icon: FaUserCog },
    { to: '/admin/media', label: 'Contents', icon: FaBookOpen },
    { to: '/upload', label: 'Upload content', icon: FaUpload },
    { to: '/about', label: 'About us', icon: FaInfoCircle },
    { to: '/announcements', label: 'Announcements', icon: FaBullhorn },
    { to: '/admin/users', label: 'Manage user', icon: FaUsers },
  ];

  if (user?.role === 'admin') {
    const adminMenu = adminLinks;
    return (
      <>
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 bg-dark-900 text-white md:block">
          <div className="flex h-full flex-col">
            <Link to="/admin" className="flex h-20 items-center gap-3 border-b border-dark-700 px-6" aria-label="RW0448"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500"><FaHandsHelping /></span><span className="text-lg font-bold">RW0448 Admin</span></Link>
            <nav className="flex-1 space-y-1 px-4 py-6" aria-label="Admin navigation">{adminMenu.map(({ to, label, icon: Icon }) => { const active = location.pathname === to || location.pathname.startsWith(`${to}/`); return <Link key={to} to={to} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${active ? 'bg-primary-600 text-white' : 'text-dark-300 hover:bg-dark-800 hover:text-white'}`}><Icon className="w-4" />{label}</Link>; })}</nav>
            <div className="border-t border-dark-700 p-4"><p className="truncate px-3 text-sm font-semibold">{user?.name}</p><button type="button" onClick={handleLogout} className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-red-300 hover:bg-red-950/40"><FaSignOutAlt /> Sign out</button></div>
          </div>
        </aside>
        <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-dark-200 bg-white px-4 md:hidden"><Link to="/admin" className="flex items-center gap-2 font-bold text-primary-700" aria-label="RW0448"><FaHandsHelping />RW0448 Admin</Link><button type="button" onClick={() => setIsMenuOpen((current) => !current)} className="rounded-lg p-2 text-dark-700" aria-label="Open admin navigation">{isMenuOpen ? <FaTimes /> : <FaBars />}</button></div>
        {isMenuOpen && <nav className="fixed inset-x-0 top-16 z-40 border-b border-dark-200 bg-white p-4 shadow-lg md:hidden" aria-label="Mobile admin navigation">{adminMenu.map(({ to, label, icon: Icon }) => <Link key={to} to={to} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-dark-700 hover:bg-primary-50"><Icon />{label}</Link>)}<button type="button" onClick={handleLogout} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-red-600"><FaSignOutAlt /> Sign out</button></nav>}
      </>
    );
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-dark-200 bg-white shadow-sm">
        <div className="container-custom flex min-h-16 items-center justify-between gap-4 py-2">
          <Link to="/home" className="flex shrink-0 items-center gap-2" aria-label="RW0448"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white"><FaHandsHelping /></span><span className="hidden text-lg font-bold text-primary-700 sm:inline">RW0448 UEBR</span></Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">{links.map(({ to, label, icon: Icon }) => { const active = location.pathname === to || location.pathname.startsWith(`${to}/`); return <Link key={to} to={to} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${active ? 'bg-primary-50 text-primary-700' : 'text-dark-600 hover:bg-dark-50 hover:text-primary-700'}`}><Icon className="text-xs" />{label}</Link>; })}</nav>
          <div className="flex items-center gap-2"><span className="hidden text-sm font-semibold text-dark-700 md:inline">{user?.name}</span><button type="button" onClick={handleLogout} className="rounded-lg p-2 text-dark-500 hover:bg-red-50 hover:text-red-600" aria-label="Sign out" title="Sign out"><FaSignOutAlt /></button><button type="button" onClick={() => setIsMenuOpen((current) => !current)} className="rounded-lg p-2 text-dark-700 lg:hidden" aria-label="Open navigation menu">{isMenuOpen ? <FaTimes /> : <FaBars />}</button></div>
        </div>
        {isMenuOpen && <nav className="border-t border-dark-100 bg-white px-4 py-3 lg:hidden" aria-label="Mobile navigation">{links.map(({ to, label, icon: Icon }) => <Link key={to} to={to} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-dark-700 hover:bg-primary-50 hover:text-primary-700"><Icon />{label}</Link>)}</nav>}
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-dark-200 bg-white/95 shadow-[0_-4px_18px_rgba(15,23,42,0.08)] backdrop-blur-sm lg:hidden" aria-label="Mobile bottom navigation">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2">
          {links.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[0.63rem] font-semibold ${active ? 'text-primary-700' : 'text-dark-500'}`}
              >
                <Icon className="text-base" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
