'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'

interface CateringOrder {
  id: string
  orderNumber: string
  status: string
  deliveryType: string
  scheduledTime?: string
  totalAmount: number | string
  orderedAt: string
  confirmedAt?: string
  preparedAt?: string
  deliveredAt?: string
  household: {
    id: string
    name: string
  }
  items: Array<{
    id: string
    quantity: number
    menuItem: {
      id: string
      name: string
    }
  }>
}

interface CateringOrderWorkflowProps {
  order: CateringOrder
  onStatusUpdate?: () => void
}

// Define workflow steps
const WORKFLOW_STEPS = [
  { 
    key: 'submitted', 
    label: '住戶下單', 
    labelEn: 'Household Order',
    description: '住戶已提交訂單',
    descriptionEn: 'Order submitted by household'
  },
  { 
    key: 'accepted', 
    label: '管理員審核', 
    labelEn: 'Admin Approval',
    description: '建築/社區管理員審核通過',
    descriptionEn: 'Approved by building/community admin'
  },
  { 
    key: 'preparing', 
    label: '廚房準備', 
    labelEn: 'Kitchen Crew',
    description: '廚房團隊正在準備餐點',
    descriptionEn: 'Kitchen crew preparing food'
  },
  { 
    key: 'ready', 
    label: '前台通知', 
    labelEn: 'Front Desk',
    description: '餐點已準備完成，前台通知住戶',
    descriptionEn: 'Food ready, front desk notifying household'
  },
  { 
    key: 'delivered', 
    label: '住戶通知', 
    labelEn: 'Household Notice',
    description: '住戶已收到通知',
    descriptionEn: 'Household has been notified'
  },
  { 
    key: 'closed', 
    label: '完成', 
    labelEn: 'Closed',
    description: '訂單已完成',
    descriptionEn: 'Order completed'
  },
]

export default function CateringOrderWorkflow({ order, onStatusUpdate }: CateringOrderWorkflowProps) {
  const { t, currentLanguage } = useLanguage()
  const isChinese = currentLanguage === 'zh-TW' || currentLanguage === 'zhTW'

  // Get current step index
  const getCurrentStepIndex = () => {
    const statusMap: Record<string, number> = {
      'submitted': 0,
      'accepted': 1,
      'preparing': 2,
      'ready': 3,
      'delivered': 4,
      'closed': 5,
      'cancelled': -1,
    }
    return statusMap[order.status] ?? 0
  }

  const currentStepIndex = getCurrentStepIndex()
  const isCancelled = order.status === 'cancelled'

  // Get timestamp for each step
  const getStepTimestamp = (stepKey: string) => {
    switch (stepKey) {
      case 'submitted':
        return order.orderedAt
      case 'accepted':
        return order.confirmedAt
      case 'preparing':
        return order.preparedAt
      case 'ready':
      case 'delivered':
        return order.deliveredAt
      default:
        return null
    }
  }

  const formatTimestamp = (timestamp: string | null | undefined) => {
    if (!timestamp) return null
    const date = new Date(timestamp)
    return date.toLocaleString(isChinese ? 'zh-TW' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        {isChinese ? '訂單流程' : 'Order Workflow'} - {order.orderNumber}
      </h3>

      {isCancelled && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-red-900 dark:text-red-200 font-medium">
              {isChinese ? '訂單已取消' : 'Order Cancelled'}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {WORKFLOW_STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex
          const isCurrent = index === currentStepIndex && !isCancelled
          const isPending = index > currentStepIndex
          const timestamp = getStepTimestamp(step.key)

          return (
            <div key={step.key} className="flex items-start">
              {/* Step Icon */}
              <div className="flex-shrink-0 mr-4">
                {isCompleted ? (
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center animate-pulse">
                    <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-500" />
                  </div>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`text-sm font-medium ${
                      isCompleted 
                        ? 'text-green-900 dark:text-green-200' 
                        : isCurrent 
                        ? 'text-blue-900 dark:text-blue-200' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {isChinese ? step.label : step.labelEn}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {isChinese ? step.description : step.descriptionEn}
                    </p>
                  </div>
                  {timestamp && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-4 whitespace-nowrap">
                      {formatTimestamp(timestamp)}
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className="flex-shrink-0 mx-4 mt-5">
                  <ArrowRightIcon className={`h-5 w-5 ${
                    isCompleted 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-300 dark:text-gray-600'
                  }`} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Delivery Type Info */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {isChinese ? '配送方式' : 'Delivery Type'}:
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {order.deliveryType === 'dine-in' 
              ? (isChinese ? '餐廳內用' : 'Dine-in at Restaurant')
              : order.deliveryType === 'scheduled'
              ? (isChinese ? '預約送達' : 'Scheduled Delivery')
              : (isChinese ? '立即送達' : 'Immediate Delivery')}
          </span>
        </div>
        {order.scheduledTime && (
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600 dark:text-gray-400">
              {isChinese ? '預約時間' : 'Scheduled Time'}:
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatTimestamp(order.scheduledTime)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
