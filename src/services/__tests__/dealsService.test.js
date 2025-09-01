import dealsService from '../dealsService';
import { supabase } from '../../lib/supabase';

// Mock the supabase client
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('dealsService', () => {
  let mockQuery;
  let mockSelect;
  let mockInsert;
  let mockUpdate;
  let mockDelete;
  let mockEq;
  let mockOrder;
  let mockSingle;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleError.mockClear();

    // Create chainable mock functions
    mockSelect = jest.fn().mockReturnThis();
    mockInsert = jest.fn().mockReturnThis();
    mockUpdate = jest.fn().mockReturnThis();
    mockDelete = jest.fn().mockReturnThis();
    mockEq = jest.fn().mockReturnThis();
    mockOrder = jest.fn().mockReturnThis();
    mockSingle = jest.fn();

    mockQuery = {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
    };

    supabase.from.mockReturnValue(mockQuery);
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('getUserDeals', () => {
    it('should fetch all user deals with related data', async () => {
      const mockDeals = [
        { 
          id: '1', 
          name: 'Deal 1', 
          value: 10000, 
          stage: 'qualified',
          company: { id: 'comp1', name: 'Company A' },
          contact: { id: 'cont1', first_name: 'John', last_name: 'Doe' }
        },
        { 
          id: '2', 
          name: 'Deal 2', 
          value: 25000, 
          stage: 'proposal',
          company: { id: 'comp2', name: 'Company B' },
          contact: { id: 'cont2', first_name: 'Jane', last_name: 'Smith' }
        }
      ];

      mockOrder.mockResolvedValue({ data: mockDeals, error: null });

      const result = await dealsService.getUserDeals();

      expect(supabase.from).toHaveBeenCalledWith('deals');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('company:companies!company_id'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('contact:contacts!contact_id'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('owner:user_profiles!owner_id'));
      expect(mockOrder).toHaveBeenCalledWith('updated_at', { ascending: false });
      expect(result).toEqual(mockDeals);
    });

    it('should handle empty results', async () => {
      mockOrder.mockResolvedValue({ data: null, error: null });

      const result = await dealsService.getUserDeals();

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const mockError = new Error('Database connection failed');
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      await expect(dealsService.getUserDeals()).rejects.toThrow('Database connection failed');
      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching user deals:', mockError);
    });

    it('should handle unexpected errors', async () => {
      const mockError = new Error('Unexpected error');
      mockOrder.mockRejectedValue(mockError);

      await expect(dealsService.getUserDeals()).rejects.toThrow('Unexpected error');
      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching user deals:', mockError);
    });
  });

  describe('getPipelineDeals', () => {
    it('should group deals by pipeline stage', async () => {
      const mockDeals = [
        { 
          id: '1', 
          name: 'Deal 1', 
          value: 10000, 
          stage: 'qualified', 
          probability: 50,
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-15T00:00:00.000Z'
        },
        { 
          id: '2', 
          name: 'Deal 2', 
          value: 25000, 
          stage: 'proposal', 
          probability: 75,
          created_at: '2025-01-10T00:00:00.000Z',
          updated_at: '2025-01-20T00:00:00.000Z'
        },
        { 
          id: '3', 
          name: 'Deal 3', 
          value: 5000, 
          stage: 'closed_won', 
          probability: 100,
          created_at: '2025-01-05T00:00:00.000Z',
          updated_at: '2025-01-25T00:00:00.000Z'
        }
      ];

      mockOrder.mockResolvedValue({ data: mockDeals, error: null });

      const result = await dealsService.getPipelineDeals();

      expect(supabase.from).toHaveBeenCalledWith('deals');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('updated_at', { ascending: false });

      // Check pipeline structure
      expect(result).toHaveProperty('lead');
      expect(result).toHaveProperty('qualified');
      expect(result).toHaveProperty('proposal');
      expect(result).toHaveProperty('negotiation');
      expect(result).toHaveProperty('closed_won');
      expect(result).toHaveProperty('closed_lost');

      // Check that deals are grouped correctly
      expect(result.qualified.deals).toHaveLength(1);
      expect(result.proposal.deals).toHaveLength(1);
      expect(result.closed_won.deals).toHaveLength(1);
      expect(result.lead.deals).toHaveLength(0);

      // Check deal structure
      const qualifiedDeal = result.qualified.deals[0];
      expect(qualifiedDeal).toEqual({
        id: '1',
        title: 'Deal 1',
        value: 10000,
        probability: 50,
        contact: 'Unknown Contact',
        company: 'Unknown Company',
        avatar: 'https://ui-avatars.com/api/?name=U+C&background=random',
        daysInStage: expect.any(Number),
        lastActivity: 'No activity'
      });
    });

    it('should handle deals with missing stage', async () => {
      const mockDeals = [
        { id: '1', name: 'Deal 1', value: 10000 }, // No stage property
        { id: '2', name: 'Deal 2', value: 25000, stage: null }, // Null stage
        { id: '3', name: 'Deal 3', value: 5000, stage: '' } // Empty stage
      ];

      mockOrder.mockResolvedValue({ data: mockDeals, error: null });

      const result = await dealsService.getPipelineDeals();

      // All deals should be placed in 'lead' stage by default
      expect(result.lead.deals).toHaveLength(3);
    });

    it('should handle deals with missing properties', async () => {
      const mockDeals = [
        { id: '1' }, // Missing name, value, probability
        { id: '2', stage: 'proposal' } // Missing other properties
      ];

      mockOrder.mockResolvedValue({ data: mockDeals, error: null });

      const result = await dealsService.getPipelineDeals();

      const leadDeal = result.lead.deals[0];
      expect(leadDeal).toEqual({
        id: '1',
        title: 'Untitled Deal',
        value: 0,
        probability: 0,
        contact: 'Unknown Contact',
        company: 'Unknown Company',
        avatar: 'https://ui-avatars.com/api/?name=U+C&background=random',
        daysInStage: expect.any(Number),
        lastActivity: 'No activity'
      });
    });

    it('should calculate daysInStage correctly', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockDeals = [
        { 
          id: '1', 
          name: 'Deal 1', 
          stage: 'qualified',
          updated_at: yesterday.toISOString()
        }
      ];

      mockOrder.mockResolvedValue({ data: mockDeals, error: null });

      const result = await dealsService.getPipelineDeals();

      const deal = result.qualified.deals[0];
      expect(deal.daysInStage).toBe(1);
    });

    it('should handle database errors', async () => {
      const mockError = new Error('Database error');
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      await expect(dealsService.getPipelineDeals()).rejects.toThrow('Database error');
      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching pipeline deals:', mockError);
    });
  });

  describe('getDealById', () => {
    it('should fetch deal by ID with all related data', async () => {
      const mockDeal = {
        id: 'deal-123',
        name: 'Important Deal',
        value: 50000,
        stage: 'negotiation',
        company: { id: 'comp1', name: 'Company A' },
        contact: { id: 'cont1', first_name: 'John', last_name: 'Doe' },
        activities: [{ id: 'act1', type: 'call', subject: 'Follow up call' }],
        documents: [{ id: 'doc1', name: 'proposal.pdf' }],
        tasks: [{ id: 'task1', title: 'Send quote' }]
      };

      mockSingle.mockResolvedValue({ data: mockDeal, error: null });

      const result = await dealsService.getDealById('deal-123');

      expect(supabase.from).toHaveBeenCalledWith('deals');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('company:companies!company_id'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('contact:contacts!contact_id'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('activities:activities'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('documents:documents'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('tasks:tasks'));
      expect(mockEq).toHaveBeenCalledWith('id', 'deal-123');
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockDeal);
    });

    it('should handle deal not found error', async () => {
      const mockError = { code: 'PGRST116' };
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(dealsService.getDealById('invalid-id')).rejects.toThrow('Deal not found');
      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching deal by ID:', expect.any(Error));
    });

    it('should handle other database errors', async () => {
      const mockError = new Error('Database connection failed');
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(dealsService.getDealById('deal-123')).rejects.toThrow('Database connection failed');
      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching deal by ID:', mockError);
    });
  });

  describe('createDeal', () => {
    it('should create new deal successfully', async () => {
      const dealData = {
        name: 'New Deal',
        value: 15000,
        stage: 'qualified',
        probability: 60,
        contact_id: 'cont1',
        company_id: 'comp1',
        owner_id: 'user1'
      };

      const mockCreatedDeal = {
        id: 'new-deal-123',
        ...dealData,
        company: { id: 'comp1', name: 'Company A' },
        contact: { id: 'cont1', first_name: 'John', last_name: 'Doe' }
      };

      mockSingle.mockResolvedValue({ data: mockCreatedDeal, error: null });

      const result = await dealsService.createDeal(dealData);

      expect(supabase.from).toHaveBeenCalledWith('deals');
      expect(mockInsert).toHaveBeenCalledWith([dealData]);
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('company:companies!company_id'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('contact:contacts!contact_id'));
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedDeal);
    });

    it('should handle creation errors', async () => {
      const dealData = { name: 'New Deal' };
      const mockError = new Error('Validation failed');
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(dealsService.createDeal(dealData)).rejects.toThrow('Validation failed');
      expect(mockConsoleError).toHaveBeenCalledWith('Error creating deal:', mockError);
    });

    it('should handle unexpected errors during creation', async () => {
      const dealData = { name: 'New Deal' };
      const mockError = new Error('Unexpected error');
      mockSingle.mockRejectedValue(mockError);

      await expect(dealsService.createDeal(dealData)).rejects.toThrow('Unexpected error');
      expect(mockConsoleError).toHaveBeenCalledWith('Error creating deal:', mockError);
    });
  });

  describe('updateDeal', () => {
    it('should update deal successfully', async () => {
      const dealId = 'deal-123';
      const updates = {
        name: 'Updated Deal Name',
        value: 20000,
        stage: 'proposal',
        probability: 80
      };

      const mockUpdatedDeal = {
        id: dealId,
        ...updates,
        updated_at: expect.any(String),
        company: { id: 'comp1', name: 'Company A' },
        contact: { id: 'cont1', first_name: 'John', last_name: 'Doe' }
      };

      mockSingle.mockResolvedValue({ data: mockUpdatedDeal, error: null });

      const result = await dealsService.updateDeal(dealId, updates);

      expect(supabase.from).toHaveBeenCalledWith('deals');
      expect(mockUpdate).toHaveBeenCalledWith({
        ...updates,
        updated_at: expect.any(String)
      });
      expect(mockEq).toHaveBeenCalledWith('id', dealId);
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('company:companies!company_id'));
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedDeal);
    });

    it('should handle deal not found during update', async () => {
      const mockError = { code: 'PGRST116' };
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(dealsService.updateDeal('invalid-id', {})).rejects.toThrow('Deal not found');
      expect(mockConsoleError).toHaveBeenCalledWith('Error updating deal:', expect.any(Error));
    });

    it('should handle other update errors', async () => {
      const mockError = new Error('Update validation failed');
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(dealsService.updateDeal('deal-123', {})).rejects.toThrow('Update validation failed');
      expect(mockConsoleError).toHaveBeenCalledWith('Error updating deal:', mockError);
    });

    it('should preserve existing updated_at if provided in updates', async () => {
      const updates = {
        name: 'Updated Deal',
        updated_at: '2025-01-15T10:00:00.000Z'
      };

      mockSingle.mockResolvedValue({ data: { id: 'deal-123', ...updates }, error: null });

      await dealsService.updateDeal('deal-123', updates);

      expect(mockUpdate).toHaveBeenCalledWith({
        name: 'Updated Deal',
        updated_at: expect.any(String) // Should be overridden with new timestamp
      });
    });
  });

  describe('deleteDeal', () => {
    it('should delete deal successfully', async () => {
      mockEq.mockResolvedValue({ error: null });

      const result = await dealsService.deleteDeal('deal-123');

      expect(supabase.from).toHaveBeenCalledWith('deals');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'deal-123');
      expect(result).toBe(true);
    });

    it('should handle deletion errors', async () => {
      const mockError = new Error('Foreign key constraint violation');
      mockEq.mockResolvedValue({ error: mockError });

      await expect(dealsService.deleteDeal('deal-123')).rejects.toThrow('Foreign key constraint violation');
      expect(mockConsoleError).toHaveBeenCalledWith('Error deleting deal:', mockError);
    });

    it('should handle unexpected errors during deletion', async () => {
      const mockError = new Error('Unexpected error');
      mockEq.mockRejectedValue(mockError);

      await expect(dealsService.deleteDeal('deal-123')).rejects.toThrow('Unexpected error');
      expect(mockConsoleError).toHaveBeenCalledWith('Error deleting deal:', mockError);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined deal IDs', async () => {
      mockSingle.mockResolvedValue({ data: null, error: null });

      await expect(dealsService.getDealById(null)).resolves.toBeNull();
      await expect(dealsService.getDealById(undefined)).resolves.toBeNull();

      expect(mockEq).toHaveBeenCalledWith('id', null);
      expect(mockEq).toHaveBeenCalledWith('id', undefined);
    });

    it('should handle empty deal data for creation', async () => {
      mockSingle.mockResolvedValue({ data: null, error: null });

      const result = await dealsService.createDeal({});

      expect(mockInsert).toHaveBeenCalledWith([{}]);
      expect(result).toBeNull();
    });

    it('should handle empty updates for deal update', async () => {
      mockSingle.mockResolvedValue({ data: { id: 'deal-123' }, error: null });

      await dealsService.updateDeal('deal-123', {});

      expect(mockUpdate).toHaveBeenCalledWith({
        updated_at: expect.any(String)
      });
    });

    it('should preserve complex data structures in pipeline deals', async () => {
      const mockDeals = [
        {
          id: '1',
          name: 'Complex Deal',
          value: 50000,
          stage: 'qualified',
          probability: 75,
          custom_fields: { source: 'website', priority: 'high' },
          metadata: { notes: 'Important client' },
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-15T00:00:00.000Z'
        }
      ];

      mockOrder.mockResolvedValue({ data: mockDeals, error: null });

      const result = await dealsService.getPipelineDeals();

      const deal = result.qualified.deals[0];
      expect(deal.id).toBe('1');
      expect(deal.title).toBe('Complex Deal');
      expect(deal.value).toBe(50000);
      expect(deal.probability).toBe(75);
    });

    it('should handle malformed dates in pipeline calculations', async () => {
      const mockDeals = [
        { 
          id: '1', 
          name: 'Deal 1', 
          stage: 'qualified',
          updated_at: 'invalid-date',
          created_at: null
        }
      ];

      mockOrder.mockResolvedValue({ data: mockDeals, error: null });

      const result = await dealsService.getPipelineDeals();

      const deal = result.qualified.deals[0];
      expect(deal.daysInStage).toBe(expect.any(Number));
      expect(deal.daysInStage).not.toBeNaN();
    });

    it('should handle database connection timeouts', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.code = 'CONNECTION_TIMEOUT';
      
      mockOrder.mockRejectedValue(timeoutError);

      await expect(dealsService.getUserDeals()).rejects.toThrow('Connection timeout');
      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching user deals:', timeoutError);
    });

    it('should handle invalid stage names in pipeline grouping', async () => {
      const mockDeals = [
        { id: '1', name: 'Deal 1', stage: 'invalid_stage' },
        { id: '2', name: 'Deal 2', stage: 'another_invalid_stage' }
      ];

      mockOrder.mockResolvedValue({ data: mockDeals, error: null });

      const result = await dealsService.getPipelineDeals();

      // Invalid stages should default to 'lead'
      expect(result.lead.deals).toHaveLength(2);
      expect(result.qualified.deals).toHaveLength(0);
    });
  });
});