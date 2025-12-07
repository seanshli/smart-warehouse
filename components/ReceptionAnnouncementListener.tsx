'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useHousehold } from './HouseholdProvider'
import ReceptionAnnouncementDialog from './ReceptionAnnouncementDialog'

interface Announcement {
  id: string
  title: string
  message: string
  source: 'SYSTEM' | 'COMMUNITY' | 'BUILDING'
  sourceId?: string | null
  targetType: 'ALL_HOUSEHOLDS' | 'COMMUNITY' | 'BUILDING' | 'SPECIFIC_HOUSEHOLD'
  targetId?: string | null
  createdAt: string
  isActive: boolean
}

interface AnnouncementRead {
  announcementId: string
  userId: string
  householdId: string
  readAt: string
}

export default function ReceptionAnnouncementListener() {
  const { data: session } = useSession()
  const { household } = useHousehold()
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null)
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<Set<string>>(new Set())
  const [isReceptionHousehold, setIsReceptionHousehold] = useState(false)

  // Check if current household is a reception household
  useEffect(() => {
    const checkReceptionHousehold = async () => {
      if (!household?.id || !household?.buildingId) {
        setIsReceptionHousehold(false)
        return
      }

      try {
        // Check if household name contains reception keywords
        const receptionKeywords = [
          'reception',
          'frontdesk',
          'front desk',
          'front-desk',
          '前台',
          '接待處',
          'receptionist',
          'front office',
        ]

        const householdName = household.name.toLowerCase()
        const isReception = receptionKeywords.some(keyword => 
          householdName.includes(keyword.toLowerCase())
        )

        setIsReceptionHousehold(isReception)
      } catch (error) {
        console.error('Error checking reception household:', error)
        setIsReceptionHousehold(false)
      }
    }

    checkReceptionHousehold()
  }, [household?.id, household?.name, household?.buildingId])

  // Fetch announcements for reception household
  const fetchAnnouncements = useCallback(async () => {
    if (!session?.user || !household?.id || !isReceptionHousehold) {
      return
    }

    try {
      // Fetch unread announcements for this household
      const response = await fetch(`/api/admin/announcements?targetType=SPECIFIC_HOUSEHOLD&targetId=${household.id}&isActive=true`)
      if (!response.ok) return

      const data = await response.json()
      const announcements: Announcement[] = data.announcements || []

      // Filter for doorbell/mail/package announcements
      const receptionAnnouncements = announcements.filter(ann => {
        const title = ann.title.toLowerCase()
        const message = ann.message.toLowerCase()
        return (
          title.includes('visitor') ||
          title.includes('訪客') ||
          title.includes('mail') ||
          title.includes('郵件') ||
          title.includes('package') ||
          title.includes('包裹') ||
          message.includes('doorbell') ||
          message.includes('門鈴') ||
          message.includes('mailbox') ||
          message.includes('郵箱') ||
          message.includes('locker') ||
          message.includes('儲物櫃')
        )
      })

      // Fetch read status for these announcements
      if (receptionAnnouncements.length > 0) {
        const userId = (session.user as any).id
        const readResponse = await fetch(`/api/admin/announcements/reads?householdId=${household.id}`)
        let readIds = new Set<string>()
        
        if (readResponse.ok) {
          const readData = await readResponse.json()
          const reads: AnnouncementRead[] = readData.reads || []
          readIds = new Set(reads.map((r: AnnouncementRead) => r.announcementId))
          setReadAnnouncementIds(readIds)
        }
        
        // Find first unread announcement
        const unreadAnnouncement = receptionAnnouncements.find(
          ann => !readIds.has(ann.id)
        )

        if (unreadAnnouncement && !currentAnnouncement) {
          setCurrentAnnouncement(unreadAnnouncement)
        }
      }
    } catch (error) {
      console.error('Error fetching reception announcements:', error)
    }
  }, [session, household?.id, isReceptionHousehold, currentAnnouncement, readAnnouncementIds])

  // Poll for new announcements
  useEffect(() => {
    if (!isReceptionHousehold || !household?.id) return

    // Initial fetch
    fetchAnnouncements()

    // Poll every 10 seconds for new announcements
    const interval = setInterval(() => {
      fetchAnnouncements()
    }, 10000)

    return () => clearInterval(interval)
  }, [isReceptionHousehold, household?.id, fetchAnnouncements])

  // Mark announcement as read
  const markAsRead = useCallback(async (announcementId: string) => {
    if (!session?.user || !household?.id) return

    try {
      const userId = (session.user as any).id
      const response = await fetch('/api/admin/announcements/reads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcementId,
          userId,
          householdId: household.id,
        }),
      })

      if (response.ok) {
        setReadAnnouncementIds(prev => new Set([...prev, announcementId]))
      }
    } catch (error) {
      console.error('Error marking announcement as read:', error)
    }
  }, [session, household?.id])

  // Handle dialog close
  const handleClose = useCallback(() => {
    if (currentAnnouncement) {
      markAsRead(currentAnnouncement.id)
    }
    setCurrentAnnouncement(null)
    
    // Fetch next unread announcement after a short delay
    setTimeout(() => {
      fetchAnnouncements()
    }, 500)
  }, [currentAnnouncement, markAsRead, fetchAnnouncements])

  if (!isReceptionHousehold) {
    return null
  }

  return (
    <ReceptionAnnouncementDialog
      announcement={currentAnnouncement}
      onClose={handleClose}
      onMarkAsRead={markAsRead}
    />
  )
}

