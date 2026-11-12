# PrintAvenue — VPS Deployment Guide

## Project Directory Path on VPS
The project on your Hostinger/Ubuntu VPS (`srv875579`) is located at:
```bash
/path/to/printavenue
```

---

## 1-Click Update Command (Run directly from any directory)
Whenever you log in to SSH (`root@srv875579:~#`), paste this single command:

```bash
cd /path/to/printavenue && git pull origin main && npm run build && pm2 restart printavenue && pm2 logs printavenue --lines 20
```

---

## Step-by-Step Commands

### 1. Navigate to the project directory
```bash
cd /path/to/printavenue
```

### 2. Pull the latest commits from GitHub
```bash
git pull origin main
```

### 3. Build the Next.js production bundle
```bash
npm run build
```

### 4. Restart the PM2 service
```bash
pm2 restart printavenue
```

### 5. Check logs to confirm clean startup
```bash
pm2 logs printavenue --lines 20
```

---

## Process Information
- **PM2 App Name**: `printavenue`
- **PM2 App ID**: `22`
- **Node.js Version**: `v20.19.6`
- **Repository**: `https://github.com/doraswamyraju/printavenue.git`
- **Branch**: `main`
