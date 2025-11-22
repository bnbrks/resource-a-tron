#!/usr/bin/env node

/**
 * Configuration Verification Script
 * Tests Railway deployment configuration
 * 
 * Usage:
 *   node verify-config.js [backend-url] [frontend-url]
 * 
 * Example:
 *   node verify-config.js https://resource-a-tron-backend-production.up.railway.app https://resource-a-tron-frontend-production.up.railway.app
 */

const BACKEND_URL = process.argv[2] || 'https://resource-a-tron-backend-production.up.railway.app';
const FRONTEND_URL = process.argv[3] || '';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(url, method = 'GET', headers = {}) {
  try {
    const response = await fetch(url, { method, headers });
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      status: 0,
    };
  }
}

async function testHealth() {
  log('\nTest 1: Backend Health Check', 'blue');
  log('------------------------------', 'blue');
  const healthUrl = `${BACKEND_URL}/api/health`;
  log(`Checking: ${healthUrl}`);
  
  try {
    const response = await fetch(healthUrl);
    const data = await response.json().catch(() => ({}));
    
    if (response.ok) {
      log(`✓ Backend is accessible (HTTP ${response.status})`, 'green');
      log(`Response: ${JSON.stringify(data, null, 2)}`);
    } else {
      log(`✗ Backend returned error (HTTP ${response.status})`, 'red');
      log(`Response: ${JSON.stringify(data, null, 2)}`);
    }
    return response.ok;
  } catch (error) {
    log(`✗ Cannot reach backend: ${error.message}`, 'red');
    return false;
  }
}

async function testEndpoints() {
  log('\nTest 2: Backend API Endpoints', 'blue');
  log('------------------------------', 'blue');
  
  const endpoints = [
    { path: '/api', name: 'API Root' },
    { path: '/api/users', name: 'Users' },
    { path: '/api/projects', name: 'Projects' },
    { path: '/api/tasks', name: 'Tasks' },
  ];
  
  for (const { path, name } of endpoints) {
    const url = `${BACKEND_URL}${path}`;
    process.stdout.write(`Testing ${name} (${path}) ... `);
    
    const result = await testEndpoint(url);
    
    if (result.status === 200) {
      log('✓', 'green');
    } else if (result.status === 401 || result.status === 403) {
      log(`✓ (Auth required)`, 'green');
    } else if (result.status === 404) {
      log(`? (Not found)`, 'yellow');
    } else if (result.status === 0) {
      log(`✗ (Connection failed)`, 'red');
    } else {
      log(`? (HTTP ${result.status})`, 'yellow');
    }
  }
}

async function testCORS() {
  if (!FRONTEND_URL) {
    log('\nTest 3: CORS Configuration', 'blue');
    log('------------------------------', 'blue');
    log('⚠ Skipping CORS test (no frontend URL provided)');
    log('Usage: node verify-config.js <backend-url> <frontend-url>');
    return;
  }
  
  log('\nTest 3: CORS Configuration', 'blue');
  log('------------------------------', 'blue');
  log(`Testing CORS from: ${FRONTEND_URL}`);
  
  const healthUrl = `${BACKEND_URL}/api/health`;
  const result = await testEndpoint(healthUrl, 'OPTIONS', {
    'Origin': FRONTEND_URL,
    'Access-Control-Request-Method': 'GET',
  });
  
  if (result.headers['access-control-allow-origin']) {
    log('✓ CORS headers present', 'green');
    log(`  Access-Control-Allow-Origin: ${result.headers['access-control-allow-origin']}`);
  } else {
    log('⚠ CORS headers not found', 'yellow');
    log('  Make sure CORS_ORIGIN is set in backend Railway service');
  }
}

async function testDatabase() {
  log('\nTest 4: Database Connection', 'blue');
  log('------------------------------', 'blue');
  
  const usersUrl = `${BACKEND_URL}/api/users`;
  try {
    const response = await fetch(usersUrl);
    
    if (response.ok) {
      const users = await response.json();
      const count = Array.isArray(users) ? users.length : 0;
      log('✓ Database is accessible', 'green');
      log(`Found ${count} users in database`);
      
      if (count === 0) {
        log('\n⚠ Database is empty - you may need to seed it:', 'yellow');
        log('  cd backend');
        log('  railway run npm run seed');
        log('  railway run npm run seed:sample');
      }
    } else if (response.status === 401 || response.status === 403) {
      log('⚠ Database accessible, but authentication required (this is normal)', 'yellow');
    } else {
      log(`✗ Cannot access database (HTTP ${response.status})`, 'red');
    }
  } catch (error) {
    log(`✗ Database connection failed: ${error.message}`, 'red');
  }
}

async function main() {
  log('=========================================', 'blue');
  log('Railway Configuration Verification', 'blue');
  log('=========================================', 'blue');
  
  log(`\nBackend URL: ${BACKEND_URL}`);
  if (FRONTEND_URL) {
    log(`Frontend URL: ${FRONTEND_URL}`);
  }
  
  const healthOk = await testHealth();
  
  if (!healthOk) {
    log('\n⚠ Backend is not accessible. Please check:', 'yellow');
    log('  1. Backend service is deployed and running');
    log('  2. Backend URL is correct');
    log('  3. Backend has a public URL (check Railway settings)');
    return;
  }
  
  await testEndpoints();
  await testCORS();
  await testDatabase();
  
  log('\n=========================================', 'blue');
  log('Summary', 'blue');
  log('=========================================', 'blue');
  log(`\nBackend URL: ${BACKEND_URL}`);
  if (FRONTEND_URL) {
    log(`Frontend URL: ${FRONTEND_URL}`);
  }
  
  log('\nNext Steps:', 'blue');
  log('1. Ensure VITE_API_URL is set in Railway frontend service:');
  log(`   VITE_API_URL=${BACKEND_URL}/api`);
  log('');
  log('2. Ensure CORS_ORIGIN is set in Railway backend service:');
  if (FRONTEND_URL) {
    log(`   CORS_ORIGIN=${FRONTEND_URL}`);
  } else {
    log('   CORS_ORIGIN=<your-frontend-railway-url>');
  }
  log('');
  log('3. Seed the database (if not done):');
  log('   cd backend');
  log('   railway run npm run seed');
  log('   railway run npm run seed:sample');
}

main().catch(console.error);

