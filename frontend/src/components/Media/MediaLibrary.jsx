import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { mediaService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FaEdit, FaImage, FaMicrophone, FaPlus, FaTrash, FaVideo } from 'react-icons/fa';
import Loader from '../Common/Loader';
import toast from 'react-hot-toast';

const MediaLibrary = () => {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });

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

  const typeIcon = { photo: FaImage, video: FaVideo, audio: FaMicrophone };

  if (loading) return <Loader />;

  return (
    <div className="container-custom py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-dark-200 pb-6">
        <div><p className="font-mono text-xs uppercase tracking-[0.16em] text-primary-600">{isAdmin ? 'Organization workspace' : 'Community library'}</p><h1 className="mt-2 text-3xl font-extrabold text-dark-900">{isAdmin ? 'My content' : 'Shared content'}</h1><p className="mt-2 text-sm text-dark-600">{isAdmin ? 'Manage the photos, videos, and audio stories your organization shares with the community.' : 'Browse photos, videos, and audio stories published by administrators.'}</p></div>
        {isAdmin && <Link to="/upload" className="btn-primary inline-flex items-center gap-2"><FaPlus /> Add content</Link>}
      </div>
      {items.length === 0 ? <div className="rounded-2xl border border-dashed border-dark-300 bg-white py-16 text-center"><FaImage className="mx-auto text-5xl text-primary-400" /><h2 className="mt-4 text-xl font-semibold text-dark-700">No content published yet</h2><p className="mt-2 text-dark-500">{isAdmin ? 'Upload a photo, video, or audio story to help people find your organization.' : 'Check back soon for new community content.'}</p></div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => { const Icon = typeIcon[item.type] || FaImage; return <article key={item._id} className="overflow-hidden rounded-2xl border border-dark-200 bg-white shadow-sm">{item.type === 'photo' ? <img src={item.url} alt={item.title || item.originalName} className="aspect-video w-full object-cover" /> : item.type === 'audio' ? <div className="flex aspect-video items-center justify-center bg-dark-900 p-6"><div className="w-full"><FaMicrophone className="mx-auto mb-4 text-4xl text-primary-300" /><audio src={item.url} controls className="w-full" /></div></div> : <video src={item.url} controls className="aspect-video w-full bg-black object-contain" />}<div className="p-4">{isAdmin && editingId === item._id ? <div className="space-y-3"><input value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} className="input-field" /><textarea value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} rows="3" className="input-field" /><div className="flex gap-2"><button type="button" onClick={() => saveEdit(item._id)} className="btn-primary px-3 py-2 text-sm">Save</button><button type="button" onClick={() => setEditingId(null)} className="secondary-button px-3 py-2 text-sm">Cancel</button></div></div> : <><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-dark-800">{item.title || item.originalName}</h2><p className="mt-1 flex items-center gap-1 text-xs uppercase text-primary-600"><Icon /> {item.type}</p></div>{isAdmin && <div className="flex gap-2"><button type="button" onClick={() => beginEdit(item)} className="text-dark-500 hover:text-primary-600" title="Edit content"><FaEdit /></button><button type="button" onClick={() => deleteItem(item._id)} className="text-dark-500 hover:text-red-600" title="Delete content"><FaTrash /></button></div>}</div>{item.description && <p className="mt-3 line-clamp-3 text-sm text-dark-500">{item.description}</p>}</>}</div></article>; })}</div>}
    </div>
  );
};

export default MediaLibrary;
