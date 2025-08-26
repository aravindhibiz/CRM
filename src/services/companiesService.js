import { supabase } from '../lib/supabase';

export const companiesService = {
  // Get all companies (public read access)
  async getAllCompanies() {
    const { data, error } = await supabase?.from('companies')?.select(`
        *,
        contacts:contacts(count),
        deals:deals(count)
      `)?.order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get a specific company by ID
  async getCompanyById(companyId) {
    const { data, error } = await supabase?.from('companies')?.select(`
        *,
        contacts:contacts(
          id, first_name, last_name, email, phone, position, status,
          owner:owner_id(first_name, last_name)
        ),
        deals:deals(
          id, name, value, stage, expected_close_date,
          owner:owner_id(first_name, last_name),
          contact:contact_id(first_name, last_name)
        )
      `)?.eq('id', companyId)?.single()

    if (error) throw error
    return data
  },

  // Create a new company
  async createCompany(companyData) {
    const { data, error } = await supabase?.from('companies')?.insert([companyData])?.select()?.single()

    if (error) throw error
    return data
  },

  // Update a company
  async updateCompany(companyId, updates) {
    const { data, error } = await supabase?.from('companies')?.update({
        ...updates,
        updated_at: new Date()?.toISOString()
      })?.eq('id', companyId)?.select()?.single()

    if (error) throw error
    return data
  },

  // Delete a company
  async deleteCompany(companyId) {
    const { error } = await supabase?.from('companies')?.delete()?.eq('id', companyId)

    if (error) throw error
    return true
  },

  // Search companies
  async searchCompanies(searchQuery) {
    const { data, error } = await supabase?.from('companies')?.select('*')?.or(`name.ilike.%${searchQuery}%,domain.ilike.%${searchQuery}%,industry.ilike.%${searchQuery}%`)?.order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get companies by industry
  async getCompaniesByIndustry(industry) {
    const { data, error } = await supabase?.from('companies')?.select('*')?.ilike('industry', `%${industry}%`)?.order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get company statistics
  async getCompanyStats() {
    const { data, error } = await supabase?.from('companies')?.select('industry, size_range, created_at')

    if (error) throw error

    const stats = {
      total: data?.length || 0,
      byIndustry: {},
      bySize: {},
      recentlyAdded: data?.filter(c => 
        new Date(c.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      )?.length || 0
    }

    // Group by industry
    data?.forEach(company => {
      const industry = company?.industry || 'Unknown'
      stats.byIndustry[industry] = (stats?.byIndustry?.[industry] || 0) + 1
    })

    // Group by size
    data?.forEach(company => {
      const size = company?.size_range || 'Unknown'
      stats.bySize[size] = (stats?.bySize?.[size] || 0) + 1
    })

    return stats
  },

  // Get companies with deal potential (have contacts but no active deals)
  async getCompaniesWithPotential() {
    const { data, error } = await supabase?.from('companies')?.select(`
        *,
        contacts:contacts(count),
        active_deals:deals(count).eq('stage', 'closed_won')
      `)?.gt('contacts.count', 0)?.eq('active_deals.count', 0)?.order('contacts.count', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Filter companies
  async filterCompanies(filters) {
    let query = supabase?.from('companies')?.select(`
        *,
        contacts:contacts(count),
        deals:deals(count)
      `)

    if (filters?.industries && filters?.industries?.length > 0) {
      query = query?.in('industry', filters?.industries)
    }

    if (filters?.sizes && filters?.sizes?.length > 0) {
      query = query?.in('size_range', filters?.sizes)
    }

    if (filters?.locations && filters?.locations?.length > 0) {
      query = query?.in('city', filters?.locations)
    }

    if (filters?.hasContacts !== undefined) {
      if (filters?.hasContacts) {
        query = query?.gt('contacts.count', 0)
      } else {
        query = query?.eq('contacts.count', 0)
      }
    }

    if (filters?.hasDeals !== undefined) {
      if (filters?.hasDeals) {
        query = query?.gt('deals.count', 0)
      } else {
        query = query?.eq('deals.count', 0)
      }
    }

    const { data, error } = await query?.order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get company insights
  async getCompanyInsights(companyId) {
    // Get company with detailed relationships
    const { data: company, error: companyError } = await supabase?.from('companies')?.select(`
        *,
        contacts:contacts(
          id, first_name, last_name, email, status, position, created_at
        ),
        deals:deals(
          id, name, value, stage, expected_close_date, created_at
        ),
        activities:activities(
          id, type, subject, created_at,
          contact:contact_id(first_name, last_name)
        )
      `)?.eq('id', companyId)?.single()

    if (companyError) throw companyError

    // Calculate insights
    const deals = company?.deals || []
    const contacts = company?.contacts || []
    const activities = company?.activities || []

    const totalDealValue = deals?.reduce((sum, deal) => sum + (deal?.value || 0), 0)
    const wonDeals = deals?.filter(d => d?.stage === 'closed_won')
    const lostDeals = deals?.filter(d => d?.stage === 'closed_lost')
    const activeDealValue = deals?.filter(d => 
      !['closed_won', 'closed_lost']?.includes(d?.stage)
    )?.reduce((sum, deal) => sum + (deal?.value || 0), 0)

    const insights = {
      company,
      summary: {
        totalContacts: contacts?.length,
        totalDeals: deals?.length,
        totalDealValue,
        activeDealValue,
        wonDealsCount: wonDeals?.length,
        lostDealsCount: lostDeals?.length,
        totalActivities: activities?.length,
        winRate: deals?.length > 0 ? (wonDeals?.length / deals?.length) * 100 : 0
      },
      recentActivity: activities?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))?.slice(0, 10),
      dealsByStage: deals?.reduce((acc, deal) => {
        const stage = deal?.stage || 'unknown'
        acc[stage] = (acc?.[stage] || 0) + 1
        return acc
      }, {}),
      contactsByStatus: contacts?.reduce((acc, contact) => {
        const status = contact?.status || 'unknown'
        acc[status] = (acc?.[status] || 0) + 1
        return acc
      }, {}),
      relationshipHealth: this.calculateRelationshipHealth(activities, contacts, deals)
    }

    return insights
  },

  // Helper method to calculate relationship health
  calculateRelationshipHealth(activities, contacts, deals) {
    let score = 0
    const factors = []

    // Activity frequency (last 30 days)
    const recentActivities = activities?.filter(a => 
      new Date(a.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )
    if (recentActivities?.length >= 5) {
      score += 30
      factors?.push('High activity level')
    } else if (recentActivities?.length >= 2) {
      score += 20
      factors?.push('Moderate activity level')
    } else {
      factors?.push('Low activity level')
    }

    // Multiple contacts
    if (contacts?.length >= 3) {
      score += 25
      factors?.push('Multiple contacts')
    } else if (contacts?.length >= 2) {
      score += 15
      factors?.push('Good contact coverage')
    }

    // Active deals
    const activeDeals = deals?.filter(d => 
      !['closed_won', 'closed_lost']?.includes(d?.stage)
    )
    if (activeDeals?.length >= 2) {
      score += 25
      factors?.push('Multiple active opportunities')
    } else if (activeDeals?.length === 1) {
      score += 15
      factors?.push('Active opportunity')
    }

    // Deal success rate
    const wonDeals = deals?.filter(d => d?.stage === 'closed_won')
    if (deals?.length > 0) {
      const winRate = wonDeals?.length / deals?.length
      if (winRate >= 0.5) {
        score += 20
        factors?.push('High win rate')
      } else if (winRate >= 0.25) {
        score += 10
        factors?.push('Moderate win rate')
      }
    }

    return {
      score: Math.min(score, 100),
      level: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor',
      factors
    }
  },

  // Subscribe to company changes
  subscribeToCompanies(callback) {
    return supabase?.channel('companies_changes')?.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'companies' },
        callback
      )?.subscribe();
  }
}

export default companiesService