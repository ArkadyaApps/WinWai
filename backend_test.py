#!/usr/bin/env python3
"""
Backend API Testing for WinWai Raffle App
Tests admin functionality and profile update endpoints
"""

import requests
import json
import sys
from datetime import datetime, timezone, timedelta

# Configuration
BASE_URL = "https://winwai-raffle.preview.emergentagent.com/api"
ADMIN_EMAIL = "artteabnc@gmail.com"
ADMIN_PASSWORD = "winwanadmin"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response"] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if not success and response_data:
            print(f"   Response: {response_data}")
    
    def authenticate_admin(self):
        """Authenticate as admin user using session-based auth"""
        print("\n🔐 Authenticating as admin user...")
        
        try:
            # Create a session directly in the database for testing
            # This simulates what would happen after OAuth authentication
            import uuid
            from datetime import datetime, timezone, timedelta
            
            # Generate a test session token
            session_token = str(uuid.uuid4())
            admin_user_id = "a64eddc5-dff5-4227-8a09-2e74fdd6a9da"  # From database query
            expires_at = datetime.now(timezone.utc) + timedelta(days=1)
            
            # Insert session directly into MongoDB for testing
            import pymongo
            from pymongo import MongoClient
            
            client = MongoClient("mongodb://localhost:27017")
            db = client["test_database"]
            
            # Insert test session
            session_doc = {
                "userId": admin_user_id,
                "sessionToken": session_token,
                "expiresAt": expires_at,
                "createdAt": datetime.now(timezone.utc)
            }
            
            db.user_sessions.insert_one(session_doc)
            
            # Set the authorization header
            self.admin_token = session_token
            self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
            
            # Test if authentication works
            response = self.session.get(f"{BASE_URL}/auth/me")
            
            if response.status_code == 200:
                user_data = response.json()
                if user_data.get("role") == "admin":
                    self.log_test("Admin Authentication", True, f"Successfully authenticated as admin: {user_data.get('name')}")
                    return True
                else:
                    self.log_test("Admin Authentication", False, f"User is not admin: {user_data.get('role')}")
                    return False
            else:
                self.log_test("Admin Authentication", False, f"Auth verification failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Authentication", False, f"Authentication error: {str(e)}")
            return False
    
    def test_profile_update(self):
        """Test profile update endpoint"""
        print("\n👤 Testing Profile Update Endpoint...")
        
        # Test data
        profile_data = {
            "name": "Updated Test User",
            "email": "updated.test@example.com", 
            "phone": "+66987654321"
        }
        
        try:
            response = self.session.put(f"{BASE_URL}/users/me/profile", json=profile_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("name") == profile_data["name"]:
                    self.log_test("Profile Update", True, "Profile updated successfully", data)
                else:
                    self.log_test("Profile Update", False, "Profile data not updated correctly", data)
            elif response.status_code == 401:
                self.log_test("Profile Update", False, "Authentication required", response.text)
            else:
                self.log_test("Profile Update", False, f"Unexpected status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Profile Update", False, f"Request error: {str(e)}")
    
    def test_admin_partners(self):
        """Test admin partner management endpoints"""
        print("\n🤝 Testing Admin Partner Management...")
        
        # Test GET partners
        try:
            response = self.session.get(f"{BASE_URL}/admin/partners")
            
            if response.status_code == 200:
                partners = response.json()
                self.log_test("Get Partners", True, f"Retrieved {len(partners)} partners", {"count": len(partners)})
            elif response.status_code == 403:
                self.log_test("Get Partners", False, "Admin access denied", response.text)
                return  # Skip other partner tests if no admin access
            else:
                self.log_test("Get Partners", False, f"Unexpected status: {response.status_code}", response.text)
                return
                
        except Exception as e:
            self.log_test("Get Partners", False, f"Request error: {str(e)}")
            return
        
        # Test POST partner (create)
        partner_data = {
            "name": "Test Partner Restaurant",
            "description": "A test restaurant for API testing",
            "category": "food",
            "sponsored": False
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/admin/partners", json=partner_data)
            
            if response.status_code in [200, 201]:
                created_partner = response.json()
                partner_id = created_partner.get("id")
                self.log_test("Create Partner", True, f"Partner created with ID: {partner_id}", created_partner)
                
                # Test PUT partner (update)
                if partner_id:
                    update_data = partner_data.copy()
                    update_data["name"] = "Updated Test Partner Restaurant"
                    update_data["id"] = partner_id
                    
                    response = self.session.put(f"{BASE_URL}/admin/partners/{partner_id}", json=update_data)
                    
                    if response.status_code == 200:
                        updated_partner = response.json()
                        self.log_test("Update Partner", True, "Partner updated successfully", updated_partner)
                    else:
                        self.log_test("Update Partner", False, f"Update failed: {response.status_code}", response.text)
                    
                    # Test DELETE partner
                    response = self.session.delete(f"{BASE_URL}/admin/partners/{partner_id}")
                    
                    if response.status_code == 200:
                        self.log_test("Delete Partner", True, "Partner deleted successfully", response.json())
                    else:
                        self.log_test("Delete Partner", False, f"Delete failed: {response.status_code}", response.text)
                        
            else:
                self.log_test("Create Partner", False, f"Create failed: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Create Partner", False, f"Request error: {str(e)}")
    
    def test_admin_users(self):
        """Test admin user management endpoints"""
        print("\n👥 Testing Admin User Management...")
        
        # Test GET users
        try:
            response = self.session.get(f"{BASE_URL}/admin/users")
            
            if response.status_code == 200:
                users = response.json()
                self.log_test("Get Users", True, f"Retrieved {len(users)} users", {"count": len(users)})
                
                # Find a test user to update (not the admin)
                test_user = None
                admin_user_id = None
                
                for user in users:
                    if user.get("email") == ADMIN_EMAIL:
                        admin_user_id = user.get("id")
                    elif user.get("role") != "admin":
                        test_user = user
                        break
                
                # Test PUT user (update)
                if test_user:
                    user_id = test_user.get("id")
                    update_data = {"tickets": 500}
                    
                    response = self.session.put(f"{BASE_URL}/admin/users/{user_id}", json=update_data)
                    
                    if response.status_code == 200:
                        updated_user = response.json()
                        if updated_user.get("tickets") == 500:
                            self.log_test("Update User", True, f"User tickets updated to 500", updated_user)
                        else:
                            self.log_test("Update User", False, "User tickets not updated correctly", updated_user)
                    else:
                        self.log_test("Update User", False, f"Update failed: {response.status_code}", response.text)
                else:
                    self.log_test("Update User", False, "No non-admin user found to test update")
                
                # Test DELETE user protection (trying to delete self)
                if admin_user_id:
                    response = self.session.delete(f"{BASE_URL}/admin/users/{admin_user_id}")
                    
                    if response.status_code == 400:
                        self.log_test("Delete Self Protection", True, "Correctly prevented admin from deleting self", response.json())
                    else:
                        self.log_test("Delete Self Protection", False, f"Should prevent self-deletion: {response.status_code}", response.text)
                        
            elif response.status_code == 403:
                self.log_test("Get Users", False, "Admin access denied", response.text)
            else:
                self.log_test("Get Users", False, f"Unexpected status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Get Users", False, f"Request error: {str(e)}")
    
    def test_admin_raffles(self):
        """Test admin raffle management endpoints"""
        print("\n🎟️ Testing Admin Raffle Management...")
        
        # Test GET raffles
        try:
            response = self.session.get(f"{BASE_URL}/admin/raffles")
            
            if response.status_code == 200:
                raffles = response.json()
                self.log_test("Get Raffles", True, f"Retrieved {len(raffles)} raffles", {"count": len(raffles)})
                
                # Test PUT raffle (update) if we have raffles
                if raffles:
                    test_raffle = raffles[0]
                    raffle_id = test_raffle.get("id")
                    
                    # Update raffle data
                    update_data = test_raffle.copy()
                    update_data["description"] = "Updated test description"
                    
                    response = self.session.put(f"{BASE_URL}/admin/raffles/{raffle_id}", json=update_data)
                    
                    if response.status_code == 200:
                        updated_raffle = response.json()
                        self.log_test("Update Raffle", True, "Raffle updated successfully", updated_raffle)
                    else:
                        self.log_test("Update Raffle", False, f"Update failed: {response.status_code}", response.text)
                else:
                    self.log_test("Update Raffle", False, "No raffles available to test update")
                    
            elif response.status_code == 403:
                self.log_test("Get Raffles", False, "Admin access denied", response.text)
            else:
                self.log_test("Get Raffles", False, f"Unexpected status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Get Raffles", False, f"Request error: {str(e)}")
    
    def test_non_admin_access(self):
        """Test that non-admin users get 403 errors"""
        print("\n🚫 Testing Non-Admin Access Restrictions...")
        
        # Remove admin token to simulate non-admin user
        original_headers = self.session.headers.copy()
        if "Authorization" in self.session.headers:
            del self.session.headers["Authorization"]
        
        # Test admin endpoints should return 401/403
        endpoints_to_test = [
            "/admin/partners",
            "/admin/users", 
            "/admin/raffles"
        ]
        
        for endpoint in endpoints_to_test:
            try:
                response = self.session.get(f"{BASE_URL}{endpoint}")
                
                if response.status_code in [401, 403]:
                    self.log_test(f"Non-Admin Access {endpoint}", True, f"Correctly denied access: {response.status_code}")
                else:
                    self.log_test(f"Non-Admin Access {endpoint}", False, f"Should deny access: {response.status_code}", response.text)
                    
            except Exception as e:
                self.log_test(f"Non-Admin Access {endpoint}", False, f"Request error: {str(e)}")
        
        # Restore admin headers
        self.session.headers.update(original_headers)
    
    def test_edge_cases(self):
        """Test edge cases and error handling"""
        print("\n⚠️ Testing Edge Cases...")
        
        # Test invalid partner ID
        try:
            response = self.session.get(f"{BASE_URL}/admin/partners/invalid-id")
            
            if response.status_code == 404:
                self.log_test("Invalid Partner ID", True, "Correctly returned 404 for invalid ID")
            else:
                self.log_test("Invalid Partner ID", False, f"Expected 404, got: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Invalid Partner ID", False, f"Request error: {str(e)}")
        
        # Test invalid user ID
        try:
            response = self.session.put(f"{BASE_URL}/admin/users/invalid-id", json={"tickets": 100})
            
            if response.status_code == 404:
                self.log_test("Invalid User ID", True, "Correctly returned 404 for invalid user ID")
            else:
                self.log_test("Invalid User ID", False, f"Expected 404, got: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Invalid User ID", False, f"Request error: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting WinWai Raffle Backend API Tests")
        print(f"🌐 Testing against: {BASE_URL}")
        print("=" * 60)
        
        # Authenticate first
        if not self.authenticate_admin():
            print("❌ Authentication failed - skipping admin tests")
            return False
        
        # Run all tests
        self.test_profile_update()
        self.test_admin_partners()
        self.test_admin_users()
        self.test_admin_raffles()
        self.test_non_admin_access()
        self.test_edge_cases()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open("/app/test_results_detailed.json", "w") as f:
        json.dump(tester.test_results, f, indent=2, default=str)
    
    print(f"\n📄 Detailed results saved to: /app/test_results_detailed.json")
    
    sys.exit(0 if success else 1)