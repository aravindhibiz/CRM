import { supabase } from '../lib/supabase';

export const tasksService = {
  // Get all tasks for the current user
  async getUserTasks() {
    const { data, error } = await supabase?.from('tasks')?.select(`
        *,
        deal:deal_id(id, name, value, stage),
        contact:contact_id(id, first_name, last_name, email, company:company_id(name)),
        assigned_to:assigned_to(id, first_name, last_name, email),
        created_by:created_by(id, first_name, last_name, email)
      `)?.or(`assigned_to.eq.${(await supabase?.auth?.getUser())?.data?.user?.id},created_by.eq.${(await supabase?.auth?.getUser())?.data?.user?.id}`)?.order('due_date', { ascending: true, nullsLast: true })

    if (error) throw error
    return data || []
  },

  // Get upcoming tasks (next 7 days)
  async getUpcomingTasks(days = 7) {
    const endDate = new Date()
    endDate?.setDate(endDate?.getDate() + days)

    const { data, error } = await supabase?.from('tasks')?.select(`
        *,
        deal:deal_id(id, name, value),
        contact:contact_id(id, first_name, last_name, company:company_id(name)),
        assigned_to:assigned_to(id, first_name, last_name)
      `)?.eq('assigned_to', (await supabase?.auth?.getUser())?.data?.user?.id)?.neq('status', 'completed')?.lte('due_date', endDate?.toISOString())?.order('due_date', { ascending: true })

    if (error) throw error

    // Transform for dashboard display
    return data?.map(task => ({
      id: task?.id,
      title: task?.title,
      description: task?.description,
      priority: task?.priority,
      dueDate: task?.due_date,
      status: task?.status,
      deal: task?.deal?.name,
      contact: task?.contact ? `${task?.contact?.first_name} ${task?.contact?.last_name}` : null,
      company: task?.contact?.company?.name,
      isOverdue: task?.due_date && new Date(task.due_date) < new Date(),
      daysUntilDue: task?.due_date ? 
        Math.ceil((new Date(task.due_date) - new Date()) / (1000 * 60 * 60 * 24)) : null
    })) || [];
  },

  // Get tasks for a specific deal
  async getDealTasks(dealId) {
    const { data, error } = await supabase?.from('tasks')?.select(`
        *,
        assigned_to:assigned_to(id, first_name, last_name, email),
        created_by:created_by(id, first_name, last_name, email)
      `)?.eq('deal_id', dealId)?.order('due_date', { ascending: true, nullsLast: true })

    if (error) throw error
    return data || []
  },

  // Create a new task
  async createTask(taskData) {
    const { data, error } = await supabase?.from('tasks')?.insert([{
        ...taskData,
        created_at: new Date()?.toISOString()
      }])?.select(`
        *,
        deal:deal_id(id, name),
        contact:contact_id(id, first_name, last_name),
        assigned_to:assigned_to(id, first_name, last_name),
        created_by:created_by(id, first_name, last_name)
      `)?.single()

    if (error) throw error
    return data
  },

  // Update a task
  async updateTask(taskId, updates) {
    const updateData = {
      ...updates,
      updated_at: new Date()?.toISOString()
    }

    // If marking as completed, set completed_at timestamp
    if (updates?.status === 'completed' && !updates?.completed_at) {
      updateData.completed_at = new Date()?.toISOString()
    }

    const { data, error } = await supabase?.from('tasks')?.update(updateData)?.eq('id', taskId)?.select(`
        *,
        deal:deal_id(id, name),
        contact:contact_id(id, first_name, last_name),
        assigned_to:assigned_to(id, first_name, last_name)
      `)?.single()

    if (error) throw error
    return data
  },

  // Mark task as completed
  async completeTask(taskId) {
    return this.updateTask(taskId, {
      status: 'completed',
      completed_at: new Date()?.toISOString()
    });
  },

  // Delete a task
  async deleteTask(taskId) {
    const { error } = await supabase?.from('tasks')?.delete()?.eq('id', taskId)

    if (error) throw error
    return true
  },

  // Get task statistics
  async getTaskStats() {
    const { data, error } = await supabase?.from('tasks')?.select('status, priority, due_date, created_at')?.eq('assigned_to', (await supabase?.auth?.getUser())?.data?.user?.id)

    if (error) throw error

    const now = new Date()
    const stats = {
      total: data?.length || 0,
      pending: data?.filter(t => t?.status === 'pending')?.length || 0,
      inProgress: data?.filter(t => t?.status === 'in_progress')?.length || 0,
      completed: data?.filter(t => t?.status === 'completed')?.length || 0,
      overdue: data?.filter(t => 
        t?.due_date && 
        new Date(t.due_date) < now && 
        t?.status !== 'completed'
      )?.length || 0,
      highPriority: data?.filter(t => 
        t?.priority === 'high' || t?.priority === 'urgent'
      )?.length || 0
    }

    stats.completionRate = stats?.total > 0 ? 
      Math.round((stats?.completed / stats?.total) * 100) : 0

    return stats
  },

  // Filter tasks
  async filterTasks(filters) {
    let query = supabase?.from('tasks')?.select(`
        *,
        deal:deal_id(id, name, value),
        contact:contact_id(id, first_name, last_name, company:company_id(name)),
        assigned_to:assigned_to(id, first_name, last_name)
      `)

    // Only get tasks assigned to or created by current user
    const currentUser = (await supabase?.auth?.getUser())?.data?.user
    if (currentUser) {
      query = query?.or(`assigned_to.eq.${currentUser?.id},created_by.eq.${currentUser?.id}`)
    }

    if (filters?.status && filters?.status?.length > 0) {
      query = query?.in('status', filters?.status)
    }

    if (filters?.priority && filters?.priority?.length > 0) {
      query = query?.in('priority', filters?.priority)
    }

    if (filters?.dealIds && filters?.dealIds?.length > 0) {
      query = query?.in('deal_id', filters?.dealIds)
    }

    if (filters?.assignedTo && filters?.assignedTo?.length > 0) {
      query = query?.in('assigned_to', filters?.assignedTo)
    }

    if (filters?.dueDateRange) {
      query = query?.gte('due_date', filters?.dueDateRange?.start)?.lte('due_date', filters?.dueDateRange?.end)
    }

    if (filters?.overdue) {
      query = query?.lt('due_date', new Date()?.toISOString())?.neq('status', 'completed')
    }

    const { data, error } = await query?.order('due_date', { ascending: true, nullsLast: true })

    if (error) throw error
    return data || []
  },

  // Subscribe to task changes
  subscribeToTasks(callback) {
    return supabase?.channel('tasks_changes')?.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' },
        callback
      )?.subscribe();
  },

  // Bulk update tasks
  async bulkUpdateTasks(taskIds, updates) {
    const { data, error } = await supabase?.from('tasks')?.update({
        ...updates,
        updated_at: new Date()?.toISOString()
      })?.in('id', taskIds)?.select()

    if (error) throw error
    return data || []
  },

  // Create quick action tasks for deals
  async createDealFollowUpTask(dealId, contactId, assignedTo) {
    return this.createTask({
      deal_id: dealId,
      contact_id: contactId,
      assigned_to: assignedTo,
      created_by: assignedTo,
      title: 'Follow up on deal',
      description: 'Check in with prospect about deal progress',
      priority: 'medium',
      status: 'pending',
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000)?.toISOString() // Tomorrow
    });
  },

  // Create task for deal stage transitions
  async createStageTransitionTask(dealId, fromStage, toStage, assignedTo) {
    const stageActions = {
      'lead_to_qualified': 'Complete discovery call and needs assessment',
      'qualified_to_proposal': 'Prepare and send detailed proposal',
      'proposal_to_negotiation': 'Schedule negotiation meeting with stakeholders',
      'negotiation_to_closed_won': 'Finalize contract terms and get signatures'
    }

    const taskKey = `${fromStage}_to_${toStage}`
    const description = stageActions?.[taskKey] || `Complete actions for ${toStage} stage`

    return this.createTask({
      deal_id: dealId,
      assigned_to: assignedTo,
      created_by: assignedTo,
      title: `${toStage?.replace('_', ' ')?.toUpperCase()} stage actions`,
      description,
      priority: 'high',
      status: 'pending',
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)?.toISOString() // 2 days
    });
  }
}

export default tasksService