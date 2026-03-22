# Air Quality App 

## Stack
- **Frontend**: React + Vite
- **Backend**: Express.js
- **Database**: PostgreSQL
- **Auth**: express-session
- **AI**: TBD

## Project Structure
```
air-quality-m1/
├── server/
│   ├── index.js              # Express entry point, session setup
│   ├── db.js                 # PostgreSQL client
│   ├── routes/
│   │   ├── auth.js           # POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
│   │   └── ai.js             # GET /api/ai/predict (stubbed)
│   └── middleware/
│       └── requireAuth.js    # Session verification middleware
├── client/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── UserDashboard.jsx
│           └── AdminDashboard.jsx
├── .env
└── package.json              # root — runs both server + client
```

---

## Setup

### 1. Install dependencies
```bash
# In Root folder
npm install

# Then swap to Client folder
cd client
npm install
```

### 2. Create `.env`
Fill in your values:
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.ksbrrzrpgripdfflfoki.supabase.co:5432/postgres
SESSION_SECRET=change_this_to_a_long_random_string
CLIENT_URL=IGNORE FOR NOW UNTIL I GET IT HOSTED
PORT=3001
```

### 3. Run the app
```bash 
# Runs both server and client at once
# MAKE SURE YOU'RE IN THE ROOT FOLDER 
npm run dev

# Or separately:
npm run server   # backend on http://localhost:3001
npm run client   # frontend on http://localhost:5173
```

---

## API Endpoints

| Method | Path | Auth required | Description |
|--------|------|---------------|-------------|
| POST | /api/auth/register | No | Create account |
| POST | /api/auth/login | No | Login, starts session |
| POST | /api/auth/logout | No | Logout, destroys session |
| GET | /api/auth/me | Yes | Get current logged-in user |
| GET | /api/ai/predict | Yes | AI prediction stub |

---

## How Auth Works
1. User registers → password is hashed with `bcrypt` → stored in PostgreSQL
2. User logs in → bcrypt compares password → `req.session.user` is set on the server
3. The browser automatically stores the session cookie
4. Every protected request sends the cookie automatically
5. `requireAuth.js` middleware checks `req.session.user` exists on protected routes
6. `user.role` determines which dashboard to show after login
7. Logout calls `req.session.destroy()` and clears the session

---

## Important: credentials: 'include'
Every `fetch()` call on the frontend includes `credentials: 'include'` so the
browser sends the session cookie cross-origin (Vite on port 5173 → Express on port 3001).
Without this the server would not recognise the session.

---

## AI Portion
# Ensure you have python installed; currently using GPT-2
cd ai
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
