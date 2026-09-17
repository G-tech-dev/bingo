import React from 'react';
import { FaHandsHelping } from 'react-icons/fa';

const AboutUs = () => (
  <div className="container-custom py-8">
    <header className="mb-8 border-b border-dark-200 pb-6">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary-600">About us</p>
      <h1 className="mt-2 text-3xl font-extrabold text-dark-900">RW0448 UEBR KABUGA</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-dark-600">Supported with Compassion International to connect families, stories, and community programs in Kabuga.</p>
    </header>
    <section className="card flex gap-5 p-6"><FaHandsHelping className="mt-1 shrink-0 text-2xl text-primary-600" /><div><h2 className="text-xl font-bold text-dark-900">Built for connection</h2><p className="mt-2 text-sm leading-6 text-dark-600">RW0448 UEBR KABUGA is supported with Compassion International and brings trusted community content into one welcoming space for viewers and administrators.</p></div></section>
  </div>
);

export default AboutUs;
