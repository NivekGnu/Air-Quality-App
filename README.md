# Air Quality App 

Web app that connects to a MQ135 sensor on a raspberry pi to record the air quality in the environment. Includes a fun "breathalyzer" feature to test your breath.

## Stack
- **Frontend**: React + Vite
- **Backend**: Express.js
- **Database**: PostgreSQL
- **Auth**: JWT Token
- **AI**: LLAMA 3.3 through Groq API

## Hardware / Edge Device Setup
The device was run on a Raspberry Pi Zero 2 W and communicates with the Express backend.

**Components:**
- Raspberry Pi Zero 2 W (or something cheaper! Just needs wireless network capabilities)
- MQ135 Gas/Air Quality Sensor
- ADS1115 Analog-to-Digital Converter (I2C)
- Any OLED Display (I2C)

**Running the Raspberry Pi:**
1. Ensure you have python installed
2. Install Python dependencies:
   `pip install requests adafruit-circuitpython-ads1x15 luma.oled Pillow python_dotenv`
3. Create a new .env file in the same directory as the python file
4. In the .env add { SERVER_URL=[LINK_TO_SERVER] } 
5. Run the script:
   `python3 sensor_v1.py`

#### Note: If you are having problems running pip or python3, you may need to create a virtual environment (venv).

## Project Structure
```
air-quality-app/
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
DATABASE_URL=COPY_YOUR_DATABASE_URL
JWT_SECRET=GENERATE_LONG_STRING
CLIENT_URL=LINK_TO_FRONT_END
PORT=3001
GROQ_API_KEY=YOUR_API_KEY
SENSOR_RO=490.5       
SENSOR_RL=10.0       
SENSOR_VCC=5.0
```
#### NOTE: Remove PORT if you deploy as it will change the port given by your hosting service. This will prevent your frontend from being able to comunicate to the server.

### 3. Run the app
```bash 
# Runs both server and client at once
# MAKE SURE YOU'RE IN THE ROOT FOLDER (Air-Quality-App)
npm run dev
```

## API Endpoints

| Method | Path | Auth required | Description |
|--------|------|---------------|-------------|
| POST | /api/auth/register | No | Create account |
| POST | /api/auth/login | No | Login, starts session |
| POST | /api/auth/logout | No | Logout, destroys session |
| GET | /api/auth/me | Yes | Get current logged-in user |
| GET | /api/ai/predict | Yes | AI prediction stub |

## How Auth Works
1. User registers → password is hashed with `bcrypt` → stored in PostgreSQL.
2. User logs in → `bcrypt` compares password → Server signs a JWT containing the user's `id`, `email`, and `role`.
3. The server sends the JWT back to the React client, which stores it in `localStorage`.
4. The client attaches the JWT to the `Authorization: Bearer <token>` header for all protected API calls.
5. The `requireAuth.js` middleware intercepts requests, verifies the JWT signature, and grants access.
6. The `user.role` determines whether the client routes the user to the Admin or User dashboard.
7. Logout deletes the token from `localStorage`, immediately revoking access on the client side.

## AI Folder
Please ignore the ai folder as it contains GPT-2 which is not really good and overall costs hosting on a server! You can use it if you'd but I will not be giving instructions on how to install, build, or run the model.