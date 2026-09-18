import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mediaService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FaImage, FaInfoCircle, FaMicrophone, FaSpinner, FaUpload, FaVideo } from 'react-icons/fa';
import toast from 'react-hot-toast';

const UploadVideo = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [contentType, setContentType] = useState('video');
  const [selectedFile, setSelectedFile] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef(null);
  const recordingChunksRef = useRef([]);

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleTypeChange = (type) => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    setContentType(type);
    setSelectedFile(null);
    setBackgroundImage(null);
    setProgress(0);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast.error('Audio recording is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recordingChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm';
        const file = new File([new Blob(recordingChunksRef.current, { type })], `recording-${Date.now()}.webm`, { type });
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setRecording(false);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (error) {
      console.error('Audio recording error:', error);
      toast.error('Microphone permission is required to record audio.');
    }
  };

  const stopRecording = () => recorderRef.current?.stop();

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024 * 1024) {
      toast.error('Files must be smaller than 500MB.');
      return;
    }
    const expectedMimeType = contentType === 'photo' ? 'image' : contentType;
    if (!file.type.startsWith(`${expectedMimeType}/`)) {
      toast.error(`Choose a ${contentType} file.`);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.error(`Choose a ${contentType} file first.`);
      return;
    }
    setLoading(true);
    setProgress(0);
    try {
      await mediaService.upload(selectedFile, {
        title: formData.title,
        description: formData.description,
        ...(contentType === 'audio' && backgroundImage ? { backgroundImage: await fileToBase64(backgroundImage) } : {}),
      }, (uploadEvent) => {
        if (uploadEvent.total) setProgress(Math.round((uploadEvent.loaded * 100) / uploadEvent.total));
      });
      toast.success(`${contentType.charAt(0).toUpperCase() + contentType.slice(1)} uploaded successfully.`);
      navigate(contentType === 'video' ? '/videos' : '/media');
    } catch (error) {
      console.error('Content upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  if (!isAdmin) return null;

  return (
    <div className="container-custom max-w-3xl py-8">
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-white">
          <h1 className="flex items-center gap-2 text-2xl font-bold"><FaUpload /> Add new content</h1>
          <p className="mt-1 text-primary-100">Help people discover the work your organization is doing for children.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-dark-50 p-1">
            {[['video', 'Video', FaVideo], ['photo', 'Photo', FaImage], ['audio', 'Audio', FaMicrophone]].map(([type, label, Icon]) => <button key={type} type="button" onClick={() => handleTypeChange(type)} className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${contentType === type ? 'bg-white text-primary-700 shadow-sm' : 'text-dark-500'}`}><Icon /> {label}</button>)}
          </div>
          <div><label className="mb-1 block text-sm font-medium text-dark-700">Title *</label><input name="title" value={formData.title} onChange={handleChange} required maxLength="200" className="input-field" placeholder={`Enter ${contentType} title`} /></div>
          <div><label className="mb-1 block text-sm font-medium text-dark-700">Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="input-field" placeholder="Describe your content" /></div>
          <div><label className="mb-1 block text-sm font-medium text-dark-700">{contentType.charAt(0).toUpperCase() + contentType.slice(1)} file *</label><input type="file" accept={`${contentType === 'photo' ? 'image' : contentType}/*`} onChange={handleFileChange} required={!selectedFile} disabled={recording} className="input-field" /><p className="mt-1 text-xs text-dark-400">Maximum file size: 500MB</p>{contentType === 'audio' && <><div className="mt-3 flex items-center gap-3"><button type="button" onClick={recording ? stopRecording : startRecording} disabled={loading} className="secondary-button px-4 py-2 text-sm">{recording ? 'Stop recording' : 'Record audio'}</button>{recording && <span className="text-sm text-red-600">Recording...</span>}</div><label className="mt-4 block text-sm font-medium text-dark-700">Audio background image</label><input type="file" accept="image/*" onChange={(event) => setBackgroundImage(event.target.files?.[0] || null)} className="input-field" /><p className="mt-1 text-xs text-dark-400">Optional image shown behind the audio player.</p></>}{previewUrl && (contentType === 'photo' ? <img src={previewUrl} alt="Selected content preview" className="mt-3 max-h-64 rounded-lg object-contain" /> : <div className="mt-3 rounded-lg bg-dark-50 p-4"><audio src={previewUrl} controls={contentType === 'audio'} className="w-full" />{contentType === 'video' && <video src={previewUrl} controls className="max-h-64 w-full rounded-lg" />}</div>)}</div>
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700"><FaInfoCircle className="mt-0.5 shrink-0" /><p>Content is stored securely in Cloudinary. Published content will be visible to people looking for organizations helping children.</p></div>
          <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><FaSpinner className="animate-spin" /> Uploading {progress ? `${progress}%` : ''}</> : <><FaUpload /> Upload {contentType}</>}</button>
        </form>
      </div>
    </div>
  );
};

export default UploadVideo;
