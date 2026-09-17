import React from 'react';
import { FaBullhorn } from 'react-icons/fa';
import ManagedPage from './ManagedPage';

const Announcements = () => (
  <ManagedPage
    section="announcement"
    eyebrow="Announcements"
    heading="What is happening"
    intro="Important updates from the platform administrator will appear here."
    emptyTitle="No announcements yet"
    emptyText="Check back soon for news and community updates."
    Icon={FaBullhorn}
  />
);

export default Announcements;
