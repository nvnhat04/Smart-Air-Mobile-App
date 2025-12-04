# Auth API Testing Guide

## 📦 Setup

### 1. Install Testing Dependencies

```bash
cd d:\Github\smartair\smartair-app\server
pip install pytest pytest-cov httpx
```

Or install from requirements.txt:
```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Make sure `.env` file has:
```env
FIREBASE_API_KEY=your_firebase_web_api_key
FIREBASE_SERVICE_ACCOUNT=path/to/serviceAccount.json  # Optional
```

## 🧪 Running Tests

### Run All Auth Tests
```bash
cd d:\Github\smartair\smartair-app\server
pytest testing/test_auth_api.py -v
```

### Run Specific Test Class
```bash
# Test only registration
pytest testing/test_auth_api.py::TestAuthRegister -v

# Test only login
pytest testing/test_auth_api.py::TestAuthLogin -v

# Test integration flows
pytest testing/test_auth_api.py::TestAuthIntegration -v

# Test edge cases
pytest testing/test_auth_api.py::TestAuthEdgeCases -v
```

### Run Specific Test
```bash
pytest testing/test_auth_api.py::TestAuthRegister::test_register_with_full_profile -v
```

### Run with Coverage Report
```bash
pytest testing/test_auth_api.py --cov=app.api.endpoints.auth --cov-report=html
```

Then open `htmlcov/index.html` to view coverage report.

### Run with Detailed Output
```bash
pytest testing/test_auth_api.py -v -s
```

## 📊 Test Structure

### Test Classes

1. **TestAuthRegister** - Registration endpoint tests
   - ✅ Full profile registration
   - ✅ Minimal registration (email + password only)
   - ✅ Display name only
   - ✅ Female user registration
   - ❌ Invalid email format
   - ❌ Weak password
   - ❌ Duplicate email
   - ❌ Missing required fields

2. **TestAuthLogin** - Login endpoint tests
   - ✅ Successful login
   - ❌ Wrong password
   - ❌ Non-existent email
   - ❌ Missing credentials

3. **TestAuthIntegration** - Complete auth flows
   - ✅ Register → Login → Verify
   - ✅ Multiple users registration

4. **TestAuthEdgeCases** - Special scenarios
   - ✅ Special characters in names
   - ✅ Very long names
   - ✅ Null profile fields
   - ✅ International phone formats

## 🎯 Test Coverage

Current test coverage areas:

- ✅ User registration with various profile combinations
- ✅ User login with valid/invalid credentials
- ✅ Email validation
- ✅ Password strength validation
- ✅ Duplicate email detection
- ✅ Complete auth flow (register + login)
- ✅ Multiple concurrent users
- ✅ Special characters and edge cases
- ✅ International data formats

## 📝 Example Test Results

```
testing/test_auth_api.py::TestAuthRegister::test_register_with_full_profile PASSED
testing/test_auth_api.py::TestAuthRegister::test_register_minimal_profile PASSED
testing/test_auth_api.py::TestAuthRegister::test_register_with_display_name_only PASSED
testing/test_auth_api.py::TestAuthRegister::test_register_female_user PASSED
testing/test_auth_api.py::TestAuthRegister::test_register_invalid_email PASSED
testing/test_auth_api.py::TestAuthRegister::test_register_weak_password PASSED
testing/test_auth_api.py::TestAuthRegister::test_register_duplicate_email PASSED
testing/test_auth_api.py::TestAuthRegister::test_register_missing_password PASSED
testing/test_auth_api.py::TestAuthRegister::test_register_missing_email PASSED
testing/test_auth_api.py::TestAuthLogin::test_login_success PASSED
testing/test_auth_api.py::TestAuthLogin::test_login_wrong_password PASSED
testing/test_auth_api.py::TestAuthLogin::test_login_nonexistent_email PASSED
testing/test_auth_api.py::TestAuthLogin::test_login_missing_email PASSED
testing/test_auth_api.py::TestAuthLogin::test_login_missing_password PASSED
testing/test_auth_api.py::TestAuthLogin::test_login_empty_credentials PASSED
testing/test_auth_api.py::TestAuthIntegration::test_register_and_login_flow PASSED
testing/test_auth_api.py::TestAuthIntegration::test_multiple_users_registration PASSED
testing/test_auth_api.py::TestAuthEdgeCases::test_register_with_special_characters_in_name PASSED
testing/test_auth_api.py::TestAuthEdgeCases::test_register_with_very_long_display_name PASSED
testing/test_auth_api.py::TestAuthEdgeCases::test_register_with_null_profile_fields PASSED
testing/test_auth_api.py::TestAuthEdgeCases::test_register_with_international_phone PASSED

======================== 21 passed in 15.23s ========================
```

## 🐛 Troubleshooting

### Tests Failing?

1. **Check Firebase Configuration**
   ```bash
   # Verify .env file exists
   cat .env | grep FIREBASE_API_KEY
   ```

2. **Check Server is NOT running**
   - Tests use TestClient which doesn't need running server
   - Kill any running uvicorn instances

3. **Check Dependencies**
   ```bash
   pip list | grep -E "pytest|httpx|fastapi"
   ```

4. **Run with Verbose Output**
   ```bash
   pytest testing/test_auth_api.py -v -s --tb=short
   ```

### Common Errors

**"No module named 'app'"**
- Solution: Run pytest from `server/` directory

**"FIREBASE_API_KEY not set"**
- Solution: Create `.env` file with Firebase API key

**"EMAIL_EXISTS" errors**
- Expected behavior for duplicate email tests
- Tests use random emails to avoid conflicts

## 📈 CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run Auth API Tests
  run: |
    cd server
    pytest testing/test_auth_api.py --cov=app.api.endpoints.auth --cov-report=xml
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./server/coverage.xml
```

## 🚀 Quick Commands

```bash
# Run all tests
pytest testing/test_auth_api.py

# Run with coverage
pytest testing/test_auth_api.py --cov

# Run verbose
pytest testing/test_auth_api.py -v

# Run specific test
pytest testing/test_auth_api.py -k "test_register_with_full_profile"

# Run and stop on first failure
pytest testing/test_auth_api.py -x

# Run and show local variables on failure
pytest testing/test_auth_api.py -l

# Run parallel (if pytest-xdist installed)
pytest testing/test_auth_api.py -n auto
```

## 📚 Additional Resources

- [pytest documentation](https://docs.pytest.org/)
- [FastAPI testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [Firebase Auth REST API](https://firebase.google.com/docs/reference/rest/auth)
