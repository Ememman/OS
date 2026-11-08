# Deployment Guide — Portfolio OS

This guide covers how to deploy both the **Client (Frontend)** and **Server (Backend)** using GitHub Actions, GitHub Pages, and cloud platforms.

---

## 🏗️ Architecture Overview

| Component | Stack | Output / Artifact | Recommended Host | Deployment Method |
| :--- | :--- | :--- | :--- | :--- |
| **Client** | React 19 + Vite + Tailwind v4 | Static SPA (`client/dist`) | **GitHub Pages** (Free) | GitHub Actions (`deploy-client.yml`) |
| **Server** | Node.js + Express + Socket.IO | Docker image & REST/WS API | **Render** / **Railway** / **VPS** | GitHub Packages (`ghcr.io`) & Webhook (`deploy-server.yml`) |

---

## 🌐 1. Deploying the Client to GitHub Pages

The client is configured with relative base paths (`base: './'`), meaning it works on any root domain or GitHub Pages subpath (e.g. `https://<username>.github.io/<repo>/`).

### Step 1: Enable GitHub Actions as Pages Source
1. On GitHub, navigate to your repository.
2. Go to **Settings** → **Pages** (in the left sidebar).
3. Under **Build and deployment** → **Source**, select **GitHub Actions**.

### Step 2: (Optional) Set the Backend Server URL
If your backend server is deployed live (e.g., on Render or Railway):
1. In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions**.
2. Click the **Variables** tab → **New repository variable**.
3. Set:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-server-app.onrender.com` (your live server URL)

### Step 3: Trigger the Deployment
- Push to the `main` branch touching the `client/` folder:
  ```bash
  git push origin main
  ```
- Or trigger it manually:
  1. Go to the **Actions** tab in GitHub.
  2. Select **Deploy Client to GitHub Pages** in the left sidebar.
  3. Click **Run workflow** (you can optionally supply a custom `VITE_API_URL` directly in the prompt).

Your site will be live at `https://<username>.github.io/<repo-name>/`!

---

## 🖥️ 2. Deploying the Server (Backend)

The server is powered by Express and Socket.IO, requiring a persistent Node.js or Docker runtime.

### Option A: Free Hosting on Render (Recommended)
1. Sign up or log into [Render.com](https://render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Plan**: Free
5. Add Environment Variables:
   - `PORT`: `4000` (or leave default, Render sets this automatically)
   - `CLIENT_URL`: `https://<username>.github.io` (your GitHub Pages client URL)
6. Once created, copy the **Deploy Hook URL** from your Render service settings (**Settings** → **Deploy Hook**).
7. In your GitHub repository:
   - Go to **Settings** → **Secrets and variables** → **Actions**.
   - Under **Secrets**, click **New repository secret**.
   - Name: `RENDER_DEPLOY_HOOK_URL`
   - Value: `<paste your Render deploy hook URL>`
8. Now, whenever changes are pushed to `server/`, GitHub Actions will automatically test and trigger Render to deploy!

### Option B: GitHub Container Registry (`ghcr.io`)
Every push to `main` touching `server/` automatically builds and publishes a Docker container to GitHub Packages:
```bash
docker pull ghcr.io/<your-github-username>/portfolio-os-server:latest
```
You can run this container anywhere:
```bash
docker run -d -p 4000:4000 \
  -e PORT=4000 \
  -e CLIENT_URL="https://<username>.github.io" \
  ghcr.io/<your-github-username>/portfolio-os-server:latest
```

### Option C: Railway / Custom VPS Webhook
If you use Railway, Koyeb, Portainer, or a VPS with a webhook listener:
- Add your webhook URL as a secret named `DEPLOY_WEBHOOK_URL` in GitHub Repository Secrets.
- The `deploy-server.yml` workflow will automatically send a POST trigger on every successful build.

---

## 🐳 3. Local Deployment via Docker Compose

To test the entire full-stack production build locally with a single command:

```bash
# Start both client and server containers
docker compose up --build

# Client available at: http://localhost:8080
# Server available at: http://localhost:4000
# Health check:        http://localhost:4000/api/health
```

---

## 🔄 4. GitHub Actions Workflows Included

| Workflow | File | Trigger | Description |
| :--- | :--- | :--- | :--- |
| **Deploy Client to GitHub Pages** | `.github/workflows/deploy-client.yml` | Push to `main` (`client/**`) / Dispatch | Builds Vite client into `dist` and deploys to GitHub Pages. |
| **Build & Deploy Server** | `.github/workflows/deploy-server.yml` | Push to `main` (`server/**`) / Dispatch | Tests server, builds and publishes Docker image to `ghcr.io`, and triggers cloud webhook if configured. |
| **CI Lint & Build Check** | `.github/workflows/ci.yml` | PR & Push to `main`, `dev` | Runs tests, linters, and type-checking on both client and server to prevent regressions. |
