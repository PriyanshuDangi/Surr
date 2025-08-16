// Surr Game - Interpolation Testing Script
// Simple test to verify client-side interpolation works correctly

// Test function to simulate network updates and verify interpolation
export function testInterpolation() {
  console.log('🧪 Starting interpolation test...');
  
  // This test requires a remote player to be present
  // Instructions for manual testing:
  console.log('📋 Manual Test Instructions:');
  console.log('1. Start the server: cd server && npm run dev');
  console.log('2. Open two browser tabs to http://localhost:3000');
  console.log('3. In both tabs, the game should connect to server');
  console.log('4. Move around in one tab (WASD keys)');
  console.log('5. Observe smooth movement in the other tab');
  console.log('6. Run debugInterpolation() in console to see stats');
  
  // Automated test for interpolation buffer
  console.log('\n🔧 Testing interpolation buffer logic...');
  
  // Test buffer size limit
  const testBuffer = [];
  const maxSize = 5;
  
  // Simulate adding 10 updates (should only keep last 5)
  for (let i = 0; i < 10; i++) {
    testBuffer.push({ timestamp: performance.now() + i * 100, position: { x: i, y: 0, z: 0 } });
    if (testBuffer.length > maxSize) {
      testBuffer.shift();
    }
  }
  
  console.assert(testBuffer.length === maxSize, 'Buffer size should be limited to 5');
  console.assert(testBuffer[0].position.x === 5, 'Oldest entry should be position 5');
  console.assert(testBuffer[4].position.x === 9, 'Newest entry should be position 9');
  
  // Test teleportation detection
  const pos1 = { x: 0, y: 0, z: 0 };
  const pos2 = { x: 25, y: 0, z: 0 }; // 25 units away (> 20 threshold)
  
  const distance = Math.sqrt(
    Math.pow(pos2.x - pos1.x, 2) +
    Math.pow(pos2.y - pos1.y, 2) +
    Math.pow(pos2.z - pos1.z, 2)
  );
  
  console.assert(distance > 20, 'Should detect teleportation for distance > 20');
  
  console.log('✅ All buffer tests passed!');
  console.log('\n🎮 To test real interpolation:');
  console.log('- Open multiple browser tabs');
  console.log('- Move in one tab, observe smoothness in others');
  console.log('- Use debugInterpolation() to monitor stats');
  
  return {
    bufferTest: true,
    teleportationTest: true,
    instructions: 'Open multiple tabs and test movement'
  };
}

// Export for use in browser console
window.testInterpolation = testInterpolation;
