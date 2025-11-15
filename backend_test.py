#!/usr/bin/env python3
"""
Backend Testing Suite for WinWai Raffle Rewards App
Testing automatic raffle draw and voucher generation system
"""

import requests
import json
import time
from datetime import datetime, timedelta, timezone
import random
import string

# Configuration
BASE_URL = "https://lucky-draw-82.preview.emergentagent.com/api"
ADMIN_EMAIL = "artteabnc@gmail.com"
ADMIN_PASSWORD = "winwanadmin"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_user_token = None
        self.test_raffle_id = None
        self.test_partner_id = None
        self.test_user_id = None
        self.results = []
        
    def log_result(self, test_name, success, details="", error=""):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
        print()
        
    def authenticate_admin(self) -> bool:
        """Authenticate as admin user"""
        try:
            response = requests.post(f"{BACKEND_URL}/auth/email/signin", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.session_token = data.get("session_token")
                user = data.get("user", {})
                if user.get("role") == "admin":
                    self.log_test("Admin Authentication", True, f"Authenticated as {user.get('name', 'Admin')}")
                    return True
                else:
                    self.log_test("Admin Authentication", False, f"User role is {user.get('role')}, not admin")
                    return False
            else:
                self.log_test("Admin Authentication", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Authentication", False, f"Exception: {str(e)}")
            return False
    
    def get_headers(self) -> Dict[str, str]:
        """Get headers with authentication"""
        return {
            "Authorization": f"Bearer {self.session_token}",
            "Content-Type": "application/json"
        }
    
    def get_partners(self) -> Optional[list]:
        """Get list of partners for raffle creation"""
        try:
            response = requests.get(f"{BACKEND_URL}/admin/partners", headers=self.get_headers())
            if response.status_code == 200:
                partners = response.json()
                if partners:
                    return partners
                else:
                    # Create a test partner if none exist
                    return self.create_test_partner()
            return None
        except Exception as e:
            print(f"Error getting partners: {e}")
            return None
    
    def create_test_partner(self) -> Optional[list]:
        """Create a test partner for raffle testing"""
        try:
            partner_data = {
                "id": "test-partner-001",
                "name": "Test Restaurant Bangkok",
                "description": "Premium dining experience in the heart of Bangkok",
                "category": "food",
                "sponsored": True,
                "email": "contact@testrestaurant.com",
                "whatsapp": "+66123456789",
                "address": "123 Sukhumvit Road, Bangkok 10110",
                "latitude": 13.7563,
                "longitude": 100.5018
            }
            
            response = requests.post(f"{BACKEND_URL}/admin/partners", 
                                   json=partner_data, 
                                   headers=self.get_headers())
            
            if response.status_code == 200:
                return [response.json()]
            return None
        except Exception as e:
            print(f"Error creating test partner: {e}")
            return None
    
    def test_create_raffle_with_prize_fields(self) -> Optional[str]:
        """Test creating a raffle with prizeValue and gamePrice fields"""
        partners = self.get_partners()
        if not partners:
            self.log_test("Create Raffle with Prize Fields", False, "No partners available")
            return None
            
        partner = partners[0]
        
        # Create raffle with prizeValue and gamePrice
        raffle_data = {
            "id": f"test-raffle-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "title": "Premium Dining Experience - Prize Value Test",
            "description": "Win a luxurious 5-course tasting menu for two at our award-winning restaurant",
            "image": "https://example.com/dining-experience.jpg",
            "category": "food",
            "partnerId": partner["id"],
            "partnerName": partner["name"],
            "location": "bangkok",
            "address": "123 Sukhumvit Road, Bangkok",
            "prizesAvailable": 5,
            "prizesRemaining": 5,
            "ticketCost": 25,
            "prizeValue": 5000.0,  # 5000 THB prize value
            "gamePrice": 100.0,    # 100 THB per ticket
            "drawDate": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "validityMonths": 6,
            "active": True,
            "totalEntries": 0
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/admin/raffles", 
                                   json=raffle_data, 
                                   headers=self.get_headers())
            
            if response.status_code == 200:
                created_raffle = response.json()
                # Verify prizeValue and gamePrice are saved
                if (created_raffle.get("prizeValue") == 5000.0 and 
                    created_raffle.get("gamePrice") == 100.0):
                    self.log_test("Create Raffle with Prize Fields", True, 
                                f"Raffle created with prizeValue: {created_raffle.get('prizeValue')} THB, gamePrice: {created_raffle.get('gamePrice')} THB")
                    return created_raffle["id"]
                else:
                    self.log_test("Create Raffle with Prize Fields", False, 
                                f"Prize fields not saved correctly. prizeValue: {created_raffle.get('prizeValue')}, gamePrice: {created_raffle.get('gamePrice')}")
                    return None
            else:
                self.log_test("Create Raffle with Prize Fields", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("Create Raffle with Prize Fields", False, f"Exception: {str(e)}")
            return None
    
    def test_get_raffle_details(self, raffle_id: str) -> bool:
        """Test retrieving raffle details to verify prizeValue and gamePrice"""
        try:
            response = requests.get(f"{BACKEND_URL}/admin/raffles", headers=self.get_headers())
            
            if response.status_code == 200:
                raffles = response.json()
                # Find our test raffle
                test_raffle = None
                for raffle in raffles:
                    if raffle["id"] == raffle_id:
                        test_raffle = raffle
                        break
                
                if test_raffle:
                    prize_value = test_raffle.get("prizeValue")
                    game_price = test_raffle.get("gamePrice")
                    
                    if prize_value == 5000.0 and game_price == 100.0:
                        self.log_test("Get Raffle Details", True, 
                                    f"Retrieved raffle with correct prizeValue: {prize_value} THB, gamePrice: {game_price} THB")
                        return True
                    else:
                        self.log_test("Get Raffle Details", False, 
                                    f"Incorrect prize fields. prizeValue: {prize_value}, gamePrice: {game_price}")
                        return False
                else:
                    self.log_test("Get Raffle Details", False, "Test raffle not found in list")
                    return False
            else:
                self.log_test("Get Raffle Details", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Raffle Details", False, f"Exception: {str(e)}")
            return False
    
    def test_update_raffle_prize_fields(self, raffle_id: str) -> bool:
        """Test updating raffle prizeValue and gamePrice"""
        try:
            # First get the current raffle
            response = requests.get(f"{BACKEND_URL}/admin/raffles", headers=self.get_headers())
            if response.status_code != 200:
                self.log_test("Update Raffle Prize Fields", False, "Could not fetch current raffle")
                return False
            
            raffles = response.json()
            current_raffle = None
            for raffle in raffles:
                if raffle["id"] == raffle_id:
                    current_raffle = raffle
                    break
            
            if not current_raffle:
                self.log_test("Update Raffle Prize Fields", False, "Raffle not found for update")
                return False
            
            # Update prizeValue and gamePrice
            current_raffle["prizeValue"] = 7500.0  # Updated to 7500 THB
            current_raffle["gamePrice"] = 150.0    # Updated to 150 THB
            current_raffle["description"] = "Updated: Win a luxurious 7-course tasting menu for two"
            
            response = requests.put(f"{BACKEND_URL}/admin/raffles/{raffle_id}", 
                                  json=current_raffle, 
                                  headers=self.get_headers())
            
            if response.status_code == 200:
                updated_raffle = response.json()
                if (updated_raffle.get("prizeValue") == 7500.0 and 
                    updated_raffle.get("gamePrice") == 150.0):
                    self.log_test("Update Raffle Prize Fields", True, 
                                f"Updated prizeValue: {updated_raffle.get('prizeValue')} THB, gamePrice: {updated_raffle.get('gamePrice')} THB")
                    return True
                else:
                    self.log_test("Update Raffle Prize Fields", False, 
                                f"Update failed. prizeValue: {updated_raffle.get('prizeValue')}, gamePrice: {updated_raffle.get('gamePrice')}")
                    return False
            else:
                self.log_test("Update Raffle Prize Fields", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Update Raffle Prize Fields", False, f"Exception: {str(e)}")
            return False
    
    def test_create_raffle_with_zero_values(self) -> bool:
        """Test creating raffle with prizeValue=0 and gamePrice=0 (defaults)"""
        partners = self.get_partners()
        if not partners:
            self.log_test("Create Raffle with Zero Values", False, "No partners available")
            return False
            
        partner = partners[0]
        
        raffle_data = {
            "id": f"test-raffle-zero-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "title": "Free Entry Raffle - Zero Values Test",
            "description": "Test raffle with zero prize value and game price",
            "category": "food",
            "partnerId": partner["id"],
            "partnerName": partner["name"],
            "prizesAvailable": 1,
            "prizesRemaining": 1,
            "ticketCost": 10,
            "prizeValue": 0.0,  # Default value
            "gamePrice": 0.0,   # Default value
            "drawDate": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
            "active": True,
            "totalEntries": 0
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/admin/raffles", 
                                   json=raffle_data, 
                                   headers=self.get_headers())
            
            if response.status_code == 200:
                created_raffle = response.json()
                if (created_raffle.get("prizeValue") == 0.0 and 
                    created_raffle.get("gamePrice") == 0.0):
                    self.log_test("Create Raffle with Zero Values", True, 
                                "Successfully created raffle with zero prizeValue and gamePrice")
                    return True
                else:
                    self.log_test("Create Raffle with Zero Values", False, 
                                f"Unexpected values. prizeValue: {created_raffle.get('prizeValue')}, gamePrice: {created_raffle.get('gamePrice')}")
                    return False
            else:
                self.log_test("Create Raffle with Zero Values", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Raffle with Zero Values", False, f"Exception: {str(e)}")
            return False
    
    def test_create_raffle_with_negative_values(self) -> bool:
        """Test creating raffle with negative prizeValue and gamePrice (should be rejected if validation exists)"""
        partners = self.get_partners()
        if not partners:
            self.log_test("Create Raffle with Negative Values", False, "No partners available")
            return False
            
        partner = partners[0]
        
        raffle_data = {
            "id": f"test-raffle-negative-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "title": "Negative Values Test Raffle",
            "description": "Test raffle with negative prize values",
            "category": "food",
            "partnerId": partner["id"],
            "partnerName": partner["name"],
            "prizesAvailable": 1,
            "prizesRemaining": 1,
            "ticketCost": 10,
            "prizeValue": -100.0,  # Negative value
            "gamePrice": -50.0,    # Negative value
            "drawDate": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
            "active": True,
            "totalEntries": 0
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/admin/raffles", 
                                   json=raffle_data, 
                                   headers=self.get_headers())
            
            # Check if validation exists (should reject negative values)
            if response.status_code == 422 or response.status_code == 400:
                self.log_test("Create Raffle with Negative Values", True, 
                            f"Correctly rejected negative values with HTTP {response.status_code}")
                return True
            elif response.status_code == 200:
                # If no validation, check if negative values were saved
                created_raffle = response.json()
                prize_value = created_raffle.get("prizeValue")
                game_price = created_raffle.get("gamePrice")
                
                if prize_value == -100.0 and game_price == -50.0:
                    self.log_test("Create Raffle with Negative Values", True, 
                                "No validation exists - negative values accepted (may need validation)")
                    return True
                else:
                    self.log_test("Create Raffle with Negative Values", False, 
                                f"Unexpected behavior. prizeValue: {prize_value}, gamePrice: {game_price}")
                    return False
            else:
                self.log_test("Create Raffle with Negative Values", False, 
                            f"Unexpected HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Raffle with Negative Values", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all raffle prize field tests"""
        print("🧪 Starting Backend Tests for Raffle prizeValue and gamePrice fields")
        print("=" * 70)
        
        # Authenticate
        if not self.authenticate_admin():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return
        
        # Test 1: Create raffle with prizeValue and gamePrice
        raffle_id = self.test_create_raffle_with_prize_fields()
        
        if raffle_id:
            # Test 2: Get raffle details to verify fields are saved
            self.test_get_raffle_details(raffle_id)
            
            # Test 3: Update raffle prizeValue and gamePrice
            self.test_update_raffle_prize_fields(raffle_id)
        
        # Test 4: Create raffle with zero values (defaults)
        self.test_create_raffle_with_zero_values()
        
        # Test 5: Test negative values (edge case)
        self.test_create_raffle_with_negative_values()
        
        # Summary
        print("\n" + "=" * 70)
        print("🏁 TEST SUMMARY")
        print("=" * 70)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED! Raffle prizeValue and gamePrice fields are working correctly.")
        else:
            print(f"\n⚠️  {total - passed} test(s) failed. Please review the issues above.")
        
        return passed == total

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)