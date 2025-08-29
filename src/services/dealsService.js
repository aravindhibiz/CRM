import { supabase } from '../lib/supabase';

export const dealsService = {
  // Get all deals for the current user
  async getUserDeals() {
    try {
      const { data, error } = await supabase?.from('deals')?.select(`
          *,
          company:companies!company_id(id, name, industry),
          contact:contacts!contact_id(id, first_name, last_name, email, position),
          owner:user_profiles!owner_id(id, first_name, last_name, email)
        `)?.order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching user deals:', err);
      throw err;
    }
  },

  // Get deals grouped by pipeline stage
  async getPipelineDeals() {
    try {
      // SIMPLE VERSION - just get basic deal data
      const { data, error } = await supabase?.from('deals')?.select('*')?.order('updated_at', { ascending: false });

      if (error) throw error;

      // Group deals by stage
      const pipelineData = {
        lead: { id: 'lead', title: 'Lead', deals: [] },
        qualified: { id: 'qualified', title: 'Qualified', deals: [] },
        proposal: { id: 'proposal', title: 'Proposal', deals: [] },
        negotiation: { id: 'negotiation', title: 'Negotiation', deals: [] },
        closed_won: { id: 'closed_won', title: 'Closed Won', deals: [] },
        closed_lost: { id: 'closed_lost', title: 'Closed Lost', deals: [] }
      };

      (data || []).forEach(deal => {
        const stage = deal?.stage || 'lead';
        if (pipelineData?.[stage]) {
          pipelineData?.[stage]?.deals?.push({
            id: deal?.id,
            title: deal?.name || 'Untitled Deal',
            value: deal?.value || 0,
            probability: deal?.probability || 0,
            contact: 'Unknown Contact', // Will be populated later
            company: 'Unknown Company', // Will be populated later
            avatar: 'https://ui-avatars.com/api/?name=U+C&background=random',
            daysInStage: Math.floor((new Date() - new Date(deal?.updated_at || deal?.created_at)) / (1000 * 60 * 60 * 24)),
            lastActivity: 'No activity'
          });
        }
      });

      return pipelineData;
    } catch (err) {
      console.error('Error fetching pipeline deals:', err);
      throw err;
    }
  },

  // Get a specific deal by ID
  async getDealById(dealId) {
    try {
      const { data, error } = await supabase?.from('deals')?.select(`
          *,
          company:companies!company_id(id, name, industry, phone, website),
          contact:contacts!contact_id(id, first_name, last_name, email, phone, position),
          owner:user_profiles!owner_id(id, first_name, last_name, email),
          activities:activities(
            id, type, subject, description, duration_minutes, 
            created_at, user:user_profiles!user_id(first_name, last_name)
          ),
          documents:documents(
            id, name, file_url, file_size, document_type, created_at,
            uploaded_by:user_profiles!uploaded_by(first_name, last_name)
          ),
          tasks:tasks(
            id, title, description, status, priority, due_date, created_at,
            assigned_to:user_profiles!assigned_to(first_name, last_name)
          )
        `)?.eq('id', dealId)?.single();

      if (error) {
        if (error?.code === 'PGRST116') {
          throw new Error('Deal not found');
        }
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Error fetching deal by ID:', err);
      throw err;
    }
  },

  // Create a new deal
  async createDeal(dealData) {
    try {
      const { data, error } = await supabase?.from('deals')?.insert([dealData])?.select(`
          *,
          company:companies!company_id(id, name, industry),
          contact:contacts!contact_id(id, first_name, last_name, email)
        `)?.single();

      if (error) throw error;
      
      return data;
    } catch (err) {
      console.error('Error creating deal:', err);
      throw err;
    }
  },

  // Update a deal
  async updateDeal(dealId, updates) {
    try {
      const { data, error } = await supabase?.from('deals')?.update({
          ...updates,
          updated_at: new Date()?.toISOString()
        })?.eq('id', dealId)?.select(`
          *,
          company:companies!company_id(id, name, industry),
          contact:contacts!contact_id(id, first_name, last_name, email)
        `)?.single();

      if (error) {
        if (error?.code === 'PGRST116') {
          throw new Error('Deal not found');
        }
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Error updating deal:', err);
      throw err;
    }
  },

  // Delete a deal
  async deleteDeal(dealId) {
    try {
      const { error } = await supabase?.from('deals')?.delete()?.eq('id', dealId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting deal:', err);
      throw err;
    }
  },

  // Update deal stage (for drag and drop)
  async updateDealStage(dealId, newStage) {
    try {
      const stageProbs = {
        lead: 10,
        qualified: 25,
        proposal: 50,
        negotiation: 75,
        closed_won: 100,
        closed_lost: 0
      };

      const { data, error } = await supabase?.from('deals')?.update({
          stage: newStage,
          probability: stageProbs?.[newStage] || 10,
          updated_at: new Date()?.toISOString()
        })?.eq('id', dealId)?.select(`
          *,
          company:companies!company_id(id, name, industry),
          contact:contacts!contact_id(id, first_name, last_name, email)
        `)?.single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error updating deal stage:', err);
      throw err;
    }
  },

  // Subscribe to deal changes
  subscribeToDeals(callback) {
    try {
      return supabase?.channel('deals_changes')?.on('postgres_changes', 
          { event: '*', schema: 'public', table: 'deals' },
          callback
        )?.subscribe();
    } catch (err) {
      console.error('Error setting up deals subscription:', err);
      return null;
    }
  },

  // Get revenue forecast data
  async getRevenueData() {
    try {
      const { data, error } = await supabase?.from('deals')?.select('value, expected_close_date, actual_close_date, stage')?.not('expected_close_date', 'is', null);

      if (error) throw error;

      // Process data for chart (simplified forecast calculation)
      const monthlyData = {};
      const currentYear = new Date()?.getFullYear();
      
      for (let month = 0; month < 12; month++) {
        const monthKey = new Date(currentYear, month)?.toLocaleString('default', { month: 'short' });
        monthlyData[monthKey] = { month: monthKey, forecast: 0, actual: 0, target: 208333 };
      }

      data?.forEach(deal => {
        const closeDate = new Date(deal?.expected_close_date);
        const monthKey = closeDate?.toLocaleString('default', { month: 'short' });
        
        if (monthlyData?.[monthKey]) {
          monthlyData[monthKey].forecast += deal?.value || 0;
          
          if (deal?.stage === 'closed_won' && deal?.actual_close_date) {
            monthlyData[monthKey].actual += deal?.value || 0;
          }
        }
      });

      return Object.values(monthlyData);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      throw err;
    }
  },

  // Get performance metrics
  async getPerformanceMetrics() {
    try {
      const { data: deals, error } = await supabase?.from('deals')?.select('value, stage, created_at');

      if (error) throw error;

      const wonDeals = deals?.filter(d => d?.stage === 'closed_won') || [];
      const lostDeals = deals?.filter(d => d?.stage === 'closed_lost') || [];
      const totalValue = wonDeals?.reduce((sum, deal) => sum + (deal?.value || 0), 0);
      const avgDealSize = wonDeals?.length > 0 ? totalValue / wonDeals?.length : 0;
      const conversionRate = deals?.length > 0 ? (wonDeals?.length / deals?.length) * 100 : 0;

      return {
        quota: 2500000, // This could come from user settings
        achieved: totalValue,
        percentage: totalValue > 0 ? Math.round((totalValue / 2500000) * 100) : 0,
        dealsWon: wonDeals?.length,
        dealsLost: lostDeals?.length,
        avgDealSize: Math.round(avgDealSize),
        conversionRate: Math.round(conversionRate * 10) / 10
      };
    } catch (err) {
      console.error('Error fetching performance metrics:', err);
      throw err;
    }
  },

  // Get win rate data
  async getWinRateData() {
    try {
      const { data: deals, error } = await supabase?.from('deals')?.select('stage, created_at');
      
      if (error) throw error;

      // Group deals by month and calculate win rates
      const monthlyWinRate = {};
      const currentYear = new Date()?.getFullYear();
      
      for (let month = 0; month < 12; month++) {
        const monthKey = new Date(currentYear, month)?.toLocaleString('default', { month: 'short' });
        monthlyWinRate[monthKey] = { period: monthKey, won: 0, total: 0, winRate: 0 };
      }

      deals?.forEach(deal => {
        const createdDate = new Date(deal?.created_at);
        const monthKey = createdDate?.toLocaleString('default', { month: 'short' });
        
        if (monthlyWinRate?.[monthKey]) {
          monthlyWinRate[monthKey].total += 1;
          if (deal?.stage === 'closed_won') {
            monthlyWinRate[monthKey].won += 1;
          }
        }
      });

      // Calculate win rates
      Object.values(monthlyWinRate).forEach(month => {
        month.winRate = month.total > 0 ? Math.round((month.won / month.total) * 100) : 0;
      });

      return Object.values(monthlyWinRate);
    } catch (err) {
      console.error('Error fetching win rate data:', err);
      throw err;
    }
  }
};

export default dealsService;