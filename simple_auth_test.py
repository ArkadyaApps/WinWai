#!/usr/bin/env python3
"""
Simple Authentication Test - Focus on the failing scenarios
"""

import requests
import json
import time
import pymongo
from pymongo import MongoClient

BASE_URL = "https://winticket-2.preview.emergentagent.com/api"
TEST_EMAIL = "test_auth_user@example.com"

def cleanup():
    """Clean up test data"""
    try:
        client = MongoClient('mongodb://localhost:27017')
        db = client['test_database']
        result = db.users.delete_many({'email': TEST_EMAIL})
        db.user_sessions.delete_many({})
        print(f"Cleaned up {result.deleted_count} test users")
    except Exception as e:
        print(f"Cleanup failed: {e}")

def test_auth_flow():
    """Test the complete authentication flow"""
    
    print("=== WinWai Authentication Test ===")
    print(f"Base URL: {BASE_URL}")
    print()
    
    # Clean up first
    cleanup()
    time.sleep(1)
    
    session_token = None
    reset_token = None
    
    # Test 1: Sign up new user
    print("1. Testing signup...")
    data = {"email": TEST_EMAIL, "password": "testpass123", "name": "Test User"}
    response = requests.post(f"{BASE_URL}/auth/email/signup", json=data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        session_token = result.get("session_token")
        print(f"   ✅ Signup successful, token: {session_token[:20] if session_token else 'None'}...")
    else:
        print(f"   ❌ Signup failed: {response.text}")
        return
    
    time.sleep(0.5)
    
    # Test 2: Duplicate email
    print("2. Testing duplicate email...")
    response = requests.post(f"{BASE_URL}/auth/email/signup", json=data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 400:
        result = response.json()
        if "already registered" in result.get("detail", "").lower():
            print(f"   ✅ Correctly rejected duplicate: {result['detail']}")
        else:
            print(f"   ❌ Wrong error message: {result}")
    else:
        print(f"   ❌ Expected 400, got {response.status_code}: {response.text}")
    
    time.sleep(0.5)
    
    # Test 3: Weak password
    print("3. Testing weak password...")
    weak_data = {"email": "weak@example.com", "password": "123", "name": "Weak"}
    response = requests.post(f"{BASE_URL}/auth/email/signup", json=weak_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 400:
        result = response.json()
        if "6 characters" in result.get("detail", ""):
            print(f"   ✅ Correctly rejected weak password: {result['detail']}")
        else:
            print(f"   ❌ Wrong error message: {result}")
    else:
        print(f"   ❌ Expected 400, got {response.status_code}: {response.text}")
    
    time.sleep(0.5)
    
    # Test 4: Wrong password signin
    print("4. Testing wrong password signin...")
    wrong_data = {"email": TEST_EMAIL, "password": "wrongpass"}
    response = requests.post(f"{BASE_URL}/auth/email/signin", json=wrong_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 401:
        result = response.json()
        if "invalid" in result.get("detail", "").lower():
            print(f"   ✅ Correctly rejected wrong password: {result['detail']}")
        else:
            print(f"   ❌ Wrong error message: {result}")
    else:
        print(f"   ❌ Expected 401, got {response.status_code}: {response.text}")
    
    time.sleep(0.5)
    
    # Test 5: Nonexistent user signin
    print("5. Testing nonexistent user signin...")
    nonexist_data = {"email": "nonexistent@example.com", "password": "anypass"}
    response = requests.post(f"{BASE_URL}/auth/email/signin", json=nonexist_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 401:
        result = response.json()
        if "invalid" in result.get("detail", "").lower():
            print(f"   ✅ Correctly rejected nonexistent user: {result['detail']}")
        else:
            print(f"   ❌ Wrong error message: {result}")
    else:
        print(f"   ❌ Expected 401, got {response.status_code}: {response.text}")
    
    time.sleep(0.5)
    
    # Test 6: Correct signin
    print("6. Testing correct signin...")
    correct_data = {"email": TEST_EMAIL, "password": "testpass123"}
    response = requests.post(f"{BASE_URL}/auth/email/signin", json=correct_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        session_token = result.get("session_token")
        print(f"   ✅ Signin successful, token: {session_token[:20] if session_token else 'None'}...")
    else:
        print(f"   ❌ Signin failed: {response.text}")
        return
    
    time.sleep(0.5)
    
    # Test 7: Change password with wrong current password
    print("7. Testing change password with wrong current...")
    headers = {"Authorization": f"Bearer {session_token}"}
    wrong_change_data = {"currentPassword": "wrongcurrent", "newPassword": "newpass456"}
    response = requests.post(f"{BASE_URL}/auth/change-password", json=wrong_change_data, headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 401:
        result = response.json()
        if "incorrect" in result.get("detail", "").lower():
            print(f"   ✅ Correctly rejected wrong current password: {result['detail']}")
        else:
            print(f"   ❌ Wrong error message: {result}")
    else:
        print(f"   ❌ Expected 401, got {response.status_code}: {response.text}")
    
    time.sleep(0.5)
    
    # Test 8: Change password without auth
    print("8. Testing change password without auth...")
    unauth_change_data = {"currentPassword": "testpass123", "newPassword": "newpass456"}
    response = requests.post(f"{BASE_URL}/auth/change-password", json=unauth_change_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 401:
        result = response.json()
        if "not authenticated" in result.get("detail", "").lower():
            print(f"   ✅ Correctly rejected unauthenticated request: {result['detail']}")
        else:
            print(f"   ❌ Wrong error message: {result}")
    else:
        print(f"   ❌ Expected 401, got {response.status_code}: {response.text}")
    
    time.sleep(0.5)
    
    # Test 9: Forgot password
    print("9. Testing forgot password...")
    forgot_data = {"email": TEST_EMAIL}
    response = requests.post(f"{BASE_URL}/auth/forgot-password", json=forgot_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        reset_token = result.get("resetToken")
        print(f"   ✅ Reset token generated: {reset_token[:20] if reset_token else 'None'}...")
    else:
        print(f"   ❌ Forgot password failed: {response.text}")
        return
    
    time.sleep(0.5)
    
    # Test 10: Reset password with invalid token
    print("10. Testing reset password with invalid token...")
    invalid_reset_data = {"email": TEST_EMAIL, "resetToken": "invalid_token", "newPassword": "newpass789"}
    response = requests.post(f"{BASE_URL}/auth/reset-password", json=invalid_reset_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 400:
        result = response.json()
        if "invalid" in result.get("detail", "").lower() or "expired" in result.get("detail", "").lower():
            print(f"   ✅ Correctly rejected invalid token: {result['detail']}")
        else:
            print(f"   ❌ Wrong error message: {result}")
    else:
        print(f"   ❌ Expected 400, got {response.status_code}: {response.text}")
    
    print()
    print("=== Test Complete ===")

if __name__ == "__main__":
    test_auth_flow()