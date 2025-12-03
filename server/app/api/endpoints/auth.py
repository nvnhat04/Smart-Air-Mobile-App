"""
Auth endpoints for the server.
Provides /auth/register and /auth/login using Firebase REST API as fallback and optionally Firebase Admin SDK when configured.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import requests

load_dotenv()

FIREBASE_API_KEY = os.getenv('FIREBASE_API_KEY')
SERVICE_ACCOUNT = os.getenv('FIREBASE_SERVICE_ACCOUNT')

router = APIRouter()

# Try to initialize firebase admin if service account is provided
admin_available = False
db = None
auth_admin = None
try:
    if SERVICE_ACCOUNT:
        import firebase_admin
        from firebase_admin import credentials, auth as auth_admin_module, firestore
        cred = credentials.Certificate(SERVICE_ACCOUNT)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        auth_admin = auth_admin_module
        admin_available = True
except Exception as e:
    # Admin SDK is optional; log will be visible on server
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


@router.post('/auth/register')
def register(payload: RegisterPayload):
    """Register a user. Prefer admin SDK; fallback to Firebase REST signUp when API key available."""
    if admin_available and auth_admin:
        try:
            user = auth_admin.create_user(email=payload.email, password=payload.password, display_name=payload.displayName)
            uid = user.uid
            profile = payload.profile or {}
            profile.update({'email': payload.email, 'displayName': payload.displayName})
            try:
                db.collection('users').document(uid).set(profile)
            except Exception as _e:
                print('Warning: failed to write profile to Firestore:', _e)
            return {'success': True, 'uid': uid}
        except Exception as e:
            print(f'[auth/register] Admin SDK error: {e}')
            raise HTTPException(status_code=500, detail=f'Registration failed: {str(e)}')

    # REST fallback
    if FIREBASE_API_KEY:
        try:
            url = f'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={FIREBASE_API_KEY}'
            body = {'email': payload.email, 'password': payload.password, 'returnSecureToken': True}
            r = requests.post(url, json=body)
            r.raise_for_status()
            return {'success': True, 'provider': 'rest', 'data': r.json()}
        except requests.HTTPError as exc:
            error_detail = exc.response.json() if exc.response is not None else str(exc)
            print(f'[auth/register] Firebase REST API error: {error_detail}')
            raise HTTPException(status_code=400, detail=error_detail)
        except Exception as e:
            print(f'[auth/register] Request error: {e}')
            raise HTTPException(status_code=500, detail=f'Registration request failed: {str(e)}')

    error_msg = 'Firebase admin not configured and FIREBASE_API_KEY not set; cannot register users. Please create a .env file with FIREBASE_API_KEY.'
    print(f'[auth/register] {error_msg}')
    raise HTTPException(status_code=500, detail=error_msg)


@router.post('/auth/login')
def login(payload: LoginPayload):
    """Login using Firebase Auth REST API (requires FIREBASE_API_KEY). Returns idToken/refreshToken on success."""
    if not FIREBASE_API_KEY:
        raise HTTPException(status_code=500, detail='FIREBASE_API_KEY not set')
    try:
        url = f'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}'
        body = {'email': payload.email, 'password': payload.password, 'returnSecureToken': True}
        r = requests.post(url, json=body)
        r.raise_for_status()
        return r.json()
    except requests.HTTPError as exc:
        detail = exc.response.json() if exc.response is not None else str(exc)
        raise HTTPException(status_code=400, detail=detail)
