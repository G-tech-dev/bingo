import React from 'react';
import { FaBookOpen, FaHeart } from 'react-icons/fa';

const StoriesOfChange = () => (
  <div className="container-custom py-8">
    <header className="mb-8 border-b border-dark-200 pb-6">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary-600">Stories of change</p>
      <h1 className="mt-2 text-3xl font-extrabold text-dark-900">See compassion in action</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-dark-600">Explore stories, videos, and community moments shared by Umushinga.</p>
    </header>
    <section className="grid gap-5 md:grid-cols-2">
      <article className="card p-6"><FaBookOpen className="text-2xl text-primary-600" /><h2 className="mt-4 text-xl font-bold text-dark-900">Community stories</h2><p className="mt-2 text-sm leading-6 text-dark-600">Stories shared by people and organizations serving families across the community will appear here.</p></article>
      <article className="card p-6"><FaHeart className="text-2xl text-primary-600" /><h2 className="mt-4 text-xl font-bold text-dark-900">A place to connect</h2><p className="mt-2 text-sm leading-6 text-dark-600">Watch, learn, and stay close to the work making a difference every day.</p></article>
    </section>
  </div>
);

export default StoriesOfChange;
