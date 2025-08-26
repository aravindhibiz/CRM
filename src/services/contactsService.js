import { supabase } from '../lib/supabase';

export const contactsService = {
  // Get all contacts for the current user
  async getUserContacts() {
    const { data, error } = await supabase?.from('contacts')?.select(`
        *,
        company:company_id(id, name, industry, city, state),
        owner:owner_id(id, first_name, last_name, email),
        deals:deals(id, name, value, stage),
        activities:activities(id, type, subject, created_at)
      `)?.order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get a specific contact by ID
  async getContactById(contactId) {
    const { data, error } = await supabase?.from('contacts')?.select(`
        *,
        company:company_id(*),
        owner:owner_id(id, first_name, last_name, email),
        deals:deals(
          id, name, value, stage, expected_close_date, created_at
        ),
        activities:activities(
          id, type, subject, description, duration_minutes, created_at,
          user:user_id(first_name, last_name)
        ),
        tasks:tasks(
          id, title, description, status, priority, due_date, created_at,
          assigned_to:assigned_to(first_name, last_name)
        )
      `)?.eq('id', contactId)?.single()

    if (error) throw error
    return data
  },

  // Create a new contact
  async createContact(contactData) {
    // If company doesn't exist, create it first
    let companyId = contactData?.company_id
    
    if (!companyId && contactData?.companyName) {
      const { data: companyData, error: companyError } = await supabase?.from('companies')?.insert([{
          name: contactData?.companyName,
          industry: contactData?.industry || null
        }])?.select()?.single()

      if (companyError) throw companyError
      companyId = companyData?.id
    }

    // Remove companyName from the contact data before inserting
    const { companyName, ...cleanContactData } = contactData

    const { data, error } = await supabase?.from('contacts')?.insert([{
        ...cleanContactData,
        company_id: companyId,
        last_contact_date: new Date()?.toISOString()
      }])?.select(`
        *,
        company:company_id(id, name, industry),
        owner:owner_id(id, first_name, last_name, email)
      `)?.single()

    if (error) throw error
    return data
  },

  // Update a contact
  async updateContact(contactId, updates) {
    const { data, error } = await supabase?.from('contacts')?.update({
        ...updates,
        updated_at: new Date()?.toISOString()
      })?.eq('id', contactId)?.select(`
        *,
        company:company_id(id, name, industry),
        owner:owner_id(id, first_name, last_name, email)
      `)?.single()

    if (error) throw error
    return data
  },

  // Delete a contact
  async deleteContact(contactId) {
    const { error } = await supabase?.from('contacts')?.delete()?.eq('id', contactId)

    if (error) throw error
    return true
  },

  // Delete multiple contacts
  async deleteContacts(contactIds) {
    const { error } = await supabase?.from('contacts')?.delete()?.in('id', contactIds)

    if (error) throw error
    return true
  },

  // Search contacts
  async searchContacts(searchQuery) {
    const { data, error } = await supabase?.from('contacts')?.select(`
        *,
        company:company_id(id, name, industry)
      `)?.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)?.order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Filter contacts
  async filterContacts(filters) {
    let query = supabase?.from('contacts')?.select(`
        *,
        company:company_id(id, name, industry),
        owner:owner_id(id, first_name, last_name, email),
        deals:deals(id, name, value, stage)
      `)

    // Apply filters
    if (filters?.status && filters?.status?.length > 0) {
      query = query?.in('status', filters?.status)
    }

    if (filters?.companies && filters?.companies?.length > 0) {
      query = query?.in('company_id', filters?.companies)
    }

    if (filters?.leadSources && filters?.leadSources?.length > 0) {
      query = query?.in('lead_source', filters?.leadSources)
    }

    if (filters?.tags && filters?.tags?.length > 0) {
      query = query?.overlaps('tags', filters?.tags)
    }

    if (filters?.dateRange) {
      const { start, end } = filters?.dateRange
      query = query?.gte('last_contact_date', start)?.lte('last_contact_date', end)
    }

    const { data, error } = await query?.order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get contact statistics
  async getContactStats() {
    const { data, error } = await supabase?.from('contacts')?.select('status, lead_source, created_at')

    if (error) throw error

    const stats = {
      total: data?.length || 0,
      active: data?.filter(c => c?.status === 'active')?.length || 0,
      prospects: data?.filter(c => c?.status === 'prospect')?.length || 0,
      customers: data?.filter(c => c?.status === 'customer')?.length || 0,
      leadSources: {}
    }

    // Count by lead source
    data?.forEach(contact => {
      const source = contact?.lead_source || 'unknown'
      stats.leadSources[source] = (stats?.leadSources?.[source] || 0) + 1
    })

    return stats
  },

  // Subscribe to contact changes
  subscribeToContacts(callback) {
    return supabase?.channel('contacts_changes')?.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'contacts' },
        callback
      )?.subscribe();
  },

  // Import contacts (bulk create)
  async importContacts(contactsData) {
    const { data, error } = await supabase?.from('contacts')?.insert(contactsData?.map(contact => ({
        ...contact,
        last_contact_date: new Date()?.toISOString()
      })))?.select()

    if (error) throw error
    return data || []
  },

  // Merge duplicate contacts
  async mergeContacts(primaryContactId, duplicateContactId, mergedData) {
    // Start a transaction-like operation
    // First, update activities and deals to point to primary contact
    await supabase?.from('activities')?.update({ contact_id: primaryContactId })?.eq('contact_id', duplicateContactId)

    await supabase?.from('deals')?.update({ contact_id: primaryContactId })?.eq('contact_id', duplicateContactId)

    // Update primary contact with merged data
    const { data, error: updateError } = await supabase?.from('contacts')?.update(mergedData)?.eq('id', primaryContactId)?.select()?.single()

    if (updateError) throw updateError

    // Delete duplicate contact
    await supabase?.from('contacts')?.delete()?.eq('id', duplicateContactId)

    return data
  }
}

export default contactsService