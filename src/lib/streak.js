import { supabase } from './supabase'

/**
 * Update a user's streak correctly.
 * - If last_active_date was yesterday → increment
 * - If last_active_date was today → no change (already counted)
 * - If last_active_date was 2+ days ago → reset to 1
 * - Always update longest_streak if current beats it
 */
export async function updateStreak(userId) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    // Fetch current streak record
    const { data: existing } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!existing) {
      // First ever activity — create the row
      await supabase.from('streaks').insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_active_date: today,
      })
      return
    }

    const last = existing.last_active_date

    // Already counted today — do nothing
    if (last === today) return

    let newStreak
    if (last === yesterday) {
      // Continued streak
      newStreak = (existing.current_streak || 0) + 1
    } else {
      // Streak broken
      newStreak = 1
    }

    const newLongest = Math.max(newStreak, existing.longest_streak || 0)

    await supabase.from('streaks').update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_active_date: today,
    }).eq('user_id', userId)

  } catch (err) {
    // Non-critical — never block the user
    console.warn('Streak update failed:', err)
  }
}
