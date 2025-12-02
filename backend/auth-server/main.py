from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import requests

load_dotenv()

FIREBASE_API_KEY = os.getenv('FIREBASE_API_KEY')
SERVICE_ACCOUNT = os.getenv('FIREBASE_SERVICE_ACCOUNT')

app = FastAPI(title='SmartAir Auth (FastAPI)')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    if SERVICE_ACCOUNT:
        import firebase_admin
        from firebase_admin import credentials, auth, firestore
        cred = credentials.Certificate(SERVICE_ACCOUNT)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        admin_available = True
    else:
        admin_available = False
except Exception as e:
    print('Firebase admin init error:', e)
    admin_available = False


class RegisterPayload(BaseModel):
    email: str
    password: str
    displayName: str | None = None
    profile: dict | None = None


class LoginPayload(BaseModel):
    email: str
    password: str


@app.get('/')
def root():
    return {'ok': True, 'admin': admin_available}


@app.post('/register')
def register(payload: RegisterPayload):
    # Prefer using Firebase Admin SDK to create user and store profile
    if not admin_available:
        raise HTTPException(status_code=500, detail='Firebase admin not configured - set FIREBASE_SERVICE_ACCOUNT')

    try:
        user = auth.create_user(email=payload.email, password=payload.password, display_name=payload.displayName)
        uid = user.uid
        # store profile in Firestore
        profile = payload.profile or {}
        profile.update({'email': payload.email, 'displayName': payload.displayName})
        db.collection('users').document(uid).set(profile)
        return {'success': True, 'uid': uid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/login')
def login(payload: LoginPayload):
    # Use Firebase Auth REST API to sign in with email/password
    if not FIREBASE_API_KEY:
        raise HTTPException(status_code=500, detail='FIREBASE_API_KEY not set')

    url = f'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}'
    body = {
        'email': payload.email,
        'password': payload.password,
        'returnSecureToken': True
    }
    try:
        r = requests.post(url, json=body)
        r.raise_for_status()
        return r.json()
    except requests.HTTPError as exc:
        detail = exc.response.json() if exc.response is not None else str(exc)
        raise HTTPException(status_code=400, detail=detail)
