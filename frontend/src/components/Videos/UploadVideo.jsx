import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mediaService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FaImage, FaInfoCircle, FaMicrophone, FaSpinner, FaUpload, FaVideo } from 'react-icons/fa';
import toast from 'react-hot-toast';

const categories = [
  ['gaming', 'Gaming'], ['tech', 'Tech'], ['finance', 'Finance'], ['education', 'Education'],
  ['entertainment', 'Entertainment'], ['music', 'Music'], ['fitness', 'Fitness'], ['travel', 'Travel'],
  ['food', 'Food'], ['other', 'Other'],
];

const UploadVideo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contentType, setContentType] = useState('video');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState({ title: '', description: '', category: 'other' });

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleTypeChange = (type) => {
    setContentType(type);
    setSelectedFile(null);
    setProgress(0);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024 * 1024) {
      toast.error('Files must be smaller than 500MB.');
      return;
    }
    if (!file.type.startsWith(`${contentType}/`)) {
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
        category: formData.category,
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
          <div><label className="mb-1 block text-sm font-medium text-dark-700">Category</label><select name="category" value={formData.category} onChange={handleChange} className="input-field">{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div><label className="mb-1 block text-sm font-medium text-dark-700">{contentType.charAt(0).toUpperCase() + contentType.slice(1)} file *</label><input type="file" accept={`${contentType}/*`} onChange={handleFileChange} required className="input-field" /><p className="mt-1 text-xs text-dark-400">Maximum file size: 500MB</p>{previewUrl && (contentType === 'photo' ? <img src={previewUrl} alt="Selected content preview" className="mt-3 max-h-64 rounded-lg object-contain" /> : <div className="mt-3 rounded-lg bg-dark-50 p-4"><audio src={previewUrl} controls={contentType === 'audio'} className="w-full" />{contentType === 'video' && <video src={previewUrl} controls className="max-h-64 w-full rounded-lg" />}</div>)}</div>
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700"><FaInfoCircle className="mt-0.5 shrink-0" /><p>Content is stored securely in Firebase Storage. Published content will be visible to people looking for organizations helping children.</p></div>
          <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><FaSpinner className="animate-spin" /> Uploading {progress ? `${progress}%` : ''}</> : <><FaUpload /> Upload {contentType}</>}</button>
        </form>
      </div>
    </div>
  );
};

export default UploadVideo;
