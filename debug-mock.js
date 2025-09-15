// Debug test for mock database
import { vi } from 'vitest';
import { safeTestDatabase } from './src/test/safeTestDatabase.js';

async function debugMockChain() {
  const client = await safeTestDatabase.getClient();
  
  console.log('=== Testing Mock Chain ===');
  
  // Test step by step
  const fromResult = client.from('contacts');
  console.log('from result:', typeof fromResult, !!fromResult.select);
  
  const selectResult = fromResult.select('*');
  console.log('select result:', typeof selectResult, !!selectResult.eq);
  
  const eqResult = selectResult.eq('id', 'test-id');
  console.log('eq result:', typeof eqResult, !!eqResult.single);
  
  if (eqResult.single) {
    const singleResult = await eqResult.single();
    console.log('single result:', singleResult);
  } else {
    console.log('ERROR: single method not available!');
    console.log('Available methods on eq result:', Object.keys(eqResult));
  }
}

// Run the debug function
debugMockChain().catch(console.error);
