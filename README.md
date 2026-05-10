# Johnson Saimon — Personal Fitness System

A full personal fitness, nutrition, and scheduling web app. Deployable on GitHub + Vercel with a working AI coach and Google Calendar integration.

---

## What works after deployment

| Feature | Status |
|---|---|
| All pages — Dashboard, Nutrition, Workout, Shopping, Calendar, Progress | Works |
| Full 7-day meal plan with Tanzanian foods | Works |
| Workout programme — 5 AM / 6:30 PM slots | Works |
| Shopping list with TZS prices | Works |
| **Analyse & Get Adjustments** (AI coach) | Works via Vercel |
| **Google Calendar sync** (add reminders) | Works via Vercel + Google OAuth |

---

## Step-by-step deployment

### STEP 1 — Push to GitHub

```bash
# In your terminal
git init
git add .
git commit -m "Initial commit — Johnson Fitness System"
git branch -M main

# Create a new repo on github.com then:
git remote add origin https://github.com/YOUR_USERNAME/johnson-fitness.git
git push -u origin main
```

---

### STEP 2 — Get your Anthropic API key

1. Go to **https://console.anthropic.com/keys**
2. Click **Create Key**
3. Copy the key — it starts with `sk-ant-...`
4. Save it somewhere safe — you will need it in Step 4

---

### STEP 3 — Set up Google OAuth (for Calendar)

1. Go to **https://console.cloud.google.com/**
2. Click **Select a project** → **New Project** → name it `johnson-fitness` → Create
3. In the left menu: **APIs & Services** → **Library**
4. Search for **Google Calendar API** → click it → click **Enable**
5. Go to **APIs & Services** → **Credentials**
6. Click **Create Credentials** → **OAuth 2.0 Client ID**
7. If prompted, configure the OAuth consent screen first:
   - User Type: **External**
   - App name: `Johnson Fitness`
   - Your email for support and developer contact
   - Save and continue through all steps (scopes, test users — skip those)
8. Back at Create Credentials → **OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - Name: `Johnson Fitness Web`
   - Authorised redirect URIs: (leave blank for now — you will add this after Vercel deploy)
   - Click **Create**
9. Copy your **Client ID** and **Client Secret** — save them

---

### STEP 4 — Deploy to Vercel

1. Go to **https://vercel.com** → sign up with your GitHub account
2. Click **Add New Project**
3. Find and click your `johnson-fitness` repository → click **Import**
4. Before clicking Deploy, click **Environment Variables** and add these:

| Variable Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your key from Step 2 (sk-ant-...) |
| `GOOGLE_CLIENT_ID` | Your Client ID from Step 3 |
| `GOOGLE_CLIENT_SECRET` | Your Client Secret from Step 3 |
| `GOOGLE_REDIRECT_URI` | Leave blank for now (add after deploy) |
| `ALLOWED_ORIGIN` | Leave blank for now (add after deploy) |

5. Click **Deploy**
6. Wait ~60 seconds
7. Vercel gives you a URL like: `https://johnson-fitness-abc123.vercel.app`
8. **Copy that URL**

---

### STEP 5 — Finish Google OAuth setup

Now that you have your Vercel URL:

1. Go back to **https://console.cloud.google.com/** → **APIs & Services** → **Credentials**
2. Click your OAuth 2.0 client
3. Under **Authorised redirect URIs**, click **Add URI**
4. Enter: `https://your-project.vercel.app/api/auth/google` (use your real URL)
5. Click **Save**

6. Go back to Vercel → your project → **Settings** → **Environment Variables**
7. Update these two variables:
   - `GOOGLE_REDIRECT_URI` = `https://your-project.vercel.app/api/auth/google`
   - `ALLOWED_ORIGIN` = `https://your-project.vercel.app`
8. Go to **Deployments** → click the three dots on your latest deploy → **Redeploy**

---

### STEP 6 — Update the frontend config

Open `public/index.html` and find this line near the top of the `<script>` section:

```js
const VERCEL_URL = '';  // <-- set this after deploying to Vercel
```

Change it to your Vercel URL:

```js
const VERCEL_URL = 'https://your-project.vercel.app';
```

Then also find this line:

```js
const clientId = '%%GOOGLE_CLIENT_ID%%';
```

Replace it with your actual Google Client ID:

```js
const clientId = 'your-client-id.apps.googleusercontent.com';
```

Save the file, commit and push:

```bash
git add public/index.html
git commit -m "Add Vercel URL and Google Client ID"
git push
```

Vercel auto-deploys on every push. Wait 30 seconds and your app is live.

---

### STEP 7 — Test everything

1. Open your Vercel URL
2. Go to **Progress** page → enter your weight → click **Analyse & Get Adjustments**
   - Should return a personalised coaching response in ~3 seconds
3. Go to **Calendar** page → click **Connect Google Calendar**
   - Google sign-in page opens → approve access
   - You are redirected back to the app with "Google Calendar connected" toast
   - Click **Add** next to any reminder — it appears in your Google Calendar

---

## Project structure

```
johnson-fitness/
├── api/
│   ├── analyze.js          ← AI coaching endpoint (uses Anthropic API)
│   ├── calendar.js         ← Google Calendar event creation
│   └── auth/
│       └── google.js       ← Google OAuth token exchange
├── public/
│   └── index.html          ← The entire frontend app
├── vercel.json             ← Vercel routing config
├── package.json
├── .env.example            ← Copy to .env.local for local development
├── .gitignore
└── README.md
```

---

## Local development

```bash
# Install Vercel CLI
npm install -g vercel

# Copy and fill in your keys
cp .env.example .env.local
# Edit .env.local with your real keys

# Run locally (simulates Vercel serverless functions)
vercel dev

# App runs at http://localhost:3000
```

---

## Troubleshooting

**Analyse button returns an error**
- Check `ANTHROPIC_API_KEY` is set correctly in Vercel environment variables
- Make sure there are no extra spaces in the key value

**Google Calendar button does nothing**
- Make sure you replaced `%%GOOGLE_CLIENT_ID%%` in `index.html` with your real Client ID
- Make sure the redirect URI in Google Cloud Console exactly matches your Vercel URL

**After connecting Google, redirected but "not connected"**
- Make sure `ALLOWED_ORIGIN` in Vercel exactly matches your frontend URL (no trailing slash)

**Vercel shows 404 on API routes**
- Check `vercel.json` is in the root of the project (not inside a subfolder)

---

## Updating your app

Any time you change `public/index.html` or any `api/*.js` file:

```bash
git add .
git commit -m "describe what you changed"
git push
```

Vercel redeploys automatically within 30 seconds.
