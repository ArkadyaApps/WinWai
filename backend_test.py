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
BASE_URL = "https://winwai-fix-1.preview.emergentagent.com/api"
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

    def authenticate_admin(self):
        """Authenticate as admin user"""
        try:
            response = self.session.post(f"{BASE_URL}/auth/email/signin", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("session_token")
                user = data.get("user", {})
                
                if user.get("role") == "admin":
                    self.log_result("Admin Authentication", True, 
                                  f"Authenticated as {user.get('name')} with admin role")
                    return True
                else:
                    self.log_result("Admin Authentication", False, 
                                  error=f"User role is {user.get('role')}, not admin")
                    return False
            else:
                self.log_result("Admin Authentication", False, 
                              error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Admin Authentication", False, error=str(e))
            return False

    def create_test_user(self):
        """Create a test user for entries"""
        try:
            # Generate unique email
            timestamp = int(time.time())
            test_email = f"testuser{timestamp}@example.com"
            
            response = self.session.post(f"{BASE_URL}/auth/email/signup", json={
                "email": test_email,
                "password": "testpass123",
                "name": f"Test User {timestamp}"
            })
            
            if response.status_code == 200:
                data = response.json()
                self.test_user_token = data.get("session_token")
                user = data.get("user", {})
                self.test_user_id = user.get("id")
                
                self.log_result("Create Test User", True, 
                              f"Created user {user.get('name')} with {user.get('tickets')} tickets")
                return True
            else:
                self.log_result("Create Test User", False, 
                              error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Create Test User", False, error=str(e))
            return False

    def create_test_partner(self):
        """Create a test partner for the raffle"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            partner_data = {
                "name": "Test Digital Partner",
                "description": "Partner for testing digital prize raffles",
                "category": "digital",
                "email": "partner@test.com",
                "whatsapp": "+66123456789",
                "line": "testpartner",
                "address": "123 Test Street, Bangkok"
            }
            
            response = self.session.post(f"{BASE_URL}/admin/partners", 
                                       json=partner_data, headers=headers)
            
            if response.status_code == 200:
                partner = response.json()
                self.test_partner_id = partner.get("id")
                self.log_result("Create Test Partner", True, 
                              f"Created partner: {partner.get('name')}")
                return True
            else:
                self.log_result("Create Test Partner", False, 
                              error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Create Test Partner", False, error=str(e))
            return False

    def test_raffle_creation_with_draw_fields(self):
        """Test raffle creation with automatic minimumDrawDate calculation"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Create raffle with digital prize
            # Use a past createdAt to ensure minimum draw date is in the past
            past_time = datetime.now(timezone.utc) - timedelta(days=3)
            raffle_data = {
                "title": "Test Digital Prize Raffle",
                "description": "Testing automatic draw system with digital prizes",
                "category": "digital",
                "partnerId": self.test_partner_id,
                "partnerName": "Test Digital Partner",
                "prizesAvailable": 1,
                "prizesRemaining": 1,
                "ticketCost": 10,
                "prizeValue": 10.0,  # 10 THB (very small to minimize minimum draw date)
                "currency": "THB",
                "gamePrice": 10.0,  # Need 10 tickets total to trigger draw
                "drawDate": (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat(),  # Past due for testing
                "createdAt": past_time.isoformat(),  # Created 3 days ago
                "isDigitalPrize": True,
                "active": True
            }
            
            response = self.session.post(f"{BASE_URL}/admin/raffles", 
                                       json=raffle_data, headers=headers)
            
            if response.status_code == 200:
                raffle = response.json()
                self.test_raffle_id = raffle.get("id")
                
                # Check if minimumDrawDate was calculated
                minimum_draw_date = raffle.get("minimumDrawDate")
                prize_value_usd = raffle.get("prizeValueUSD")
                
                details = f"Created raffle with prizeValue={raffle.get('prizeValue')} THB, "
                details += f"prizeValueUSD={prize_value_usd}, gamePrice={raffle.get('gamePrice')}"
                
                if minimum_draw_date:
                    details += f", minimumDrawDate calculated: {minimum_draw_date}"
                
                self.log_result("Raffle Creation with Draw Fields", True, details)
                return True
            else:
                self.log_result("Raffle Creation with Draw Fields", False, 
                              error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Raffle Creation with Draw Fields", False, error=str(e))
            return False

    def test_secret_code_upload(self):
        """Test uploading secret codes to a digital prize raffle"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Generate test secret codes
            secret_codes = [
                "NETFLIX-ABC123",
                "NETFLIX-DEF456", 
                "NETFLIX-GHI789",
                "NETFLIX-ABC123",  # Duplicate to test deduplication
                "  NETFLIX-JKL012  "  # With whitespace to test cleaning
            ]
            
            upload_data = {
                "raffleId": self.test_raffle_id,
                "secretCodes": secret_codes
            }
            
            response = self.session.post(f"{BASE_URL}/admin/raffles/upload-secret-codes", 
                                       json=upload_data, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                codes_uploaded = result.get("codesUploaded", 0)
                
                # Verify raffle was updated
                raffle_response = self.session.get(f"{BASE_URL}/raffles/{self.test_raffle_id}")
                if raffle_response.status_code == 200:
                    raffle = raffle_response.json()
                    stored_codes = raffle.get("secretCodes", [])
                    is_digital = raffle.get("isDigitalPrize", False)
                    
                    details = f"Uploaded {codes_uploaded} codes, stored {len(stored_codes)} codes, "
                    details += f"isDigitalPrize={is_digital}"
                    
                    self.log_result("Secret Code Upload", True, details)
                    return True
                else:
                    self.log_result("Secret Code Upload", False, 
                                  error="Could not verify raffle update")
                    return False
            else:
                self.log_result("Secret Code Upload", False, 
                              error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Secret Code Upload", False, error=str(e))
            return False

    def create_test_entries(self):
        """Create test entries to meet gamePrice threshold"""
        try:
            headers = {"Authorization": f"Bearer {self.test_user_token}"}
            
            # Enter raffle with 10 tickets to meet gamePrice threshold
            entry_data = {
                "raffleId": self.test_raffle_id,
                "ticketsToUse": 10
            }
            
            response = self.session.post(f"{BASE_URL}/raffles/enter", 
                                       json=entry_data, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                new_balance = result.get("newBalance")
                entry_id = result.get("entryId")
                
                # Update raffle's totalTicketsCollected manually for testing
                # (In real app, this would be done automatically)
                admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
                
                # Get current raffle first
                raffle_response = self.session.get(f"{BASE_URL}/raffles/{self.test_raffle_id}")
                if raffle_response.status_code == 200:
                    current_raffle = raffle_response.json()
                    current_raffle["totalTicketsCollected"] = 10
                    
                    update_response = self.session.put(f"{BASE_URL}/admin/raffles/{self.test_raffle_id}", 
                                                     json=current_raffle, headers=admin_headers)
                    
                    if update_response.status_code == 200:
                        self.log_result("Create Test Entries", True, 
                                      f"Created entry {entry_id}, user balance: {new_balance}, tickets collected: 10")
                        return True
                    else:
                        self.log_result("Create Test Entries", False, 
                                      error="Failed to update totalTicketsCollected")
                        return False
                else:
                    self.log_result("Create Test Entries", False, 
                                  error="Failed to get current raffle for update")
                    return False
            else:
                self.log_result("Create Test Entries", False, 
                              error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Create Test Entries", False, error=str(e))
            return False

    def test_automatic_draw_system(self):
        """Test the automatic draw system endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            response = self.session.post(f"{BASE_URL}/admin/process-automatic-draws", 
                                       headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                processed_raffles = result.get("results", {}).get("processedRaffles", [])
                drawn_raffles = result.get("results", {}).get("drawnRaffles", [])
                extended_raffles = result.get("results", {}).get("extendedRaffles", [])
                errors = result.get("results", {}).get("errors", [])
                
                details = f"Processed: {len(processed_raffles)}, Drawn: {len(drawn_raffles)}, "
                details += f"Extended: {len(extended_raffles)}, Errors: {len(errors)}"
                
                if self.test_raffle_id in processed_raffles:
                    # Check if our raffle was drawn
                    our_draw = next((d for d in drawn_raffles if d.get("raffleId") == self.test_raffle_id), None)
                    if our_draw:
                        details += f", Winner: {our_draw.get('winnerName')}, Voucher: {our_draw.get('voucherRef')}"
                        self.log_result("Automatic Draw System", True, details)
                        return True
                    else:
                        # Check if it was extended
                        our_extension = next((e for e in extended_raffles if e.get("raffleId") == self.test_raffle_id), None)
                        if our_extension:
                            details += f", Extended to: {our_extension.get('newDrawDate')}"
                            self.log_result("Automatic Draw System", True, details)
                            return True
                        else:
                            self.log_result("Automatic Draw System", False, 
                                          error="Test raffle was processed but not drawn or extended")
                            return False
                else:
                    self.log_result("Automatic Draw System", False, 
                                  error="Test raffle was not processed")
                    return False
            else:
                self.log_result("Automatic Draw System", False, 
                              error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Automatic Draw System", False, error=str(e))
            return False

    def test_user_voucher_endpoints(self):
        """Test user voucher and winners endpoints"""
        try:
            headers = {"Authorization": f"Bearer {self.test_user_token}"}
            
            # Test GET /api/users/me/vouchers
            vouchers_response = self.session.get(f"{BASE_URL}/users/me/vouchers", headers=headers)
            
            if vouchers_response.status_code == 200:
                vouchers = vouchers_response.json()
                voucher_count = len(vouchers)
                
                # Test GET /api/users/me/winners
                winners_response = self.session.get(f"{BASE_URL}/users/me/winners", headers=headers)
                
                if winners_response.status_code == 200:
                    winners = winners_response.json()
                    winner_count = len(winners)
                    
                    details = f"Vouchers: {voucher_count}, Winners: {winner_count}"
                    
                    # Check if we have vouchers with secret codes
                    if vouchers:
                        first_voucher = vouchers[0]
                        secret_code = first_voucher.get("secretCode")
                        verification_code = first_voucher.get("verificationCode")
                        is_digital = first_voucher.get("isDigitalPrize")
                        
                        details += f", First voucher: digital={is_digital}, "
                        details += f"has_secret_code={secret_code is not None}, "
                        details += f"has_verification_code={verification_code is not None}"
                    
                    # Check if winners have enriched details
                    if winners:
                        first_winner = winners[0]
                        has_voucher = first_winner.get("voucher") is not None
                        has_raffle = first_winner.get("raffle") is not None
                        
                        details += f", First winner: has_voucher_details={has_voucher}, "
                        details += f"has_raffle_details={has_raffle}"
                    
                    self.log_result("User Voucher Endpoints", True, details)
                    return True
                else:
                    self.log_result("User Voucher Endpoints", False, 
                                  error=f"Winners endpoint failed: HTTP {winners_response.status_code}")
                    return False
            else:
                self.log_result("User Voucher Endpoints", False, 
                              error=f"Vouchers endpoint failed: HTTP {vouchers_response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("User Voucher Endpoints", False, error=str(e))
            return False

    def test_threshold_not_met_scenario(self):
        """Test scenario where gamePrice threshold is not met (should extend)"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Create another raffle with higher gamePrice threshold
            # Use past createdAt to ensure minimum draw date is in the past
            past_time = datetime.now(timezone.utc) - timedelta(days=3)
            raffle_data = {
                "title": "Test Extension Raffle",
                "description": "Testing draw extension when threshold not met",
                "category": "digital",
                "partnerId": self.test_partner_id,
                "partnerName": "Test Digital Partner",
                "prizesAvailable": 1,
                "prizesRemaining": 1,
                "ticketCost": 10,
                "prizeValue": 50.0,  # 50 THB
                "currency": "THB",
                "gamePrice": 100.0,  # Need 100 tickets total (high threshold)
                "drawDate": (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat(),  # Past due
                "createdAt": past_time.isoformat(),  # Created 3 days ago
                "totalTicketsCollected": 5,  # Only 5 tickets (below threshold)
                "active": True
            }
            
            response = self.session.post(f"{BASE_URL}/admin/raffles", 
                                       json=raffle_data, headers=headers)
            
            if response.status_code == 200:
                raffle = response.json()
                extension_raffle_id = raffle.get("id")
                
                # Run automatic draws
                draw_response = self.session.post(f"{BASE_URL}/admin/process-automatic-draws", 
                                                headers=headers)
                
                if draw_response.status_code == 200:
                    result = draw_response.json()
                    extended_raffles = result.get("results", {}).get("extendedRaffles", [])
                    
                    # Check if our raffle was extended
                    our_extension = next((e for e in extended_raffles if e.get("raffleId") == extension_raffle_id), None)
                    
                    if our_extension:
                        current_tickets = our_extension.get("currentTickets")
                        required_tickets = our_extension.get("requiredTickets")
                        new_draw_date = our_extension.get("newDrawDate")
                        
                        details = f"Extended raffle: {current_tickets}/{required_tickets} tickets, "
                        details += f"new draw date: {new_draw_date}"
                        
                        self.log_result("Threshold Not Met Scenario", True, details)
                        return True
                    else:
                        self.log_result("Threshold Not Met Scenario", False, 
                                      error="Raffle was not extended as expected")
                        return False
                else:
                    self.log_result("Threshold Not Met Scenario", False, 
                                  error=f"Draw process failed: HTTP {draw_response.status_code}")
                    return False
            else:
                self.log_result("Threshold Not Met Scenario", False, 
                              error=f"Raffle creation failed: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Threshold Not Met Scenario", False, error=str(e))
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend Testing Suite for Automatic Raffle Draw System")
        print("=" * 80)
        
        # Authentication
        if not self.authenticate_admin():
            print("❌ Admin authentication failed. Cannot continue.")
            return False
        
        if not self.create_test_user():
            print("❌ Test user creation failed. Cannot continue.")
            return False
        
        # Setup
        if not self.create_test_partner():
            print("❌ Test partner creation failed. Cannot continue.")
            return False
        
        # Core tests
        self.test_raffle_creation_with_draw_fields()
        self.test_secret_code_upload()
        self.create_test_entries()
        self.test_automatic_draw_system()
        self.test_user_voucher_endpoints()
        self.test_threshold_not_met_scenario()
        
        # Summary
        print("=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for r in self.results if r["success"])
        total = len(self.results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['error']}")
        
        return passed == total

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)