import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaChartLine, FaClock, FaEye, FaImage, FaUpload, FaWallet } from 'react-icons/fa';
import { mediaService, watchService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loader from '../Common/Loader';

const formatMoney = (value) => `RWF ${Number(value || 0).toFixed(2)}`;
const formatTime = (seconds) => `${Math.floor((seconds || 0) / 60)}m`;

function Dashboard() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState(null);
  const [history, setHistory] = useState([]);
  const [mediaCount, setMediaCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([watchService.getEarnings(), watchService.getHistory(), mediaService.getAll()])
      .then(([earningsResponse, historyResponse, mediaResponse]) => {
        setEarnings(earningsResponse.data.earnings);
        setHistory(historyResponse.data.history || []);
        setMediaCount(mediaResponse.data.media?.length || 0);
      })
      .catch((error) => console.error('Dashboard data error:', error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  const cards = [
    ['Published content', mediaCount, FaImage, 'text-primary-600 bg-primary-50'],
    ['Total earnings', formatMoney(earnings?.totalEarned), FaWallet, 'text-green-600 bg-green-50'],
    ['Watch time', formatTime(earnings?.watchTime), FaClock, 'text-blue-600 bg-blue-50'],
    ['Completed views', earnings?.completedCount || 0, FaEye, 'text-orange-600 bg-orange-50'],
  ];
  return <div className="container-custom py-8">
    <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-semibold uppercase tracking-wider text-primary-600">Organization workspace</p><h1 className="mt-1 text-3xl font-bold text-dark-900">Welcome, {user?.username || user?.name || 'organization'}</h1><p className="mt-2 text-dark-600">Share your work and help people find how your organization supports children.</p></div><Link to="/upload" className="btn-primary inline-flex items-center gap-2"><FaUpload /> Add content <FaArrowRight className="text-xs" /></Link></header>
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value, Icon, color]) => <div key={label} className="stat-card"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-dark-500">{label}</p><p className="mt-2 text-2xl font-bold text-dark-900">{value}</p></div><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon /></span></div></div>)}</section>
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-5"><div className="card lg:col-span-2"><div className="border-b border-dark-100 px-5 py-4"><h2 className="font-semibold text-dark-900">Organization content</h2><p className="mt-1 text-sm text-dark-500">Keep your public library up to date.</p></div><div className="p-5"><Link to="/media" className="btn-primary inline-flex items-center gap-2"><FaImage /> Manage content</Link></div></div><div className="card lg:col-span-3"><div className="flex items-center justify-between border-b border-dark-100 px-5 py-4"><div><h2 className="font-semibold text-dark-900">Recent watch activity</h2><p className="mt-1 text-sm text-dark-500">Your latest viewing sessions.</p></div><Link to="/earnings" className="text-sm font-semibold text-primary-600">View all</Link></div><div className="divide-y divide-dark-100">{history.length === 0 ? <p className="px-5 py-8 text-sm text-dark-500">No watch history yet.</p> : history.slice(0, 5).map((item) => <Link to={`/video/${item.video?._id}`} key={item._id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-dark-50"><div className="min-w-0"><p className="truncate text-sm font-semibold text-dark-800">{item.video?.videoTitle || 'Unknown video'}</p><p className="mt-1 text-xs text-dark-500">{formatTime(item.watchedSeconds)} watched</p></div><span className="whitespace-nowrap text-sm font-semibold text-green-600">+{formatMoney(item.earned)}</span></Link>)}</div></div></section>
    <section className="mt-6 rounded-2xl bg-dark-900 p-6 text-white"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-lg font-semibold">Help people find your work</h2><p className="mt-1 text-sm text-dark-300">Publish a photo or video about your organization’s work with children.</p></div><Link to="/upload" className="secondary-button border-dark-700 bg-dark-800 text-white hover:bg-dark-700">Publish content</Link></div></section>
  </div>;
}

export default Dashboard;
