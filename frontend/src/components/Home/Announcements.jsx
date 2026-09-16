import React from 'react';
import { FaBullhorn } from 'react-icons/fa';

const Announcements = () => (
  <div className="container-custom py-8">
    <header className="mb-8 border-b border-dark-200 pb-6">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary-600">Announcements</p>
      <h1 className="mt-2 text-3xl font-extrabold text-dark-900">What is happening</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-dark-600">Important updates from the platform administrator will appear here.</p>
    </header>
    <section className="card p-8 text-center"><FaBullhorn className="mx-auto text-3xl text-primary-600" /><h2 className="mt-4 text-xl font-bold text-dark-900">No announcements yet</h2><p className="mt-2 text-sm text-dark-600">Check back soon for news and community updates.</p></section>
  </div>
);

export default Announcements;
