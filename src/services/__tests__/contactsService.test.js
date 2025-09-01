import contactsService from '../contactsService';
import { supabase } from '../../lib/supabase';

// Mock the supabase client
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('contactsService', () => {
  let mockQuery;
  let mockSelect;
  let mockInsert;
  let mockUpdate;
  let mockDelete;
  let mockEq;
  let mockIn;
  let mockOr;
  let mockOverlaps;
  let mockGte;
  let mockLte;
  let mockOrder;
  let mockSingle;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create chainable mock functions
    mockSelect = jest.fn().mockReturnThis();
    mockInsert = jest.fn().mockReturnThis();
    mockUpdate = jest.fn().mockReturnThis();
    mockDelete = jest.fn().mockReturnThis();
    mockEq = jest.fn().mockReturnThis();
    mockIn = jest.fn().mockReturnThis();
    mockOr = jest.fn().mockReturnThis();
    mockOverlaps = jest.fn().mockReturnThis();
    mockGte = jest.fn().mockReturnThis();
    mockLte = jest.fn().mockReturnThis();
    mockOrder = jest.fn().mockReturnThis();
    mockSingle = jest.fn();

    mockQuery = {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      in: mockIn,
      or: mockOr,
      overlaps: mockOverlaps,
      gte: mockGte,
      lte: mockLte,
      order: mockOrder,
      single: mockSingle,
    };

    supabase.from.mockReturnValue(mockQuery);
  });

  describe('getUserContacts', () => {
    it('should fetch all user contacts with related data', async () => {
      const mockContacts = [
        { id: '1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        { id: '2', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' }
      ];

      mockOrder.mockResolvedValue({ data: mockContacts, error: null });

      const result = await contactsService.getUserContacts();

      expect(supabase.from).toHaveBeenCalledWith('contacts');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('company:company_id'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('owner:owner_id'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('deals:deals'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('activities:activities'));
      expect(mockOrder).toHaveBeenCalledWith('updated_at', { ascending: false });
      expect(result).toEqual(mockContacts);
    });

    it('should handle empty results', async () => {
      mockOrder.mockResolvedValue({ data: null, error: null });

      const result = await contactsService.getUserContacts();

      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      const mockError = new Error('Database connection failed');
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      await expect(contactsService.getUserContacts()).rejects.toThrow('Database connection failed');
    });
  });

  describe('getContactById', () => {
    it('should fetch contact by ID with all related data', async () => {
      const mockContact = {
        id: 'contact-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        company: { id: '1', name: 'Company A' },
        deals: [{ id: '1', name: 'Deal 1', value: 10000 }]
      };

      mockSingle.mockResolvedValue({ data: mockContact, error: null });

      const result = await contactsService.getContactById('contact-123');

      expect(supabase.from).toHaveBeenCalledWith('contacts');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('company:company_id(*)'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('tasks:tasks'));
      expect(mockEq).toHaveBeenCalledWith('id', 'contact-123');
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockContact);
    });

    it('should throw error when contact is not found', async () => {
      const mockError = new Error('Contact not found');
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(contactsService.getContactById('invalid-id')).rejects.toThrow('Contact not found');
    });
  });

  describe('createContact', () => {
    it('should create contact without company', async () => {
      const contactData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        company_id: 'existing-company-id'
      };

      const mockCreatedContact = { id: 'new-contact-123', ...contactData };
      mockSingle.mockResolvedValue({ data: mockCreatedContact, error: null });

      const result = await contactsService.createContact(contactData);

      expect(mockInsert).toHaveBeenCalledWith([{
        ...contactData,
        last_contact_date: expect.any(String)
      }]);
      expect(result).toEqual(mockCreatedContact);
    });

    it('should create contact with new company', async () => {
      const contactData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        companyName: 'New Company',
        industry: 'Technology'
      };

      const mockCompany = { id: 'new-company-123', name: 'New Company' };
      const mockCreatedContact = { 
        id: 'new-contact-123', 
        ...contactData, 
        company_id: 'new-company-123' 
      };

      // Mock company creation
      const mockCompanyQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCompany, error: null })
      };

      supabase.from
        .mockReturnValueOnce(mockCompanyQuery) // For company creation
        .mockReturnValueOnce(mockQuery); // For contact creation

      mockSingle.mockResolvedValue({ data: mockCreatedContact, error: null });

      const result = await contactsService.createContact(contactData);

      expect(supabase.from).toHaveBeenCalledWith('companies');
      expect(mockCompanyQuery.insert).toHaveBeenCalledWith([{
        name: 'New Company',
        industry: 'Technology'
      }]);
      expect(mockInsert).toHaveBeenCalledWith([{
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        industry: 'Technology',
        company_id: 'new-company-123',
        last_contact_date: expect.any(String)
      }]);
      expect(result).toEqual(mockCreatedContact);
    });

    it('should handle company creation error', async () => {
      const contactData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        companyName: 'New Company'
      };

      const mockCompanyError = new Error('Company creation failed');
      const mockCompanyQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockCompanyError })
      };

      supabase.from.mockReturnValueOnce(mockCompanyQuery);

      await expect(contactsService.createContact(contactData)).rejects.toThrow('Company creation failed');
    });

    it('should handle contact creation error', async () => {
      const contactData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      };

      const mockError = new Error('Contact creation failed');
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(contactsService.createContact(contactData)).rejects.toThrow('Contact creation failed');
    });
  });

  describe('updateContact', () => {
    it('should update contact successfully', async () => {
      const contactId = 'contact-123';
      const updates = {
        first_name: 'Updated John',
        phone: '987-654-3210'
      };

      const mockUpdatedContact = { id: contactId, ...updates };
      mockSingle.mockResolvedValue({ data: mockUpdatedContact, error: null });

      const result = await contactsService.updateContact(contactId, updates);

      expect(mockUpdate).toHaveBeenCalledWith({
        ...updates,
        updated_at: expect.any(String)
      });
      expect(mockEq).toHaveBeenCalledWith('id', contactId);
      expect(result).toEqual(mockUpdatedContact);
    });

    it('should throw error when update fails', async () => {
      const mockError = new Error('Update failed');
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(contactsService.updateContact('contact-123', {})).rejects.toThrow('Update failed');
    });
  });

  describe('deleteContact', () => {
    it('should delete contact successfully', async () => {
      mockEq.mockResolvedValue({ error: null });

      const result = await contactsService.deleteContact('contact-123');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'contact-123');
      expect(result).toBe(true);
    });

    it('should throw error when delete fails', async () => {
      const mockError = new Error('Delete failed');
      mockEq.mockResolvedValue({ error: mockError });

      await expect(contactsService.deleteContact('contact-123')).rejects.toThrow('Delete failed');
    });
  });

  describe('deleteContacts', () => {
    it('should delete multiple contacts successfully', async () => {
      const contactIds = ['contact-1', 'contact-2', 'contact-3'];
      mockIn.mockResolvedValue({ error: null });

      const result = await contactsService.deleteContacts(contactIds);

      expect(mockDelete).toHaveBeenCalled();
      expect(mockIn).toHaveBeenCalledWith('id', contactIds);
      expect(result).toBe(true);
    });

    it('should throw error when bulk delete fails', async () => {
      const mockError = new Error('Bulk delete failed');
      mockIn.mockResolvedValue({ error: mockError });

      await expect(contactsService.deleteContacts(['contact-1'])).rejects.toThrow('Bulk delete failed');
    });
  });

  describe('searchContacts', () => {
    it('should search contacts by query', async () => {
      const searchQuery = 'john';
      const mockSearchResults = [
        { id: '1', first_name: 'John', last_name: 'Doe' },
        { id: '2', first_name: 'Johnny', last_name: 'Smith' }
      ];

      mockOrder.mockResolvedValue({ data: mockSearchResults, error: null });

      const result = await contactsService.searchContacts(searchQuery);

      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('company:company_id'));
      expect(mockOr).toHaveBeenCalledWith(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      expect(mockOrder).toHaveBeenCalledWith('updated_at', { ascending: false });
      expect(result).toEqual(mockSearchResults);
    });

    it('should return empty array when no search results', async () => {
      mockOrder.mockResolvedValue({ data: null, error: null });

      const result = await contactsService.searchContacts('nonexistent');

      expect(result).toEqual([]);
    });

    it('should throw error when search fails', async () => {
      const mockError = new Error('Search failed');
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      await expect(contactsService.searchContacts('test')).rejects.toThrow('Search failed');
    });
  });

  describe('filterContacts', () => {
    it('should filter contacts by status', async () => {
      const filters = { status: ['prospect', 'customer'] };
      const mockFilteredContacts = [
        { id: '1', status: 'prospect' },
        { id: '2', status: 'customer' }
      ];

      mockOrder.mockResolvedValue({ data: mockFilteredContacts, error: null });

      const result = await contactsService.filterContacts(filters);

      expect(mockIn).toHaveBeenCalledWith('status', ['prospect', 'customer']);
      expect(result).toEqual(mockFilteredContacts);
    });

    it('should filter contacts by companies', async () => {
      const filters = { companies: ['company-1', 'company-2'] };
      mockOrder.mockResolvedValue({ data: [], error: null });

      await contactsService.filterContacts(filters);

      expect(mockIn).toHaveBeenCalledWith('company_id', ['company-1', 'company-2']);
    });

    it('should filter contacts by lead sources', async () => {
      const filters = { leadSources: ['website', 'referral'] };
      mockOrder.mockResolvedValue({ data: [], error: null });

      await contactsService.filterContacts(filters);

      expect(mockIn).toHaveBeenCalledWith('lead_source', ['website', 'referral']);
    });

    it('should filter contacts by tags', async () => {
      const filters = { tags: ['vip', 'priority'] };
      mockOrder.mockResolvedValue({ data: [], error: null });

      await contactsService.filterContacts(filters);

      expect(mockOverlaps).toHaveBeenCalledWith('tags', ['vip', 'priority']);
    });

    it('should filter contacts by date range', async () => {
      const filters = {
        dateRange: {
          start: '2025-01-01',
          end: '2025-01-31'
        }
      };
      mockOrder.mockResolvedValue({ data: [], error: null });

      await contactsService.filterContacts(filters);

      expect(mockGte).toHaveBeenCalledWith('last_contact_date', '2025-01-01');
      expect(mockLte).toHaveBeenCalledWith('last_contact_date', '2025-01-31');
    });

    it('should apply multiple filters together', async () => {
      const filters = {
        status: ['prospect'],
        companies: ['company-1'],
        tags: ['vip'],
        dateRange: { start: '2025-01-01', end: '2025-01-31' }
      };
      mockOrder.mockResolvedValue({ data: [], error: null });

      await contactsService.filterContacts(filters);

      expect(mockIn).toHaveBeenCalledWith('status', ['prospect']);
      expect(mockIn).toHaveBeenCalledWith('company_id', ['company-1']);
      expect(mockOverlaps).toHaveBeenCalledWith('tags', ['vip']);
      expect(mockGte).toHaveBeenCalledWith('last_contact_date', '2025-01-01');
      expect(mockLte).toHaveBeenCalledWith('last_contact_date', '2025-01-31');
    });

    it('should not apply filters when they are empty', async () => {
      const filters = {
        status: [],
        companies: null,
        leadSources: undefined,
        tags: [],
        dateRange: null
      };
      mockOrder.mockResolvedValue({ data: [], error: null });

      await contactsService.filterContacts(filters);

      expect(mockIn).not.toHaveBeenCalled();
      expect(mockOverlaps).not.toHaveBeenCalled();
      expect(mockGte).not.toHaveBeenCalled();
      expect(mockLte).not.toHaveBeenCalled();
    });

    it('should return empty array when no filtered results', async () => {
      mockOrder.mockResolvedValue({ data: null, error: null });

      const result = await contactsService.filterContacts({ status: ['nonexistent'] });

      expect(result).toEqual([]);
    });

    it('should throw error when filtering fails', async () => {
      const mockError = new Error('Filter failed');
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      await expect(contactsService.filterContacts({})).rejects.toThrow('Filter failed');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined parameters gracefully', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await expect(contactsService.searchContacts(null)).resolves.toEqual([]);
      await expect(contactsService.filterContacts(null)).resolves.toEqual([]);
      await expect(contactsService.filterContacts(undefined)).resolves.toEqual([]);
    });

    it('should handle empty string search query', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      const result = await contactsService.searchContacts('');

      expect(mockOr).toHaveBeenCalledWith('first_name.ilike.%%,last_name.ilike.%%,email.ilike.%%');
      expect(result).toEqual([]);
    });

    it('should handle special characters in search query', async () => {
      const specialQuery = "john's & co.";
      mockOrder.mockResolvedValue({ data: [], error: null });

      await contactsService.searchContacts(specialQuery);

      expect(mockOr).toHaveBeenCalledWith(`first_name.ilike.%${specialQuery}%,last_name.ilike.%${specialQuery}%,email.ilike.%${specialQuery}%`);
    });

    it('should preserve data structure when service methods return data', async () => {
      const complexContactData = {
        id: 'contact-123',
        first_name: 'John',
        company: { id: 'company-1', name: 'Company A' },
        deals: [{ id: 'deal-1', value: 10000 }],
        activities: [{ id: 'activity-1', type: 'call' }],
        tags: ['vip', 'priority'],
        custom_fields: { industry: 'tech', source: 'linkedin' }
      };

      mockOrder.mockResolvedValue({ data: [complexContactData], error: null });

      const result = await contactsService.getUserContacts();

      expect(result[0]).toEqual(complexContactData);
      expect(result[0].company).toEqual({ id: 'company-1', name: 'Company A' });
      expect(result[0].deals).toHaveLength(1);
      expect(result[0].tags).toEqual(['vip', 'priority']);
    });
  });
});