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


class UserProfile(BaseModel):
    """Extended user profile fields for registration."""
    displayName: str | None = None
    gender: str | None = None  # e.g., 'male', 'female', 'other'
    age: int | None = None
    phone: str | None = None
    location: str | None = None
    city: str | None = None
    country: str | None = None
    photoURL: str | None = None
    additionalInfo: dict | None = None  # For custom fields


class RegisterPayload(BaseModel):
    email: str
    password: str
    profile: UserProfile | None = None


class LoginPayload(BaseModel):
    email: str
    password: str


@router.post('/auth/register')
def register(payload: RegisterPayload):
    """Register a user with extended profile (gender, age, phone, etc.).
    Prefers admin SDK; falls back to Firebase REST when API key available."""
    
    # Build profile dict from UserProfile model
    profile = {
        'email': payload.email,
        'createdAt': None,  # Will be set by server timestamp in Firestore
    }
    if payload.profile:
        profile_data = payload.profile.dict(exclude_none=True)
        profile.update(profile_data)
    
    if admin_available and auth_admin:
        try:
            user = auth_admin.create_user(
                email=payload.email,
                password=payload.password,
                display_name=payload.profile.displayName if payload.profile else None
            )
            uid = user.uid
            profile['uid'] = uid
            profile['createdAt'] = __import__('datetime').datetime.utcnow()
            try:
                db.collection('users').document(uid).set(profile)
                print(f'[auth/register] Admin SDK: User {uid} registered with profile: {profile}')
            except Exception as _e:
                print(f'Warning: failed to write profile to Firestore for user {uid}: {_e}')
            return {'success': True, 'uid': uid, 'provider': 'admin'}
        except Exception as e:
            print(f'[auth/register] Admin SDK error: {e}')
            raise HTTPException(status_code=500, detail=f'Registration failed: {str(e)}')

    # REST fallback
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
            resp_data = r.json()
            uid = resp_data.get('localId')
            
            # If Admin SDK is not available but we got uid, try to store profile
            if uid and SERVICE_ACCOUNT and admin_available and db:
                profile['uid'] = uid
                profile['createdAt'] = __import__('datetime').datetime.utcnow()
                try:
                    db.collection('users').document(uid).set(profile)
                    print(f'[auth/register] REST fallback: User {uid} profile stored in Firestore')
                except Exception as _e:
                    print(f'Warning: failed to store profile for REST user {uid}: {_e}')
            
            print(f'[auth/register] REST fallback: User {uid} registered with profile fields')
            return {
                'success': True,
                'uid': uid,
                'provider': 'rest',
                'idToken': resp_data.get('idToken'),
                'refreshToken': resp_data.get('refreshToken')
            }
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
