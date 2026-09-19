import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaImage, FaMicrophone, FaVideo } from 'react-icons/fa';
import { mediaService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loader from '../Common/Loader';

const typeIcon = { photo: FaImage, video: FaVideo, audio: FaMicrophone };

const Dashboard = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await mediaService.getAll();
        setItems(Array.isArray(response.data.media) ? response.data.media : []);
      } catch (error) {
        console.error('Home content error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="container-custom py-8">
      <header className="mb-8 max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-600">Umushinga home</p>
        <h1 className="mt-2 text-4xl font-black leading-tight tracking-[-0.04em] text-dark-900 md:text-5xl">
          Welcome {user?.name || user?.username || 'community member'}
        </h1>
        <p className="mt-3 text-lg text-dark-600">See the photos, videos, and audio already shared with the community.</p>
      </header>

      {items.length === 0 ? (
        <div className="card p-8 text-center text-sm text-dark-600">
          No content has been published yet. Check back soon.
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => {
            const Icon = typeIcon[item.type] || FaImage;
            const destination = item.videoId ? `/video/${item.videoId}` : '/media';

            return (
              <Link
                key={item._id}
                to={destination}
                className="group overflow-hidden rounded-[1.25rem] border border-[#dfe5ea] bg-[#edf2f4] shadow-none transition duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-md"
              >
                <div className="aspect-[16/10] overflow-hidden bg-[#edf2f4]">
                  {item.type === 'photo' && item.url ? (
                    <img src={item.url} alt={item.title || item.originalName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : item.type === 'video' && item.url ? (
                    <video src={item.url} className="h-full w-full object-cover" muted />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-200">
                      <Icon className="text-4xl text-primary-600" />
                    </div>
                  )}
                </div>
                <div className="p-4 pb-5">
                  <h2 className="text-[1.05rem] font-semibold leading-tight tracking-[-0.02em] text-dark-900">{item.title || item.originalName}</h2>
                  <p className="mt-3 flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-primary-600">
                    <Icon className="text-[0.75rem]" /> {item.type}
                  </p>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default Dashboard;
