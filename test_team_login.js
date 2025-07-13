#!/usr/bin/env node

// Test script to verify team member login flow
import http from 'http';
import url from 'url';
import querystring from 'querystring';

console.log('🧪 Testing Team Member Login Flow...\n');

// Function to make HTTP requests
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function testTeamMemberLogin() {
  try {
    // Step 1: Login as team member
    console.log('1. Logging in as team member...');
    const loginData = JSON.stringify({
      email: 'testmember@test.com',
      password: 'password123'
    });
    
    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    };
    
    const loginResponse = await makeRequest(loginOptions, loginData);
    console.log(`   Status: ${loginResponse.statusCode}`);
    
    if (loginResponse.statusCode === 200) {
      const loginResult = JSON.parse(loginResponse.body);
      console.log(`   ✅ Login successful: ${loginResult.message}`);
      console.log(`   📍 Redirect to: ${loginResult.redirectTo}`);
      console.log(`   🔑 Access level: ${loginResult.accessLevel}`);
      
      // Extract cookies
      const cookies = loginResponse.headers['set-cookie'];
      const cookieHeader = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '';
      
      // Step 2: Test admin auth endpoint
      console.log('\n2. Testing admin authentication...');
      const adminAuthOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/auth/user',
        method: 'GET',
        headers: {
          'Cookie': cookieHeader
        }
      };
      
      const adminAuthResponse = await makeRequest(adminAuthOptions);
      console.log(`   Status: ${adminAuthResponse.statusCode}`);
      
      if (adminAuthResponse.statusCode === 200) {
        const adminUser = JSON.parse(adminAuthResponse.body);
        console.log(`   ✅ Admin auth successful`);
        console.log(`   👤 User: ${adminUser.firstName} ${adminUser.lastName}`);
        console.log(`   📧 Email: ${adminUser.email}`);
        console.log(`   🎭 Role: ${adminUser.role}`);
        console.log(`   🔓 Access Level: ${adminUser.accessLevel}`);
        console.log(`   🔧 Is Original Admin: ${adminUser.isOriginalAdmin}`);
        
        // Test permission system with different access levels
        const permissionTests = [
          { action: 'view', resource: 'bookings' },
          { action: 'edit', resource: 'bookings' },
          { action: 'delete', resource: 'bookings' },
          { action: 'view', resource: 'team' },
          { action: 'edit', resource: 'team' },
          { action: 'view', resource: 'pricing' },
          { action: 'edit', resource: 'pricing' }
        ];
        
        console.log('\n   🔐 Permission Tests (if this was read_only):');
        permissionTests.forEach(test => {
          // Simulate read_only permissions
          const readOnlyCanView = ['overview', 'bookings', 'reviews', 'users'].includes(test.resource);
          const readOnlyCanEdit = false; // read_only can't edit anything
          const readOnlyCanDelete = false; // read_only can't delete anything
          
          let hasPermission = false;
          if (test.action === 'view') hasPermission = readOnlyCanView;
          else if (test.action === 'edit') hasPermission = readOnlyCanEdit;
          else if (test.action === 'delete') hasPermission = readOnlyCanDelete;
          
          const icon = hasPermission ? '✅' : '❌';
          console.log(`     ${icon} ${test.action} ${test.resource}: ${hasPermission ? 'ALLOWED' : 'DENIED'}`);
        });
        
        // Step 3: Test admin status endpoint
        console.log('\n3. Testing admin status...');
        const statusOptions = {
          hostname: 'localhost',
          port: 3000,
          path: '/api/admin/auth/status',
          method: 'GET',
          headers: {
            'Cookie': cookieHeader
          }
        };
        
        const statusResponse = await makeRequest(statusOptions);
        console.log(`   Status: ${statusResponse.statusCode}`);
        
        if (statusResponse.statusCode === 200) {
          const status = JSON.parse(statusResponse.body);
          console.log(`   ✅ Admin status retrieved`);
          console.log(`   🛡️  Is Admin: ${status.isAdmin}`);
          console.log(`   🔐 Admin Authenticated: ${status.adminAuthenticated}`);
          console.log(`   📱 TOTP Verified: ${status.totpVerified}`);
          console.log(`   🔑 Has TOTP Setup: ${status.hasTOTPSetup}`);
          
          console.log('\n🎉 All tests passed! Team member login is working correctly.');
        } else {
          console.log(`   ❌ Admin status failed: ${statusResponse.body}`);
        }
      } else {
        console.log(`   ❌ Admin auth failed: ${adminAuthResponse.body}`);
      }
    } else {
      console.log(`   ❌ Login failed: ${loginResponse.body}`);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTeamMemberLogin();
