import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { mediaService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FaEdit, FaImage, FaMicrophone, FaPause, FaPlay, FaPlus, FaTrash, FaVideo } from 'react-icons/fa';
import Loader from '../Common/Loader';
import toast from 'react-hot-toast';

const formatDuration = (seconds) => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;

const AudioMediaPlayer = ({ url }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlayback = async () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else await audioRef.current.play();
  };

  return <div className="mt-3 rounded-xl border border-white/20 bg-black/30 p-3 text-white"><audio ref={audioRef} src={url} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} /><div className="flex items-center gap-3"><button type="button" onClick={togglePlayback} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-dark-900" aria-label={playing ? 'Pause audio' : 'Play audio'}>{playing ? <FaPause /> : <FaPlay />}</button><div className="min-w-0 flex-1"><div className="h-1.5 overflow-hidden rounded-full bg-white/30"><div className="h-full bg-primary-300" style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }} /></div></div><span className="text-xs tabular-nums text-white/80">{formatDuration(currentTime)} / {formatDuration(duration)}</span></div></div>;
};

const MediaLibrary = () => {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [backgroundFile, setBackgroundFile] = useState(null);

  const loadMedia = async () => {
    try {
      const response = await mediaService.getAll();
      setItems(response.data.media || []);
    } catch (error) {
      console.error('Media library error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMedia(); }, []);

  const beginEdit = (item) => {
    setEditingId(item._id);
    setEditForm({ title: item.title || '', description: item.description || '' });
  };

  const saveEdit = async (id) => {
    try {
      const response = await mediaService.update(id, editForm);
      setItems((current) => current.map((item) => item._id === id ? response.data.media : item));
      setEditingId(null);
      toast.success('Content details updated.');
    } catch (error) {
      console.error('Media update error:', error);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this content permanently?')) return;
    try {
      await mediaService.delete(id);
      setItems((current) => current.filter((item) => item._id !== id));
      toast.success('Content deleted.');
    } catch (error) {
      console.error('Media delete error:', error);
    }
  };

  const replaceBackground = async (item) => {
    if (!backgroundFile) return;
    try {
      const response = await mediaService.updateBackground(item._id, backgroundFile);
      setItems((current) => current.map((media) => media._id === item._id ? response.data.media : media));
      setBackgroundFile(null);
      toast.success('Audio background replaced.');
    } catch (error) { toast.error(error.response?.data?.message || 'Unable to replace background.'); }
  };

  const removeBackground = async (item) => {
    try {
      const response = await mediaService.deleteBackground(item._id);
      setItems((current) => current.map((media) => media._id === item._id ? response.data.media : media));
      toast.success('Audio background removed.');
    } catch (error) { toast.error(error.response?.data?.message || 'Unable to remove background.'); }
  };

  const typeIcon = { photo: FaImage, video: FaVideo, audio: FaMicrophone };

  if (loading) return <Loader />;

  return (
    <div className="container-custom py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-dark-200 pb-6">
        <div><p className="font-mono text-xs uppercase tracking-[0.16em] text-primary-600">{isAdmin ? 'Organization workspace' : 'Community library'}</p><h1 className="mt-2 text-3xl font-extrabold text-dark-900">{isAdmin ? 'My content' : 'Shared content'}</h1><p className="mt-2 text-sm text-dark-600">{isAdmin ? 'Manage the photos, videos, and audio stories your organization shares with the community.' : 'Browse photos, videos, and audio stories published by administrators.'}</p></div>
        {isAdmin && <Link to="/upload" className="btn-primary inline-flex items-center gap-2"><FaPlus /> Add content</Link>}
      </div>
      {items.length === 0 ? <div className="rounded-2xl border border-dashed border-dark-300 bg-white py-16 text-center"><FaImage className="mx-auto text-5xl text-primary-400" /><h2 className="mt-4 text-xl font-semibold text-dark-700">No content published yet</h2><p className="mt-2 text-dark-500">{isAdmin ? 'Upload a photo, video, or audio story to help people find your organization.' : 'Check back soon for new community content.'}</p></div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => { const Icon = typeIcon[item.type] || FaImage; return <article key={item._id} className="overflow-hidden rounded-2xl border border-dark-200 bg-white shadow-sm">{item.type === 'photo' ? <img src={item.url} alt={item.title || item.originalName} className="aspect-video w-full object-cover" /> : item.type === 'audio' ? <div className="flex aspect-video items-center justify-center bg-cover bg-center p-6" style={item.backgroundImageUrl ? { backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.58), rgba(15, 23, 42, 0.72)), url(${item.backgroundImageUrl})` } : { backgroundColor: '#0f172a' }}><div className="w-full"><FaMicrophone className="mx-auto mb-4 text-4xl text-primary-300" /><AudioMediaPlayer url={item.url} /></div></div> : <video src={item.url} controls className="aspect-video w-full bg-black object-contain" />}<div className="p-4">{isAdmin && editingId === item._id ? <div className="space-y-3"><input value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} className="input-field" /><textarea value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} rows="3" className="input-field" /><div className="flex gap-2"><button type="button" onClick={() => saveEdit(item._id)} className="btn-primary px-3 py-2 text-sm">Save</button><button type="button" onClick={() => setEditingId(null)} className="secondary-button px-3 py-2 text-sm">Cancel</button></div></div> : <><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-dark-800">{item.title || item.originalName}</h2><p className="mt-1 flex items-center gap-1 text-xs uppercase text-primary-600"><Icon /> {item.type}</p></div>{isAdmin && <div className="flex gap-2"><button type="button" onClick={() => beginEdit(item)} className="text-dark-500 hover:text-primary-600" title="Edit content"><FaEdit /></button><button type="button" onClick={() => deleteItem(item._id)} className="text-dark-500 hover:text-red-600" title="Delete content"><FaTrash /></button></div>}</div>{item.type === 'audio' && isAdmin && <div className="mt-3 space-y-2"><input type="file" accept="image/*" onChange={(event) => setBackgroundFile(event.target.files?.[0] || null)} className="input-field text-xs" /><div className="flex flex-wrap gap-2"><button type="button" onClick={() => replaceBackground(item)} disabled={!backgroundFile} className="secondary-button px-3 py-2 text-xs">Replace background</button>{item.backgroundImageUrl && <button type="button" onClick={() => removeBackground(item)} className="text-xs font-semibold text-red-600">Delete background</button>}</div></div>}{item.description && <p className="mt-3 line-clamp-3 text-sm text-dark-500">{item.description}</p>}</>}</div></article>; })}</div>}
    </div>
  );
};

export default MediaLibrary;
