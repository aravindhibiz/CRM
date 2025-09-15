// Debug test for mock database
import { describe, it, expect } from 'vitest';
import { safeTestDB } from '../test/safeTestDatabase.js';

describe('Mock Database Debug', () => {
  it('should properly chain select, eq, and single methods', async () => {
    const client = await safeTestDB.getClient();
    
    console.log('=== Testing Mock Chain ===');
    
    // Test step by step
    const fromResult = client.from('contacts');
    console.log('from result:', typeof fromResult, !!fromResult.select);
    expect(fromResult.select).toBeDefined();
    
    const selectResult = fromResult.select('*');
    console.log('select result:', typeof selectResult, !!selectResult.eq);
    expect(selectResult.eq).toBeDefined();
    
    const eqResult = selectResult.eq('id', 'test-id');
    console.log('eq result:', typeof eqResult, !!eqResult.single);
    console.log('Available methods on eq result:', Object.keys(eqResult));
    
    expect(eqResult.single).toBeDefined();
    
    if (eqResult.single) {
      const singleResult = await eqResult.single();
      console.log('single result:', singleResult);
      expect(singleResult).toBeDefined();
      expect(singleResult.data).toBeNull(); // Should be null for invalid ID
    }
  });
});
