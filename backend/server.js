require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET ;

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:8080')
	.split(',')
	.map((origin) => origin.trim())
	.map((origin) => origin.replace(/\/+$/, ''))
	.filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: allowedOrigins.includes('*') ? true : allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const userSchema = new mongoose.Schema({
	name: { type: String, required: true, trim: true },
	email: { type: String, required: true, unique: true, lowercase: true, trim: true },
	password: { type: String, required: true, select: false },
	role: { type: String, enum: ['admin', 'viewer'], default: 'viewer' },
	isPremium: { type: Boolean, default: false },
	premiumPlan: { type: String, default: null },
	wallet: { balance: { type: Number, default: 0 }, currency: { type: String, default: 'RWF' } },
}, { timestamps: true });

const videoSchema = new mongoose.Schema({
	owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	videoTitle: { type: String, required: true, trim: true },
	videoDescription: { type: String, default: '' },
	category: { type: String, default: 'all' },
	media: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
	mediaType: { type: String, enum: ['video', 'photo'], default: 'video' },
	mediaUrl: { type: String, default: '' },
	thumbnailUrl: { type: String, default: '' },
	duration: { type: Number, default: 0 },
	views: { type: Number, default: 0 },
}, { timestamps: true });

const mediaSchema = new mongoose.Schema({
	owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	type: { type: String, enum: ['photo', 'video', 'audio'], required: true },
	originalName: String,
	mimeType: String,
	size: Number,
	storagePath: { type: String, required: true },
	storageResourceType: { type: String, default: 'image' },
	url: { type: String, required: true },
	videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
	backgroundImageUrl: { type: String, default: '' },
	backgroundImageMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
	isBackground: { type: Boolean, default: false },
	isStaffPhoto: { type: Boolean, default: false },
	title: { type: String, default: '' },
	description: { type: String, default: '' },
}, { timestamps: true });

const watchSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
	watchedSeconds: { type: Number, default: 0 },
	completed: { type: Boolean, default: false },
	earned: { type: Number, default: 0 },
}, { timestamps: true });

const pageContentSchema = new mongoose.Schema({
	section: { type: String, enum: ['about', 'story', 'announcement'], required: true },
	title: { type: String, required: true, trim: true },
	body: { type: String, default: '' },
	owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
pageContentSchema.index({ section: 1, createdAt: -1 });

const workerSchema = new mongoose.Schema({
	owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	name: { type: String, required: true, trim: true },
	role: { type: String, default: '', trim: true },
	details: { type: String, default: '' },
	photoUrl: { type: String, default: '' },
	photoMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Video = mongoose.model('Video', videoSchema);
const Media = mongoose.model('Media', mediaSchema);
const Watch = mongoose.model('Watch', watchSchema);
const PageContent = mongoose.model('PageContent', pageContentSchema);
const Worker = mongoose.model('Worker', workerSchema);

const cloudinaryConfigured = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

function signUser(user) {
	return jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
	return { id: user._id, name: user.name, email: user.email, role: user.role, isPremium: user.isPremium, premiumPlan: user.premiumPlan, wallet: user.wallet };
}

function auth(req, res, next) {
	const token = req.headers.authorization?.replace('Bearer ', '');
	if (!token) return res.status(401).json({ message: 'Authentication required' });
	try {
		req.user = jwt.verify(token, JWT_SECRET);
		return next();
	} catch (error) {
		return res.status(401).json({ message: 'Invalid or expired token' });
	}
}

function databaseRequired(req, res, next) {
	if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Database is not connected' });
	return next();
}

async function adminOnly(req, res, next) {
	try {
		if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Database is not connected' });
		const user = await User.findById(req.user.id).select('role');
		if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Administrator access required' });
		req.user.role = user.role;
		return next();
	} catch (error) {
		return next(error);
	}
}

async function removeLegacyUserIndexes() {
	try {
		await User.collection.dropIndex('username_1');
		console.log('Removed legacy username index');
	} catch (error) {
		if (error.code !== 27) throw error;
	}
}

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 200 * 1024 * 1024 },
	fileFilter: (req, file, callback) => callback(null, /^(image|video|audio)\//.test(file.mimetype)),
});

const cloudinaryResourceType = (type) => type === 'photo' ? 'image' : 'video';
const uploadToCloudinary = (file, userId, type) => new Promise((resolve, reject) => {
	const uploadStream = cloudinary.uploader.upload_stream({
		folder: `compassion/users/${userId}/${type}`,
		resource_type: cloudinaryResourceType(type),
		use_filename: false,
		unique_filename: true,
	}, (error, result) => error ? reject(error) : resolve(result));
	uploadStream.end(file.buffer);
});

const saveStorageFile = async (file, userId, type) => {
	const result = await uploadToCloudinary(file, userId, type);
	return { storagePath: result.public_id, storageResourceType: result.resource_type, url: result.secure_url };
};

const deleteStorageFile = async (storagePath, storageResourceType) => {
	if (!storagePath) return;
	await cloudinary.uploader.destroy(storagePath, { resource_type: storageResourceType || 'image', invalidate: true });
};

app.get('/api/health', (req, res) => res.json({ ok: true, database: mongoose.connection.readyState === 1, cloudinary: cloudinaryConfigured }));

app.post('/api/auth/login', databaseRequired, async (req, res, next) => {
	try {
		const user = await User.findOne({ email: req.body.email?.toLowerCase().trim() }).select('+password');
		if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) return res.status(401).json({ message: 'Invalid email or password' });
		return res.json({ user: publicUser(user), token: jwt.sign({ id: user._id.toString(), email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' }) });
	} catch (error) { return next(error); }
});

app.get('/api/auth/me', auth, databaseRequired, async (req, res, next) => {
	try { return res.json({ user: publicUser(await User.findById(req.user.id)) }); } catch (error) { return next(error); }
});

app.post('/api/auth/premium', auth, databaseRequired, async (req, res, next) => {
	try { const user = await User.findByIdAndUpdate(req.user.id, { isPremium: true, premiumPlan: req.body.plan || 'basic' }, { new: true }); return res.json({ user: publicUser(user) }); } catch (error) { return next(error); }
});

app.get('/api/admin/users', auth, adminOnly, databaseRequired, async (req, res, next) => {
	try { return res.json({ users: await User.find().select('name email role createdAt isPremium').sort({ createdAt: -1 }) }); } catch (error) { return next(error); }
});
app.get('/api/admin/media', auth, adminOnly, databaseRequired, async (req, res, next) => {
	try { return res.json({ media: await Media.find({ isStaffPhoto: { $ne: true } }).populate('owner', 'name email').sort({ createdAt: -1 }).limit(100) }); } catch (error) { return next(error); }
});
app.post('/api/admin/users', auth, adminOnly, databaseRequired, async (req, res, next) => {
	try {
		const { name, email, password } = req.body;
		if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: 'Name, email and a password of at least 6 characters are required' });
		const normalizedEmail = email.toLowerCase().trim();
		if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'Email is already registered' });
		const user = await User.create({ name, email: normalizedEmail, role: 'viewer', password: await bcrypt.hash(password, 12) });
		return res.status(201).json({ user: publicUser(user) });
	} catch (error) {
		if (error.code === 11000) return res.status(409).json({ message: 'Email is already registered' });
		return next(error);
	}
});
app.put('/api/admin/users/:id/role', auth, adminOnly, databaseRequired, async (req, res, next) => {
	try {
		if (req.body.role !== 'admin') return res.status(400).json({ message: 'Only promotion to administrator is supported' });
		const user = await User.findByIdAndUpdate(req.params.id, { role: 'admin' }, { new: true, runValidators: true }).select('name email role createdAt isPremium');
		if (!user) return res.status(404).json({ message: 'User not found' });
		return res.json({ user });
	} catch (error) { return next(error); }
});
app.delete('/api/admin/users/:id', auth, adminOnly, databaseRequired, async (req, res, next) => {
	try { const user = await User.findOne({ _id: req.params.id, role: { $ne: 'admin' } }); if (!user) return res.status(404).json({ message: 'User not found or cannot be removed' }); await User.deleteOne({ _id: user._id }); await Media.deleteMany({ owner: user._id }); await Video.deleteMany({ owner: user._id }); return res.json({ message: 'User removed' }); } catch (error) { return next(error); }
});

app.post('/api/media/upload', auth, adminOnly, databaseRequired, upload.fields([{ name: 'file', maxCount: 20 }, { name: 'backgroundImage', maxCount: 1 }]), async (req, res, next) => {
	try {
		if (!cloudinaryConfigured) return res.status(503).json({ message: 'Cloudinary is not configured' });
		const mediaFiles = req.files?.file || [];
		const backgroundFile = req.files?.backgroundImage?.[0];
		if (!mediaFiles.length) return res.status(400).json({ message: 'Send an image, video, or audio file in the file field' });
		if (backgroundFile && mediaFiles.length > 1) return res.status(400).json({ message: 'Background images can only be added to a single audio upload.' });
		if (backgroundFile && !backgroundFile.mimetype.startsWith('image/')) return res.status(400).json({ message: 'The audio background must be an image.' });
		const isStaffPhoto = req.body.isStaffPhoto === 'true' || req.body.isStaffPhoto === true;
		const uploadedMedia = [];
		for (const mediaFile of mediaFiles) {
			const type = mediaFile.mimetype.startsWith('video/') ? 'video' : mediaFile.mimetype.startsWith('audio/') ? 'audio' : 'photo';
			if (backgroundFile && type !== 'audio') return res.status(400).json({ message: 'Background images can only be added to audio.' });
			const savedMedia = await saveStorageFile(mediaFile, req.user.id, type);
			let backgroundImageUrl = '';
			let backgroundImageMedia;
			if (backgroundFile) {
				const savedBackground = await saveStorageFile(backgroundFile, req.user.id, 'photo');
				backgroundImageUrl = savedBackground.url;
				backgroundImageMedia = await Media.create({ owner: req.user.id, type: 'photo', originalName: backgroundFile.originalname, mimeType: backgroundFile.mimetype, size: backgroundFile.size, storagePath: savedBackground.storagePath, storageResourceType: savedBackground.storageResourceType, url: backgroundImageUrl, title: req.body.title || '', description: 'Audio background image', isBackground: true });
			}
			const media = await Media.create({ owner: req.user.id, type, originalName: mediaFile.originalname, mimeType: mediaFile.mimetype, size: mediaFile.size, storagePath: savedMedia.storagePath, storageResourceType: savedMedia.storageResourceType, url: savedMedia.url, title: req.body.title || '', description: req.body.description || '', backgroundImageUrl, backgroundImageMedia: backgroundImageMedia?._id, isStaffPhoto });
			let video = null;
			if (type === 'video') {
				video = await Video.create({ owner: req.user.id, media: media._id, mediaType: type, mediaUrl: savedMedia.url, videoTitle: req.body.title || mediaFile.originalname, videoDescription: req.body.description || '', category: req.body.category || 'other' });
				media.videoId = video._id;
				await media.save();
			}
			uploadedMedia.push({ media, video });
		}
		if (uploadedMedia.length === 1) {
			return res.status(201).json({ media: uploadedMedia[0].media, video: uploadedMedia[0].video });
		}
		return res.status(201).json({ media: uploadedMedia.map((entry) => entry.media), videos: uploadedMedia.map((entry) => entry.video).filter(Boolean), count: uploadedMedia.length });
	} catch (error) { return next(error); }
});

app.get('/api/media', auth, databaseRequired, async (req, res, next) => {
	try { return res.json({ media: await Media.find({ isBackground: { $ne: true }, isStaffPhoto: { $ne: true } }).sort({ createdAt: -1 }) }); } catch (error) { return next(error); }
});
app.get('/api/media/:id', auth, databaseRequired, async (req, res, next) => {
	try { const media = await Media.findById(req.params.id); if (!media) return res.status(404).json({ message: 'Media not found' }); return res.json({ media }); } catch (error) { return next(error); }
});
app.put('/api/media/:id', auth, adminOnly, databaseRequired, async (req, res, next) => {
	try { const media = await Media.findOneAndUpdate({ _id: req.params.id, owner: req.user.id }, { $set: { title: req.body.title, description: req.body.description } }, { new: true, runValidators: true }); if (!media) return res.status(404).json({ message: 'Media not found' }); if (media.type === 'video') await Video.findOneAndUpdate({ media: media._id, owner: req.user.id }, { videoTitle: media.title, videoDescription: media.description }); return res.json({ media }); } catch (error) { return next(error); }
});
app.put('/api/media/:id/background', auth, adminOnly, databaseRequired, upload.single('backgroundImage'), async (req, res, next) => {
	try {
		if (!cloudinaryConfigured) return res.status(503).json({ message: 'Cloudinary is not configured' });
		const media = await Media.findOne({ _id: req.params.id, owner: req.user.id, type: 'audio' });
		if (!media) return res.status(404).json({ message: 'Audio not found' });
		if (!req.file || !req.file.mimetype.startsWith('image/')) return res.status(400).json({ message: 'Choose an image background.' });
		if (media.backgroundImageMedia) {
			const oldBackground = await Media.findById(media.backgroundImageMedia);
			if (oldBackground) { await deleteStorageFile(oldBackground.storagePath, oldBackground.storageResourceType).catch(() => {}); await Media.deleteOne({ _id: oldBackground._id }); }
		}
		const savedBackground = await saveStorageFile(req.file, req.user.id, 'photo');
		const background = await Media.create({ owner: req.user.id, type: 'photo', originalName: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size, storagePath: savedBackground.storagePath, storageResourceType: savedBackground.storageResourceType, url: savedBackground.url, title: media.title, description: 'Audio background image', isBackground: true });
		media.backgroundImageUrl = savedBackground.url;
		media.backgroundImageMedia = background._id;
		await media.save();
		return res.json({ media });
	} catch (error) { return next(error); }
});
app.delete('/api/media/:id/background', auth, adminOnly, databaseRequired, async (req, res, next) => {
	try {
		const media = await Media.findOne({ _id: req.params.id, owner: req.user.id, type: 'audio' });
		if (!media) return res.status(404).json({ message: 'Audio not found' });
		if (media.backgroundImageMedia) {
			const background = await Media.findById(media.backgroundImageMedia);
			if (background) { await deleteStorageFile(background.storagePath, background.storageResourceType).catch(() => {}); await Media.deleteOne({ _id: background._id }); }
		}
		media.backgroundImageUrl = '';
		media.backgroundImageMedia = undefined;
		await media.save();
		return res.json({ media });
	} catch (error) { return next(error); }
});
app.delete('/api/media/:id', auth, adminOnly, databaseRequired, async (req, res, next) => {
	try { const media = await Media.findOneAndDelete({ _id: req.params.id, owner: req.user.id }); if (!media) return res.status(404).json({ message: 'Media not found' }); await Video.deleteOne({ media: media._id, owner: req.user.id }); await deleteStorageFile(media.storagePath, media.storageResourceType).catch(() => {}); return res.json({ message: 'Media deleted' }); } catch (error) { return next(error); }
});

app.post('/api/videos', auth, adminOnly, databaseRequired, async (req, res, next) => { try { return res.status(201).json({ video: await Video.create({ ...req.body, owner: req.user.id }) }); } catch (error) { return next(error); } });
app.get('/api/videos', databaseRequired, async (req, res, next) => { try { const query = req.query.category && req.query.category !== 'all' ? { category: req.query.category } : {}; return res.json({ videos: await Video.find(query).sort({ createdAt: -1 }) }); } catch (error) { return next(error); } });
app.get('/api/videos/:id', databaseRequired, async (req, res, next) => { try { const video = await Video.findById(req.params.id); if (!video) return res.status(404).json({ message: 'Video not found' }); return res.json({ video }); } catch (error) { return next(error); } });
app.put('/api/videos/:id', auth, adminOnly, databaseRequired, async (req, res, next) => { try { const video = await Video.findOneAndUpdate({ _id: req.params.id, owner: req.user.id }, { $set: req.body }, { new: true, runValidators: true }); if (!video) return res.status(404).json({ message: 'Video not found' }); return res.json({ video }); } catch (error) { return next(error); } });
app.delete('/api/videos/:id', auth, adminOnly, databaseRequired, async (req, res, next) => { try { const video = await Video.findOneAndDelete({ _id: req.params.id, owner: req.user.id }); if (!video) return res.status(404).json({ message: 'Video not found' }); return res.json({ message: 'Video deleted' }); } catch (error) { return next(error); } });

const pageSections = ['about', 'story', 'announcement'];
app.get('/api/pages/:section', auth, databaseRequired, async (req, res, next) => {
	try {
		if (!pageSections.includes(req.params.section)) return res.status(400).json({ message: 'Unknown page section' });
		return res.json({ pages: await PageContent.find({ section: req.params.section }).sort({ createdAt: -1 }) });
	} catch (error) { return next(error); }
});
app.post('/api/pages/:section', auth, adminOnly, databaseRequired, async (req, res, next) => {
	try {
		if (!pageSections.includes(req.params.section)) return res.status(400).json({ message: 'Unknown page section' });
		const title = req.body.title?.trim();
		if (!title) return res.status(400).json({ message: 'Title is required' });
		const page = await PageContent.create({ section: req.params.section, title, body: req.body.body || '', owner: req.user.id });
		return res.status(201).json({ page });
	} catch (error) { return next(error); }
});
app.put('/api/pages/:id', auth, adminOnly, databaseRequired, async (req, res, next) => {
	try {
		const page = await PageContent.findByIdAndUpdate(req.params.id, { $set: { title: req.body.title, body: req.body.body } }, { new: true, runValidators: true });
		if (!page) return res.status(404).json({ message: 'Content not found' });
		return res.json({ page });
	} catch (error) { return next(error); }
});
app.delete('/api/pages/:id', auth, adminOnly, databaseRequired, async (req, res, next) => {
	try {
		const page = await PageContent.findByIdAndDelete(req.params.id);
		if (!page) return res.status(404).json({ message: 'Content not found' });
		return res.json({ message: 'Content deleted' });
	} catch (error) { return next(error); }
});

app.get('/api/workers', auth, databaseRequired, async (req, res, next) => {
	try { return res.json({ workers: await Worker.find().sort({ createdAt: -1 }) }); } catch (error) { return next(error); }
});
app.post('/api/workers', auth, adminOnly, databaseRequired, async (req, res, next) => {
	try {
		const name = req.body.name?.trim();
		if (!name) return res.status(400).json({ message: 'Staff name is required' });
		const worker = await Worker.create({ name, role: req.body.role || '', details: req.body.details || '', photoUrl: req.body.photoUrl || '', photoMedia: req.body.photoMedia || undefined, owner: req.user.id });
		return res.status(201).json({ worker });
	} catch (error) { return next(error); }
});
app.put('/api/workers/:id', auth, adminOnly, databaseRequired, async (req, res, next) => {
	try {
		const worker = await Worker.findByIdAndUpdate(req.params.id, { $set: { name: req.body.name, role: req.body.role || '', details: req.body.details || '', photoUrl: req.body.photoUrl || '', photoMedia: req.body.photoMedia || undefined } }, { new: true, runValidators: true });
		if (!worker) return res.status(404).json({ message: 'Staff member not found' });
		return res.json({ worker });
	} catch (error) { return next(error); }
});
app.delete('/api/workers/:id', auth, adminOnly, databaseRequired, async (req, res, next) => {
	try {
		const worker = await Worker.findByIdAndDelete(req.params.id);
		if (!worker) return res.status(404).json({ message: 'Staff member not found' });
		return res.json({ message: 'Staff deleted' });
	} catch (error) { return next(error); }
});


app.use((error, req, res, next) => {
	if (error instanceof multer.MulterError || error.message?.includes('File too large')) return res.status(400).json({ message: 'File is too large. Maximum size is 500MB.' });
	if (error.message?.includes('File type')) return res.status(400).json({ message: error.message });
	if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
	if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid resource id' });
	console.error(error);
	return res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Upload failed. Check Cloudinary configuration.' : error.message || 'Internal server error' });
});

let databaseConnectionPromise;

async function initialize() {
	if (!process.env.MONGODB_URI) {
		console.warn('MONGODB_URI is not configured. Database routes will return 503.');
		return;
	}
	if (mongoose.connection.readyState === 1) return;
	if (!databaseConnectionPromise) {
		databaseConnectionPromise = mongoose.connect(process.env.MONGODB_URI).then(async () => {
			console.log('MongoDB connected');
			await removeLegacyUserIndexes();
		}).catch((error) => {
			databaseConnectionPromise = null;
			throw error;
		});
	}
	await databaseConnectionPromise;
}

async function start() {
	await initialize().catch((error) => console.error('MongoDB connection failed:', error.message));
	return app.listen(PORT, () => console.log(`Videa API listening on port ${PORT}`));
}

if (require.main === module) start();
module.exports = { app, initialize, start };
