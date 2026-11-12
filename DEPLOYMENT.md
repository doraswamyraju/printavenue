# PrintAvenue — VPS Deployment Guide

## Finding the Project Directory on VPS
If you run `pm2 list` or `pm2 show printavenue`, you can check the exact directory path.
Typically on Hostinger / Ubuntu VPS, projects are located in `/var/www/printavenue` or `/var/www/html/printavenue` or `/root/printavenue`.

To see the exact path from PM2, run:
```bash
pm2 show printavenue | grep "pm2 cwd"
```

---

## Standard 1-Line Update Command
Copy and paste this single command block into your VPS terminal:

```bash
cd $(pm2 show printavenue | grep "pm2 cwd" | awk -F': ' '{print $2}' | xargs) && \
git pull origin main && \
npm run build && \
pm2 restart printavenue && \
pm2 logs printavenue --lines 20
```

---

## Step-by-Step Manual Commands

### 1. Navigate to the project directory
```bash
# Check where PM2 runs printavenue:
pm2 show printavenue | grep "pm2 cwd"

# CD into that directory (e.g. /var/www/printavenue or wherever it is located):
cd /var/www/printavenue
# (or cd /root/apps/printavenue, etc.)
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

### 5. Check logs to confirm it is running cleanly
```bash
pm2 logs printavenue --lines 20
```

---

## Troubleshooting Common Errors

### Error: `fatal: not a git repository` or `npm error Missing script: "build"`
* **Cause**: You are in the home directory (`/root/`) instead of inside the `printavenue` project folder.
* **Solution**: Run `cd /var/www/printavenue` (or use `pm2 show printavenue` to see the actual path) before running `git` or `npm`.
