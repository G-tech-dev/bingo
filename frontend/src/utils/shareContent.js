import toast from 'react-hot-toast';

const shareContent = async ({ title, text, url = window.location.href }) => {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return;
    }

    await navigator.clipboard.writeText(url);
    toast.success('Content link copied.');
  } catch (error) {
    if (error.name !== 'AbortError') toast.error('Could not share this content.');
  }
};

export default shareContent;
