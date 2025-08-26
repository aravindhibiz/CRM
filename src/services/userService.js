import { supabase } from '../lib/supabase';

export const userService = {
  // Get all users (admin only)
  async getAllUsers() {
    const { data, error } = await supabase?.from('user_profiles')?.select(`
        *,
        created_at,
        updated_at
      `)?.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get current user profile
  async getCurrentUserProfile() {
    const { data: { user } } = await supabase?.auth?.getUser()
    
    if (!user) return null

    const { data, error } = await supabase?.from('user_profiles')?.select('*')?.eq('id', user?.id)?.single()

    if (error && error?.code !== 'PGRST116') throw error
    return data
  },

  // Create user profile (called automatically by trigger)
  async createUserProfile(userData) {
    const { data, error } = await supabase?.from('user_profiles')?.insert([{
        id: userData?.id,
        email: userData?.email,
        first_name: userData?.first_name || '',
        last_name: userData?.last_name || '',
        role: userData?.role || 'sales_rep',
        is_active: true
      }])?.select()?.single()

    if (error) throw error
    return data
  },

  // Update user profile
  async updateUserProfile(userId, updates) {
    const { data, error } = await supabase?.from('user_profiles')?.update({
        ...updates,
        updated_at: new Date()?.toISOString()
      })?.eq('id', userId)?.select()?.single()

    if (error) throw error
    return data
  },

  // Invite new user
  async inviteUser(inviteData) {
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase?.auth?.admin?.inviteUserByEmail(
        inviteData?.email,
        {
          data: {
            first_name: inviteData?.firstName || '',
            last_name: inviteData?.lastName || '',
            role: inviteData?.role || 'sales_rep'
          },
          redirectTo: `${window.location?.origin}/login`
        }
      );

      if (authError) throw authError

      return { user: authData?.user }
    } catch (error) {
      // Fallback for regular signup if admin invite fails
      const { data, error: signupError } = await supabase?.auth?.signUp({
        email: inviteData?.email,
        password: this.generateTempPassword(),
        options: {
          data: {
            first_name: inviteData?.firstName || '',
            last_name: inviteData?.lastName || '',
            role: inviteData?.role || 'sales_rep'
          }
        }
      });

      if (signupError) throw signupError
      return { user: data?.user }
    }
  },

  // Deactivate user
  async deactivateUser(userId) {
    const { data, error } = await supabase?.from('user_profiles')?.update({
        is_active: false,
        updated_at: new Date()?.toISOString()
      })?.eq('id', userId)?.select()?.single()

    if (error) throw error
    return data
  },

  // Activate user
  async activateUser(userId) {
    const { data, error } = await supabase?.from('user_profiles')?.update({
        is_active: true,
        updated_at: new Date()?.toISOString()
      })?.eq('id', userId)?.select()?.single()

    if (error) throw error
    return data
  },

  // Delete user (soft delete by deactivation)
  async deleteUser(userId) {
    return this.deactivateUser(userId)
  },

  // Bulk update users
  async bulkUpdateUsers(userIds, updates) {
    const { data, error } = await supabase?.from('user_profiles')?.update({
        ...updates,
        updated_at: new Date()?.toISOString()
      })?.in('id', userIds)?.select()

    if (error) throw error
    return data || []
  },

  // Get user statistics
  async getUserStats() {
    const { data, error } = await supabase?.from('user_profiles')?.select('role, is_active, created_at')

    if (error) throw error

    const stats = {
      total: data?.length || 0,
      active: data?.filter(u => u?.is_active)?.length || 0,
      inactive: data?.filter(u => !u?.is_active)?.length || 0,
      byRole: {},
      recentlyJoined: data?.filter(u => 
        new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      )?.length || 0
    }

    // Group by role
    data?.forEach(user => {
      const role = user?.role || 'unknown'
      stats.byRole[role] = (stats?.byRole?.[role] || 0) + 1
    })

    return stats
  },

  // Search users
  async searchUsers(searchQuery) {
    const { data, error } = await supabase?.from('user_profiles')?.select('*')?.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)?.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Filter users
  async filterUsers(filters) {
    let query = supabase?.from('user_profiles')?.select('*')

    if (filters?.roles && filters?.roles?.length > 0) {
      query = query?.in('role', filters?.roles)
    }

    if (filters?.status !== undefined) {
      query = query?.eq('is_active', filters?.status === 'active')
    }

    if (filters?.territories && filters?.territories?.length > 0) {
      query = query?.in('territory', filters?.territories)
    }

    const { data, error } = await query?.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get user activity summary
  async getUserActivitySummary(userId, days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)?.toISOString()

    const [activities, tasks, deals] = await Promise.all([
      supabase?.from('activities')?.select('id, created_at')?.eq('user_id', userId)?.gte('created_at', startDate),
      supabase?.from('tasks')?.select('id, status, created_at')?.eq('assigned_to', userId)?.gte('created_at', startDate),
      supabase?.from('deals')?.select('id, stage, value, created_at')?.eq('owner_id', userId)?.gte('created_at', startDate)
    ]);

    const summary = {
      totalActivities: activities?.data?.length || 0,
      totalTasks: tasks?.data?.length || 0,
      completedTasks: tasks?.data?.filter(t => t?.status === 'completed')?.length || 0,
      totalDeals: deals?.data?.length || 0,
      wonDeals: deals?.data?.filter(d => d?.stage === 'closed_won')?.length || 0,
      totalDealValue: deals?.data?.reduce((sum, deal) => sum + (deal?.value || 0), 0) || 0,
      period: days
    }

    return summary
  },

  // Subscribe to user changes
  subscribeToUsers(callback) {
    return supabase?.channel('user_profiles_changes')?.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_profiles' },
        callback
      )?.subscribe();
  },

  // Helper method to generate temporary password
  generateTempPassword() {
    return Math.random()?.toString(36)?.slice(-8) + Math.random()?.toString(36)?.slice(-8)?.toUpperCase()
  },

  // Get user roles enumeration
  getUserRoles() {
    return [
      { value: 'admin', label: 'Administrator' },
      { value: 'manager', label: 'Sales Manager' },
      { value: 'sales_rep', label: 'Sales Representative' },
      { value: 'user', label: 'User' }
    ]
  }
}

export default userService