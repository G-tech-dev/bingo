import React, { useEffect, useState } from 'react';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { pageService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loader from '../Common/Loader';

const emptyForm = { title: '', body: '' };

const ManagedPage = ({ section, eyebrow, heading, intro, emptyTitle, emptyText, Icon }) => {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadItems = async () => {
    try {
      const response = await pageService.getAll(section);
      setItems(response.data.pages || []);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Page content error:', error);
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, [section]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const beginEdit = (item) => {
    setEditingId(item._id);
    setForm({ title: item.title || '', body: item.body || '' });
  };

  const saveItem = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const response = await pageService.update(editingId, form);
        setItems((current) => current.map((item) => item._id === editingId ? response.data.page : item));
        toast.success('Content updated.');
      } else {
        const response = await pageService.create(section, form);
        setItems((current) => [response.data.page, ...current]);
        toast.success('Content published.');
      }
      resetForm();
    } catch (error) {
      console.error('Page save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this content permanently?')) return;
    try {
      await pageService.delete(id);
      setItems((current) => current.filter((item) => item._id !== id));
      if (editingId === id) resetForm();
      toast.success('Content deleted.');
    } catch (error) {
      console.error('Page delete error:', error);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container-custom py-8">
      <header className="mb-8 border-b border-dark-200 pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary-600">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight text-dark-900 sm:text-3xl">{heading}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-dark-600">{intro}</p>
      </header>

      {isAdmin && (
        <form onSubmit={saveItem} className="card mb-8 space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-semibold text-dark-900">
            <FaPlus /> {editingId ? 'Edit content' : 'Add content'}
          </h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-dark-700">Title *</label>
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required maxLength="200" className="input-field" placeholder="Enter a title" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-dark-700">Details</label>
            <textarea value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} rows="4" className="input-field" placeholder="Write the content viewers should see" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">{saving ? 'Saving...' : editingId ? 'Save changes' : 'Publish'}</button>
            {editingId && <button type="button" onClick={resetForm} className="secondary-button px-4 py-2 text-sm">Cancel</button>}
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <section className="card p-8 text-center">
          {Icon && <Icon className="mx-auto text-3xl text-primary-600" />}
          <h2 className="mt-4 text-xl font-bold text-dark-900">{emptyTitle}</h2>
          <p className="mt-2 text-sm text-dark-600">{emptyText}</p>
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-2">
          {items.map((item) => (
            <article key={item._id} className="card p-6">
              {Icon && <Icon className="text-2xl text-primary-600" />}
              <div className="mt-4 flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-dark-900">{item.title}</h2>
                {isAdmin && (
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => beginEdit(item)} className="text-dark-500 hover:text-primary-600" title="Edit content"><FaEdit /></button>
                    <button type="button" onClick={() => deleteItem(item._id)} className="text-dark-500 hover:text-red-600" title="Delete content"><FaTrash /></button>
                  </div>
                )}
              </div>
              {item.body && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-dark-600">{item.body}</p>}
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default ManagedPage;
