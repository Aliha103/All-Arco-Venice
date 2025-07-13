const WebSocket = require('ws');

console.log('Testing WebSocket connection to ws://localhost:3000/ws');

const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('open', function open() {
  console.log('✅ WebSocket connection established successfully');
  
  // Send a test message
  ws.send(JSON.stringify({ type: 'test', data: 'Hello from test client' }));
});

ws.on('message', function message(data) {
  console.log('📨 Received message:', data.toString());
});

ws.on('close', function close() {
  console.log('🔌 WebSocket connection closed');
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message);
});

// Keep the script running for a few seconds
setTimeout(() => {
  console.log('🔄 Closing test connection...');
  ws.close();
  process.exit(0);
}, 5000);
