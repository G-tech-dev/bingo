import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaHandsHelping, FaHeart, FaImage, FaSearch } from 'react-icons/fa';
import heroImage from '../../assets/hero.png';

const actions = [
  { number: '01', title: 'Find an organization', text: 'Explore organizations creating safer, brighter futures for children.', icon: FaSearch },
  { number: '02', title: 'See the work', text: 'View photos and videos showing the programs and people being supported.', icon: FaImage },
  { number: '03', title: 'Share their story', text: 'Help good work become easier to find in your community.', icon: FaHandsHelping },
];

const Home = () => (
  <div className="overflow-hidden bg-dark-50 text-dark-900">
    <main>
      <section className="relative border-b border-dark-200 bg-dark-900 text-white">
        <div className="container-custom grid items-center gap-10 py-14 sm:py-20 lg:min-h-[620px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
          <div className="relative z-10 max-w-2xl">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-primary-300">Umushanga RW044 UEBR Kabuga</p>
            <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">Helping people find organizations helping children.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-dark-300 sm:text-lg sm:leading-8">A community space for Umushanga RW044 UEBR Kabuga, supported by Compassion International, to share the photos and videos that show its work.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary inline-flex items-center justify-center gap-3 px-6 py-3">Join the community <FaArrowRight className="text-xs" /></Link>
              <Link to="/login" className="inline-flex items-center justify-center border border-dark-600 px-6 py-3 text-sm font-semibold text-white transition hover:border-primary-300 hover:text-primary-200">Sign in</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-dark-400"><span><strong className="text-white">Real stories</strong> from Kabuga</span><span><strong className="text-white">Shared with care</strong> through Compassion International</span></div>
          </div>
          <div className="relative flex min-h-[300px] items-center justify-center sm:min-h-[390px] lg:min-h-[480px]">
            <div className="absolute h-64 w-64 rotate-3 border border-primary-300/30 bg-primary-600/10 sm:h-96 sm:w-96" />
            <img src={heroImage} alt="Umushanga RW044 UEBR Kabuga community" className="relative z-10 w-56 drop-shadow-[0_24px_40px_rgba(124,58,237,0.3)] sm:w-80" />
            <div className="absolute bottom-0 left-1/2 z-20 -translate-x-1/2 border border-dark-600 bg-dark-800 px-5 py-4 shadow-2xl sm:bottom-8 sm:left-8 sm:translate-x-0"><p className="font-mono text-[10px] uppercase tracking-widest text-dark-400">Our purpose</p><p className="mt-1 flex items-center gap-2 text-xl font-bold text-white"><FaHeart className="text-primary-300" /> Every child matters</p></div>
          </div>
        </div>
      </section>
      <section className="border-b border-dark-200 bg-white py-16 sm:py-20"><div className="container-custom"><div className="max-w-2xl"><p className="font-mono text-xs uppercase tracking-[0.2em] text-primary-600">How it works</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-dark-900 sm:text-4xl">Make compassionate work easier to find.</h2><p className="mt-4 text-base leading-7 text-dark-600">Discover the people, programs, and stories connected to Umushanga RW044 UEBR Kabuga.</p></div><div className="mt-12 grid gap-px border border-dark-200 bg-dark-200 md:grid-cols-3">{actions.map(({ number, title, text, icon: Icon }) => <article key={number} className="bg-white p-7"><div className="flex items-center justify-between text-primary-600"><span className="font-mono text-xs">{number}</span><Icon /></div><h3 className="mt-8 text-xl font-bold text-dark-900 sm:mt-12">{title}</h3><p className="mt-3 text-sm leading-6 text-dark-600">{text}</p></article>)}</div></div></section>
      <section className="bg-primary-700 py-16 text-white"><div className="container-custom flex flex-col justify-between gap-8 md:flex-row md:items-center"><div className="max-w-2xl"><p className="font-mono text-xs uppercase tracking-[0.2em] text-primary-200">Our community</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight">Share the work. Strengthen the connection.</h2><p className="mt-3 max-w-xl leading-7 text-primary-100">Publish photos and videos so families, supporters, and partners can better understand the work happening in Kabuga.</p></div><Link to="/register" className="inline-flex shrink-0 items-center gap-3 bg-white px-6 py-3 text-sm font-bold text-primary-700 transition hover:bg-primary-50">Get started <FaArrowRight className="text-xs" /></Link></div></section>
    </main>
    <footer className="border-t border-dark-200 bg-dark-950 py-6 text-sm text-dark-400"><div className="container-custom flex flex-col justify-between gap-2 sm:flex-row"><span className="font-semibold text-white">Umushanga RW044 UEBR Kabuga</span><span>Supported by Compassion International.</span></div></footer>
  </div>
);

export default Home;
