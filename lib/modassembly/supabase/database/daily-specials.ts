/**
 * Daily Specials Database Service
 */

import { createClient } from '@/lib/modassembly/supabase/client'
import { Security } from '@/lib/security'
import { measureApiCall } from '@/lib/performance-utils'

export interface DailySpecial {
  id: string
  name: string
  description: string
  meal_period: 'breakfast' | 'lunch' | 'dinner' | 'all_day'
  price?: number
  ingredients: string[]
  dietary_tags: string[]
  is_active: boolean
  available_date: string
  start_time?: string
  end_time?: string
  max_orders?: number
  current_orders: number
  image_url?: string
  preparation_time_minutes: number
  created_at: string
  updated_at: string
  created_by?: string
}

export interface AvailableSpecial extends DailySpecial {
  is_available: boolean
  orders_remaining?: number
}

/**
 * Get current meal period based on time of day
 */
export function getCurrentMealPeriod(): 'breakfast' | 'lunch' | 'dinner' {
  const hour = new Date().getHours()
  
  if (hour < 11) return 'breakfast'
  if (hour < 16) return 'lunch'
  return 'dinner'
}

/**
 * Get available daily specials for current or specified meal period
 */
export async function getAvailableSpecials(
  mealPeriod?: string
): Promise<AvailableSpecial[]> {
  return measureApiCall('get_available_specials', async () => {
    const supabase = createClient()
    
    // Use the database function for complex availability logic
    const { data, error } = await supabase
      .rpc('get_current_specials', { 
        meal_period_filter: mealPeriod || null 
      })
    
    if (error) {
      console.error('Error fetching available specials:', error)
      throw error
    }

    // Security: Sanitize returned data
    return (data || []).map((special: any) => ({
      ...special,
      name: Security.sanitize.sanitizeUserName(special.name),
      description: Security.sanitize.sanitizeHTML(special.description),
      ingredients: Array.isArray(special.ingredients) 
        ? special.ingredients
            .map((item: any) => Security.sanitize.sanitizeOrderItem(item))
            .filter((item: string) => item.length > 0)
            .slice(0, 10)
        : [],
      dietary_tags: Array.isArray(special.dietary_tags)
        ? special.dietary_tags
            .map((tag: any) => Security.sanitize.sanitizeUserName(tag))
            .filter((tag: string) => tag.length > 0)
            .slice(0, 5)
        : [],
      price: typeof special.price === 'number' ? Math.max(0, special.price) : undefined,
      preparation_time_minutes: Math.max(5, Math.min(120, special.preparation_time_minutes || 20))
    })) as AvailableSpecial[]
  })
}

/**
 * Get today's featured special (first available special for current meal period)
 */
export async function getTodaysFeaturedSpecial(): Promise<AvailableSpecial | null> {
  const currentPeriod = getCurrentMealPeriod()
  const specials = await getAvailableSpecials(currentPeriod)
  
  // Return the first available special, or fall back to all-day specials
  const featured = specials.find(s => s.is_available && s.meal_period === currentPeriod) ||
                   specials.find(s => s.is_available && s.meal_period === 'all_day')
  
  return featured || null
}

/**
 * Increment order count for a special (called when order is placed)
 */
export async function incrementSpecialOrders(specialId: string): Promise<void> {
  return measureApiCall('increment_special_orders', async () => {
    // Security: Validate special ID
    const sanitizedId = Security.sanitize.sanitizeIdentifier(specialId)
    if (!sanitizedId) {
      throw new Error('Invalid special ID')
    }

    const supabase = createClient()
    const { error } = await supabase
      .rpc('increment_special_orders', { special_id: sanitizedId })
    
    if (error) {
      console.error('Error incrementing special orders:', error)
      throw error
    }
  })
}

/**
 * Create a new daily special (admin only)
 */
export async function createDailySpecial(
  specialData: Omit<DailySpecial, 'id' | 'created_at' | 'updated_at' | 'current_orders'>
): Promise<DailySpecial> {
  return measureApiCall('create_daily_special', async () => {
    // Security: Validate and sanitize data
    const sanitizedData = {
      name: Security.sanitize.sanitizeUserName(specialData.name),
      description: Security.sanitize.sanitizeHTML(specialData.description),
      meal_period: specialData.meal_period,
      price: typeof specialData.price === 'number' ? Math.max(0, specialData.price) : null,
      ingredients: Array.isArray(specialData.ingredients)
        ? specialData.ingredients
            .map(item => Security.sanitize.sanitizeOrderItem(item))
            .filter(item => item.length > 0)
            .slice(0, 20)
        : [],
      dietary_tags: Array.isArray(specialData.dietary_tags)
        ? specialData.dietary_tags
            .map(tag => Security.sanitize.sanitizeUserName(tag))
            .filter(tag => tag.length > 0)
            .slice(0, 10)
        : [],
      is_active: Boolean(specialData.is_active),
      available_date: specialData.available_date,
      start_time: specialData.start_time || null,
      end_time: specialData.end_time || null,
      max_orders: typeof specialData.max_orders === 'number' ? Math.max(0, specialData.max_orders) : null,
      image_url: specialData.image_url ? Security.sanitize.sanitizeHTML(specialData.image_url) : null,
      preparation_time_minutes: Math.max(5, Math.min(120, specialData.preparation_time_minutes || 20))
    }

    // Validate required fields
    if (!sanitizedData.name || sanitizedData.name.length < 2) {
      throw new Error('Special name is required and must be at least 2 characters')
    }
    if (!sanitizedData.description || sanitizedData.description.length < 5) {
      throw new Error('Special description is required and must be at least 5 characters')
    }
    if (!['breakfast', 'lunch', 'dinner', 'all_day'].includes(specialData.meal_period)) {
      throw new Error('Invalid meal period')
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('daily_specials')
      .insert([sanitizedData])
      .select()
      .single()

    if (error) {
      console.error('Error creating daily special:', error)
      throw error
    }

    return data as DailySpecial
  })
}

/**
 * Update a daily special (admin only)
 */
export async function updateDailySpecial(
  id: string,
  updates: Partial<DailySpecial>
): Promise<DailySpecial> {
  return measureApiCall('update_daily_special', async () => {
    // Security: Validate ID
    const sanitizedId = Security.sanitize.sanitizeIdentifier(id)
    if (!sanitizedId) {
      throw new Error('Invalid special ID')
    }

    // Security: Sanitize update data
    const sanitizedUpdates: any = {}
    
    if (updates.name !== undefined) {
      sanitizedUpdates.name = Security.sanitize.sanitizeUserName(updates.name)
    }
    if (updates.description !== undefined) {
      sanitizedUpdates.description = Security.sanitize.sanitizeHTML(updates.description)
    }
    if (updates.meal_period !== undefined) {
      if (!['breakfast', 'lunch', 'dinner', 'all_day'].includes(updates.meal_period)) {
        throw new Error('Invalid meal period')
      }
      sanitizedUpdates.meal_period = updates.meal_period
    }
    if (updates.price !== undefined) {
      sanitizedUpdates.price = typeof updates.price === 'number' ? Math.max(0, updates.price) : null
    }
    if (updates.ingredients !== undefined) {
      sanitizedUpdates.ingredients = Array.isArray(updates.ingredients)
        ? updates.ingredients
            .map(item => Security.sanitize.sanitizeOrderItem(item))
            .filter(item => item.length > 0)
            .slice(0, 20)
        : []
    }
    if (updates.dietary_tags !== undefined) {
      sanitizedUpdates.dietary_tags = Array.isArray(updates.dietary_tags)
        ? updates.dietary_tags
            .map(tag => Security.sanitize.sanitizeUserName(tag))
            .filter(tag => tag.length > 0)
            .slice(0, 10)
        : []
    }
    if (updates.is_active !== undefined) {
      sanitizedUpdates.is_active = Boolean(updates.is_active)
    }
    if (updates.available_date !== undefined) {
      sanitizedUpdates.available_date = updates.available_date
    }
    if (updates.start_time !== undefined) {
      sanitizedUpdates.start_time = updates.start_time || null
    }
    if (updates.end_time !== undefined) {
      sanitizedUpdates.end_time = updates.end_time || null
    }
    if (updates.max_orders !== undefined) {
      sanitizedUpdates.max_orders = typeof updates.max_orders === 'number' ? Math.max(0, updates.max_orders) : null
    }
    if (updates.image_url !== undefined) {
      sanitizedUpdates.image_url = updates.image_url ? Security.sanitize.sanitizeHTML(updates.image_url) : null
    }
    if (updates.preparation_time_minutes !== undefined) {
      sanitizedUpdates.preparation_time_minutes = Math.max(5, Math.min(120, updates.preparation_time_minutes || 20))
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('daily_specials')
      .update(sanitizedUpdates)
      .eq('id', sanitizedId)
      .select()
      .single()

    if (error) {
      console.error('Error updating daily special:', error)
      throw error
    }

    return data as DailySpecial
  })
}

/**
 * Delete a daily special (admin only)
 */
export async function deleteDailySpecial(id: string): Promise<void> {
  return measureApiCall('delete_daily_special', async () => {
    // Security: Validate ID
    const sanitizedId = Security.sanitize.sanitizeIdentifier(id)
    if (!sanitizedId) {
      throw new Error('Invalid special ID')
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('daily_specials')
      .delete()
      .eq('id', sanitizedId)

    if (error) {
      console.error('Error deleting daily special:', error)
      throw error
    }
  })
}

/**
 * Get all daily specials (admin only)
 */
export async function getAllDailySpecials(): Promise<DailySpecial[]> {
  return measureApiCall('get_all_daily_specials', async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('daily_specials')
      .select('*')
      .order('available_date', { ascending: false })
      .order('meal_period')
      .order('name')

    if (error) {
      console.error('Error fetching all daily specials:', error)
      throw error
    }

    // Security: Sanitize returned data
    return (data || []).map((special: any) => ({
      ...special,
      name: Security.sanitize.sanitizeUserName(special.name),
      description: Security.sanitize.sanitizeHTML(special.description),
      ingredients: Array.isArray(special.ingredients) ? special.ingredients : [],
      dietary_tags: Array.isArray(special.dietary_tags) ? special.dietary_tags : []
    })) as DailySpecial[]
  })
}