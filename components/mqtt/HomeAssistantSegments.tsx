// HomeKit 風格分段控制組件
// 用於 Home Assistant 裝置控制（如風扇速度、濕度模式等）

import React from 'react'

// 分段控制屬性介面
type SegmentedControlProps = {
  label?: string // 標籤文字（可選）
  options: string[] // 選項陣列
  value: string // 當前選中的值
  onSelect: (option: string) => void // 選擇回調函數
}

// 分段控制組件（HomeKit 風格）
export function SegmentedControl({
  label,
  options,
  value,
  onSelect,
}: SegmentedControlProps) {
  if (!options || options.length === 0) return null // 無選項時不渲染

  return (
    <div className="space-y-2">
      {label && (
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
          {label}
        </div>
      )}
      {/* 分段控制容器（圓角背景） */}
      <div className="flex flex-col gap-2 rounded-2xl bg-sky-50 dark:bg-slate-800 p-2">
        {options.map((option) => {
          const isActive = option === value // 判斷是否為當前選中項
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)} // 點擊時觸發選擇回調
              className={`rounded-2xl py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-primary-500 text-white shadow-md' // 選中狀態：主色背景，白色文字
                  : 'bg-white text-gray-700 dark:bg-slate-900 dark:text-gray-200' // 未選中狀態：白色背景，灰色文字
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// 風扇速度選項（預定義）
export const FanSpeedOptions = ['High', 'Medium', 'Low', 'Off']

