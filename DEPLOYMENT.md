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

### 2. Check for local modifications & pull latest code
If there are any local edits or conflicting files on the VPS:
```bash
# Optional: discard any unwanted local file changes on VPS to match GitHub
git reset --hard origin/main

# Pull latest commits
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

## Troubleshooting Known Deployment Issues

### 1. Unstyled Page / Raw HTML Appearing
- **Symptoms**:
  - Webpage appears without CSS styling (white background, raw blue links, basic black buttons).
  - Browser DevTools Network tab shows `404 Not Found` for `_next/static/css/...` or `_next/static/chunks/...`.
- **Root Cause**:
  - Next.js production builds produce unique content hashes for CSS and JavaScript files. When `npm run build` generates new files, the old hash chunks are purged. If PM2 was still serving the old Node process or if the browser holds cached HTML pointing to old chunks, the styles fail to load.
- **Resolution**:
  1. Restart PM2 to bind the newly built chunks:
     ```bash
     pm2 restart printavenue
     ```
  2. Perform a hard browser refresh:
     - **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
     - **Mac**: `Cmd + Shift + R`

---

### 2. Client-Side Error: `TypeError: Cannot read properties of undefined (reading 'background')`
- **Symptoms**:
  - The page displays "Application error: a client-side exception has occurred" upon login or viewing product customizers.
  - Browser console logs: `TypeError: Cannot read properties of undefined (reading 'background')`.
- **Root Cause**:
  - Legacy or custom product templates stored without a `background` object or when null fallbacks were missing in older builds.
- **Resolution**:
  - Pull latest codebase which contains comprehensive safe fallbacks across `SheetRenderer.tsx`, `ProductsManagementView.tsx`, `TemplateBuilderModal.tsx`, and `compositor.ts`:
    ```bash
    cd /path/to/printavenue && git pull origin main && npm run build && pm2 restart printavenue
    ```

---

### 3. Git Conflict / "Your local changes would be overwritten by merge"
- **Symptoms**:
  - Running `git pull origin main` outputs:
    `error: Your local changes to the following files would be overwritten by merge:`
- **Resolution**:
  - If you do not need the VPS modifications:
    ```bash
    git reset --hard origin/main
    git pull origin main
    ```
  - If you want to temporarily save them:
    ```bash
    git stash
    git pull origin main
    ```

---

### 4. Preserving Uploaded User Content
- All customer photos, uploaded logos, and admin product thumbnails are stored in:
  `/path/to/printavenue/public/uploads`
- This folder is ignored by Git, ensuring user uploads persist across updates and builds without being overwritten.
