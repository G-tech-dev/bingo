import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaEye, FaImage, FaMusic, FaUsers, FaVideo } from 'react-icons/fa';
import { mediaService, videoService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loader from '../Common/Loader';

const Dashboard = () => {
  const { user } = useAuth();
  const [mediaCount, setMediaCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([mediaService.getAll(), videoService.getAll()])
      .then(([mediaResponse, videoResponse]) => {
        setMediaCount(mediaResponse.data.media?.length || 0);
        setVideoCount(videoResponse.data.videos?.length || 0);
      })
      .catch((error) => console.error('Workspace data error:', error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  return <div className="container-custom py-8">
    <header className="mb-8"><p className="text-sm font-semibold uppercase tracking-wider text-primary-600">Umushinga home</p><h1 className="mt-1 text-3xl font-bold text-dark-900">Welcome, {user?.name || user?.username || 'community member'}</h1><p className="mt-2 text-dark-600">Choose how you want to explore the community.</p></header>
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[
        ['Video', videoCount, FaVideo, 'text-blue-600 bg-blue-50', '/videos', 'Watch community videos'],
        ['Photo', mediaCount, FaImage, 'text-primary-600 bg-primary-50', '/media', 'Browse shared photos'],
        ['Audio', 'Explore', FaMusic, 'text-green-600 bg-green-50', '/media', 'Listen to community stories'],
      ].map(([label, value, Icon, color, to, description]) => <Link key={label} to={to} className="stat-card block transition hover:-translate-y-1 hover:border-primary-200 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-dark-700">{label}</p><p className="mt-2 text-2xl font-bold text-dark-900">{value}</p><p className="mt-1 text-xs text-dark-500">{description}</p></div><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon /></span></div></Link>)}
    </section>
    <section className="card p-6"><div className="flex items-center gap-3"><FaEye className="text-primary-600" /><h2 className="font-semibold text-dark-900">Explore the community</h2></div><p className="mt-3 max-w-2xl text-sm leading-6 text-dark-600">Discover the people, programs, and stories helping families across Kabuga.</p><Link to="/stories" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-700">Stories of Change <FaArrowRight className="text-xs" /></Link></section>
  </div>;
};

export default Dashboard;
