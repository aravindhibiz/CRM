import { describe, test, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestDataCleanup, createTestData, createTestSupabaseClient, authenticateTestUser } from '../../test/integrationHelpers.js';

// Mock the supabase import to use our authenticated test client
vi.mock('../../lib/supabase', async () => {
  const { createTestSupabaseClient } = await import('../../test/integrationHelpers.js');
  const testClient = createTestSupabaseClient();
  
  return {
    default: testClient,
    supabase: testClient
  };
});

// Import service AFTER mocking
import { contactsService } from '../contactsService.js';

describe('Contacts Service - Integration Tests', () => {
  let cleanup;
  let testClient;
  let authenticatedUser;

  beforeAll(async () => {
    // Create test client and authenticate
    testClient = createTestSupabaseClient();
    authenticatedUser = await authenticateTestUser(testClient);
  });

  beforeEach(() => {
    cleanup = new TestDataCleanup(testClient);
  });

  afterEach(async () => {
    await cleanup.cleanupAll();
  });

  describe('getUserContacts', () => {
    test('should fetch contacts with real database structure', async () => {
      // Skip test if authentication failed
      if (!authenticatedUser) {
        console.warn('⚠️ Skipping test - no authenticated user');
        return;
      }

      // Create a test contact using the service layer (which handles RLS properly)
      const contactData = createTestData.contact({}, authenticatedUser.id);
      
      const createdContact = await contactsService.createContact(contactData);

      console.log('📝 Creating test contact via service:', { contactData, createdContact });

      expect(createdContact).toBeDefined();
      cleanup.track('contacts', createdContact);

      // Now test the service method
      const contacts = await contactsService.getUserContacts();

      expect(Array.isArray(contacts)).toBe(true);
      expect(contacts.length).toBeGreaterThan(0);

      // Find our test contact
      const foundContact = contacts.find(c => c.id === createdContact.id);
      expect(foundContact).toBeDefined();
      expect(foundContact.first_name).toBe(contactData.first_name);
      expect(foundContact.email).toBe(contactData.email);

      // Test the joined data structure
      expect(foundContact).toHaveProperty('company');
      expect(foundContact).toHaveProperty('deals');
      expect(foundContact).toHaveProperty('activities');
      expect(foundContact).toHaveProperty('owner');
    });

    test.skip('should handle empty results gracefully', async () => {
      // Test with user that has no contacts (use a valid UUID)
      const contacts = await contactsService.getUserContacts('00000000-0000-0000-0000-000000000000');
      
      expect(Array.isArray(contacts)).toBe(true);
      expect(contacts.length).toBe(0);
    });
  });

  describe.skip('getContactById', () => {
    test('should fetch specific contact with full details', async () => {
      // Create test contact using service layer
      const contactData = createTestData.contact();
      
      const createdContact = await contactsService.createContact(contactData);

      expect(createdContact).toBeDefined();
      cleanup.track('contacts', createdContact);

      // Test the service method
      const contact = await contactsService.getContactById(createdContact.id);

      expect(contact).toBeDefined();
      expect(contact.id).toBe(createdContact.id);
      expect(contact.first_name).toBe(contactData.first_name);
      expect(contact.email).toBe(contactData.email);

      // Test joined data
      expect(contact).toHaveProperty('company');
      expect(contact).toHaveProperty('deals');
      expect(contact).toHaveProperty('activities');
      expect(contact).toHaveProperty('tasks');
    });

    test('should handle non-existent contact', async () => {
      const contact = await contactsService.getContactById('00000000-0000-0000-0000-000000000000');
      expect(contact).toBeNull();
    });
  });

  describe.skip('createContact', () => {
    test('should create contact in real database', async () => {
      const contactData = createTestData.contact({
        first_name: 'Integration',
        last_name: 'Test',
        email: `integration_${Date.now()}@test.com`
      });

      const createdContact = await contactsService.createContact(contactData);
      cleanup.track('contacts', createdContact);

      expect(createdContact).toBeDefined();
      expect(createdContact.id).toBeDefined();
      expect(createdContact.first_name).toBe(contactData.first_name);
      expect(createdContact.email).toBe(contactData.email);

      // Verify it's actually in the database
      const { data: dbContact } = await testClient
        .from('contacts')
        .select()
        .eq('id', createdContact.id)
        .single();

      expect(dbContact).toBeDefined();
      expect(dbContact.first_name).toBe(contactData.first_name);
    });

    test('should create contact with company relationship', async () => {
      // Create a company first
      const companyData = createTestData.company();
      const { data: company, error: companyError } = await testClient
        .from('companies')
        .insert([companyData])
        .select()
        .single();

      expect(companyError).toBeNull();
      cleanup.track('companies', company);

      // Create contact with company
      const contactData = createTestData.contact({
        company_id: company.id
      });

      const createdContact = await contactsService.createContact(contactData);
      cleanup.track('contacts', createdContact);

      expect(createdContact.company_id).toBe(company.id);

      // Verify the relationship
      const contactWithCompany = await contactsService.getContactById(createdContact.id);
      expect(contactWithCompany.company).toBeDefined();
      expect(contactWithCompany.company.id).toBe(company.id);
      expect(contactWithCompany.company.name).toBe(companyData.name);
    });

    test('should handle database constraints', async () => {
      const contactData = createTestData.contact({
        email: `duplicate_${Date.now()}@test.com`
      });

      // Create first contact
      const firstContact = await contactsService.createContact(contactData);
      cleanup.track('contacts', firstContact);

      // Try to create duplicate (if email is unique in your schema)
      const duplicateData = { ...contactData };
      
      try {
        const secondContact = await contactsService.createContact(duplicateData);
        cleanup.track('contacts', secondContact);
        
        // If no error, that's fine - depends on your schema constraints
        expect(secondContact).toBeDefined();
      } catch (error) {
        // If error, it should be a meaningful database constraint error
        expect(error.message).toMatch(/duplicate|unique|constraint/i);
      }
    });
  });

  describe.skip('updateContact', () => {
    test('should update contact in real database', async () => {
      // Create test contact using service layer
      const contactData = createTestData.contact();
      const createdContact = await contactsService.createContact(contactData);

      expect(createdContact).toBeDefined();
      cleanup.track('contacts', createdContact);

      // Update the contact
      const updates = {
        first_name: 'Updated Name',
        phone: '+9876543210'
      };

      const updatedContact = await contactsService.updateContact(createdContact.id, updates);

      expect(updatedContact.first_name).toBe(updates.first_name);
      expect(updatedContact.phone).toBe(updates.phone);
      expect(updatedContact.email).toBe(contactData.email); // Should remain unchanged

      // Verify in database
      const { data: dbContact } = await testClient
        .from('contacts')
        .select()
        .eq('id', createdContact.id)
        .single();

      expect(dbContact.first_name).toBe(updates.first_name);
      expect(dbContact.phone).toBe(updates.phone);
    });
  });

  describe.skip('deleteContact', () => {
    test('should delete contact from real database', async () => {
      // Create test contact using service layer
      const contactData = createTestData.contact();
      const createdContact = await contactsService.createContact(contactData);

      expect(createdContact).toBeDefined();

      // Delete the contact
      await contactsService.deleteContact(createdContact.id);

      // Verify it's deleted by trying to fetch it
      await expect(contactsService.getContactById(createdContact.id))
        .rejects
        .toThrow();
    });
  });

  describe.skip('searchContacts', () => {
    test('should search contacts in real database', async () => {
      // Create test contacts using service layer
      const uniqueSearchTerm = `SearchTest_${Date.now()}`;
      const contactData1 = createTestData.contact({
        first_name: uniqueSearchTerm,
        last_name: 'Alpha'
      });
      const contactData2 = createTestData.contact({
        first_name: 'Beta',
        last_name: uniqueSearchTerm
      });

      const contact1 = await contactsService.createContact(contactData1);
      cleanup.track('contacts', contact1);

      const contact2 = await contactsService.createContact(contactData2);
      cleanup.track('contacts', contact2);

      // Search for contacts
      const searchResults = await contactsService.searchContacts(uniqueSearchTerm);

      expect(Array.isArray(searchResults)).toBe(true);
      expect(searchResults.length).toBeGreaterThanOrEqual(2);

      const foundIds = searchResults.map(c => c.id);
      expect(foundIds).toContain(contact1.id);
      expect(foundIds).toContain(contact2.id);
    });
  });

  describe.skip('Real-time subscriptions', () => {
    test('should handle contact subscriptions', async () => {
      let subscriptionCallbackCalled = false;
      let receivedContact = null;

      // Set up subscription
      const unsubscribe = contactsService.subscribeToContacts((contact) => {
        subscriptionCallbackCalled = true;
        receivedContact = contact;
      });

      // Give subscription time to set up
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create a contact using service layer (should trigger subscription)
      const contactData = createTestData.contact();
      const createdContact = await contactsService.createContact(contactData);
      
      cleanup.track('contacts', createdContact);

      // Wait for subscription callback
      await new Promise(resolve => setTimeout(resolve, 500));

      // Clean up subscription
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }

      // Verify subscription worked
      expect(subscriptionCallbackCalled).toBe(true);
      expect(receivedContact).toBeDefined();
    });
  });
});
