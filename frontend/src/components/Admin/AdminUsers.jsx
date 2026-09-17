import React, { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash, FaTrash, FaUserPlus, FaUsers } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loader from '../Common/Loader';

const emptyForm = { name: '', email: '', password: '' };

const AdminUsers = () => {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    try {
      const response = await adminService.getUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') loadUsers();
    else setLoading(false);
  }, [user?.role]);

  const handleChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const createUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await adminService.createUser(form);
      setUsers((current) => [response.data.user, ...current]);
      setForm(emptyForm);
      toast.success('Viewer created.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to create viewer.');
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (id) => {
    if (!window.confirm('Remove this viewer and their content?')) return;
    try {
      await adminService.deleteUser(id);
      setUsers((current) => current.filter((item) => item._id !== id));
      toast.success('Viewer removed.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to remove viewer.');
    }
  };

  if (authLoading || loading) return <Loader />;
  if (user?.role !== 'admin') return <div className="container-custom py-16 text-center"><FaUsers className="mx-auto text-5xl text-primary-500" /><h1 className="mt-4 text-2xl font-bold text-dark-800">Administrator access required</h1></div>;

  return (
    <div className="container-custom py-8">
      <header className="mb-8"><p className="font-mono text-xs uppercase tracking-[0.16em] text-primary-600">System administration</p><h1 className="mt-2 text-3xl font-extrabold text-dark-900">Manage users</h1><p className="mt-2 text-sm text-dark-600">Create viewer accounts for people who want to discover community stories.</p></header>
      <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
        <form onSubmit={createUser} className="card space-y-4 p-6"><h2 className="flex items-center gap-2 font-semibold text-dark-900"><FaUserPlus className="text-primary-600" /> Create viewer</h2><input name="name" value={form.name} onChange={handleChange} required className="input-field" placeholder="Viewer name" /><input name="email" type="email" value={form.email} onChange={handleChange} required className="input-field" placeholder="Email address" /><div className="relative"><input name="password" type={showPassword ? 'text' : 'password'} minLength="6" value={form.password} onChange={handleChange} required className="input-field pr-10" placeholder="Temporary password" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-dark-500 hover:text-dark-700">{showPassword ? <FaEyeSlash /> : <FaEye />}</button></div><button disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50">{saving ? 'Creating...' : 'Create viewer'}</button></form>
        <section className="card overflow-hidden"><div className="border-b border-dark-100 px-6 py-4"><h2 className="font-semibold text-dark-900">Accounts ({users.length})</h2></div><div className="divide-y divide-dark-100">{users.map((item) => <div key={item._id} className="flex items-center justify-between gap-4 px-6 py-4"><div className="min-w-0"><p className="truncate font-semibold text-dark-800">{item.name}</p><p className="truncate text-sm text-dark-500">{item.email}</p><span className="text-xs capitalize text-primary-600">{item.role}</span></div>{item.role !== 'admin' && <button type="button" onClick={() => removeUser(item._id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label={`Remove ${item.name}`} title="Remove viewer"><FaTrash /></button>}</div>)}{users.length === 0 && <p className="px-6 py-8 text-sm text-dark-500">No accounts found.</p>}</div></section>
      </div>
    </div>
  );
};

export default AdminUsers;
