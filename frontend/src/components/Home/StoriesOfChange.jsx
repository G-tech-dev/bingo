import React from 'react';
import { FaBookOpen } from 'react-icons/fa';
import ManagedPage from './ManagedPage';

const StoriesOfChange = () => (
  <ManagedPage
    section="story"
    eyebrow="Stories of change"
    heading="See compassion in action"
    intro="Explore stories and community moments shared by the administrator."
    emptyTitle="No stories yet"
    emptyText="Stories of change published by the administrator will appear here."
    Icon={FaBookOpen}
  />
);

export default StoriesOfChange;
