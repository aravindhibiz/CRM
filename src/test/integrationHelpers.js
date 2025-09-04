import { createClient } from '@supabase/supabase-js';
import { vi } from 'vitest';

// Create a separate Supabase client for integration tests
export const createTestSupabaseClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_TEST_URL || import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_TEST_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Test Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseKey);
};

// Test authentication helper
export const authenticateTestUser = async (supabase) => {
  // Try to authenticate with a test user or create one
  try {
    // First, try to sign in with demo credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@salesflow.com',
      password: 'password123'
    });

    if (!authError && authData.user) {
      console.log('✅ Integration test authentication successful:', authData.user.email);
      return authData.user;
    }

    // If demo user doesn't work, return null but don't fail
    console.warn('❌ Authentication failed for integration tests:', authError?.message);
    return null;
  } catch (error) {
    console.warn('❌ Authentication error:', error.message);
    return null;
  }
};

// Test data helpers with user context
export const createTestData = {
  contact: (overrides = {}, userId = null) => ({
    first_name: `TEST_${Date.now()}_John`,
    last_name: 'Doe',
    email: `test_${Date.now()}@example.com`,
    phone: '+1234567890',
    position: 'Test Manager',
    owner_id: userId, // Add owner_id for RLS policies
    ...overrides
  }),

  company: (overrides = {}, userId = null) => ({
    name: `TEST_${Date.now()}_Corp`,
    industry: 'Technology',
    website: 'https://test.com',
    city: 'Test City',
    state: 'TS',
    // Note: companies table doesn't have owner_id column
    ...overrides
  }),

  deal: (overrides = {}, userId = null) => ({
    name: `TEST_${Date.now()}_Deal`,
    value: 50000,
    stage: 'prospecting',
    probability: 25,
    expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    owner_id: userId, // Add owner_id for RLS policies
    ...overrides
  }),

  activity: (overrides = {}, userId = null) => ({
    type: 'call',
    subject: `TEST_${Date.now()}_Call`,
    description: 'Test activity description',
    user_id: userId, // Activities use user_id instead of owner_id
    ...overrides
  })
};

// Cleanup helpers
export class TestDataCleanup {
  constructor(supabase) {
    this.createdData = {
      contacts: [],
      companies: [],
      deals: [],
      activities: [],
      users: []
    };
    this.supabase = supabase;
  }

  track(type, data) {
    if (this.createdData[type] && data?.id) {
      this.createdData[type].push(data);
    }
    return data;
  }

  async cleanupAll() {
    const errors = [];

    // Clean up in reverse dependency order
    for (const activityId of this.createdData.activities.map(a => a.id)) {
      try {
        await this.supabase.from('activities').delete().eq('id', activityId);
      } catch (error) {
        errors.push(`Activity ${activityId}: ${error.message}`);
      }
    }

    for (const dealId of this.createdData.deals.map(d => d.id)) {
      try {
        await this.supabase.from('deals').delete().eq('id', dealId);
      } catch (error) {
        errors.push(`Deal ${dealId}: ${error.message}`);
      }
    }

    for (const contactId of this.createdData.contacts.map(c => c.id)) {
      try {
        await this.supabase.from('contacts').delete().eq('id', contactId);
      } catch (error) {
        errors.push(`Contact ${contactId}: ${error.message}`);
      }
    }

    for (const companyId of this.createdData.companies.map(c => c.id)) {
      try {
        await this.supabase.from('companies').delete().eq('id', companyId);
      } catch (error) {
        errors.push(`Company ${companyId}: ${error.message}`);
      }
    }

    // Reset tracking
    this.createdData = {
      contacts: [],
      companies: [],
      deals: [],
      activities: [],
      users: []
    };

    if (errors.length > 0) {
      console.warn('Cleanup errors:', errors);
    }
  }
}

// Mock the main supabase client to use test client during integration tests
export const setupIntegrationTestMocks = () => {
  const testClient = createTestSupabaseClient();
  
  vi.mock('../../lib/supabase', () => ({
    default: testClient,
    supabase: testClient
  }));

  return testClient;
};
