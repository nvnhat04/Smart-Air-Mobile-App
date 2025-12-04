"""
Test suite for Auth API endpoints
Tests /auth/register and /auth/login endpoints with various scenarios
"""
import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Add parent directory to path to import app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app

client = TestClient(app)


class TestAuthRegister:
    """Test cases for /auth/register endpoint"""
    
    def test_register_with_full_profile(self):
        """Test registering a user with complete profile information"""
        payload = {
            "email": f"test_full_{os.urandom(4).hex()}@example.com",
            "password": "StrongPassword123!",
            "profile": {
                "displayName": "Nguyễn Văn A",
                "gender": "male",
                "age": 25,
                "phone": "+84912345678",
                "location": "Hà Nội",
                "city": "Hà Nội",
                "country": "Vietnam",
                "photoURL": "https://example.com/avatar.jpg",
                "additionalInfo": {
                    "occupation": "Software Engineer",
                    "interests": ["air quality", "environment"]
                }
            }
        }
        
        response = client.post("/auth/register", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "uid" in data
        assert data["provider"] in ["admin", "rest"]
    
    def test_register_minimal_profile(self):
        """Test registering a user with only email and password"""
        payload = {
            "email": f"test_minimal_{os.urandom(4).hex()}@example.com",
            "password": "Password123!"
        }
        
        response = client.post("/auth/register", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "uid" in data
    
    def test_register_with_display_name_only(self):
        """Test registering with just display name in profile"""
        payload = {
            "email": f"test_name_{os.urandom(4).hex()}@example.com",
            "password": "SecurePass456!",
            "profile": {
                "displayName": "John Doe"
            }
        }
        
        response = client.post("/auth/register", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    def test_register_female_user(self):
        """Test registering a female user"""
        payload = {
            "email": f"test_female_{os.urandom(4).hex()}@example.com",
            "password": "Password789!",
            "profile": {
                "displayName": "Jane Smith",
                "gender": "female",
                "age": 28,
                "phone": "+84987654321",
                "city": "Hồ Chí Minh",
                "country": "Vietnam"
            }
        }
        
        response = client.post("/auth/register", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    def test_register_invalid_email(self):
        """Test registering with invalid email format"""
        payload = {
            "email": "not-an-email",
            "password": "Password123!"
        }
        
        response = client.post("/auth/register", json=payload)
        
        # Should return 400 or 422 for validation error
        assert response.status_code in [400, 422]
    
    def test_register_weak_password(self):
        """Test registering with weak password (less than 6 characters)"""
        payload = {
            "email": f"test_weak_{os.urandom(4).hex()}@example.com",
            "password": "123"
        }
        
        response = client.post("/auth/register", json=payload)
        
        # Firebase requires min 6 characters
        assert response.status_code == 400
        assert "WEAK_PASSWORD" in str(response.json())
    
    def test_register_duplicate_email(self):
        """Test registering with an email that already exists"""
        email = f"test_duplicate_{os.urandom(4).hex()}@example.com"
        payload = {
            "email": email,
            "password": "Password123!"
        }
        
        # First registration should succeed
        response1 = client.post("/auth/register", json=payload)
        assert response1.status_code == 200
        
        # Second registration with same email should fail
        response2 = client.post("/auth/register", json=payload)
        assert response2.status_code == 400
        assert "EMAIL_EXISTS" in str(response2.json())
    
    def test_register_missing_password(self):
        """Test registering without password"""
        payload = {
            "email": f"test_nopass_{os.urandom(4).hex()}@example.com"
        }
        
        response = client.post("/auth/register", json=payload)
        
        # Should return validation error
        assert response.status_code == 422
    
    def test_register_missing_email(self):
        """Test registering without email"""
        payload = {
            "password": "Password123!"
        }
        
        response = client.post("/auth/register", json=payload)
        
        # Should return validation error
        assert response.status_code == 422


class TestAuthLogin:
    """Test cases for /auth/login endpoint"""
    
    def setup_method(self):
        """Create a test user before each login test"""
        self.test_email = f"test_login_{os.urandom(4).hex()}@example.com"
        self.test_password = "TestPassword123!"
        
        # Register user for login tests
        register_payload = {
            "email": self.test_email,
            "password": self.test_password,
            "profile": {
                "displayName": "Test Login User"
            }
        }
        response = client.post("/auth/register", json=register_payload)
        assert response.status_code == 200
    
    def test_login_success(self):
        """Test successful login with valid credentials"""
        payload = {
            "email": self.test_email,
            "password": self.test_password
        }
        
        response = client.post("/auth/login", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert "idToken" in data
        assert "localId" in data or "uid" in data
        assert data.get("email") == self.test_email
    
    def test_login_wrong_password(self):
        """Test login with incorrect password"""
        payload = {
            "email": self.test_email,
            "password": "WrongPassword123!"
        }
        
        response = client.post("/auth/login", json=payload)
        
        assert response.status_code == 400
        assert "INVALID" in str(response.json()).upper()
    
    def test_login_nonexistent_email(self):
        """Test login with email that doesn't exist"""
        payload = {
            "email": f"nonexistent_{os.urandom(4).hex()}@example.com",
            "password": "Password123!"
        }
        
        response = client.post("/auth/login", json=payload)
        
        assert response.status_code == 400
    
    def test_login_missing_email(self):
        """Test login without email"""
        payload = {
            "password": "Password123!"
        }
        
        response = client.post("/auth/login", json=payload)
        
        assert response.status_code == 422
    
    def test_login_missing_password(self):
        """Test login without password"""
        payload = {
            "email": self.test_email
        }
        
        response = client.post("/auth/login", json=payload)
        
        assert response.status_code == 422
    
    def test_login_empty_credentials(self):
        """Test login with empty email and password"""
        payload = {
            "email": "",
            "password": ""
        }
        
        response = client.post("/auth/login", json=payload)
        
        assert response.status_code in [400, 422]


class TestAuthIntegration:
    """Integration tests for complete auth flow"""
    
    def test_register_and_login_flow(self):
        """Test complete flow: register -> login -> verify token"""
        email = f"test_flow_{os.urandom(4).hex()}@example.com"
        password = "FlowTest123!"
        
        # Step 1: Register
        register_payload = {
            "email": email,
            "password": password,
            "profile": {
                "displayName": "Flow Test User",
                "age": 30
            }
        }
        
        register_response = client.post("/auth/register", json=register_payload)
        assert register_response.status_code == 200
        register_data = register_response.json()
        assert register_data["success"] is True
        uid = register_data["uid"]
        
        # Step 2: Login with same credentials
        login_payload = {
            "email": email,
            "password": password
        }
        
        login_response = client.post("/auth/login", json=login_payload)
        assert login_response.status_code == 200
        login_data = login_response.json()
        assert "idToken" in login_data
        
        # Verify the UID matches
        assert login_data.get("localId") == uid or login_data.get("uid") == uid
    
    def test_multiple_users_registration(self):
        """Test registering multiple users with different profiles"""
        users = [
            {
                "email": f"user1_{os.urandom(4).hex()}@example.com",
                "password": "User1Pass123!",
                "profile": {"displayName": "User One", "gender": "male"}
            },
            {
                "email": f"user2_{os.urandom(4).hex()}@example.com",
                "password": "User2Pass123!",
                "profile": {"displayName": "User Two", "gender": "female"}
            },
            {
                "email": f"user3_{os.urandom(4).hex()}@example.com",
                "password": "User3Pass123!",
                "profile": {"displayName": "User Three", "age": 25}
            }
        ]
        
        uids = []
        for user in users:
            response = client.post("/auth/register", json=user)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            uids.append(data["uid"])
        
        # Verify all UIDs are unique
        assert len(uids) == len(set(uids))
        
        # Verify all users can login
        for user in users:
            login_payload = {
                "email": user["email"],
                "password": user["password"]
            }
            login_response = client.post("/auth/login", json=login_payload)
            assert login_response.status_code == 200


class TestAuthEdgeCases:
    """Test edge cases and special scenarios"""
    
    def test_register_with_special_characters_in_name(self):
        """Test registration with special characters in display name"""
        payload = {
            "email": f"test_special_{os.urandom(4).hex()}@example.com",
            "password": "Password123!",
            "profile": {
                "displayName": "Nguyễn Thị Ánh 🌟",
                "city": "Đà Nẵng"
            }
        }
        
        response = client.post("/auth/register", json=payload)
        assert response.status_code == 200
    
    def test_register_with_very_long_display_name(self):
        """Test registration with very long display name"""
        payload = {
            "email": f"test_long_{os.urandom(4).hex()}@example.com",
            "password": "Password123!",
            "profile": {
                "displayName": "A" * 255  # Very long name
            }
        }
        
        response = client.post("/auth/register", json=payload)
        assert response.status_code == 200
    
    def test_register_with_null_profile_fields(self):
        """Test registration with explicit null values in profile"""
        payload = {
            "email": f"test_null_{os.urandom(4).hex()}@example.com",
            "password": "Password123!",
            "profile": {
                "displayName": "Null Test",
                "gender": None,
                "age": None,
                "phone": None
            }
        }
        
        response = client.post("/auth/register", json=payload)
        assert response.status_code == 200
    
    def test_register_with_international_phone(self):
        """Test registration with various international phone formats"""
        phone_formats = [
            "+84912345678",
            "+1-555-123-4567",
            "+44 20 7123 4567",
            "+86 138 0013 8000"
        ]
        
        for phone in phone_formats:
            payload = {
                "email": f"test_phone_{os.urandom(4).hex()}@example.com",
                "password": "Password123!",
                "profile": {
                    "displayName": "Phone Test",
                    "phone": phone
                }
            }
            
            response = client.post("/auth/register", json=payload)
            assert response.status_code == 200


# Run tests with: pytest testing/test_auth_api.py -v
# Run with coverage: pytest testing/test_auth_api.py --cov=app.api.endpoints.auth --cov-report=html
