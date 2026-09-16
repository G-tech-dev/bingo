import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaChartBar, FaImage, FaUsers, FaVideo } from 'react-icons/fa';
import { adminService } from '../../services/api';
import Loader from '../Common/Loader';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminService.getUsers(), adminService.getMedia()])
      .then(([usersResponse, mediaResponse]) => {
        setUsers(usersResponse.data.users || []);
        setMedia(mediaResponse.data.media || []);
      })
      .catch((error) => console.error('Admin overview error:', error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const publishers = users.filter((user) => user.role === 'publisher').length;
  const supporters = users.filter((user) => user.role === 'supporter').length;

  return (
    <div className="container-custom py-8">
      <header className="mb-8 flex flex-col justify-between gap-5 border-b border-dark-200 pb-6 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary-600">Administrator workspace</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-dark-900">Platform overview</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-dark-600">Manage the people and content that help families discover Compassion International programs.</p>
        </div>
        <Link to="/admin/users" className="btn-primary inline-flex items-center gap-2">Open user management <FaArrowRight className="text-xs" /></Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Platform statistics">
        {[
          ['Total accounts', users.length, FaUsers, 'text-primary-600 bg-primary-50'],
          ['Publishers', publishers, FaVideo, 'text-blue-600 bg-blue-50'],
          ['Supporters', supporters, FaImage, 'text-green-600 bg-green-50'],
          ['Published media', media.length, FaVideo, 'text-orange-600 bg-orange-50'],
        ].map(([label, value, Icon, color]) => (
          <div key={label} className="stat-card">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-sm text-dark-500">{label}</p><p className="mt-2 text-3xl font-bold text-dark-900">{value}</p></div>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon /></span>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center gap-3"><FaChartBar className="text-primary-600" /><h2 className="font-semibold text-dark-900">Content operations</h2></div>
          <p className="mt-3 text-sm leading-6 text-dark-600">Keep the platform focused on clear stories about children, families, and community programs across video, photo, and audio content.</p>
          <Link to="/admin/users" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800">Open user management <FaArrowRight className="text-xs" /></Link>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3"><FaUsers className="text-primary-600" /><h2 className="font-semibold text-dark-900">Latest accounts</h2></div>
          <div className="mt-4 space-y-3">
            {users.slice(0, 4).map((user) => <div key={user._id} className="flex items-center justify-between gap-4 border-b border-dark-100 pb-3 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-semibold text-dark-800">{user.name}</p><p className="truncate text-xs text-dark-500">{user.email}</p></div><span className="text-xs capitalize text-primary-600">{user.role}</span></div>)}
            {users.length === 0 && <p className="text-sm text-dark-500">No accounts found.</p>}
          </div>
        </div>
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center gap-3"><FaVideo className="text-primary-600" /><h2 className="font-semibold text-dark-900">Recent published media</h2></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {media.slice(0, 8).map((item) => <div key={item._id} className="border-b border-dark-100 pb-3"><p className="truncate text-sm font-semibold text-dark-800">{item.title || item.originalName}</p><p className="mt-1 text-xs capitalize text-primary-600">{item.type}</p><p className="mt-1 truncate text-xs text-dark-500">{item.owner?.name || 'Unknown publisher'}</p></div>)}
            {media.length === 0 && <p className="text-sm text-dark-500">No published media found.</p>}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
