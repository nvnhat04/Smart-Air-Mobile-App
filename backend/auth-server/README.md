# FastAPI Auth Server (SmartAir)

This small FastAPI service provides two endpoints for user registration and login using Firebase:

- `POST /register` — creates a Firebase Auth user and stores a Firestore `users/{uid}` document (requires service account)
- `POST /login` — signs-in a user via Firebase Auth REST API and returns the idToken/refreshToken (requires API key)

Setup
1. Create a Firebase project and enable Email/Password sign-in.
2. Create a service account (Project Settings → Service Accounts) and download the JSON file.
3. Set environment variables in a `.env` file in this folder:

```
FIREBASE_API_KEY=your_firebase_web_api_key
FIREBASE_SERVICE_ACCOUNT=C:\path\to\serviceAccountKey.json
PORT=8000
```

4. Install dependencies and run:

```bash
python -m pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Notes
- If you don't configure `FIREBASE_SERVICE_ACCOUNT`, the `/register` endpoint will return an error. `/login` uses the REST API and only needs `FIREBASE_API_KEY`.
