import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaEye, FaImage, FaUpload, FaUsers, FaVideo } from 'react-icons/fa';
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
    <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-semibold uppercase tracking-wider text-primary-600">Umushinga workspace</p><h1 className="mt-1 text-3xl font-bold text-dark-900">Welcome, {user?.name || user?.username || 'community member'}</h1><p className="mt-2 text-dark-600">Help people discover the work supporting children in Kabuga.</p></div><Link to="/upload" className="btn-primary inline-flex items-center gap-2"><FaUpload /> Publish content <FaArrowRight className="text-xs" /></Link></header>
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">{[['Published items', mediaCount, FaImage, 'text-primary-600 bg-primary-50'], ['Public videos', videoCount, FaVideo, 'text-blue-600 bg-blue-50'], ['Community reach', 'Open', FaUsers, 'text-green-600 bg-green-50']].map(([label, value, Icon, color]) => <div key={label} className="stat-card"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-dark-500">{label}</p><p className="mt-2 text-2xl font-bold text-dark-900">{value}</p></div><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon /></span></div></div>)}</section>
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-5"><div className="card lg:col-span-2"><div className="border-b border-dark-100 px-5 py-4"><h2 className="font-semibold text-dark-900">Organization library</h2><p className="mt-1 text-sm text-dark-500">Keep your photos and videos current.</p></div><div className="p-5"><Link to="/media" className="btn-primary inline-flex items-center gap-2"><FaImage /> Manage content</Link></div></div><div className="card lg:col-span-3"><div className="border-b border-dark-100 px-5 py-4"><h2 className="font-semibold text-dark-900">Why publish here?</h2><p className="mt-1 text-sm text-dark-500">Make your work easier for families and supporters to understand.</p></div><div className="space-y-4 p-5 text-sm leading-6 text-dark-600"><p><FaEye className="mr-2 inline text-primary-600" />Show the real places, programs, and people behind your organization.</p><p><FaUsers className="mr-2 inline text-primary-600" />Give community members a clear way to discover and share your work.</p></div></div></section>
    <section className="mt-6 rounded-2xl bg-dark-900 p-6 text-white"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-lg font-semibold">Tell the story of your work</h2><p className="mt-1 text-sm text-dark-300">Publish a photo or video about how your organization supports children.</p></div><Link to="/upload" className="secondary-button border-dark-700 bg-dark-800 text-white hover:bg-dark-700">Add content</Link></div></section>
  </div>;
};

export default Dashboard;
