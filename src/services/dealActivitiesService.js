import { supabase } from '../lib/supabase';

export const dealActivitiesService = {
  // Get all activities for a specific deal
  async getDealActivities(dealId) {
    if (!dealId) {
      throw new Error('Deal ID is required');
    }

    try {
      const { data, error } = await supabase?.from('activities')?.select(`
          *,
          contact:contact_id(id, first_name, last_name, email, company:company_id(name)),
          user:user_id(id, first_name, last_name, email)
        `)?.eq('deal_id', dealId)?.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform data for UI
      return data?.map(activity => ({
        id: activity?.id,
        type: activity?.type,
        title: activity?.subject,
        description: activity?.description,
        timestamp: activity?.created_at,
        user: activity?.user ? `${activity?.user?.first_name} ${activity?.user?.last_name}` : 'Unknown User',
        dealId: activity?.deal_id,
        contact: activity?.contact ? `${activity?.contact?.first_name} ${activity?.contact?.last_name}` : null,
        company: activity?.contact?.company?.name || null,
        duration: activity?.duration_minutes,
        scheduledAt: activity?.scheduled_at,
        completedAt: activity?.completed_at
      })) || [];
    } catch (error) {
      console.error('Error fetching deal activities:', error);
      throw error;
    }
  },

  // Create a new activity for a deal
  async createActivity(activityData) {
    try {
      const { data: user } = await supabase?.auth?.getUser();
      if (!user?.user?.id) {
        throw new Error('User must be logged in to create activities');
      }

      const newActivity = {
        type: activityData?.type || 'note',
        subject: activityData?.title || activityData?.subject,
        description: activityData?.description,
        deal_id: activityData?.dealId,
        contact_id: activityData?.contactId || null,
        user_id: user?.user?.id,
        duration_minutes: activityData?.duration || null,
        scheduled_at: activityData?.scheduledAt || null,
        completed_at: activityData?.completedAt || null,
        created_at: new Date()?.toISOString()
      };

      const { data, error } = await supabase?.from('activities')?.insert([newActivity])?.select(`
          *,
          contact:contact_id(id, first_name, last_name, email),
          user:user_id(id, first_name, last_name, email)
        `)?.single();

      if (error) {
        throw error;
      }

      // Transform data for UI
      return {
        id: data?.id,
        type: data?.type,
        title: data?.subject,
        description: data?.description,
        timestamp: data?.created_at,
        user: data?.user ? `${data?.user?.first_name} ${data?.user?.last_name}` : 'Unknown User',
        dealId: data?.deal_id,
        contact: data?.contact ? `${data?.contact?.first_name} ${data?.contact?.last_name}` : null,
        duration: data?.duration_minutes,
        scheduledAt: data?.scheduled_at,
        completedAt: data?.completed_at
      };
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  },

  // Delete an activity
  async deleteActivity(activityId) {
    try {
      const { data: user } = await supabase?.auth?.getUser();
      if (!user?.user?.id) {
        throw new Error('User must be logged in to delete activities');
      }

      const { error } = await supabase?.from('activities')?.delete()?.eq('id', activityId)?.eq('user_id', user?.user?.id); // Only allow deleting own activities

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  },

  // Subscribe to activity changes for real-time updates
  subscribeToActivityChanges(dealId, callback) {
    if (!dealId || !callback) {
      throw new Error('Deal ID and callback are required for subscription');
    }

    const channel = supabase?.channel(`deal_activities_${dealId}`)?.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `deal_id=eq.${dealId}`
        },
        (payload) => {
          callback(payload);
        }
      )?.subscribe();

    return channel;
  },

  // Unsubscribe from activity changes
  unsubscribeFromActivityChanges(channel) {
    if (channel) {
      supabase?.removeChannel(channel);
    }
  }
};

export default dealActivitiesService;