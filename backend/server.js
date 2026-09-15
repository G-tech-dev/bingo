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

const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || 'local-development-secret-change-me';

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
	type: { type: String, enum: ['photo', 'video'], required: true },
	originalName: String,
	mimeType: String,
	size: Number,
	storagePath: { type: String, required: true },
	url: { type: String, required: true },
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

const User = mongoose.model('User', userSchema);
const Video = mongoose.model('Video', videoSchema);
const Media = mongoose.model('Media', mediaSchema);
const Watch = mongoose.model('Watch', watchSchema);

let bucket = null;
function initializeFirebase() {
	if (admin.apps.length) return;
	const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
	if (!serviceAccount || !process.env.FIREBASE_STORAGE_BUCKET) {
		console.warn('Firebase Storage is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON and FIREBASE_STORAGE_BUCKET to enable uploads.');
		return;
	}
	admin.initializeApp({
		credential: admin.credential.cert(JSON.parse(serviceAccount)),
		storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
	});
	bucket = admin.storage().bucket();
}

function signUser(user) {
	return jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
	return { id: user._id, name: user.name, email: user.email, isPremium: user.isPremium, premiumPlan: user.premiumPlan, wallet: user.wallet };
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

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 500 * 1024 * 1024 },
	fileFilter: (req, file, callback) => callback(null, /^(image|video)\//.test(file.mimetype)),
});

app.get('/api/health', (req, res) => res.json({ ok: true, database: mongoose.connection.readyState === 1, firebaseStorage: Boolean(bucket) }));

app.post('/api/auth/register', databaseRequired, async (req, res, next) => {
	try {
		const { name, email, password } = req.body;
		if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: 'Name, email and a password of at least 6 characters are required' });
		const normalizedEmail = email.toLowerCase().trim();
		if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'Email is already registered' });
		const user = await User.create({ name, email: normalizedEmail, password: await bcrypt.hash(password, 12) });
		return res.status(201).json({ user: publicUser(user), token: signUser(user) });
	} catch (error) { return next(error); }
});

app.post('/api/auth/login', databaseRequired, async (req, res, next) => {
	try {
		const user = await User.findOne({ email: req.body.email?.toLowerCase().trim() }).select('+password');
		if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) return res.status(401).json({ message: 'Invalid email or password' });
		return res.json({ user: publicUser(user), token: signUser(user) });
	} catch (error) { return next(error); }
});

app.get('/api/auth/me', auth, databaseRequired, async (req, res, next) => {
	try { return res.json({ user: publicUser(await User.findById(req.user.id)) }); } catch (error) { return next(error); }
});

app.post('/api/auth/premium', auth, databaseRequired, async (req, res, next) => {
	try { const user = await User.findByIdAndUpdate(req.user.id, { isPremium: true, premiumPlan: req.body.plan || 'basic' }, { new: true }); return res.json({ user: publicUser(user) }); } catch (error) { return next(error); }
});

app.post('/api/media/upload', auth, databaseRequired, upload.single('file'), async (req, res, next) => {
	try {
		if (!bucket) return res.status(503).json({ message: 'Firebase Storage is not configured' });
		if (!req.file) return res.status(400).json({ message: 'Send an image or video in the file field' });
		const type = req.file.mimetype.startsWith('video/') ? 'video' : 'photo';
		const storagePath = `users/${req.user.id}/${type}/${crypto.randomUUID()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
		const file = bucket.file(storagePath);
		await file.save(req.file.buffer, { metadata: { contentType: req.file.mimetype, metadata: { uploadedBy: req.user.id } } });
		const [url] = await file.getSignedUrl({ action: 'read', expires: '03-09-2491' });
		const media = await Media.create({ owner: req.user.id, type, originalName: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size, storagePath, url, title: req.body.title || '', description: req.body.description || '' });
		let video = null;
		if (type === 'video') {
			video = await Video.create({ owner: req.user.id, media: media._id, mediaType: type, mediaUrl: url, videoTitle: req.body.title || req.file.originalname, videoDescription: req.body.description || '', category: req.body.category || 'other' });
			media.videoId = video._id;
		}
		return res.status(201).json({ media, video });
	} catch (error) { return next(error); }
});

app.get('/api/media', auth, databaseRequired, async (req, res, next) => {
	try { return res.json({ media: await Media.find({ owner: req.user.id }).sort({ createdAt: -1 }) }); } catch (error) { return next(error); }
});
app.get('/api/media/:id', auth, databaseRequired, async (req, res, next) => {
	try { const media = await Media.findOne({ _id: req.params.id, owner: req.user.id }); if (!media) return res.status(404).json({ message: 'Media not found' }); return res.json({ media }); } catch (error) { return next(error); }
});
app.put('/api/media/:id', auth, databaseRequired, async (req, res, next) => {
	try { const media = await Media.findOneAndUpdate({ _id: req.params.id, owner: req.user.id }, { $set: { title: req.body.title, description: req.body.description } }, { new: true, runValidators: true }); if (!media) return res.status(404).json({ message: 'Media not found' }); if (media.type === 'video') await Video.findOneAndUpdate({ media: media._id, owner: req.user.id }, { videoTitle: media.title, videoDescription: media.description }); return res.json({ media }); } catch (error) { return next(error); }
});
app.delete('/api/media/:id', auth, databaseRequired, async (req, res, next) => {
	try { const media = await Media.findOneAndDelete({ _id: req.params.id, owner: req.user.id }); if (!media) return res.status(404).json({ message: 'Media not found' }); await Video.deleteOne({ media: media._id, owner: req.user.id }); if (bucket) await bucket.file(media.storagePath).delete().catch(() => {}); return res.json({ message: 'Media deleted' }); } catch (error) { return next(error); }
});

app.post('/api/videos', auth, databaseRequired, async (req, res, next) => { try { return res.status(201).json({ video: await Video.create({ ...req.body, owner: req.user.id }) }); } catch (error) { return next(error); } });
app.get('/api/videos', databaseRequired, async (req, res, next) => { try { const query = req.query.category && req.query.category !== 'all' ? { category: req.query.category } : {}; return res.json({ videos: await Video.find(query).sort({ createdAt: -1 }) }); } catch (error) { return next(error); } });
app.get('/api/videos/:id', databaseRequired, async (req, res, next) => { try { const video = await Video.findById(req.params.id); if (!video) return res.status(404).json({ message: 'Video not found' }); return res.json({ video }); } catch (error) { return next(error); } });
app.put('/api/videos/:id', auth, databaseRequired, async (req, res, next) => { try { const video = await Video.findOneAndUpdate({ _id: req.params.id, owner: req.user.id }, { $set: req.body }, { new: true, runValidators: true }); if (!video) return res.status(404).json({ message: 'Video not found' }); return res.json({ video }); } catch (error) { return next(error); } });
app.delete('/api/videos/:id', auth, databaseRequired, async (req, res, next) => { try { const video = await Video.findOneAndDelete({ _id: req.params.id, owner: req.user.id }); if (!video) return res.status(404).json({ message: 'Video not found' }); return res.json({ message: 'Video deleted' }); } catch (error) { return next(error); } });

app.post('/api/watch/track', auth, databaseRequired, async (req, res, next) => { try { const completed = Boolean(req.body.completed); const earned = completed ? 100 : 0; const watch = await Watch.create({ user: req.user.id, video: req.body.videoId, watchedSeconds: Number(req.body.watchedSeconds || 0), completed, earned }); await Video.findByIdAndUpdate(req.body.videoId, { $inc: { views: 1 } }); if (earned) await User.findByIdAndUpdate(req.user.id, { $inc: { 'wallet.balance': earned } }); return res.json({ watch, earned }); } catch (error) { return next(error); } });
app.get('/api/watch/history', auth, databaseRequired, async (req, res, next) => { try { return res.json({ history: await Watch.find({ user: req.user.id }).populate('video').sort({ createdAt: -1 }) }); } catch (error) { return next(error); } });
app.get('/api/watch/earnings', auth, databaseRequired, async (req, res, next) => { try { const history = await Watch.find({ user: req.user.id }); return res.json({ earnings: { totalEarned: history.reduce((sum, item) => sum + item.earned, 0), completedCount: history.filter((item) => item.completed).length } }); } catch (error) { return next(error); } });
app.get('/api/wallet', auth, databaseRequired, async (req, res, next) => { try { const user = await User.findById(req.user.id); return res.json({ wallet: user.wallet }); } catch (error) { return next(error); } });
app.put('/api/wallet/details', auth, databaseRequired, async (req, res) => res.json({ message: 'Wallet details saved', details: req.body }));
app.post('/api/wallet/deposit', auth, databaseRequired, async (req, res, next) => { try { const user = await User.findByIdAndUpdate(req.user.id, { $inc: { 'wallet.balance': Number(req.body.amount || 0) } }, { new: true }); return res.json({ wallet: user.wallet }); } catch (error) { return next(error); } });
app.post('/api/wallet/withdraw', auth, databaseRequired, async (req, res, next) => { try { const user = await User.findById(req.user.id); const amount = Number(req.body.amount || 0); if (amount <= 0 || amount > user.wallet.balance) return res.status(400).json({ message: 'Invalid withdrawal amount' }); user.wallet.balance -= amount; await user.save(); return res.json({ wallet: user.wallet }); } catch (error) { return next(error); } });

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
		mongoose.connect(process.env.MONGODB_URI).then(() => console.log('MongoDB connected')).catch((error) => console.error('MongoDB connection failed:', error.message));
	} else {
		console.warn('MONGODB_URI is not configured. Database routes will return 503.');
	}
	return app.listen(PORT, () => console.log(`Videa API listening on port ${PORT}`));
}

if (require.main === module) start();
module.exports = { app, start };
