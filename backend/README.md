# Compassion API

Express API for the Compassion organization content platform.

The backend provides authentication, organization media uploads, content CRUD, public video discovery, watch tracking, and wallet endpoints. Photos and videos are stored in Firebase Storage, with metadata in MongoDB.

## Run locally

```powershell
npm install
npm start
```

Required environment variables:

```text
MONGODB_URI=mongodb://localhost:27017/compassion
JWT_SECRET=replace-with-a-long-random-value
FIREBASE_SERVICE_ACCOUNT_JSON=<single-line Firebase service account JSON>
FIREBASE_STORAGE_BUCKET=<your-project-id>.firebasestorage.app
```

The API seeds the administrator account automatically when MongoDB connects. Demo login: `admin@compassion.local` / `CompassionAdmin2026!`. Change this password before production use.

Uploads use `POST /api/media/upload` with an authenticated multipart `file` field. The API accepts image, video, and audio files. Media metadata is managed through `/api/media`.
