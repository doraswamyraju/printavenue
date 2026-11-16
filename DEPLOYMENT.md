# PrintAvenue — VPS Deployment Guide

## VPS & Process Details
- **Live URL**: [https://printavenue.sriddha.com](https://printavenue.sriddha.com)
- **VPS Host**: `srv875579`
- **Exact Project Directory**: `/path/to/printavenue`
- **PM2 App Name**: `printavenue`
- **PM2 App ID**: `22`
- **Git Branch**: `main`
- **Repository**: `https://github.com/doraswamyraju/printavenue.git`

---

## 1-Click Deployment (Recommended)
Whenever you SSH into your VPS (`root@srv875579:~#`), copy and paste this single command:

```bash
cd /path/to/printavenue && git pull origin main && npm run build && pm2 restart printavenue
```

---

## Step-by-Step Deployment

### 1. Navigate to the project folder
```bash
cd /path/to/printavenue
```

### 2. Pull latest code from GitHub
```bash
git pull origin main
```

### 3. Compile Next.js production build
```bash
npm run build
```

### 4. Restart PM2 service
> [!IMPORTANT]
> Always run `pm2 restart printavenue` immediately after building. Next.js creates fresh asset hashes with each build, so PM2 must be restarted to serve the updated stylesheets and scripts.

```bash
pm2 restart printavenue
```

### 5. Verify live status & logs
```bash
pm2 logs printavenue --lines 20
```

---

## Common Issues & Fixes

### 1. Unstyled Page / Raw HTML Appearing
- **Cause**: The build completed, but PM2 is still running the older Node process with old CSS/JS chunk hashes.
- **Fix**:
  1. Run `pm2 restart printavenue`
  2. In your browser, perform a hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac) to bypass stale browser cache.

### 2. "fatal: not a git repository"
- **Cause**: You ran `git pull` from `/root/` or another folder.
- **Fix**: Always `cd /path/to/printavenue` first.
