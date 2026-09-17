require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const multer = require('multer');
const admin = require('firebase-admin');
const { seedUsersIfMissing } = require('./seedData');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET ;

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:8080')
	.split(',')
	.map((origin) => origin.trim())
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
	url: { type: String, required: true },
	videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
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

const User = mongoose.model('User', userSchema);
const Video = mongoose.model('Video', videoSchema);
const Media = mongoose.model('Media', mediaSchema);
const Watch = mongoose.model('Watch', watchSchema);
const PageContent = mongoose.model('PageContent', pageContentSchema);

let bucket = null;
function initializeFirebase() {
	if (admin.apps.length) return;
	const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
	if (!serviceAccount || !process.env.FIREBASE_STORAGE_BUCKET) {
		console.warn('Firebase Storage is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON and FIREBASE_STORAGE_BUCKET to enable uploads.');
		return;
	}
	try {
		admin.initializeApp({
			credential: admin.credential.cert(JSON.parse(serviceAccount)),
			storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
		});
		bucket = admin.storage().bucket();
	} catch (error) {
		console.error('Firebase initialization failed:', error.message);
	}
}

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
	limits: { fileSize: 500 * 1024 * 1024 },
	fileFilter: (req, file, callback) => callback(null, /^(image|video|audio)\//.test(file.mimetype)),
});

app.get('/api/health', (req, res) => res.json({ ok: true, database: mongoose.connection.readyState === 1, firebaseStorage: Boolean(bucket) }));

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
	try { return res.json({ media: await Media.find().populate('owner', 'name email').sort({ createdAt: -1 }).limit(100) }); } catch (error) { return next(error); }
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
app.delete('/api/admin/users/:id', auth, adminOnly, databaseRequired, async (req, res, next) => {
	try { const user = await User.findOne({ _id: req.params.id, role: { $ne: 'admin' } }); if (!user) return res.status(404).json({ message: 'User not found or cannot be removed' }); await User.deleteOne({ _id: user._id }); await Media.deleteMany({ owner: user._id }); await Video.deleteMany({ owner: user._id }); return res.json({ message: 'User removed' }); } catch (error) { return next(error); }
});

app.post('/api/media/upload', auth, adminOnly, databaseRequired, upload.single('file'), async (req, res, next) => {
	try {
		if (!bucket) return res.status(503).json({ message: 'Firebase Storage is not configured' });
		if (!req.file) return res.status(400).json({ message: 'Send an image, video, or audio file in the file field' });
		const type = req.file.mimetype.startsWith('video/') ? 'video' : req.file.mimetype.startsWith('audio/') ? 'audio' : 'photo';
		const storagePath = `users/${req.user.id}/${type}/${crypto.randomUUID()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
		const file = bucket.file(storagePath);
		await file.save(req.file.buffer, { metadata: { contentType: req.file.mimetype, metadata: { uploadedBy: req.user.id } } });
		const [url] = await file.getSignedUrl({ action: 'read', expires: '03-09-2491' });
		const media = await Media.create({ owner: req.user.id, type, originalName: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size, storagePath, url, title: req.body.title || '', description: req.body.description || '' });
		let video = null;
		if (type === 'video') {
			video = await Video.create({ owner: req.user.id, media: media._id, mediaType: type, mediaUrl: url, videoTitle: req.body.title || req.file.originalname, videoDescription: req.body.description || '', category: req.body.category || 'other' });
			media.videoId = video._id;
			await media.save();
		}
		return res.status(201).json({ media, video });
	} catch (error) { return next(error); }
});

app.get('/api/media', auth, databaseRequired, async (req, res, next) => {
	try { return res.json({ media: await Media.find().sort({ createdAt: -1 }) }); } catch (error) { return next(error); }
});
app.get('/api/media/:id', auth, databaseRequired, async (req, res, next) => {
	try { const media = await Media.findById(req.params.id); if (!media) return res.status(404).json({ message: 'Media not found' }); return res.json({ media }); } catch (error) { return next(error); }
});
app.put('/api/media/:id', auth, adminOnly, databaseRequired, async (req, res, next) => {
	try { const media = await Media.findOneAndUpdate({ _id: req.params.id, owner: req.user.id }, { $set: { title: req.body.title, description: req.body.description } }, { new: true, runValidators: true }); if (!media) return res.status(404).json({ message: 'Media not found' }); if (media.type === 'video') await Video.findOneAndUpdate({ media: media._id, owner: req.user.id }, { videoTitle: media.title, videoDescription: media.description }); return res.json({ media }); } catch (error) { return next(error); }
});
app.delete('/api/media/:id', auth, adminOnly, databaseRequired, async (req, res, next) => {
	try { const media = await Media.findOneAndDelete({ _id: req.params.id, owner: req.user.id }); if (!media) return res.status(404).json({ message: 'Media not found' }); await Video.deleteOne({ media: media._id, owner: req.user.id }); if (bucket) await bucket.file(media.storagePath).delete().catch(() => {}); return res.json({ message: 'Media deleted' }); } catch (error) { return next(error); }
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


app.use((error, req, res, next) => {
	if (error instanceof multer.MulterError || error.message?.includes('File too large')) return res.status(400).json({ message: 'File is too large. Maximum size is 500MB.' });
	if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
	if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid resource id' });
	console.error(error);
	return res.status(500).json({ message: 'Internal server error' });
});

async function start() {
	initializeFirebase();
	if (process.env.MONGODB_URI) {
		mongoose.connect(process.env.MONGODB_URI).then(async () => {
			console.log('MongoDB connected');
			await removeLegacyUserIndexes();
			await seedUsersIfMissing(User);
		}).catch((error) => console.error('MongoDB connection failed:', error.message));
	} else {
		console.warn('MONGODB_URI is not configured. Database routes will return 503.');
	}
	return app.listen(PORT, () => console.log(`Videa API listening on port ${PORT}`));
}

if (require.main === module) start();
module.exports = { app, start };
