# 🚀 GMAIL OAUTH + DEPLOYMENT GUIDE

## ⚙️ SETUP INSTRUCTIONS (Do This Now)

### Step 1: Get Google OAuth Credentials (5 minutes)

1. **Go to:** https://console.cloud.google.com
2. **Create new project:**
   - Click "Select a Project" → "New Project"
   - Name: `FinTrack`
   - Click Create

3. **Enable Google+ API:**
   - Search: "Google+ API"
   - Click Enable

4. **Create OAuth Credentials:**
   - Left menu: "Credentials"
   - "Create Credentials" → "OAuth client ID"
   - Select: "Web application"
   - Application name: `FinTrack`

5. **Add Authorized Redirect URIs:**
   ```
   http://localhost:5000/auth/google/callback (local testing)
   http://localhost:5173/auth/google/callback (local testing)
   https://fintrack-api.render.com/auth/google/callback (production)
   https://fintrack.vercel.app/auth/google/callback (production)
   ```

6. **Copy Credentials:**
   - Copy **Client ID**
   - Copy **Client Secret**

---

### Step 2: Update .env with OAuth Credentials

Edit `backend/.env`:
```
MONGO_URI=mongodb+srv://stoniecap_db_user:tb8xT2iPI0RNmUer@fintrackcluster.xbtympo.mongodb.net/?appName=FintrackCluster
PORT=5000
JWT_SECRET=your-secure-secret-key

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your-client-id-from-google-cloud
GOOGLE_CLIENT_SECRET=your-client-secret-from-google-cloud
GOOGLE_CALLBACK_URL=https://fintrack-api.render.com/auth/google/callback

# Frontend URL
FRONTEND_URL=https://fintrack.vercel.app
```

---

### Step 3: Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

---

## 🌐 DEPLOYMENT STEPS

### Deploy Backend to Render

1. **Create Render Account:** https://render.com
2. **Connect GitHub repo**
3. **Create New → Web Service**
4. **Configuration:**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables (add all from .env)
   - Region: Singapore or closest to you
5. **Deploy**
6. **Copy deployed URL:** `https://fintrack-api.render.com`

---

### Deploy Frontend to Vercel

1. **Create Vercel Account:** https://vercel.com
2. **Connect GitHub repo**
3. **Framework Preset:** Vite
4. **Root Directory:** `frontend`
5. **Environment Variables:**
   - `VITE_API_URL=https://fintrack-api.render.com`
6. **Deploy**
7. **Copy deployed URL:** `https://fintrack.vercel.app`

---

## 🔄 Update OAuth Callback URLs

Once you have Render + Vercel URLs:

1. Go back to **Google Cloud Console**
2. **Credentials** → Click your OAuth app
3. **Update Authorized Redirect URIs:**
   ```
   https://fintrack-api.render.com/auth/google/callback
   https://fintrack.vercel.app/auth/google/callback
   ```
4. Save

---

## 📝 HOW GMAIL AUTH WORKS

### First-Time User (Email Not Verified)

```
User clicks "Sign in with Google"
    ↓
Redirected to Google Login
    ↓
User authenticates with Gmail
    ↓
System sets isEmailVerified = true
    ↓
User redirected to dashboard with JWT token
    ↓
Now local (email/password) login is ENABLED
```

### Subsequent Logins (Email Verified)

User can use EITHER:
- **Option 1:** "Sign in with Google" (OAuth)
- **Option 2:** Email + Password (local login)

---

## 🎯 DEMO USERS (Verification Bypassed)

Demo users are created with `isEmailVerified = true`:

```
✓ maria.santos@company.com / password123 (HR Head)
✓ juan.cruz@company.com / password123 (HR Staff)
✓ joshua.marcelino@company.com / password123 (Employee)
✓ lj.tanauan@company.com / password123 (Employee)
✓ ana.garcia@company.com / password123 (Employee)
```

**These demo users can login immediately without Gmail verification!**

---

## 🧪 TESTING LOCALLY

```bash
# Terminal 1: Backend
cd backend
npm start
# Should run on http://localhost:5000

# Terminal 2: Frontend
cd frontend
npm run dev
# Should run on http://localhost:5173
```

**Test login:**
- Use demo email + password (works immediately)
- Use real Gmail email → must verify via Google OAuth first

---

## 🔐 SECURITY FEATURES

✅ **Email Verification Gate:** New users must verify Gmail before local login
✅ **Password Hashing:** bcryptjs with 10 salt rounds
✅ **JWT Tokens:** Secure stateless authentication
✅ **Role-Based Access:** Seeder Admin → Supervisor → HR Head → HR Staff/Employees
✅ **Audit Logging:** All login attempts logged
✅ **Rate Limiting:** Brute force protection on login
✅ **HTTPS Only:** Cookies secure in production
✅ **CORS Protection:** Only specified frontend domains allowed

---

## 📊 DATABASE CHANGES

User schema updated with:
- `isEmailVerified: Boolean` (default: false)
- `googleId: String` (stores Google OAuth ID)

Demo users created with `isEmailVerified = true`

---

## 🎬 FOR YOUR PRESENTATION

**Tomorrow 9 AM:**

1. **Use demo accounts** (no Gmail needed)
2. **Show Gmail OAuth button** on login page
3. **Demo verification gate** if you want
4. **Focus on payroll workflow** (demo users can login immediately)

---

## 📱 DEPLOYMENT CHECKLIST

- [ ] Google OAuth credentials obtained
- [ ] .env updated with Client ID & Secret
- [ ] npm install (backend + frontend)
- [ ] Render backend deployed
- [ ] Vercel frontend deployed
- [ ] OAuth Callback URLs updated in Google Cloud
- [ ] Test login with demo account
- [ ] Test Google OAuth with real Gmail
- [ ] Verify password authentication works
- [ ] Check audit logs

---

**You're ready to deploy!** 🚀
