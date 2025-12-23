/**
 * Utility functions for handling catering time slots
 * Supports category-level time slots that are inherited by menu items
 */

export interface TimeSlot {
  id?: string
  dayOfWeek: number // 0 = Sunday, 1 = Monday, ..., 6 = Saturday, -1 = All days
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  isWeekend?: boolean | null // true for weekend, false for weekday, null for all days
}

/**
 * Get effective time slots for a menu item
 * If the item has its own time slots, use those. Otherwise, inherit from category.
 * 
 * @param itemTimeSlots - Time slots defined directly on the menu item
 * @param categoryTimeSlots - Time slots defined on the category
 * @param itemAvailableAllDay - Whether the item is available all day
 * @returns Array of effective time slots
 */
export function getEffectiveTimeSlots(
  itemTimeSlots: TimeSlot[] | null | undefined,
  categoryTimeSlots: TimeSlot[] | null | undefined,
  itemAvailableAllDay: boolean = true
): TimeSlot[] {
  // If item has its own time slots, use those
  if (itemTimeSlots && itemTimeSlots.length > 0) {
    return itemTimeSlots
  }

  // If item is available all day and has no time slots, return empty (all day)
  if (itemAvailableAllDay) {
    return []
  }

  // Otherwise, inherit from category
  if (categoryTimeSlots && categoryTimeSlots.length > 0) {
    return categoryTimeSlots
  }

  // No time slots defined anywhere
  return []
}

/**
 * Check if a menu item is currently available based on time slots
 * 
 * @param timeSlots - Effective time slots for the item
 * @param availableAllDay - Whether the item is available all day
 * @param currentTime - Optional current time (defaults to now)
 * @returns true if the item is currently available
 */
export function isItemAvailableNow(
  timeSlots: TimeSlot[],
  availableAllDay: boolean,
  currentTime: Date = new Date()
): boolean {
  // If available all day and no time slots, always available
  if (availableAllDay && timeSlots.length === 0) {
    return true
  }

  // If no time slots and not available all day, not available
  if (timeSlots.length === 0) {
    return false
  }

  const currentDay = currentTime.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const currentHour = currentTime.getHours()
  const currentMinute = currentTime.getMinutes()
  const currentTimeMinutes = currentHour * 60 + currentMinute

  // Check if any time slot matches current time
  return timeSlots.some(slot => {
    // Check day of week
    if (slot.dayOfWeek !== -1 && slot.dayOfWeek !== currentDay) {
      return false
    }

    // Check weekend/weekday if specified
    if (slot.isWeekend !== null && slot.isWeekend !== undefined) {
      const isWeekend = currentDay === 0 || currentDay === 6 // Sunday or Saturday
      if (slot.isWeekend !== isWeekend) {
        return false
      }
    }

    // Check time range
    const [startHour, startMinute] = slot.startTime.split(':').map(Number)
    const [endHour, endMinute] = slot.endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    // Handle time slots that span midnight
    if (endMinutes < startMinutes) {
      // Time slot spans midnight (e.g., 22:00 to 02:00)
      return currentTimeMinutes >= startMinutes || currentTimeMinutes <= endMinutes
    } else {
      // Normal time slot
      return currentTimeMinutes >= startMinutes && currentTimeMinutes <= endMinutes
    }
  })
}

/**
 * Format time slot for display
 * 
 * @param slot - Time slot to format
 * @returns Formatted string
 */
export function formatTimeSlot(slot: TimeSlot): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayName = slot.dayOfWeek === -1 ? 'All days' : days[slot.dayOfWeek]
  
  let timeRange = `${slot.startTime} - ${slot.endTime}`
  
  if (slot.isWeekend === true) {
    return `Weekend (${dayName}): ${timeRange}`
  } else if (slot.isWeekend === false) {
    return `Weekday (${dayName}): ${timeRange}`
  }
  
  return `${dayName}: ${timeRange}`
}
