# Route Time Tracker - PWA

A Progressive Web App for tracking your driving route times and analyzing performance.

## Features

✅ Track checkpoint times during drives
✅ Compare performance to historical averages in real-time
✅ View detailed statistics (mean, std dev, min, max, range)
✅ Save or discard trips after completion
✅ Works offline after first load
✅ Install on iPhone home screen like a native app

## Files Included

- `index.html` - Main app structure
- `styles.css` - Styling and layout
- `app.js` - Application logic
- `manifest.json` - PWA configuration
- `icon.svg` - App icon

## Setup Instructions

### Option 1: GitHub Pages (Recommended - Free & Easy)

1. **Create a GitHub account** (if you don't have one)
   - Go to https://github.com
   - Click "Sign up"

2. **Create a new repository**
   - Click the "+" in top right → "New repository"
   - Name it: `route-tracker`
   - Make it Public
   - Click "Create repository"

3. **Upload your files**
   - Click "uploading an existing file"
   - Drag and drop ALL files from the route-tracker-pwa folder:
     - index.html
     - styles.css
     - app.js
     - manifest.json
     - icon.svg
   - Click "Commit changes"

4. **Enable GitHub Pages**
   - Go to Settings (in your repository)
   - Click "Pages" in left sidebar
   - Under "Source", select "main" branch
   - Click "Save"
   - Wait 1-2 minutes, then you'll see: "Your site is published at https://YOUR-USERNAME.github.io/route-tracker/"

5. **Access on iPhone**
   - Open Safari on your iPhone
   - Go to the URL from step 4
   - Tap the Share button (square with arrow)
   - Scroll down and tap "Add to Home Screen"
   - Tap "Add"
   - Now you have an app icon on your home screen!

### Option 2: Netlify (Also Free & Easy)

1. **Go to https://netlify.com**
   - Sign up with GitHub, GitLab, or email

2. **Deploy**
   - Click "Add new site" → "Deploy manually"
   - Drag the entire `route-tracker-pwa` folder into the box
   - Wait 30 seconds for deployment
   - You'll get a URL like: `https://random-name-123.netlify.app`

3. **Access on iPhone**
   - Same as GitHub Pages steps 5 above

### Option 3: Vercel (Also Free)

1. **Go to https://vercel.com**
   - Sign up with GitHub or email

2. **Deploy**
   - Click "Add New" → "Project"
   - Import the route-tracker-pwa folder
   - Click "Deploy"
   - Get your URL

3. **Access on iPhone**
   - Same as GitHub Pages step 5 above

## How to Use

1. **Login**
   - Username: BRENNAN
   - Password: DRIVE

2. **Start a Drive**
   - Select "Begin a Drive"
   - Choose your route
   - Press "START DRIVE"
   - Tap "CHECKPOINT" at each checkpoint location
   - After final checkpoint, choose to Keep or Discard the trip

3. **View Statistics**
   - Select "View Statistics"
   - Choose a route
   - See all your historical data and averages

## Data Storage

- All data is stored locally on your device using IndexedDB
- No data is sent to any server
- Your trip history stays on your phone
- If you clear browser data, trip history will be deleted

## Customization

To add more routes, edit the `ROUTES` object in `app.js`:

```javascript
const ROUTES = {
    "6": {
        name: "Your New Route",
        checkpoints: [
            "First checkpoint",
            "Second checkpoint",
            "Third checkpoint"
        ]
    }
};
```

## Troubleshooting

**App won't install on iPhone:**
- Make sure you're using Safari (not Chrome)
- Some features require HTTPS (GitHub Pages, Netlify, Vercel all use HTTPS)

**Data disappeared:**
- Check if you cleared browser cache/data
- Make sure you're using the same browser

**App is slow:**
- Close other browser tabs
- Restart your phone

## Support

If you have issues, check that:
1. You uploaded ALL files (index.html, styles.css, app.js, manifest.json, icon.svg)
2. Files are in the root directory (not in a subfolder)
3. You're accessing via HTTPS
4. You're using Safari on iPhone for best compatibility
