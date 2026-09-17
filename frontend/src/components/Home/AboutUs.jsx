import React from 'react';
import { FaHandsHelping } from 'react-icons/fa';
import ManagedPage from './ManagedPage';

const AboutUs = () => (
  <ManagedPage
    section="about"
    eyebrow="About us"
    heading="RW0448 UEBR KABUGA"
    intro="Supported with Compassion International to connect families, stories, and community programs in Kabuga."
    emptyTitle="More about us coming soon"
    emptyText="The administrator will publish additional information about the project here."
    Icon={FaHandsHelping}
  />
);

export default AboutUs;
