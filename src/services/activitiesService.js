import { supabase } from '../lib/supabase';

export const activitiesService = {
  // Get all activities for the current user
  async getUserActivities(limit = 50) {
    console.log('Fetching user activities...');
    const { data, error } = await supabase
      ?.from('activities')
      ?.select('*') // Simplified select statement for debugging
      ?.order('created_at', { ascending: false })
      ?.limit(limit);

    if (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
    
    console.log('Fetched raw activities data:', data);
    return data || [];
  },

  // Get activities for a specific deal
  async getDealActivities(dealId) {
    const { data, error } = await supabase?.from('activities')?.select(`
        *,
        contact:contact_id(id, first_name, last_name, email),
        user:user_id(id, first_name, last_name, email)
      `)?.eq('deal_id', dealId)?.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get activities for a specific contact
  async getContactActivities(contactId) {
    const { data, error } = await supabase?.from('activities')?.select(`
        *,
        deal:deal_id(id, name, value, stage),
        user:user_id(id, first_name, last_name, email)
      `)?.eq('contact_id', contactId)?.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Create a new activity
  async createActivity(activityData) {
    const { data, error } = await supabase?.from('activities')?.insert([{
        ...activityData,
        created_at: new Date()?.toISOString()
      }])?.select(`
        *,
        deal:deal_id(id, name),
        contact:contact_id(id, first_name, last_name, email),
        user:user_id(id, first_name, last_name)
      `)?.single()

    if (error) throw error
    return data
  },

  // Update an activity
  async updateActivity(activityId, updates) {
    const { data, error } = await supabase?.from('activities')?.update(updates)?.eq('id', activityId)?.select(`
        *,
        deal:deal_id(id, name),
        contact:contact_id(id, first_name, last_name, email),
        user:user_id(id, first_name, last_name)
      `)?.single()

    if (error) throw error
    return data
  },

  // Delete an activity
  async deleteActivity(activityId) {
    const { error } = await supabase?.from('activities')?.delete()?.eq('id', activityId)

    if (error) throw error
    return true
  },

  // Log an email activity
  async logEmail(emailData) {
    return this.createActivity({
      type: 'email',
      subject: emailData?.subject,
      description: emailData?.content || emailData?.body,
      deal_id: emailData?.dealId,
      contact_id: emailData?.contactId,
      user_id: emailData?.userId
    });
  },

  // Log a call activity
  async logCall(callData) {
    return this.createActivity({
      type: 'call',
      subject: callData?.subject || 'Phone Call',
      description: callData?.summary || callData?.notes,
      duration_minutes: callData?.duration,
      deal_id: callData?.dealId,
      contact_id: callData?.contactId,
      user_id: callData?.userId,
      completed_at: callData?.completedAt || new Date()?.toISOString()
    });
  },

  // Log a meeting activity
  async logMeeting(meetingData) {
    return this.createActivity({
      type: 'meeting',
      subject: meetingData?.subject || 'Meeting',
      description: meetingData?.agenda || meetingData?.summary,
      duration_minutes: meetingData?.duration,
      deal_id: meetingData?.dealId,
      contact_id: meetingData?.contactId,
      user_id: meetingData?.userId,
      scheduled_at: meetingData?.scheduledAt,
      completed_at: meetingData?.completedAt
    });
  },

  // Log a note activity
  async logNote(noteData) {
    return this.createActivity({
      type: 'note',
      subject: noteData?.title || 'Note',
      description: noteData?.content,
      deal_id: noteData?.dealId,
      contact_id: noteData?.contactId,
      user_id: noteData?.userId
    });
  },

  // Get recent activity for dashboard
  async getRecentActivity(limit = 10) {
    const { data, error } = await supabase?.from('activities')?.select(`
        *,
        deal:deal_id(id, name, value),
        contact:contact_id(id, first_name, last_name, company:company_id(name)),
        user:user_id(id, first_name, last_name)
      `)?.order('created_at', { ascending: false })?.limit(limit)

    if (error) throw error

    // Transform data for dashboard display
    return data?.map(activity => ({
      id: activity?.id,
      type: activity?.type,
      title: activity?.subject,
      description: activity?.description,
      user: `${activity?.user?.first_name} ${activity?.user?.last_name}`,
      contact: activity?.contact ? `${activity?.contact?.first_name} ${activity?.contact?.last_name}` : null,
      company: activity?.contact?.company?.name,
      deal: activity?.deal?.name,
      time: activity?.created_at,
      icon: this.getActivityIcon(activity?.type)
    })) || [];
  },

  // Get activity statistics
  async getActivityStats(dateRange = null) {
    let query = supabase?.from('activities')?.select('type, created_at, duration_minutes')

    if (dateRange) {
      query = query?.gte('created_at', dateRange?.start)?.lte('created_at', dateRange?.end)
    }

    const { data, error } = await query

    if (error) throw error

    const stats = {
      total: data?.length || 0,
      emails: data?.filter(a => a?.type === 'email')?.length || 0,
      calls: data?.filter(a => a?.type === 'call')?.length || 0,
      meetings: data?.filter(a => a?.type === 'meeting')?.length || 0,
      notes: data?.filter(a => a?.type === 'note')?.length || 0,
      totalCallTime: data?.filter(a => a?.type === 'call' && a?.duration_minutes)?.reduce((sum, a) => sum + a?.duration_minutes, 0) || 0,
      avgCallDuration: 0
    }

    const callsWithDuration = data?.filter(a => a?.type === 'call' && a?.duration_minutes) || []
    if (callsWithDuration?.length > 0) {
      stats.avgCallDuration = Math.round(stats?.totalCallTime / callsWithDuration?.length)
    }

    return stats
  },

  // Filter activities
  async filterActivities(filters) {
    let query = supabase?.from('activities')?.select(`
        *,
        deal:deal_id(id, name, value),
        contact:contact_id(id, first_name, last_name, company:company_id(name)),
        user:user_id(id, first_name, last_name)
      `)

    if (filters?.types && filters?.types?.length > 0) {
      query = query?.in('type', filters?.types)
    }

    if (filters?.dealIds && filters?.dealIds?.length > 0) {
      query = query?.in('deal_id', filters?.dealIds)
    }

    if (filters?.contactIds && filters?.contactIds?.length > 0) {
      query = query?.in('contact_id', filters?.contactIds)
    }

    if (filters?.userIds && filters?.userIds?.length > 0) {
      query = query?.in('user_id', filters?.userIds)
    }

    if (filters?.dateRange) {
      query = query?.gte('created_at', filters?.dateRange?.start)?.lte('created_at', filters?.dateRange?.end)
    }

    const { data, error } = await query?.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Subscribe to activity changes
  subscribeToActivities(callback) {
    return supabase?.channel('activities_changes')?.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'activities' },
        callback
      )?.subscribe();
  },

  // Helper method to get activity icon
  getActivityIcon(type) {
    const icons = {
      email: 'Mail',
      call: 'Phone',
      meeting: 'Calendar',
      note: 'FileText',
      task: 'CheckSquare',
      demo: 'Play',
      proposal_sent: 'Send',
      document_shared: 'Share'
    }
    return icons?.[type] || 'Activity';
  }
}

export default activitiesService