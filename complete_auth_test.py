#!/usr/bin/env python3
"""
Complete Authentication Test Suite - All 15 test cases as specified
"""

import requests
import json
import time
import pymongo
from pymongo import MongoClient

BASE_URL = "https://reward-raffles-1.preview.emergentagent.com/api"
TEST_EMAIL = "test_auth_user@example.com"
TEST_PASSWORD = "testpass123"
TEST_NAME = "Test Auth User"

def cleanup():
    """Clean up test data"""
    try:
        client = MongoClient('mongodb://localhost:27017')
        db = client['test_database']
        result = db.users.delete_many({'email': {'$in': [TEST_EMAIL, 'weak_password_test@example.com']}})
        db.user_sessions.delete_many({})
        print(f"Cleaned up {result.deleted_count} test users")
    except Exception as e:
        print(f"Cleanup failed: {e}")

def run_complete_test():
    """Run all 15 authentication test cases"""
    
    print("=" * 80)
    print("WinWai Raffle Rewards - Complete Email/Password Authentication Testing")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Email: {TEST_EMAIL}")
    print("=" * 80)
    print()
    
    # Clean up first
    print("Cleaning up test data...")
    cleanup()
    time.sleep(1)
    print()
    
    session_token = None
    reset_token = None
    passed = 0
    failed = 0
    
    # Test 1: Sign Up New User
    print("1. Sign Up New User")
    data = {"email": TEST_EMAIL, "password": TEST_PASSWORD, "name": TEST_NAME}
    response = requests.post(f"{BASE_URL}/auth/email/signup", json=data)
    if response.status_code == 200:
        result = response.json()
        if "user" in result and "session_token" in result:
            user = result["user"]
            if "password_hash" not in user and "resetToken" not in user:
                session_token = result["session_token"]
                print(f"   ✅ PASS: User created successfully. Session token: {session_token[:20]}...")
                passed += 1
            else:
                print(f"   ❌ FAIL: User object exposes sensitive data")
                failed += 1
        else:
            print(f"   ❌ FAIL: Missing user or session_token in response")
            failed += 1
    else:
        print(f"   ❌ FAIL: HTTP {response.status_code}: {response.text}")
        failed += 1
    
    time.sleep(0.5)
    
    # Test 2: Sign Up Duplicate Email
    print("2. Sign Up Duplicate Email")
    response = requests.post(f"{BASE_URL}/auth/email/signup", json=data)
    if response.status_code == 400:
        result = response.json()
        if "detail" in result and "already registered" in result["detail"].lower():
            print(f"   ✅ PASS: Correctly rejected duplicate email: {result['detail']}")
            passed += 1
        else:
            print(f"   ❌ FAIL: Wrong error message: {result}")
            failed += 1
    else:
        print(f"   ❌ FAIL: Expected 400, got {response.status_code}: {response.text}")
        failed += 1
    
    time.sleep(0.5)
    
    # Test 3: Sign Up Weak Password
    print("3. Sign Up Weak Password")
    weak_data = {"email": "weak_password_test@example.com", "password": "123", "name": "Weak Password Test"}
    response = requests.post(f"{BASE_URL}/auth/email/signup", json=weak_data)
    if response.status_code == 400:
        result = response.json()
        if "detail" in result and "6 characters" in result["detail"]:
            print(f"   ✅ PASS: Correctly rejected weak password: {result['detail']}")
            passed += 1
        else:
            print(f"   ❌ FAIL: Wrong error message: {result}")
            failed += 1
    else:
        print(f"   ❌ FAIL: Expected 400, got {response.status_code}: {response.text}")
        failed += 1
    
    time.sleep(0.5)
    
    # Test 4: Sign In Correct Credentials
    print("4. Sign In Correct Credentials")
    signin_data = {"email": TEST_EMAIL, "password": TEST_PASSWORD}
    response = requests.post(f"{BASE_URL}/auth/email/signin", json=signin_data)
    if response.status_code == 200:
        result = response.json()
        if "user" in result and "session_token" in result:
            session_token = result["session_token"]
            print(f"   ✅ PASS: Successfully signed in. New session token: {session_token[:20]}...")
            passed += 1
        else:
            print(f"   ❌ FAIL: Missing user or session_token in response")
            failed += 1
    else:
        print(f"   ❌ FAIL: HTTP {response.status_code}: {response.text}")
        failed += 1
    
    time.sleep(0.5)
    
    # Test 5: Sign In Wrong Password
    print("5. Sign In Wrong Password")
    wrong_signin_data = {"email": TEST_EMAIL, "password": "wrongpassword"}
    response = requests.post(f"{BASE_URL}/auth/email/signin", json=wrong_signin_data)
    if response.status_code == 401:
        result = response.json()
        if "detail" in result and "invalid" in result["detail"].lower():
            print(f"   ✅ PASS: Correctly rejected wrong password: {result['detail']}")
            passed += 1
        else:
            print(f"   ❌ FAIL: Wrong error message: {result}")
            failed += 1
    else:
        print(f"   ❌ FAIL: Expected 401, got {response.status_code}: {response.text}")
        failed += 1
    
    time.sleep(0.5)
    
    # Test 6: Sign In Non-existent User
    print("6. Sign In Non-existent User")
    nonexist_data = {"email": "nonexistent@example.com", "password": "anypassword"}
    response = requests.post(f"{BASE_URL}/auth/email/signin", json=nonexist_data)
    if response.status_code == 401:
        result = response.json()
        if "detail" in result and "invalid" in result["detail"].lower():
            print(f"   ✅ PASS: Correctly rejected non-existent user: {result['detail']}")
            passed += 1
        else:
            print(f"   ❌ FAIL: Wrong error message: {result}")
            failed += 1
    else:
        print(f"   ❌ FAIL: Expected 401, got {response.status_code}: {response.text}")
        failed += 1
    
    time.sleep(0.5)
    
    # Test 7: Change Password - Authenticated
    print("7. Change Password - Authenticated")
    if session_token:
        headers = {"Authorization": f"Bearer {session_token}"}
        change_data = {"currentPassword": TEST_PASSWORD, "newPassword": "newpass456"}
        response = requests.post(f"{BASE_URL}/auth/change-password", json=change_data, headers=headers)
        if response.status_code == 200:
            result = response.json()
            if "message" in result and "success" in result["message"].lower():
                print(f"   ✅ PASS: Password changed successfully: {result['message']}")
                passed += 1
            else:
                print(f"   ❌ FAIL: Wrong success message: {result}")
                failed += 1
        else:
            print(f"   ❌ FAIL: HTTP {response.status_code}: {response.text}")
            failed += 1
    else:
        print("   ❌ FAIL: No session token available")
        failed += 1
    
    time.sleep(0.5)
    
    # Test 8: Sign In With New Password
    print("8. Sign In With New Password")
    new_signin_data = {"email": TEST_EMAIL, "password": "newpass456"}
    response = requests.post(f"{BASE_URL}/auth/email/signin", json=new_signin_data)
    if response.status_code == 200:
        result = response.json()
        if "user" in result and "session_token" in result:
            session_token = result["session_token"]
            print(f"   ✅ PASS: Successfully signed in with new password. Token: {session_token[:20]}...")
            passed += 1
        else:
            print(f"   ❌ FAIL: Missing user or session_token in response")
            failed += 1
    else:
        print(f"   ❌ FAIL: HTTP {response.status_code}: {response.text}")
        failed += 1
    
    time.sleep(0.5)
    
    # Test 9: Change Password - Wrong Current Password
    print("9. Change Password - Wrong Current Password")
    if session_token:
        headers = {"Authorization": f"Bearer {session_token}"}
        wrong_change_data = {"currentPassword": "wrongpass", "newPassword": "anotherpass"}
        response = requests.post(f"{BASE_URL}/auth/change-password", json=wrong_change_data, headers=headers)
        if response.status_code == 401:
            result = response.json()
            if "detail" in result and "incorrect" in result["detail"].lower():
                print(f"   ✅ PASS: Correctly rejected wrong current password: {result['detail']}")
                passed += 1
            else:
                print(f"   ❌ FAIL: Wrong error message: {result}")
                failed += 1
        else:
            print(f"   ❌ FAIL: Expected 401, got {response.status_code}: {response.text}")
            failed += 1
    else:
        print("   ❌ FAIL: No session token available")
        failed += 1
    
    time.sleep(0.5)
    
    # Test 10: Change Password - Unauthenticated
    print("10. Change Password - Unauthenticated")
    unauth_change_data = {"currentPassword": "newpass456", "newPassword": "anotherpass"}
    response = requests.post(f"{BASE_URL}/auth/change-password", json=unauth_change_data)
    if response.status_code == 401:
        result = response.json()
        if "detail" in result and "not authenticated" in result["detail"].lower():
            print(f"   ✅ PASS: Correctly rejected unauthenticated request: {result['detail']}")
            passed += 1
        else:
            print(f"   ❌ FAIL: Wrong error message: {result}")
            failed += 1
    else:
        print(f"   ❌ FAIL: Expected 401, got {response.status_code}: {response.text}")
        failed += 1
    
    time.sleep(0.5)
    
    # Test 11: Forgot Password - Valid Email
    print("11. Forgot Password - Valid Email")
    forgot_data = {"email": TEST_EMAIL}
    response = requests.post(f"{BASE_URL}/auth/forgot-password", json=forgot_data)
    if response.status_code == 200:
        result = response.json()
        if "message" in result and "resetToken" in result and "email" in result:
            reset_token = result["resetToken"]
            print(f"   ✅ PASS: Reset token generated: {reset_token[:20]}... (Note: In production, token should only be sent via email)")
            passed += 1
        else:
            print(f"   ❌ FAIL: Missing required fields in response: {result}")
            failed += 1
    else:
        print(f"   ❌ FAIL: HTTP {response.status_code}: {response.text}")
        failed += 1
    
    time.sleep(0.5)
    
    # Test 12: Reset Password With Valid Token
    print("12. Reset Password With Valid Token")
    if reset_token:
        reset_data = {"email": TEST_EMAIL, "resetToken": reset_token, "newPassword": "resetpass789"}
        response = requests.post(f"{BASE_URL}/auth/reset-password", json=reset_data)
        if response.status_code == 200:
            result = response.json()
            if "message" in result and "success" in result["message"].lower():
                print(f"   ✅ PASS: Password reset successfully: {result['message']}")
                passed += 1
            else:
                print(f"   ❌ FAIL: Wrong success message: {result}")
                failed += 1
        else:
            print(f"   ❌ FAIL: HTTP {response.status_code}: {response.text}")
            failed += 1
    else:
        print("   ❌ FAIL: No reset token available")
        failed += 1
    
    time.sleep(0.5)
    
    # Test 13: Sign In After Password Reset
    print("13. Sign In After Password Reset")
    reset_signin_data = {"email": TEST_EMAIL, "password": "resetpass789"}
    response = requests.post(f"{BASE_URL}/auth/email/signin", json=reset_signin_data)
    if response.status_code == 200:
        result = response.json()
        if "user" in result and "session_token" in result:
            session_token = result["session_token"]
            print(f"   ✅ PASS: Successfully signed in after password reset. Token: {session_token[:20]}...")
            passed += 1
        else:
            print(f"   ❌ FAIL: Missing user or session_token in response")
            failed += 1
    else:
        print(f"   ❌ FAIL: HTTP {response.status_code}: {response.text}")
        failed += 1
    
    time.sleep(0.5)
    
    # Test 14: Reset Password With Invalid Token
    print("14. Reset Password With Invalid Token")
    invalid_reset_data = {"email": TEST_EMAIL, "resetToken": "invalid_token", "newPassword": "anypass"}
    response = requests.post(f"{BASE_URL}/auth/reset-password", json=invalid_reset_data)
    if response.status_code == 400:
        result = response.json()
        if "detail" in result and ("invalid" in result["detail"].lower() or "expired" in result["detail"].lower()):
            print(f"   ✅ PASS: Correctly rejected invalid token: {result['detail']}")
            passed += 1
        else:
            print(f"   ❌ FAIL: Wrong error message: {result}")
            failed += 1
    else:
        print(f"   ❌ FAIL: Expected 400, got {response.status_code}: {response.text}")
        failed += 1
    
    time.sleep(0.5)
    
    # Test 15: Forgot Password - Non-existent Email
    print("15. Forgot Password - Non-existent Email")
    nonexist_forgot_data = {"email": "nonexistent@example.com"}
    response = requests.post(f"{BASE_URL}/auth/forgot-password", json=nonexist_forgot_data)
    if response.status_code == 200:
        result = response.json()
        if "message" in result and "if the email exists" in result["message"].lower():
            print(f"   ✅ PASS: Correctly returned generic message for security: {result['message']}")
            passed += 1
        else:
            print(f"   ❌ FAIL: Wrong security message: {result}")
            failed += 1
    else:
        print(f"   ❌ FAIL: Expected 200, got {response.status_code}: {response.text}")
        failed += 1
    
    # Summary
    print()
    print("=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"Total Tests: 15")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {(passed/15*100):.1f}%")
    print()
    
    if failed == 0:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Email/Password Authentication System is fully functional")
        print("✅ All security validations working correctly")
        print("✅ Password hashing and verification working")
        print("✅ Session token generation working")
        print("✅ Reset token flow working end-to-end")
        print("✅ Proper error messages for all failure scenarios")
    else:
        print("❌ SOME TESTS FAILED - Review the failures above")
    
    print("=" * 80)
    
    return failed == 0

if __name__ == "__main__":
    success = run_complete_test()
    exit(0 if success else 1)