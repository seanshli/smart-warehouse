import React from 'react'

type SegmentedControlProps = {
  label?: string
  options: string[]
  value: string
  onSelect: (option: string) => void
}

export function SegmentedControl({
  label,
  options,
  value,
  onSelect,
}: SegmentedControlProps) {
  if (!options || options.length === 0) return null

  return (
    <div className="space-y-2">
      {label && (
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
          {label}
        </div>
      )}
      <div className="flex flex-col gap-2 rounded-2xl bg-sky-50 dark:bg-slate-800 p-2">
        {options.map((option) => {
          const isActive = option === value
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={`rounded-2xl py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-white text-gray-700 dark:bg-slate-900 dark:text-gray-200'
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

export const FanSpeedOptions = ['High', 'Medium', 'Low', 'Off']

