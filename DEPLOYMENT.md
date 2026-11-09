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

We provide two workflows:
* **Workflow A (Recommended): `Deploy to GitHub Pages (gh-pages branch)`** (`deploy-gh-pages.yml`) — builds the app and publishes it directly to a dedicated `gh-pages` branch.
* **Workflow B: `Deploy Client to GitHub Pages (Actions Environment)`** (`deploy-client.yml`) — deploys via GitHub's native Actions Pages runner.

---

### Method A: Deploy via `gh-pages` Branch (Most Reliable & Recommended)

#### Step 1: Run the Workflow
1. Go to the **Actions** tab on GitHub (`https://github.com/Ememman/OS/actions`).
2. Select **Deploy to GitHub Pages (gh-pages branch)** in the left sidebar.
3. Click **Run workflow** (your Render URL `https://portfolio-os-api-5c7z.onrender.com` is already pre-configured as the default).
4. Wait ~1 minute for the green checkmark. This creates/updates the `gh-pages` branch.

#### Step 2: Configure Pages to Serve from `gh-pages`
1. Go to **Settings** → **Pages** (in the left sidebar).
2. Under **Build and deployment** → **Source**, select **Deploy from a branch**.
3. Under **Branch**:
   - Select **`gh-pages`**
   - Folder: **`/ (root)`**
4. Click **Save**.

Your site will immediately be live at:
🌐 **`https://ememman.github.io/OS/`**

---

### Method B: Deploy via GitHub Actions Environment

If you prefer GitHub's native Actions Pages deployment:
1. Go to **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. Go to the **Actions** tab → select **Deploy Client to GitHub Pages (Actions Environment)**.
4. Click **Run workflow**.

---

### 🔑 Setting the Backend Server URL (Optional)
Both workflows are already pre-configured to default to your live Render backend (`https://portfolio-os-api-5c7z.onrender.com`). If you ever change your backend URL:
1. In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions**.
2. Click the **Variables** tab → **New repository variable**.
3. Set:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://portfolio-os-api-5c7z.onrender.com`

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
