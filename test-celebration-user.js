#!/usr/bin/env node

import WebSocket from 'ws';

// Test celebration for test@test.com
async function testCelebrationForUser() {
  console.log('🧪 Testing celebration notification for test@test.com...');
  
  // Connect to WebSocket
  const ws = new WebSocket('ws://localhost:3000/ws');
  
  ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
    
    // Listen for messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 Received message:', JSON.stringify(message, null, 2));
        
        if (message.type === 'celebration_notification') {
          console.log('🎉 CELEBRATION RECEIVED!');
          console.log('User ID:', message.targetUserId);
          console.log('Credit Amount:', message.data.creditAmount);
          console.log('Message:', message.data.messages.primary);
        }
      } catch (error) {
        console.error('❌ Error parsing message:', error);
      }
    });
    
    // Simulate celebration after connection is established
    setTimeout(() => {
      console.log('🚀 Triggering test celebration...');
      triggerTestCelebration();
    }, 1000);
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });
}

// Function to trigger test celebration via HTTP request
async function triggerTestCelebration() {
  try {
    const response = await fetch('http://localhost:3000/api/test-celebration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail: 'test@test.com',
        creditAmount: 25,
        referrerName: 'John Doe',
        bookingDetails: {
          id: 'test-booking-123',
          totalNights: 5
        }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Test celebration triggered:', result);
    } else {
      console.error('❌ Failed to trigger celebration:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Error triggering celebration:', error);
  }
}

// Start the test
testCelebrationForUser();

// Keep the script running for a few seconds to receive messages
setTimeout(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}, 10000);
