# PipelineAI Cloud Deployment Guide (Vercel + Render)

To make your **Vercel Frontend** and **Render Backend** talk to each other and receiving GitLab commits, follow these 3 steps:

## 1. Sync Vercel with Render
Your Frontend (Vercel) doesn't know where your Backend (Render) is yet.
1. Go to your **Vercel Dashboard** -> Project -> Settings -> **Environment Variables**.
2. Add a new variable:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://your-service-name.onrender.com` (Use your actual Render URL)
3. **Re-deploy** your Vercel project to apply the change.

## 2. Sync GitLab with Render
GitLab needs to send commit data to your **Render** URL, not localhost.
1. Go to your **GitLab Project** -> Settings -> **Webhooks**.
2. Update the Webhook URL:
   - **Old**: `http://localhost:8000/...`
   - **New**: `https://your-service-name.onrender.com/api/v1/vcs/webhook`
3. Click **"Test"** and select "Push events". You should see a `200` response.

## 3. Enable Bot Comments (Optional but Recommended)
For AI Mentor to comment directly on GitLab Merge Requests:
1. Go to your **Render Dashboard** -> Your Service -> Settings -> **Environment Variables**.
2. Add:
   - **Key**: `GITLAB_TOKEN`
   - **Value**: `your_personal_access_token`
3. This allows the backend to "talk back" to GitLab.

## Troubleshooting
- **Dashboard Empty?**: Ensure you are visiting your **Vercel URL** (e.g., `pipeline-ai.vercel.app`).
- **Mixed Content Error?**: Ensure your Vercel `REACT_APP_API_URL` uses **https**, not http.
- **Still not showing?**: Visit `https://your-render-name.onrender.com/api/v1/demo/trigger` in your browser. If it shows up on your Vercel site, then your Frontend and Backend are correctly connected!
