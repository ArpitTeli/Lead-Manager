# Lead Distribution System (LDS) — Setup Guide

A lightweight internal web app for distributing Excel lead sheets to Lead
Qualifiers (LQs). Built with Next.js, Google Drive (file storage), and
Google Sheets (database). Designed for a small team (~10 users).

This guide walks through every step from zero to a live, working app.

---

## What you'll need before starting

- A Google account (personal or Workspace)
- A GitHub account
- A Vercel account (free tier is fine)
- Node.js 22 LTS installed on your machine — check with `node -v`
- The project code (this folder)

Budget about 30–45 minutes for first-time setup.

---

## Step 1 — Install dependencies locally

```bash
cd lead-distribution-system
npm install
```

This pulls in Next.js, the Google APIs client, bcrypt, and everything else
listed in `package.json`.

---

## Step 2 — Create the Google Cloud project & service account

The app talks to Google Drive and Google Sheets using a **service account**
(a robot identity), not your personal login.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and
   create a new project (e.g. "Lead Distribution System").
2. In the left sidebar, go to **APIs & Services → Library** and enable:
   - **Google Drive API**
   - **Google Sheets API**
3. Go to **APIs & Services → Credentials**.
4. Click **Create Credentials → Service account**.
   - Name it something like `lds-service-account`.
   - You can skip granting it project-level roles — it only needs access to
     the specific Sheet and Drive folder you share with it (Step 3 & 4).
5. Once created, click into the service account → **Keys** tab → **Add Key
   → Create new key → JSON**. This downloads a `.json` file — keep it safe,
   you'll need two values out of it:
   - `client_email` (looks like `lds-service-account@your-project.iam.gserviceaccount.com`)
   - `private_key` (a long string starting with `-----BEGIN PRIVATE KEY-----`)

---

## Step 3 — Create the Google Drive folder

1. In Google Drive, create a folder named `Lead Distribution System`, and
   inside it, a subfolder named `Leads`.
2. Right-click the `Leads` folder → **Share** → paste in the service
   account's email (the `client_email` from Step 2) → give it **Editor**
   access.
3. Open the `Leads` folder and copy its ID out of the URL:
   ```
   https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz
                                            ^^^^^^^^^^^^^^^^^^^^^^^^^^
                                            this is GOOGLE_DRIVE_FOLDER_ID
   ```

---

## Step 4 — Create the Google Sheet (your database)

1. Create a new Google Sheet, name it something like `LDS Database`.
2. Create **four tabs** (bottom of the screen, rename each one exactly):

   **`Users`** — row 1 headers:
   ```
   UserID | PasswordHash | Name | Role | Active
   ```

   **`Files`** — row 1 headers:
   ```
   FileID | Filename | Status | AssignedTo | UploadedAt | AssignedAt | CompletedAt
   ```

   **`Assignments`** — row 1 headers:
   ```
   AssignmentID | FileID | UserID | AssignedAt | CompletedAt | Status
   ```

   **`ActivityLog`** — row 1 headers:
   ```
   Timestamp | UserID | Action | Details
   ```

   Headers must match exactly (case-sensitive) — the app reads them by name.

3. Click **Share** on the whole spreadsheet → paste in the service
   account's email → give it **Editor** access.
4. Copy the Sheet ID out of the URL:
   ```
   https://docs.google.com/spreadsheets/d/1XyZ...longstring.../edit
                                          ^^^^^^^^^^^^^^^^^^^^^
                                          this is GOOGLE_SHEET_ID
   ```

---

## Step 5 — Create your first Admin user

You need at least one working login before the app is useful. The app
hashes passwords with bcrypt — you can't just type a plain password into
the sheet.

Generate a hash using the included helper script:

```bash
node scripts/hash-password.mjs "yourChosenPassword"
```

This prints something like:
```
$2a$10$dZBmrdKa5mdYOJGeNYbmWuiWI9YPEvHt3IlK3l7pUJJR3fksvI6zS
```

Now go to the `Users` tab in your sheet and add a row:

| UserID | PasswordHash | Name | Role | Active |
|---|---|---|---|---|
| admin | *(paste the hash here)* | Your Name | Admin | TRUE |

Pick any `UserID` you like — it's what you'll type into the login screen
(not an email address).

---

## Step 6 — Set up environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```bash
GOOGLE_CLIENT_EMAIL=lds-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz
GOOGLE_SHEET_ID=1XyZ...longstring...
SESSION_SECRET=any-long-random-string-at-least-32-characters
```

Notes:
- `GOOGLE_PRIVATE_KEY` — copy the `private_key` value straight out of the
  downloaded JSON file, **including the quotes and `\n` characters**. Keep
  it as one line wrapped in double quotes.
- `SESSION_SECRET` — any random string works. Generate one quickly with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

---

## Step 7 — Run it locally

```bash
npm run dev
```

Visit **http://localhost:3000** — you should land on the login page. Log
in with the `UserID` and password you set in Step 5. Since that user's
`Role` is `Admin`, you'll be sent to `/admin`.

Quick smoke test:
1. Go to the **Upload** tab in `/admin`, upload a sample `.xlsx` file.
2. Check your `Files` sheet — a new row should appear with `Status=Queue`.
3. Create a second user with `Role=LQ` (via the **Users** tab in `/admin`).
4. Log in as that LQ user (or open an incognito window), go to
   `/dashboard`, click **Get Next Sheet** — it should pick up the file you
   uploaded and flip its status to `Assigned` in the sheet.
5. Click **Mark Complete** — status should flip to `Completed`.

If all of that works, the wiring between Next.js, Sheets, and Drive is
correct end to end.

---

## Step 8 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

`.env.local` is already excluded via `.gitignore` — never commit it.

---

## Step 9 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import
   your GitHub repo.
2. Before deploying, add the same environment variables from `.env.local`
   under **Settings → Environment Variables**:
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `GOOGLE_DRIVE_FOLDER_ID`
   - `GOOGLE_SHEET_ID`
   - `SESSION_SECRET`

   For `GOOGLE_PRIVATE_KEY`, paste the value with the literal `\n`
   sequences — the app handles converting them to real newlines at
   runtime (see `lib/google.ts`), so you don't need to manually reformat
   it.
3. Click **Deploy**.
4. Once it's live, every push to `main` automatically redeploys.

Visit your Vercel URL, log in with your Admin account, and you're live.

---

## Day-to-day usage

### Adding a new user (as Admin)
Go to `/admin` → **Users** tab → fill in User ID, Name, Role, and a
temporary password → **Create User**. Share the credentials with them
directly (there's no email/invite flow — this is intentionally simple for
a ~10-person team).

### Resetting a password
Same **Users** tab → click **Reset Password** next to their name → enter
the new password when prompted.

### Deactivating someone
Click **Deactivate** next to their name — they're blocked from logging in
until reactivated, but their history stays intact.

### Uploading leads
`/admin` → **Upload** tab → select one or more `.xlsx`/`.xls` files →
**Upload**. Each becomes a new row in `Files` with `Status=Queue`,
available for the next LQ who clicks "Get Next Sheet."

### Checking stats
`/admin` → **Stats** tab shows queue/assigned/completed counts and a
per-LQ breakdown of how many sheets each person has worked.

---

## Troubleshooting

**Login fails**
- Double-check the `UserID` in the sheet matches exactly what you typed
  (case-sensitive).
- Confirm `Active` is `TRUE` (all caps, no extra spaces).
- Re-generate the password hash and re-paste it if unsure — a single
  wrong character breaks it silently.

**"Can't access Drive" / upload errors**
- Confirm the Drive API is enabled in Google Cloud Console.
- Confirm the `Leads` folder is shared with the service account email as
  **Editor** (not just Viewer).
- Confirm `GOOGLE_DRIVE_FOLDER_ID` is the folder's ID, not the sheet's.

**Sheets not updating / 403 errors**
- Confirm the Sheets API is enabled.
- Confirm the spreadsheet itself (not just a tab) is shared with the
  service account as Editor.
- Confirm tab names match exactly: `Users`, `Files`, `Assignments`,
  `ActivityLog`.

**Deployment fails on Vercel**
- Check that all 5 environment variables are set in Vercel's project
  settings (not just your local `.env.local`).
- Check the build logs — a missing/malformed `GOOGLE_PRIVATE_KEY` is the
  most common cause of a runtime (not build-time) failure, which shows up
  as 500 errors on login rather than a failed deploy.

**"Invalid credentials" even though you're sure the password is right**
- The private key in `.env.local`/Vercel might be malformed. Re-copy it
  fresh from the downloaded service account JSON file.

---

## Project structure reference

```
lead-distribution-system/
├── app/
│   ├── login/              → login page
│   ├── dashboard/          → LQ view (get sheet / download / complete)
│   ├── admin/               → Admin view (upload / stats / users)
│   ├── api/                 → all backend routes
│   ├── layout.tsx
│   └── page.tsx              → redirects based on session/role
├── components/               → shared UI (TopBar)
├── lib/
│   ├── auth/                 → password hashing + session (JWT cookie)
│   ├── drive/                 → Google Drive upload/download
│   ├── sheets/                 → Google Sheets read/write per tab
│   ├── assignment/              → "Get Next Sheet" core logic
│   └── logger/                   → activity log writer
├── scripts/
│   └── hash-password.mjs          → CLI to generate bcrypt hashes
├── types/                          → shared TypeScript types
├── middleware.ts                    → route protection (auth + role gating)
├── .env.example
└── package.json
```

## API endpoints

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/api/login` | Anyone | Authenticate, set session cookie |
| POST | `/api/logout` | Logged in | Clear session |
| GET | `/api/me` | Logged in | Current session info |
| POST | `/api/get-next-sheet` | LQ/Admin | Assign next queued file |
| POST | `/api/mark-complete` | LQ/Admin | Complete active assignment |
| GET | `/api/download/[fileId]` | Owner or Admin | Download the Excel file |
| POST | `/api/admin/upload` | Admin | Upload new lead files |
| GET | `/api/admin/stats` | Admin | Queue/assigned/completed totals + per-LQ stats |
| GET/POST/PATCH | `/api/admin/users` | Admin | List / create / reset-password / activate-deactivate |
| GET | `/api/admin/logs` | Admin | Recent activity log |

## Security notes

- Passwords are hashed with bcrypt (10 salt rounds) — never stored in
  plain text.
- Sessions are signed JWTs in an httpOnly, SameSite=Lax cookie — not
  readable by client-side JavaScript, marked `secure` automatically in
  production.
- All `/admin` pages and `/api/admin/*` routes are gated at the middleware
  level, not just hidden in the UI — a non-admin hitting the URL directly
  gets redirected/403'd server-side.
- Google credentials live only in environment variables, never in the
  repo (`.env.local` is git-ignored).

## Known limitation

The "Get Next Sheet" assignment logic is not fully race-condition-proof —
if two LQs click at the exact same instant, there's a small window where
both could be pointed at the same file before the Sheets API write lands.
At ~10 users this is unlikely to bite in practice, but if you scale the
team up, consider adding a lock row or moving the assignment logic into a
Google Apps Script that runs server-side against the Sheet directly.

## Future improvements (not yet built)

Bulk upload polish, search/filter on the file list, notifications, CSV
support, richer analytics/charts on the Stats tab.
