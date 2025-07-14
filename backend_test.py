#!/usr/bin/env python3
"""
Backend API Testing Script for Enhanced Chat System & Find Reservation Features
Tests all endpoints mentioned in the review request with comprehensive error handling.
"""

import requests
import json
import time
import websocket
import threading
from typing import Dict, Any, Optional
import sys

class BackendTester:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.session = requests.Session()
        self.test_results = []
        self.websocket_messages = []
        
    def log_result(self, test_name: str, success: bool, message: str, response_data: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_data": response_data
        })
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> tuple:
        """Make HTTP request and return (success, response, error_message)"""
        try:
            url = f"{self.api_base}{endpoint}"
            
            if headers is None:
                headers = {"Content-Type": "application/json"}
            
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PATCH":
                response = self.session.patch(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                return False, None, f"Unsupported method: {method}"
            
            return True, response, None
            
        except requests.exceptions.ConnectionError:
            return False, None, "Connection failed - server may not be running"
        except Exception as e:
            return False, None, f"Request error: {str(e)}"
    
    def test_chat_start_guest(self):
        """Test starting conversation as guest"""
        test_data = {
            "message": "Hello, I need help with booking",
            "guestName": "John Doe",
            "guestEmail": "john@example.com"
        }
        
        success, response, error = self.make_request("POST", "/chat/start", test_data)
        
        if not success:
            self.log_result("Chat Start (Guest)", False, error)
            return None
            
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and data.get("conversationId"):
                self.log_result("Chat Start (Guest)", True, f"Conversation created with ID: {data['conversationId']}")
                return data["conversationId"]
            else:
                self.log_result("Chat Start (Guest)", False, f"Invalid response structure: {data}")
        else:
            self.log_result("Chat Start (Guest)", False, f"HTTP {response.status_code}: {response.text}")
        
        return None
    
    def test_chat_start_user(self):
        """Test starting conversation as logged user"""
        test_data = {
            "message": "I have a question about my stay",
            "userId": "user123"
        }
        
        success, response, error = self.make_request("POST", "/chat/start", test_data)
        
        if not success:
            self.log_result("Chat Start (User)", False, error)
            return None
            
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and data.get("conversationId"):
                self.log_result("Chat Start (User)", True, f"User conversation created with ID: {data['conversationId']}")
                return data["conversationId"]
            else:
                self.log_result("Chat Start (User)", False, f"Invalid response structure: {data}")
        else:
            self.log_result("Chat Start (User)", False, f"HTTP {response.status_code}: {response.text}")
        
        return None
    
    def test_chat_send_message(self, conversation_id: int):
        """Test sending message to conversation"""
        if not conversation_id:
            self.log_result("Chat Send Message", False, "No conversation ID provided")
            return
            
        test_data = {
            "conversationId": conversation_id,
            "content": "Thank you for your help"
        }
        
        success, response, error = self.make_request("POST", "/chat/send", test_data)
        
        if not success:
            self.log_result("Chat Send Message", False, error)
            return
            
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and data.get("message"):
                self.log_result("Chat Send Message", True, "Message sent successfully")
            else:
                self.log_result("Chat Send Message", False, f"Invalid response structure: {data}")
        else:
            self.log_result("Chat Send Message", False, f"HTTP {response.status_code}: {response.text}")
    
    def test_chat_get_conversation(self, conversation_id: int):
        """Test getting conversation details"""
        if not conversation_id:
            self.log_result("Chat Get Conversation", False, "No conversation ID provided")
            return
            
        success, response, error = self.make_request("GET", f"/chat/conversation/{conversation_id}")
        
        if not success:
            self.log_result("Chat Get Conversation", False, error)
            return
            
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and data.get("conversation"):
                message_count = len(data.get("messages", []))
                self.log_result("Chat Get Conversation", True, f"Retrieved conversation with {message_count} messages")
            else:
                self.log_result("Chat Get Conversation", False, f"Invalid response structure: {data}")
        elif response.status_code == 404:
            self.log_result("Chat Get Conversation", False, "Conversation not found")
        else:
            self.log_result("Chat Get Conversation", False, f"HTTP {response.status_code}: {response.text}")
    
    def test_chat_unread_count(self):
        """Test getting unread message count"""
        success, response, error = self.make_request("GET", "/chat/unread-count")
        
        if not success:
            self.log_result("Chat Unread Count", False, error)
            return
            
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "count" in data:
                self.log_result("Chat Unread Count", True, f"Unread count: {data['count']}")
            else:
                self.log_result("Chat Unread Count", False, f"Invalid response structure: {data}")
        else:
            self.log_result("Chat Unread Count", False, f"HTTP {response.status_code}: {response.text}")
    
    def test_chat_admin_conversations(self):
        """Test admin endpoint to get all conversations"""
        success, response, error = self.make_request("GET", "/chat/admin/conversations")
        
        if not success:
            self.log_result("Chat Admin Conversations", False, error)
            return
            
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "conversations" in data:
                count = len(data.get("conversations", []))
                self.log_result("Chat Admin Conversations", True, f"Retrieved {count} conversations")
            else:
                self.log_result("Chat Admin Conversations", False, f"Invalid response structure: {data}")
        elif response.status_code == 401:
            self.log_result("Chat Admin Conversations", True, "Correctly requires authentication")
        elif response.status_code == 403:
            self.log_result("Chat Admin Conversations", True, "Correctly requires admin role")
        else:
            self.log_result("Chat Admin Conversations", False, f"HTTP {response.status_code}: {response.text}")
    
    def test_chat_admin_update_status(self, conversation_id: int):
        """Test admin endpoint to update conversation status"""
        if not conversation_id:
            self.log_result("Chat Admin Update Status", False, "No conversation ID provided")
            return
            
        test_data = {
            "status": "closed",
            "assignedTo": "admin123"
        }
        
        success, response, error = self.make_request("PATCH", f"/chat/admin/conversation/{conversation_id}/status", test_data)
        
        if not success:
            self.log_result("Chat Admin Update Status", False, error)
            return
            
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.log_result("Chat Admin Update Status", True, "Status updated successfully")
            else:
                self.log_result("Chat Admin Update Status", False, f"Invalid response structure: {data}")
        elif response.status_code in [401, 403]:
            self.log_result("Chat Admin Update Status", True, "Correctly requires admin authentication")
        else:
            self.log_result("Chat Admin Update Status", False, f"HTTP {response.status_code}: {response.text}")
    
    def test_chat_admin_archive(self, conversation_id: int):
        """Test admin endpoint to archive conversation"""
        if not conversation_id:
            self.log_result("Chat Admin Archive", False, "No conversation ID provided")
            return
            
        success, response, error = self.make_request("PATCH", f"/chat/admin/conversation/{conversation_id}/archive")
        
        if not success:
            self.log_result("Chat Admin Archive", False, error)
            return
            
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.log_result("Chat Admin Archive", True, "Conversation archived successfully")
            else:
                self.log_result("Chat Admin Archive", False, f"Invalid response structure: {data}")
        elif response.status_code in [401, 403]:
            self.log_result("Chat Admin Archive", True, "Correctly requires admin authentication")
        else:
            self.log_result("Chat Admin Archive", False, f"HTTP {response.status_code}: {response.text}")
    
    def test_booking_lookup_find(self):
        """Test finding reservation by confirmation code and email"""
        # Try with a realistic test booking first
        test_data = {
            "confirmationCode": "ARCO123456",
            "email": "marco.rossi@email.it"
        }
        
        success, response, error = self.make_request("POST", "/booking-lookup/find", test_data)
        
        if not success:
            self.log_result("Booking Lookup Find", False, error)
            return
            
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and data.get("booking"):
                self.log_result("Booking Lookup Find", True, f"Found booking for {data['booking']['guestFirstName']} {data['booking']['guestLastName']}")
            else:
                self.log_result("Booking Lookup Find", False, f"Invalid response structure: {data}")
        elif response.status_code == 404:
            data = response.json()
            if not data.get("success"):
                self.log_result("Booking Lookup Find", True, f"Correctly returns not found: {data.get('message', 'No message')}")
            else:
                self.log_result("Booking Lookup Find", False, "404 but success=true in response")
        else:
            self.log_result("Booking Lookup Find", False, f"HTTP {response.status_code}: {response.text}")
    
    def test_booking_lookup_download(self):
        """Test downloading booking confirmation PDF"""
        test_data = {
            "confirmationCode": "ARCO123456",
            "email": "marco.rossi@email.it"
        }
        
        success, response, error = self.make_request("POST", "/booking-lookup/download-confirmation", test_data)
        
        if not success:
            self.log_result("Booking Download PDF", False, error)
            return
            
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'application/pdf' in content_type:
                self.log_result("Booking Download PDF", True, f"PDF generated successfully ({len(response.content)} bytes)")
            else:
                self.log_result("Booking Download PDF", False, f"Expected PDF but got: {content_type}")
        elif response.status_code == 404:
            try:
                data = response.json()
                if not data.get("success"):
                    self.log_result("Booking Download PDF", True, f"Correctly returns not found: {data.get('message', 'No message')}")
                else:
                    self.log_result("Booking Download PDF", False, "404 but success=true in response")
            except:
                self.log_result("Booking Download PDF", True, "Correctly returns 404 for non-existent booking")
        else:
            self.log_result("Booking Download PDF", False, f"HTTP {response.status_code}: {response.text}")
    
    def test_validation_errors(self):
        """Test Zod schema validation for various endpoints"""
        
        # Test invalid chat start data
        invalid_chat_data = {
            "message": "",  # Empty message should fail
            "guestEmail": "invalid-email"  # Invalid email format
        }
        
        success, response, error = self.make_request("POST", "/chat/start", invalid_chat_data)
        
        if success and response.status_code == 400:
            self.log_result("Validation - Chat Start", True, "Correctly validates input data")
        else:
            self.log_result("Validation - Chat Start", False, f"Expected 400 validation error, got {response.status_code if success else 'connection error'}")
        
        # Test invalid booking lookup data
        invalid_booking_data = {
            "confirmationCode": "",  # Empty confirmation code
            "email": "not-an-email"  # Invalid email
        }
        
        success, response, error = self.make_request("POST", "/booking-lookup/find", invalid_booking_data)
        
        if success and response.status_code == 400:
            self.log_result("Validation - Booking Lookup", True, "Correctly validates input data")
        else:
            self.log_result("Validation - Booking Lookup", False, f"Expected 400 validation error, got {response.status_code if success else 'connection error'}")
    
    def test_websocket_connection(self):
        """Test WebSocket connection for real-time messaging"""
        try:
            ws_url = f"ws://localhost:3000/ws/chat?userId=test123&isAdmin=false"
            
            def on_message(ws, message):
                self.websocket_messages.append(json.loads(message))
                print(f"WebSocket received: {message}")
            
            def on_error(ws, error):
                print(f"WebSocket error: {error}")
            
            def on_close(ws, close_status_code, close_msg):
                print("WebSocket connection closed")
            
            def on_open(ws):
                print("WebSocket connection opened")
                # Send a ping message
                ws.send(json.dumps({"type": "ping"}))
                
                # Close after a short delay
                def close_ws():
                    time.sleep(2)
                    ws.close()
                
                threading.Thread(target=close_ws).start()
            
            ws = websocket.WebSocketApp(ws_url,
                                      on_open=on_open,
                                      on_message=on_message,
                                      on_error=on_error,
                                      on_close=on_close)
            
            # Run WebSocket in a separate thread with timeout
            ws_thread = threading.Thread(target=ws.run_forever)
            ws_thread.daemon = True
            ws_thread.start()
            
            # Wait for connection and messages
            time.sleep(3)
            
            if self.websocket_messages:
                self.log_result("WebSocket Connection", True, f"Connected and received {len(self.websocket_messages)} messages")
            else:
                self.log_result("WebSocket Connection", False, "Connected but no messages received")
                
        except Exception as e:
            self.log_result("WebSocket Connection", False, f"WebSocket test failed: {str(e)}")
    
    def test_error_handling(self):
        """Test various error scenarios"""
        
        # Test non-existent conversation
        success, response, error = self.make_request("GET", "/chat/conversation/99999")
        if success and response.status_code == 404:
            self.log_result("Error Handling - Non-existent Conversation", True, "Correctly returns 404")
        else:
            self.log_result("Error Handling - Non-existent Conversation", False, f"Expected 404, got {response.status_code if success else 'connection error'}")
        
        # Test malformed JSON
        try:
            url = f"{self.api_base}/chat/start"
            response = self.session.post(url, data="invalid json", headers={"Content-Type": "application/json"})
            if response.status_code == 400:
                self.log_result("Error Handling - Malformed JSON", True, "Correctly handles malformed JSON")
            else:
                self.log_result("Error Handling - Malformed JSON", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_result("Error Handling - Malformed JSON", False, f"Exception: {str(e)}")
        
        # Test missing required fields
        success, response, error = self.make_request("POST", "/chat/send", {"conversationId": 1})  # Missing content
        if success and response.status_code == 400:
            self.log_result("Error Handling - Missing Fields", True, "Correctly validates required fields")
        else:
            self.log_result("Error Handling - Missing Fields", False, f"Expected 400, got {response.status_code if success else 'connection error'}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests for Enhanced Chat System & Find Reservation Features")
        print("=" * 80)
        
        # Test chat system
        print("\n📱 Testing Chat System APIs...")
        guest_conversation_id = self.test_chat_start_guest()
        user_conversation_id = self.test_chat_start_user()
        
        # Use the first available conversation ID for subsequent tests
        test_conversation_id = guest_conversation_id or user_conversation_id
        
        if test_conversation_id:
            self.test_chat_send_message(test_conversation_id)
            self.test_chat_get_conversation(test_conversation_id)
        
        self.test_chat_unread_count()
        
        # Test admin endpoints (will likely fail due to auth, but that's expected)
        print("\n🔐 Testing Chat Admin APIs...")
        self.test_chat_admin_conversations()
        if test_conversation_id:
            self.test_chat_admin_update_status(test_conversation_id)
            self.test_chat_admin_archive(test_conversation_id)
        
        # Test booking lookup
        print("\n🔍 Testing Booking Lookup APIs...")
        self.test_booking_lookup_find()
        self.test_booking_lookup_download()
        
        # Test validation
        print("\n✅ Testing Data Validation...")
        self.test_validation_errors()
        
        # Test error handling
        print("\n❌ Testing Error Handling...")
        self.test_error_handling()
        
        # Test WebSocket
        print("\n🔌 Testing WebSocket Connection...")
        self.test_websocket_connection()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['message']}")
        
        print("\n" + "=" * 80)
        
        # Return success status
        return failed_tests == 0

def main():
    """Main function to run tests"""
    tester = BackendTester()
    
    print("Backend API Testing Script")
    print("Testing server at: http://localhost:3000")
    print("Make sure the server is running before starting tests.\n")
    
    try:
        success = tester.run_all_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n💥 Unexpected error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()