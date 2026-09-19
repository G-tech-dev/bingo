import React, { useEffect, useState } from 'react';
import { FaEdit, FaHandsHelping, FaImage, FaPlus, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import ManagedPage from './ManagedPage';
import { mediaService, workerService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loader from '../Common/Loader';

const emptyWorker = { name: '', role: '', details: '', photoUrl: '', photoMedia: '' };

const AboutUs = () => {
  const { isAdmin } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [form, setForm] = useState(emptyWorker);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadWorkers = async () => {
    try { setWorkers((await workerService.getAll()).data.workers || []); } catch (error) { console.error('Worker loading error:', error); } finally { setLoading(false); }
  };

  useEffect(() => { loadWorkers(); }, []);

  const resetForm = () => { setForm(emptyWorker); setFile(null); setEditingId(null); };
  const beginEdit = (worker) => { setEditingId(worker._id); setForm({ name: worker.name || '', role: worker.role || '', details: worker.details || '', photoUrl: worker.photoUrl || '', photoMedia: worker.photoMedia || '' }); setFile(null); };
  const handleChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const saveWorker = async (event) => {
    event.preventDefault();
    if (!editingId && !file) {
      toast.error('A staff photo is required.');
      return;
    }
    setSaving(true);
    try {
      let photoUrl = form.photoUrl;
      let photoMedia = form.photoMedia;
      if (file) {
        const response = await mediaService.upload(file, { title: form.name, description: `${form.role} photo`, isStaffPhoto: true });
        photoUrl = response.data.media.url;
        photoMedia = response.data.media._id;
      }
      const data = { ...form, photoUrl, photoMedia };
      const response = editingId ? await workerService.update(editingId, data) : await workerService.create(data);
      setWorkers((current) => editingId ? current.map((worker) => worker._id === editingId ? response.data.worker : worker) : [response.data.worker, ...current]);
      toast.success(editingId ? 'Staff updated.' : 'Staff added.');
      resetForm();
    } catch (error) { console.error('Staff save error:', error); } finally { setSaving(false); }
  };

  const deleteWorker = async (id) => {
    if (!window.confirm('Delete this staff member permanently?')) return;
    try { await workerService.delete(id); setWorkers((current) => current.filter((worker) => worker._id !== id)); toast.success('Staff deleted.'); } catch (error) { console.error('Staff delete error:', error); }
  };

  if (loading) return <Loader />;

  return <>
    <ManagedPage section="about" eyebrow="About us" heading="RW0448 UEBR KABUGA" intro="Supported with Compassion International to connect families, stories, and community programs in Kabuga." emptyTitle="More about us coming soon" emptyText="The administrator will publish additional information about the project here." Icon={FaHandsHelping} />
    <section className="container-custom pb-10">
      {isAdmin && <form onSubmit={saveWorker} className="card mb-8 space-y-4 p-6"><h2 className="flex items-center gap-2 font-semibold text-dark-900"><FaPlus /> {editingId ? 'Edit staff' : 'Add staff'}</h2><div className="grid gap-4 sm:grid-cols-2"><input name="name" value={form.name} onChange={handleChange} required maxLength="120" className="input-field" placeholder="Staff name *" /><input name="role" value={form.role} onChange={handleChange} maxLength="120" className="input-field" placeholder="Role or responsibility" /></div><textarea name="details" value={form.details} onChange={handleChange} rows="3" className="input-field" placeholder="Staff details" /><input type="file" accept="image/*" required={!editingId && !form.photoUrl} onChange={(event) => setFile(event.target.files?.[0] || null)} className="input-field" /><div className="flex gap-2"><button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm">{saving ? 'Saving...' : editingId ? 'Save changes' : 'Add staff'}</button>{editingId && <button type="button" onClick={resetForm} className="secondary-button px-4 py-2 text-sm">Cancel</button>}</div></form>}
      <div className="mb-5 flex items-center gap-2"><FaHandsHelping className="text-primary-600" /><h2 className="text-2xl font-bold text-dark-900">Our staff</h2></div>
      {workers.length === 0 ? <p className="text-sm text-dark-600">Staff information will appear here when published by the administrator.</p> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{workers.map((worker) => <article key={worker._id} className="card overflow-hidden">{worker.photoUrl ? <img src={worker.photoUrl} alt={worker.name} className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center bg-primary-50"><FaImage className="text-5xl text-primary-300" /></div>}<div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-dark-900">{worker.name}</h3>{worker.role && <p className="mt-1 text-sm font-semibold text-primary-600">{worker.role}</p>}</div>{isAdmin && <div className="flex gap-2"><button type="button" onClick={() => beginEdit(worker)} className="text-dark-500 hover:text-primary-600" title="Edit staff"><FaEdit /></button><button type="button" onClick={() => deleteWorker(worker._id)} className="text-dark-500 hover:text-red-600" title="Delete staff"><FaTrash /></button></div>}</div>{worker.details && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-dark-600">{worker.details}</p>}</div></article>)}</div>}
    </section>
  </>;
};

export default AboutUs;
