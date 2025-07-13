// Run this in the browser console when on localhost:5173
// This will trigger the celebration modal directly

function testCelebration() {
  const testData = {
    userId: 'local_1751898895917_pld75ulsh', // test@test.com user ID from the bookings
    creditAmount: 25,
    messages: {
      primary: '🎉 Congratulations! You\'ve earned 25€ in referral credits!',
      secondary: 'Your friend just completed their stay. Keep referring to earn more!',
      action: 'You now have credits to use on your next booking!'
    },
    animations: {
      confetti: true,
      fireworks: true,
      duration: 5000
    },
    referrerEmail: 'test@test.com',
    referrerName: 'Test User',
    bookingId: 'test-booking-123',
    totalNights: 5,
    timestamp: new Date().toISOString(),
    celebrationId: 'test-celebration-' + Date.now()
  };
  
  // Trigger the test celebration event that the App.tsx is listening for
  const celebrationEvent = new CustomEvent('test-celebration', {
    detail: { data: testData }
  });
  
  window.dispatchEvent(celebrationEvent);
  console.log('🧪 Test celebration event triggered!', testData);
}

// Auto-trigger after 2 seconds for testing
setTimeout(() => {
  console.log('🚀 Auto-triggering test celebration...');
  testCelebration();
}, 2000);

console.log('📋 Client-side celebration test loaded. Run testCelebration() to trigger manually.');
