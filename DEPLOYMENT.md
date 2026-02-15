# Deployment Guide - Render

This guide explains how to deploy the Salary Assistant app to Render.

## Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **OpenAI API Key**: Get one from [platform.openai.com](https://platform.openai.com)

## Quick Deploy

### Option 1: Blueprint (Automatic)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push
   ```

2. **Deploy on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **"New"** → **"Blueprint"**
   - Connect your GitHub repository
   - Select the repository
   - Render will detect `render.yaml` and set everything up automatically

3. **Set Environment Variables**:
   - After deployment starts, go to the backend service
   - Navigate to **Environment** tab
   - Add your `OPENAI_API_KEY`

4. **Wait for deployment** (5-10 minutes)
   - Backend will be available at: `https://salary-assistant-backend.onrender.com`
   - Frontend will be available at: `https://salary-assistant-frontend.onrender.com`

### Option 2: Manual Setup

#### Backend Service

1. **Create Web Service**:
   - Dashboard → New → Web Service
   - Connect your GitHub repo
   - Settings:
     - **Name**: `salary-assistant-backend`
     - **Region**: Frankfurt (or closest to you)
     - **Branch**: `main`
     - **Root Directory**: `backend`
     - **Runtime**: Docker
     - **Dockerfile Path**: `backend/Dockerfile`
     - **Plan**: Free

2. **Add Disk Storage**:
   - Go to service → Disks
   - Add Disk:
     - **Name**: `salary-assistant-data`
     - **Mount Path**: `/app/data`
     - **Size**: 1 GB

3. **Environment Variables**:
   ```
   OPENAI_API_KEY=your-actual-key-here
   OPENAI_MODEL=gpt-4o-mini
   EMBEDDING_PROVIDER=openai
   OPENAI_EMBEDDING_MODEL=text-embedding-3-small
   DEFAULT_CHUNK_SIZE=500
   DEFAULT_CHUNK_OVERLAP=50
   DEFAULT_TOP_K=5
   DEFAULT_TEMPERATURE=0.3
   ```

#### Frontend Service

1. **Create Web Service**:
   - Dashboard → New → Web Service
   - Connect your GitHub repo
   - Settings:
     - **Name**: `salary-assistant-frontend`
     - **Region**: Frankfurt
     - **Branch**: `main`
     - **Root Directory**: `frontend`
     - **Runtime**: Docker
     - **Dockerfile Path**: `frontend/Dockerfile`
     - **Plan**: Free

2. **Environment Variables**:
   ```
   BACKEND_URL=https://salary-assistant-backend.onrender.com
   ```

## Important Notes

### Free Tier Limitations

- **Spin down after 15 minutes** of inactivity
- **First request after spin down takes 30-60 seconds**
- **750 hours/month** of free runtime per service
- **⚠️ No persistent disk storage** - uploaded documents and ChromaDB data are lost on restart/redeploy

### Cost Optimization

**Free tier ($0/month):**
- Services sleep after 15 min
- **No persistent storage** - data resets on restart
- Good for testing/demos

**Starter tier ($7/month per service = $14/month total):**
- No spin down (always on)
- **25GB persistent disk** included
- Faster performance
- Data persists across deployments

### Data Persistence

**⚠️ Important: Free tier has NO persistent storage!**
- On free tier, all uploaded files and ChromaDB data are **lost when service restarts**
- You'll need to re-upload documents after each cold start
- To persist data, upgrade to **Starter plan** ($7/month per service)

**With paid plan (Starter+):**
- Add persistent disk in service settings
- ChromaDB data stored on disk (`/app/data`)
- Uploaded files persist (`/app/uploads`)
- Data survives deployments and restarts

### CORS Configuration

The app is configured to allow all origins. For production, update [main.py](backend/app/main.py#L31-L37) to restrict CORS:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://salary-assistant-frontend.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Troubleshooting

### Backend not responding
- Check logs: Service → Logs tab
- Verify `OPENAI_API_KEY` is set correctly
- Check health endpoint: `https://your-backend.onrender.com/api/health`

### Frontend can't connect to backend
- Verify `BACKEND_URL` environment variable
- Check CORS settings in backend
- Ensure backend service is running

### Service keeps crashing
- Check disk space usage
- Review error logs
- Verify all dependencies in requirements.txt

### Slow first request
- This is normal on free tier (cold start)
- Consider upgrading to paid plan for always-on services

## Monitoring

- **Logs**: Real-time logs in Render Dashboard
- **Metrics**: CPU, memory, and bandwidth usage
- **Health Check**: Backend has `/api/health` endpoint

## Updating the App

Render auto-deploys on git push:

```bash
git add .
git commit -m "Update feature"
git push
```

Render will automatically rebuild and redeploy both services.

## Alternative: Separate Backend URL

If you want the frontend to connect to the backend via its public URL:

1. Get backend URL from Render Dashboard
2. Update [client.ts](frontend/src/api/client.ts#L3):
   ```typescript
   const API_BASE = "https://your-backend-url.onrender.com/api";
   ```

## Security Checklist

- ✅ API keys stored in environment variables (not in code)
- ✅ `.env` files are gitignored
- ✅ Sensitive data excluded from version control
- ⚠️ Update CORS to specific origins for production
- ⚠️ Consider adding authentication if handling sensitive documents

## Next Steps

1. **Custom Domain**: Add your own domain in Render Dashboard
2. **SSL**: Automatic HTTPS with Let's Encrypt (included)
3. **CI/CD**: Set up GitHub Actions for automated testing
4. **Monitoring**: Integrate with monitoring tools like Sentry
5. **Scaling**: Upgrade to paid plans or add more instances

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
