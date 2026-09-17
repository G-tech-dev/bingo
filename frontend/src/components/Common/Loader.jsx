import React from 'react';
import { FaHandsHelping } from 'react-icons/fa';

const Loader = ({ text = 'Loading community content...' }) => {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="flex flex-col items-center justify-center rounded-[2rem] border border-primary-100 bg-white/90 px-6 py-8 shadow-lg shadow-primary-100/40 backdrop-blur-sm sm:px-10">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute h-full w-full animate-ping rounded-full bg-primary-100/80"></div>
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600 border-r-primary-400"></div>
          <div className="absolute h-12 w-12 animate-pulse rounded-full bg-primary-50"></div>
          <FaHandsHelping className="relative text-2xl text-primary-700" />
        </div>

        <div className="mt-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600">RW0448 UEBR KABUGA</p>
          <p className="mt-2 text-sm font-medium text-dark-700">{text}</p>
        </div>
      </div>
    </div>
  );
};

export default Loader;
