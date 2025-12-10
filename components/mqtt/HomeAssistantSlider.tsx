// Home Assistant 滑块控制组件
// 用于控制有级别的设备（如风扇速度、湿度设置等）
// 支持原生 iOS HomeKit 和 Android Material Design 样式

'use client'

import { useState, useCallback, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import type { HomeAssistantState } from './HomeAssistantPanel'

type HomeAssistantSliderProps = {
  entityId: string
  state?: HomeAssistantState
  min?: number
  max?: number
  step?: number
  unit?: string
  label?: string
  onValueChange: (entityId: string, value: number) => Promise<void>
  t: (key: keyof import('@/lib/translations').Translations) => string
}

export function HomeAssistantSlider({
  entityId,
  state,
  min = 0,
  max = 100,
  step = 1,
  unit = '%',
  label,
  onValueChange,
  t,
}: HomeAssistantSliderProps) {
  const [localValue, setLocalValue] = useState<number>(0)
  const [isChanging, setIsChanging] = useState(false)
  const isIOS = Capacitor.getPlatform() === 'ios'
  const isAndroid = Capacitor.getPlatform() === 'android'

  // 从状态中获取当前值
  useEffect(() => {
    if (state) {
      // 优先使用 percentage 属性
      const percentage = state.attributes?.percentage
      if (percentage !== undefined && percentage !== null) {
        setLocalValue(Number(percentage))
      } else if (state.state === 'on') {
        // 如果状态是 'on' 但没有 percentage，设置为最大值
        setLocalValue(max)
      } else if (state.state === 'off') {
        setLocalValue(min)
      } else {
        // 尝试从 state 中解析数字
        const numValue = Number(state.state)
        if (!isNaN(numValue)) {
          setLocalValue(Math.max(min, Math.min(max, numValue)))
        }
      }
    }
  }, [state, min, max])

  const handleChange = useCallback(
    async (newValue: number) => {
      setLocalValue(newValue)
      setIsChanging(true)
      
      try {
        await onValueChange(entityId, newValue)
      } catch (error) {
        console.error('Failed to update value:', error)
        // 恢复原值
        if (state) {
          const percentage = state.attributes?.percentage
          if (percentage !== undefined) {
            setLocalValue(Number(percentage))
          }
        }
      } finally {
        setIsChanging(false)
      }
    },
    [entityId, onValueChange, state]
  )

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value)
      setLocalValue(value)
    },
    []
  )

  const handleSliderMouseUp = useCallback(
    (e: React.MouseEvent<HTMLInputElement>) => {
      const value = Number(e.currentTarget.value)
      handleChange(value)
    },
    [handleChange]
  )

  const handleSliderTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLInputElement>) => {
      const value = Number(e.currentTarget.value)
      handleChange(value)
    },
    [handleChange]
  )

  const isDisabled = state?.state === 'unavailable' || state?.state === 'unknown'

  // iOS HomeKit 风格滑块
  if (isIOS) {
    return (
      <div className="space-y-2">
        {label && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              {label}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {localValue}{unit}
            </span>
          </div>
        )}
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localValue}
            onChange={handleSliderChange}
            onMouseUp={handleSliderMouseUp}
            onTouchEnd={handleSliderTouchEnd}
            disabled={isDisabled}
            className={`
              w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${isChanging ? 'opacity-75' : ''}
              ios-slider
            `}
            style={{
              background: `linear-gradient(to right, 
                #3b82f6 0%, 
                #3b82f6 ${((localValue - min) / (max - min)) * 100}%, 
                #e5e7eb ${((localValue - min) / (max - min)) * 100}%, 
                #e5e7eb 100%)`,
            }}
          />
          <style jsx>{`
            .ios-slider::-webkit-slider-thumb {
              appearance: none;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background: #ffffff;
              border: 2px solid #3b82f6;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              cursor: pointer;
              transition: transform 0.1s ease;
            }
            .ios-slider::-webkit-slider-thumb:active {
              transform: scale(1.1);
            }
            .ios-slider::-moz-range-thumb {
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background: #ffffff;
              border: 2px solid #3b82f6;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              cursor: pointer;
            }
          `}</style>
        </div>
      </div>
    )
  }

  // Android Material Design 风格滑块
  if (isAndroid) {
    return (
      <div className="space-y-2">
        {label && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
              {localValue}{unit}
            </span>
          </div>
        )}
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localValue}
            onChange={handleSliderChange}
            onMouseUp={handleSliderMouseUp}
            onTouchEnd={handleSliderTouchEnd}
            disabled={isDisabled}
            className={`
              w-full h-1 bg-gray-300 dark:bg-gray-600 rounded-full appearance-none cursor-pointer
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${isChanging ? 'opacity-75' : ''}
              android-slider
            `}
            style={{
              background: `linear-gradient(to right, 
                #2563eb 0%, 
                #2563eb ${((localValue - min) / (max - min)) * 100}%, 
                #d1d5db ${((localValue - min) / (max - min)) * 100}%, 
                #d1d5db 100%)`,
            }}
          />
          <style jsx>{`
            .android-slider::-webkit-slider-thumb {
              appearance: none;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: #2563eb;
              border: none;
              box-shadow: 0 2px 6px rgba(37, 99, 235, 0.4);
              cursor: pointer;
              transition: transform 0.1s ease, box-shadow 0.1s ease;
            }
            .android-slider::-webkit-slider-thumb:active {
              transform: scale(1.2);
              box-shadow: 0 4px 8px rgba(37, 99, 235, 0.6);
            }
            .android-slider::-moz-range-thumb {
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: #2563eb;
              border: none;
              box-shadow: 0 2px 6px rgba(37, 99, 235, 0.4);
              cursor: pointer;
            }
          `}</style>
        </div>
      </div>
    )
  }

  // Web 默认样式（类似 iOS）
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {label}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {localValue}{unit}
          </span>
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleSliderChange}
          onMouseUp={handleSliderMouseUp}
          onTouchEnd={handleSliderTouchEnd}
          disabled={isDisabled}
          className={`
            w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${isChanging ? 'opacity-75' : ''}
            web-slider
          `}
          style={{
            background: `linear-gradient(to right, 
              #3b82f6 0%, 
              #3b82f6 ${((localValue - min) / (max - min)) * 100}%, 
              #e5e7eb ${((localValue - min) / (max - min)) * 100}%, 
              #e5e7eb 100%)`,
          }}
        />
        <style jsx>{`
          .web-slider::-webkit-slider-thumb {
            appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #ffffff;
            border: 2px solid #3b82f6;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            cursor: pointer;
            transition: transform 0.1s ease;
          }
          .web-slider::-webkit-slider-thumb:active {
            transform: scale(1.1);
          }
          .web-slider::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #ffffff;
            border: 2px solid #3b82f6;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            cursor: pointer;
          }
        `}</style>
      </div>
    </div>
  )
}

