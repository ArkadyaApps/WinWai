#!/usr/bin/env python3
"""
Backend Authentication Testing Script for WinWai Raffle Rewards App
Tests all email/password authentication endpoints in sequence
"""

import requests
import json
import sys
from datetime import datetime
import pymongo
from pymongo import MongoClient

# Configuration
BASE_URL = "https://prize-raffle-2.preview.emergentagent.com/api"
TEST_EMAIL = "test_auth_user@example.com"
TEST_PASSWORD = "testpass123"
TEST_NAME = "Test Auth User"

class AuthTester:
    def __init__(self):
        self.session_token = None
        self.reset_token = None
        self.test_results = []
        
    def cleanup_test_data(self):
        """Clean up test data before starting"""
        try:
            client = MongoClient('mongodb://localhost:27017')
            db = client['test_database']
            # Clean up test users
            result = db.users.delete_many({'email': TEST_EMAIL})
            db.users.delete_many({'email': 'weak_password_test@example.com'})
            db.user_sessions.delete_many({})
            print(f"Cleaned up {result.deleted_count} test users")
        except Exception as e:
            print(f"Cleanup failed: {e}")
        
    def log_test(self, test_name, success, details="", expected="", actual=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "expected": expected,
            "actual": actual,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and expected:
            print(f"   Expected: {expected}")
            print(f"   Actual: {actual}")
        print()
        
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        try:
            # Set default headers
            if headers is None:
                headers = {}
            headers.setdefault('Content-Type', 'application/json')
            
            if method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed for {method} {url}: {e}")
            return None
            
    def test_1_signup_new_user(self):
        """Test 1: Sign Up New User"""
        data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME
        }
        
        response = self.make_request("POST", "/auth/email/signup", data)
        if not response:
            self.log_test("1. Sign Up New User", False, "Network request failed")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                if "user" in result and "session_token" in result:
                    user = result["user"]
                    # Check user object doesn't expose password_hash
                    if "password_hash" not in user and "resetToken" not in user:
                        self.session_token = result["session_token"]
                        self.log_test("1. Sign Up New User", True, 
                                    f"User created successfully. Session token: {self.session_token[:20]}...")
                        return True
                    else:
                        self.log_test("1. Sign Up New User", False, 
                                    "User object exposes sensitive data", 
                                    "No password_hash/resetToken in response",
                                    f"Found sensitive fields: {[k for k in user.keys() if k in ['password_hash', 'resetToken']]}")
                        return False
                else:
                    self.log_test("1. Sign Up New User", False, 
                                "Missing user or session_token in response",
                                "{ user: {...}, session_token: '...' }",
                                str(result))
                    return False
            except json.JSONDecodeError:
                self.log_test("1. Sign Up New User", False, "Invalid JSON response")
                return False
        else:
            self.log_test("1. Sign Up New User", False, 
                        f"HTTP {response.status_code}: {response.text}",
                        "200 OK",
                        f"{response.status_code}")
            return False
            
    def test_2_signup_duplicate_email(self):
        """Test 2: Sign Up Duplicate Email"""
        data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME
        }
        
        response = self.make_request("POST", "/auth/email/signup", data)
        if not response:
            self.log_test("2. Sign Up Duplicate Email", False, "Network request failed")
            return False
            
        if response.status_code == 400:
            try:
                result = response.json()
                if "detail" in result and "already registered" in result["detail"].lower():
                    self.log_test("2. Sign Up Duplicate Email", True, 
                                f"Correctly rejected duplicate email: {result['detail']}")
                    return True
                else:
                    self.log_test("2. Sign Up Duplicate Email", False,
                                "Wrong error message",
                                "Email already registered",
                                result.get("detail", "No detail"))
                    return False
            except json.JSONDecodeError:
                self.log_test("2. Sign Up Duplicate Email", False, "Invalid JSON response")
                return False
        else:
            self.log_test("2. Sign Up Duplicate Email", False,
                        f"Wrong status code: {response.status_code} - {response.text}",
                        "400",
                        str(response.status_code))
            return False
            
    def test_3_signup_weak_password(self):
        """Test 3: Sign Up Weak Password"""
        data = {
            "email": "weak_password_test@example.com",
            "password": "123",  # Less than 6 characters
            "name": "Weak Password Test"
        }
        
        response = self.make_request("POST", "/auth/email/signup", data)
        if not response:
            self.log_test("3. Sign Up Weak Password", False, "Network request failed")
            return False
            
        if response.status_code == 400:
            try:
                result = response.json()
                if "detail" in result and "6 characters" in result["detail"]:
                    self.log_test("3. Sign Up Weak Password", True,
                                f"Correctly rejected weak password: {result['detail']}")
                    return True
                else:
                    self.log_test("3. Sign Up Weak Password", False,
                                "Wrong error message",
                                "Password must be at least 6 characters",
                                result.get("detail", "No detail"))
                    return False
            except json.JSONDecodeError:
                self.log_test("3. Sign Up Weak Password", False, "Invalid JSON response")
                return False
        else:
            self.log_test("3. Sign Up Weak Password", False,
                        f"Wrong status code: {response.status_code} - {response.text}",
                        "400",
                        str(response.status_code))
            return False
            
    def test_4_signin_correct_credentials(self):
        """Test 4: Sign In Correct Credentials"""
        data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        response = self.make_request("POST", "/auth/email/signin", data)
        if not response:
            self.log_test("4. Sign In Correct Credentials", False, "Network request failed")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                if "user" in result and "session_token" in result:
                    self.session_token = result["session_token"]
                    self.log_test("4. Sign In Correct Credentials", True,
                                f"Successfully signed in. New session token: {self.session_token[:20]}...")
                    return True
                else:
                    self.log_test("4. Sign In Correct Credentials", False,
                                "Missing user or session_token in response",
                                "{ user: {...}, session_token: '...' }",
                                str(result))
                    return False
            except json.JSONDecodeError:
                self.log_test("4. Sign In Correct Credentials", False, "Invalid JSON response")
                return False
        else:
            self.log_test("4. Sign In Correct Credentials", False,
                        f"HTTP {response.status_code}: {response.text}",
                        "200 OK",
                        f"{response.status_code}")
            return False
            
    def test_5_signin_wrong_password(self):
        """Test 5: Sign In Wrong Password"""
        data = {
            "email": TEST_EMAIL,
            "password": "wrongpassword"
        }
        
        response = self.make_request("POST", "/auth/email/signin", data)
        if not response:
            self.log_test("5. Sign In Wrong Password", False, "Network request failed")
            return False
            
        if response.status_code == 401:
            try:
                result = response.json()
                if "detail" in result and "invalid" in result["detail"].lower():
                    self.log_test("5. Sign In Wrong Password", True,
                                f"Correctly rejected wrong password: {result['detail']}")
                    return True
                else:
                    self.log_test("5. Sign In Wrong Password", False,
                                "Wrong error message",
                                "Invalid email or password",
                                result.get("detail", "No detail"))
                    return False
            except json.JSONDecodeError:
                self.log_test("5. Sign In Wrong Password", False, "Invalid JSON response")
                return False
        else:
            self.log_test("5. Sign In Wrong Password", False,
                        f"Wrong status code: {response.status_code} - {response.text}",
                        "401",
                        str(response.status_code))
            return False
            
    def test_6_signin_nonexistent_user(self):
        """Test 6: Sign In Non-existent User"""
        data = {
            "email": "nonexistent@example.com",
            "password": "anypassword"
        }
        
        response = self.make_request("POST", "/auth/email/signin", data)
        if not response:
            self.log_test("6. Sign In Non-existent User", False, "Network request failed")
            return False
            
        if response.status_code == 401:
            try:
                result = response.json()
                if "detail" in result and "invalid" in result["detail"].lower():
                    self.log_test("6. Sign In Non-existent User", True,
                                f"Correctly rejected non-existent user: {result['detail']}")
                    return True
                else:
                    self.log_test("6. Sign In Non-existent User", False,
                                "Wrong error message",
                                "Invalid email or password",
                                result.get("detail", "No detail"))
                    return False
            except json.JSONDecodeError:
                self.log_test("6. Sign In Non-existent User", False, "Invalid JSON response")
                return False
        else:
            self.log_test("6. Sign In Non-existent User", False,
                        f"Wrong status code: {response.status_code} - {response.text}",
                        "401",
                        str(response.status_code))
            return False
            
    def test_7_change_password_authenticated(self):
        """Test 7: Change Password - Authenticated"""
        if not self.session_token:
            self.log_test("7. Change Password - Authenticated", False, "No session token available")
            return False
            
        data = {
            "currentPassword": TEST_PASSWORD,
            "newPassword": "newpass456"
        }
        
        headers = {"Authorization": f"Bearer {self.session_token}"}
        
        response = self.make_request("POST", "/auth/change-password", data, headers)
        if not response:
            self.log_test("7. Change Password - Authenticated", False, "Network request failed")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                if "message" in result and "success" in result["message"].lower():
                    self.log_test("7. Change Password - Authenticated", True,
                                f"Password changed successfully: {result['message']}")
                    return True
                else:
                    self.log_test("7. Change Password - Authenticated", False,
                                "Wrong success message",
                                "Password changed successfully",
                                result.get("message", "No message"))
                    return False
            except json.JSONDecodeError:
                self.log_test("7. Change Password - Authenticated", False, "Invalid JSON response")
                return False
        else:
            self.log_test("7. Change Password - Authenticated", False,
                        f"HTTP {response.status_code}: {response.text}",
                        "200 OK",
                        f"{response.status_code}")
            return False
            
    def test_8_signin_with_new_password(self):
        """Test 8: Sign In With New Password"""
        data = {
            "email": TEST_EMAIL,
            "password": "newpass456"
        }
        
        response = self.make_request("POST", "/auth/email/signin", data)
        if not response:
            self.log_test("8. Sign In With New Password", False, "Network request failed")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                if "user" in result and "session_token" in result:
                    self.session_token = result["session_token"]
                    self.log_test("8. Sign In With New Password", True,
                                f"Successfully signed in with new password. Token: {self.session_token[:20]}...")
                    return True
                else:
                    self.log_test("8. Sign In With New Password", False,
                                "Missing user or session_token in response")
                    return False
            except json.JSONDecodeError:
                self.log_test("8. Sign In With New Password", False, "Invalid JSON response")
                return False
        else:
            self.log_test("8. Sign In With New Password", False,
                        f"HTTP {response.status_code}: {response.text}",
                        "200 OK",
                        f"{response.status_code}")
            return False
            
    def test_9_change_password_wrong_current(self):
        """Test 9: Change Password - Wrong Current Password"""
        if not self.session_token:
            self.log_test("9. Change Password - Wrong Current Password", False, "No session token available")
            return False
            
        data = {
            "currentPassword": "wrongpass",
            "newPassword": "anotherpass"
        }
        
        headers = {"Authorization": f"Bearer {self.session_token}"}
        
        response = self.make_request("POST", "/auth/change-password", data, headers)
        if not response:
            self.log_test("9. Change Password - Wrong Current Password", False, "Network request failed")
            return False
            
        if response.status_code == 401:
            try:
                result = response.json()
                if "detail" in result and "incorrect" in result["detail"].lower():
                    self.log_test("9. Change Password - Wrong Current Password", True,
                                f"Correctly rejected wrong current password: {result['detail']}")
                    return True
                else:
                    self.log_test("9. Change Password - Wrong Current Password", False,
                                "Wrong error message",
                                "Current password is incorrect",
                                result.get("detail", "No detail"))
                    return False
            except json.JSONDecodeError:
                self.log_test("9. Change Password - Wrong Current Password", False, "Invalid JSON response")
                return False
        else:
            self.log_test("9. Change Password - Wrong Current Password", False,
                        f"Wrong status code: {response.status_code} - {response.text}",
                        "401",
                        str(response.status_code))
            return False
            
    def test_10_change_password_unauthenticated(self):
        """Test 10: Change Password - Unauthenticated"""
        data = {
            "currentPassword": "newpass456",
            "newPassword": "anotherpass"
        }
        
        # No Authorization header
        response = self.make_request("POST", "/auth/change-password", data)
        if not response:
            self.log_test("10. Change Password - Unauthenticated", False, "Network request failed")
            return False
            
        if response.status_code == 401:
            try:
                result = response.json()
                if "detail" in result and "not authenticated" in result["detail"].lower():
                    self.log_test("10. Change Password - Unauthenticated", True,
                                f"Correctly rejected unauthenticated request: {result['detail']}")
                    return True
                else:
                    self.log_test("10. Change Password - Unauthenticated", False,
                                "Wrong error message",
                                "Not authenticated",
                                result.get("detail", "No detail"))
                    return False
            except json.JSONDecodeError:
                self.log_test("10. Change Password - Unauthenticated", False, "Invalid JSON response")
                return False
        else:
            self.log_test("10. Change Password - Unauthenticated", False,
                        f"Wrong status code: {response.status_code} - {response.text}",
                        "401",
                        str(response.status_code))
            return False
            
    def test_11_forgot_password_valid_email(self):
        """Test 11: Forgot Password - Valid Email"""
        data = {
            "email": TEST_EMAIL
        }
        
        response = self.make_request("POST", "/auth/forgot-password", data)
        if not response:
            self.log_test("11. Forgot Password - Valid Email", False, "Network request failed")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                if "message" in result and "resetToken" in result and "email" in result:
                    self.reset_token = result["resetToken"]
                    self.log_test("11. Forgot Password - Valid Email", True,
                                f"Reset token generated: {self.reset_token[:20]}... (Note: In production, token should only be sent via email)")
                    return True
                else:
                    self.log_test("11. Forgot Password - Valid Email", False,
                                "Missing required fields in response",
                                "{ message: '...', resetToken: '...', email: '...' }",
                                str(result))
                    return False
            except json.JSONDecodeError:
                self.log_test("11. Forgot Password - Valid Email", False, "Invalid JSON response")
                return False
        else:
            self.log_test("11. Forgot Password - Valid Email", False,
                        f"HTTP {response.status_code}: {response.text}",
                        "200 OK",
                        f"{response.status_code}")
            return False
            
    def test_12_reset_password_valid_token(self):
        """Test 12: Reset Password With Valid Token"""
        if not self.reset_token:
            self.log_test("12. Reset Password With Valid Token", False, "No reset token available")
            return False
            
        data = {
            "email": TEST_EMAIL,
            "resetToken": self.reset_token,
            "newPassword": "resetpass789"
        }
        
        response = self.make_request("POST", "/auth/reset-password", data)
        if not response:
            self.log_test("12. Reset Password With Valid Token", False, "Network request failed")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                if "message" in result and "success" in result["message"].lower():
                    self.log_test("12. Reset Password With Valid Token", True,
                                f"Password reset successfully: {result['message']}")
                    return True
                else:
                    self.log_test("12. Reset Password With Valid Token", False,
                                "Wrong success message",
                                "Password reset successfully",
                                result.get("message", "No message"))
                    return False
            except json.JSONDecodeError:
                self.log_test("12. Reset Password With Valid Token", False, "Invalid JSON response")
                return False
        else:
            self.log_test("12. Reset Password With Valid Token", False,
                        f"HTTP {response.status_code}: {response.text}",
                        "200 OK",
                        f"{response.status_code}")
            return False
            
    def test_13_signin_after_password_reset(self):
        """Test 13: Sign In After Password Reset"""
        data = {
            "email": TEST_EMAIL,
            "password": "resetpass789"
        }
        
        response = self.make_request("POST", "/auth/email/signin", data)
        if not response:
            self.log_test("13. Sign In After Password Reset", False, "Network request failed")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                if "user" in result and "session_token" in result:
                    self.session_token = result["session_token"]
                    self.log_test("13. Sign In After Password Reset", True,
                                f"Successfully signed in after password reset. Token: {self.session_token[:20]}...")
                    return True
                else:
                    self.log_test("13. Sign In After Password Reset", False,
                                "Missing user or session_token in response")
                    return False
            except json.JSONDecodeError:
                self.log_test("13. Sign In After Password Reset", False, "Invalid JSON response")
                return False
        else:
            self.log_test("13. Sign In After Password Reset", False,
                        f"HTTP {response.status_code}: {response.text}",
                        "200 OK",
                        f"{response.status_code}")
            return False
            
    def test_14_reset_password_invalid_token(self):
        """Test 14: Reset Password With Invalid Token"""
        data = {
            "email": TEST_EMAIL,
            "resetToken": "invalid_token",
            "newPassword": "anypass"
        }
        
        response = self.make_request("POST", "/auth/reset-password", data)
        if not response:
            self.log_test("14. Reset Password With Invalid Token", False, "Network request failed")
            return False
            
        if response.status_code == 400:
            try:
                result = response.json()
                if "detail" in result and ("invalid" in result["detail"].lower() or "expired" in result["detail"].lower()):
                    self.log_test("14. Reset Password With Invalid Token", True,
                                f"Correctly rejected invalid token: {result['detail']}")
                    return True
                else:
                    self.log_test("14. Reset Password With Invalid Token", False,
                                "Wrong error message",
                                "Invalid or expired reset token",
                                result.get("detail", "No detail"))
                    return False
            except json.JSONDecodeError:
                self.log_test("14. Reset Password With Invalid Token", False, "Invalid JSON response")
                return False
        else:
            self.log_test("14. Reset Password With Invalid Token", False,
                        f"Wrong status code: {response.status_code} - {response.text}",
                        "400",
                        str(response.status_code))
            return False
            
    def test_15_forgot_password_nonexistent_email(self):
        """Test 15: Forgot Password - Non-existent Email"""
        data = {
            "email": "nonexistent@example.com"
        }
        
        response = self.make_request("POST", "/auth/forgot-password", data)
        if not response:
            self.log_test("15. Forgot Password - Non-existent Email", False, "Network request failed")
            return False
            
        if response.status_code == 200:
            try:
                result = response.json()
                if "message" in result and "if the email exists" in result["message"].lower():
                    self.log_test("15. Forgot Password - Non-existent Email", True,
                                f"Correctly returned generic message for security: {result['message']}")
                    return True
                else:
                    self.log_test("15. Forgot Password - Non-existent Email", False,
                                "Wrong security message",
                                "If the email exists, a reset link will be sent",
                                result.get("message", "No message"))
                    return False
            except json.JSONDecodeError:
                self.log_test("15. Forgot Password - Non-existent Email", False, "Invalid JSON response")
                return False
        else:
            self.log_test("15. Forgot Password - Non-existent Email", False,
                        f"HTTP {response.status_code}: {response.text}",
                        "200 OK",
                        f"{response.status_code}")
            return False
            
    def run_all_tests(self):
        """Run all authentication tests in sequence"""
        print("=" * 80)
        print("WinWai Raffle Rewards - Email/Password Authentication Testing")
        print("=" * 80)
        print(f"Base URL: {BASE_URL}")
        print(f"Test Email: {TEST_EMAIL}")
        print(f"Started at: {datetime.now().isoformat()}")
        print("=" * 80)
        print()
        
        # Clean up test data first
        print("Cleaning up test data...")
        self.cleanup_test_data()
        print()
        
        # Run tests in sequence
        tests = [
            self.test_1_signup_new_user,
            self.test_2_signup_duplicate_email,
            self.test_3_signup_weak_password,
            self.test_4_signin_correct_credentials,
            self.test_5_signin_wrong_password,
            self.test_6_signin_nonexistent_user,
            self.test_7_change_password_authenticated,
            self.test_8_signin_with_new_password,
            self.test_9_change_password_wrong_current,
            self.test_10_change_password_unauthenticated,
            self.test_11_forgot_password_valid_email,
            self.test_12_reset_password_valid_token,
            self.test_13_signin_after_password_reset,
            self.test_14_reset_password_invalid_token,
            self.test_15_forgot_password_nonexistent_email
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL: {test.__name__} - Exception: {str(e)}")
                failed += 1
                
        # Summary
        print("=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {len(tests)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/len(tests)*100):.1f}%")
        print()
        
        if failed > 0:
            print("FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"- {result['test']}: {result['details']}")
        else:
            print("🎉 ALL TESTS PASSED!")
            
        print("=" * 80)
        
        return failed == 0

if __name__ == "__main__":
    tester = AuthTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)