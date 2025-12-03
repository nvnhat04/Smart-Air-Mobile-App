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
    """
    Register a new user.
    Preferred path: use Firebase Admin SDK (service account) to create user and store profile in Firestore.
    Fallback: if admin SDK is not available but FIREBASE_API_KEY is set, use Firebase Auth REST `signUp` endpoint.
    """
    # Admin SDK path
    if admin_available:
        try:
            user = auth.create_user(email=payload.email, password=payload.password, display_name=payload.displayName)
            uid = user.uid
            # store profile in Firestore
            profile = payload.profile or {}
            profile.update({'email': payload.email, 'displayName': payload.displayName})
            try:
                db.collection('users').document(uid).set(profile)
            except Exception as _e:
                # Log but do not fail registration if Firestore write fails
                print('Warning: failed to write profile to Firestore:', _e)
            return {'success': True, 'uid': uid}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # Fallback path: use Firebase REST API signUp if API key is available
    if FIREBASE_API_KEY:
        try:
            url = f'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={FIREBASE_API_KEY}'
            body = {
                'email': payload.email,
                'password': payload.password,
                'returnSecureToken': True
            }
            r = requests.post(url, json=body)
            r.raise_for_status()
            resp = r.json()
            # Note: we can't write to Firestore without service account; return created account info
            return { 'success': True, 'provider': 'rest', 'data': resp }
        except requests.HTTPError as exc:
            detail = exc.response.json() if exc.response is not None else str(exc)
            raise HTTPException(status_code=400, detail=detail)

    # Neither admin nor REST API available
    raise HTTPException(status_code=500, detail='Firebase admin not configured and FIREBASE_API_KEY not set; cannot register users')


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
