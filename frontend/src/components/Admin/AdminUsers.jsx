import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTrash, FaUserPlus, FaUsers } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loader from '../Common/Loader';

const emptyForm = { name: '', email: '', password: '', role: 'supporter' };

const AdminUsers = () => {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    try {
      const response = await adminService.getUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Admin users error:', error);
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
      toast.success('User created.');
    } catch (error) {
      console.error('Create user error:', error);
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (id) => {
    if (!window.confirm('Remove this user and their published content?')) return;
    try {
      await adminService.deleteUser(id);
      setUsers((current) => current.filter((item) => item._id !== id));
      toast.success('User removed.');
    } catch (error) {
      console.error('Remove user error:', error);
    }
  };

  if (authLoading || loading) return <Loader />;
  if (user?.role !== 'admin') return <div className="container-custom py-16 text-center"><FaUsers className="mx-auto text-5xl text-primary-500" /><h1 className="mt-4 text-2xl font-bold text-dark-800">Administrator access required</h1></div>;

  return <div className="container-custom py-8"><header className="mb-8"><p className="font-mono text-xs uppercase tracking-[0.16em] text-primary-600">System administration</p><h1 className="mt-2 text-3xl font-extrabold text-dark-900">Manage users</h1><p className="mt-2 text-sm text-dark-600">Create supporter and organization publisher accounts for the Umushinga community.</p></header><div className="grid gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]"><form onSubmit={createUser} className="card space-y-4 p-6"><h2 className="flex items-center gap-2 font-semibold text-dark-900"><FaUserPlus className="text-primary-600" /> Create user</h2><input name="name" value={form.name} onChange={handleChange} required className="input-field" placeholder="Name or organization" /><input name="email" type="email" value={form.email} onChange={handleChange} required className="input-field" placeholder="Email address" /><input name="password" type="password" minLength="6" value={form.password} onChange={handleChange} required className="input-field" placeholder="Temporary password" /><select name="role" value={form.role} onChange={handleChange} className="input-field"><option value="supporter">Supporter</option><option value="publisher">Organization publisher</option></select><button disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50">{saving ? 'Creating...' : 'Create account'}</button></form><section className="card overflow-hidden"><div className="border-b border-dark-100 px-6 py-4"><h2 className="font-semibold text-dark-900">Accounts ({users.length})</h2></div><div className="divide-y divide-dark-100">{users.map((item) => <div key={item._id} className="flex items-center justify-between gap-4 px-6 py-4"><div className="min-w-0"><p className="truncate font-semibold text-dark-800">{item.name}</p><p className="truncate text-sm text-dark-500">{item.email}</p><span className="text-xs capitalize text-primary-600">{item.role}</span></div>{item.role !== 'admin' && <button type="button" onClick={() => removeUser(item._id)} className="text-dark-400 hover:text-red-600" title="Remove user"><FaTrash /></button>}</div>)}{users.length === 0 && <p className="px-6 py-8 text-sm text-dark-500">No users found.</p>}</div></section></div></div>;
};

export default AdminUsers;