import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { videoService, watchService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FaClock, FaDollarSign, FaEye, FaHeart, FaPlay, FaQuestionCircle, FaShare, FaVideo } from 'react-icons/fa';
import toast from 'react-hot-toast';

const VideoPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const mediaRef = useRef(null);
  const [video, setVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await videoService.getById(id);
        setVideo(response.data.video);
        const related = await videoService.getAll({ category: response.data.video.category || 'all' });
        setRelatedVideos((related.data.videos || []).filter((item) => item._id !== id).slice(0, 4));
      } catch (error) {
        toast.error('Failed to load video');
        navigate('/videos');
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, [id, navigate]);

  const trackCompletion = async () => {
    if (completed || !isAuthenticated) return;
    setCompleted(true);
    try {
      await watchService.track({ videoId: id, watchedSeconds: Math.round(duration), completed: true });
      toast.success('Watch time recorded.');
    } catch (error) {
      console.error('Failed to record watch time:', error);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: video.videoTitle, text: video.videoDescription, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); toast.success('Content link copied.'); }
    } catch (error) {
      if (error.name !== 'AbortError') toast.error('Could not share this content.');
    }
  };

  const formatViews = (views = 0) => views >= 1000000 ? `${(views / 1000000).toFixed(1)}M` : views >= 1000 ? `${(views / 1000).toFixed(1)}K` : views;
  const formatTime = (seconds = 0) => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500" /></div>;
  if (!video) return <div className="container-custom py-16 text-center"><FaQuestionCircle className="mx-auto text-6xl text-primary-500" /><h2 className="mt-4 text-2xl font-bold text-dark-700">Content not found</h2><button onClick={() => navigate('/videos')} className="btn-primary mt-4">Browse content</button></div>;

  const isPhoto = video.mediaType === 'photo' || video.mediaUrl?.match(/\.(png|jpe?g|gif|webp)(\?|$)/i);
  return (
    <div className="min-h-screen bg-slate-950"><div className="container-custom py-5 lg:py-8">
      <div className="mb-5 flex items-center justify-between text-white"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-300">Now viewing</p><p className="mt-1 text-sm text-slate-400">Enjoy content from the creator community.</p></div><button type="button" onClick={() => navigate('/videos')} className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-primary-400 hover:text-white">Back to library</button></div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3"><div className="lg:col-span-2">
        <div className="relative overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
          {isPhoto ? <img src={video.mediaUrl} alt={video.videoTitle} className="aspect-video h-full w-full object-contain" /> : <video ref={mediaRef} src={video.mediaUrl} poster={video.thumbnailUrl} controls className="aspect-video h-full w-full" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onEnded={trackCompletion} />}
          {!isPhoto && !isPlaying && <button type="button" onClick={() => mediaRef.current?.play()} aria-label="Play video" className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary-600 text-2xl text-white shadow-lg"><FaPlay /></button>}
        </div>
        <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">Content details</p><h1 className="mt-2 text-2xl font-bold text-slate-950">{video.videoTitle}</h1></div><span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold capitalize text-primary-700">{video.category || 'General'}</span></div><div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm text-slate-500"><span className="flex items-center gap-1"><FaEye className="text-primary-500" /> {formatViews(video.views)} views</span><span className="flex items-center gap-1"><FaClock className="text-primary-500" /> {new Date(video.createdAt).toLocaleDateString()}</span>{!isPhoto && <span>{formatTime(currentTime)} / {formatTime(duration)}</span>}</div><div className="mt-5 flex gap-2"><button type="button" onClick={() => setIsLiked((current) => !current)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"><FaHeart /> {isLiked ? 'Liked' : 'Like'}</button><button type="button" onClick={handleShare} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"><FaShare /> Share</button></div>{video.videoDescription && <p className="mt-5 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{video.videoDescription}</p>}</div>
      </div><aside className="space-y-6"><div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6"><h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-green-800"><FaDollarSign /> Earnings</h3><p className="mt-2 text-sm text-green-700">Complete the video to record your watch activity and unlock rewards.</p></div><div className="rounded-2xl bg-white p-6"><h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-dark-500">Related content</h3>{relatedVideos.length === 0 ? <p className="text-sm text-dark-500">No related content yet.</p> : <div className="space-y-2">{relatedVideos.map((item) => <Link key={item._id} to={`/video/${item._id}`} className="flex gap-3 rounded-xl p-2 hover:bg-slate-50"><div className="h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">{item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><FaVideo className="text-primary-400" /></div>}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-700">{item.videoTitle}</p><p className="text-xs text-slate-400">{formatViews(item.views)} views</p></div></Link>)}</div>}</div></aside></div>
    </div></div>
  );
};

export default VideoPlayer;
