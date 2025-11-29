'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useLanguage } from '@/components/LanguageProvider'
import {
  EnvelopeIcon,
  EnvelopeOpenIcon,
  BellIcon,
  CubeIcon,
  CheckCircleIcon,
  ClockIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Mailbox {
  id: string
  mailboxNumber: string
  location?: string
  hasMail: boolean
  lastMailAt?: string
  floor?: {
    id: string
    floorNumber: number
    name?: string
  }
}

interface DoorBell {
  id: string
  doorBellNumber: string
  location?: string
  isEnabled: boolean
  lastRungAt?: string
}

interface Package {
  id: string
  packageNumber?: string
  description?: string
  checkedInAt?: string
  status: string
  locker: {
    id: string
    lockerNumber: number
    location?: string
  }
}

export default function HouseholdPropertyPage() {
  const params = useParams()
  const { t } = useLanguage()
  const householdId = params.id as string

  const [mailbox, setMailbox] = useState<Mailbox | null>(null)
  const [doorbells, setDoorbells] = useState<DoorBell[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'mailbox' | 'doorbells' | 'packages'>('mailbox')

  useEffect(() => {
    if (householdId) {
      fetchPropertyData()
    }
  }, [householdId])

  const fetchPropertyData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/household/${householdId}/property`, {
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch property data')
      }

      const data = await response.json()
      setMailbox(data.mailbox)
      setDoorbells(data.doorbells || [])
      setPackages(data.packages || [])
    } catch (error) {
      console.error('Error fetching property data:', error)
      toast.error('Failed to load property information')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('commonLoading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            {t('back') || 'Back to Dashboard'}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('propertyServices') || 'Property Services'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {t('propertyServicesSubtitle') || 'Mail / Packages / Door alarms and shared spaces'}
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('mailbox')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'mailbox'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <EnvelopeIcon className="h-5 w-5" />
                <span>{t('householdMail') || 'Mail'}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('doorbells')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'doorbells'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BellIcon className="h-5 w-5" />
                <span>{t('doorBells') || 'Door Bells'}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'packages'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CubeIcon className="h-5 w-5" />
                <span>{t('householdPackage') || 'Packages'}</span>
                {packages.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold text-white bg-primary-600 rounded-full">
                    {packages.length}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Mailbox Tab */}
          {activeTab === 'mailbox' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('householdMail') || 'Mailbox'}
              </h2>
              {mailbox ? (
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${
                        mailbox.hasMail 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'bg-gray-50 text-gray-400'
                      }`}>
                        {mailbox.hasMail ? (
                          <EnvelopeIcon className="h-8 w-8" />
                        ) : (
                          <EnvelopeOpenIcon className="h-8 w-8" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {t('mailboxNumber') || 'Mailbox'} {mailbox.mailboxNumber}
                        </h3>
                        {mailbox.floor && (
                          <p className="text-sm text-gray-500 mt-1">
                            {t('floor') || 'Floor'} {mailbox.floor.floorNumber}
                            {mailbox.floor.name && ` - ${mailbox.floor.name}`}
                          </p>
                        )}
                        {mailbox.location && (
                          <p className="text-sm text-gray-500 mt-1">{mailbox.location}</p>
                        )}
                        {mailbox.hasMail && mailbox.lastMailAt && (
                          <div className="mt-3 flex items-center space-x-2 text-sm text-blue-600">
                            <ClockIcon className="h-4 w-4" />
                            <span>{t('lastMailAt') || 'Last mail'}: {formatDate(mailbox.lastMailAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      mailbox.hasMail
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {mailbox.hasMail 
                        ? (t('hasMail') || 'Has Mail') 
                        : (t('noMail') || 'No Mail')
                      }
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <EnvelopeIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p>{t('noMailboxAssigned') || 'No mailbox assigned to this household'}</p>
                </div>
              )}
            </div>
          )}

          {/* Doorbells Tab */}
          {activeTab === 'doorbells' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('doorBells') || 'Door Bells'}
              </h2>
              {doorbells.length > 0 ? (
                <div className="space-y-4">
                  {doorbells.map((doorbell) => (
                    <div key={doorbell.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 rounded-lg ${
                            doorbell.isEnabled
                              ? 'bg-green-50 text-green-600'
                              : 'bg-gray-50 text-gray-400'
                          }`}>
                            <BellIcon className="h-8 w-8" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {t('doorBellNumber') || 'Door Bell'} {doorbell.doorBellNumber}
                            </h3>
                            {doorbell.location && (
                              <p className="text-sm text-gray-500 mt-1">{doorbell.location}</p>
                            )}
                            {doorbell.lastRungAt && (
                              <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
                                <ClockIcon className="h-4 w-4" />
                                <span>{t('lastRungAt') || 'Last rung'}: {formatDate(doorbell.lastRungAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          doorbell.isEnabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {doorbell.isEnabled
                            ? (t('enabled') || 'Enabled')
                            : (t('disabled') || 'Disabled')
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BellIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p>{t('noDoorbellsAssigned') || 'No doorbells assigned to this household'}</p>
                </div>
              )}
            </div>
          )}

          {/* Packages Tab */}
          {activeTab === 'packages' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('householdPackage') || 'Packages'}
              </h2>
              {packages.length > 0 ? (
                <div className="space-y-4">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="p-3 rounded-lg bg-primary-50 text-primary-600">
                            <CubeIcon className="h-8 w-8" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {t('packageLocker') || 'Package Locker'} #{pkg.locker.lockerNumber}
                              </h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                pkg.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {pkg.status === 'pending' 
                                  ? (t('pending') || 'Pending')
                                  : pkg.status
                                }
                              </span>
                            </div>
                            {pkg.locker.location && (
                              <p className="text-sm text-gray-500 mt-1">{pkg.locker.location}</p>
                            )}
                            {pkg.packageNumber && (
                              <p className="text-sm text-gray-600 mt-2">
                                <span className="font-medium">{t('packageNumber') || 'Tracking'}:</span> {pkg.packageNumber}
                              </p>
                            )}
                            {pkg.description && (
                              <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                            )}
                            {pkg.checkedInAt && (
                              <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
                                <ClockIcon className="h-4 w-4" />
                                <span>{t('checkedInAt') || 'Checked in'}: {formatDate(pkg.checkedInAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <CubeIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p>{t('noPackages') || 'No packages waiting for pickup'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

