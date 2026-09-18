# Compassion deployment

## GitHub

From the repository root:

```powershell
git init
git add .
git commit -m "Add Docker and Vercel deployment configuration"
git branch -M main
git remote add origin https://github.com/G-tech-dev/bingo.git
git push -u origin main
```

If the remote already exists, use `git remote set-url origin https://github.com/G-tech-dev/bingo.git` instead of `git remote add`.

## Vercel frontend

1. Import `G-tech-dev/bingo` into Vercel.
2. Set **Root Directory** to `frontend`.
3. Keep the framework preset as **Vite**. The build command and output directory are read from `frontend/package.json` and Vite defaults.
4. Add this environment variable:

   ```text
   VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api
   ```

5. Deploy. `frontend/vercel.json` keeps React Router routes working after a refresh.

### Cloudinary media storage

1. Create a free Cloudinary account.
2. Copy the cloud name, API key, and API secret from the Cloudinary console.
3. Add them as backend environment variables. Media is uploaded server-side and its URL and public ID are stored in MongoDB.

Never commit API secrets or a `.env` file.

## Backend hosting on Render

The frontend remains on Vercel. Deploy the backend as a Render Web Service using `render.yaml` or the backend Dockerfile.

Set these backend environment variables on that host:

```text
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<long-random-secret>
CORS_ORIGINS=https://YOUR-VERCEL-DOMAIN.vercel.app
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

Cloudinary uploads use `POST /api/media/upload` as multipart form data with a `file` field. The API accepts image, video, and audio files and provides metadata CRUD at `/api/media`.

When MongoDB connects, the API automatically seeds the administrator account if it does not already exist:

```text
Email: admin@compassion.local
Password: CompassionAdmin2026!
```

Change this demo password before production use.

Verify the Render deployment with:

```text
https://YOUR-BACKEND-DOMAIN/api/health
```

After the backend is live, set `VITE_API_URL` in Vercel to its `/api` URL and redeploy the frontend. `VITE_API_BASE` is also supported by the bot API client.

## Local Docker stack

Create a root `.env` file containing a non-default secret:

```text
JWT_SECRET=replace-with-a-long-random-value
```

Start the frontend, API, and MongoDB together:

```powershell
docker compose up --build
```

Open `http://localhost:8080`. The API health check is available at `http://localhost:5000/api/health`.