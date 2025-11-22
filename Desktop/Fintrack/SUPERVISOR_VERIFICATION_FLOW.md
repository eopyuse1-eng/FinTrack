SUPERVISOR EMAIL VERIFICATION FLOW - FINAL DEFENSE SCENARIO
==========================================================

SCENARIO: Supervisor created with real Gmail + local password (not verified yet)

STEP 1: INITIAL ACCOUNT CREATION
================================
Status: isEmailVerified = false (when first created)
Can login with password? NO ❌
Message: "Local login unavailable. Please verify your Gmail via 'Sign in with Google' first."

STEP 2: SUPERVISOR CLICKS "SIGN IN WITH GOOGLE"
================================================
Action: Click "Sign in with Google" button
What happens:
1. Redirected to Google login page
2. Supervisor enters Gmail credentials
3. Google verifies the email address
4. Callback returns to backend with verified email

BACKEND PROCESSING (Passport Config):
- Checks if user exists with that email
- YES → User found (the supervisor account we created)
- Updates: isEmailVerified = true ✅
- Sets: googleId = <google_profile_id>
- Saves user to database

STEP 3: AFTER GMAIL VERIFICATION
=================================
✅ isEmailVerified = true (database updated)
✅ Supervisor now logged in via OAuth
✅ Redirected to dashboard with JWT token

STEP 4: NEXT TIME - LOCAL LOGIN WITH EMAIL/PASSWORD
====================================================
Scenario: Supervisor comes back tomorrow, wants to login locally

Login attempt:
- Email: supervisor@company.com
- Password: [local_password_they_created]

Backend check:
1. Find user by email ✓
2. Check isEmailVerified → true ✓ (verified yesterday via Gmail)
3. Check password match ✓
4. ALLOWED! ✅

Result: Supervisor can login with email/password WITHOUT Gmail

NO CODE REQUIRED - Direct login works because:
- Email was verified via Gmail OAuth (sets isEmailVerified = true)
- Local password exists
- Both conditions met = allow local login

================================================================================
VERIFICATION LOGIC (in authUtils.canUseLocalLogin):
================================================================================

canUseLocalLogin returns:
- allowed: true   → if isEmailVerified = true
- allowed: false  → if isEmailVerified = false

BEFORE Gmail verification:
└─ isEmailVerified = false
   └─ canUseLocalLogin() → { allowed: false }
   └─ Response: 403 EMAIL_NOT_VERIFIED
   └─ Message: "Please verify your Gmail via 'Sign in with Google' first"

AFTER Gmail verification:
└─ isEmailVerified = true (updated by Passport in OAuth callback)
   └─ canUseLocalLogin() → { allowed: true }
   └─ Can use local email/password login ✅

================================================================================
FLOW DIAGRAM:
================================================================================

Day 1 (Defense Day):
┌─────────────────────────────────────┐
│ 1. Supervisor tries local login      │
│    Email: supervisor@company.com     │
│    Password: Password123             │
│    Result: ❌ EMAIL_NOT_VERIFIED     │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 2. Click "Sign in with Google"       │
│    → Redirected to Google login      │
│    → Enter Gmail credentials         │
│    → Google verifies & returns       │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 3. Backend OAuth Callback            │
│    ✓ Find user by email              │
│    ✓ Set isEmailVerified = true      │
│    ✓ Set googleId = <google_id>      │
│    ✓ Save to database                │
│    ✓ Generate JWT token              │
│    → Redirect to /dashboard          │
└─────────────────────────────────────┘
         ↓
     ✅ LOGGED IN

Day 2+:
┌─────────────────────────────────────┐
│ Supervisor tries local login again   │
│ Email: supervisor@company.com        │
│ Password: Password123                │
│ Database check:                      │
│ ✓ User exists                        │
│ ✓ isEmailVerified = true ← from Day1 │
│ ✓ Password matches                   │
│ Result: ✅ LOGIN SUCCESS             │
└─────────────────────────────────────┘

================================================================================
KEY POINTS FOR DEFENSE:
================================================================================

1. NO CODE REQUIRED after Gmail verification
   - The database flag (isEmailVerified) is automatically set

2. ONE-TIME GMAIL VERIFICATION
   - Once verified via OAuth, they can use local login forever
   - Unless account gets reset/disabled

3. PASSWORD STORED LOCALLY
   - Supervisor's password is hashed and stored in database
   - Used for local login after verification

4. SECURITY
   - First login must be via Gmail (email domain verified)
   - Local password only works AFTER Gmail verification
   - Prevents fake accounts using random passwords

5. FLOW IS AUTOMATIC
   - No manual database updates needed
   - Passport automatically calls User.save() with isEmailVerified = true
   - Backend handles all logic in oauth callback

================================================================================
WHAT TO SHOW IN DEFENSE:
================================================================================

1. Show authUtils.canUseLocalLogin() logic
   └─ Explains the verification gate

2. Show Passport config - line where isEmailVerified is set to true
   └─ Proves automatic verification happens

3. Live demo:
   a) Create supervisor (isEmailVerified = false)
   b) Try local login → ❌ fails
   c) Click "Sign in with Google"
   d) Complete Gmail OAuth
   e) Check database → isEmailVerified = true ✅
   f) Try local login again → ✅ SUCCESS

4. Show the JWT token in localStorage
   └─ Proves user is authenticated

================================================================================
IMPORTANT: Make sure in your .env file:
================================================================================

For production Gmail OAuth:
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
GOOGLE_CALLBACK_URL=https://fintrack.example.com/auth/google/callback

For local testing:
GOOGLE_CLIENT_ID=<your_test_client_id>
GOOGLE_CLIENT_SECRET=<your_test_client_secret>  
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
