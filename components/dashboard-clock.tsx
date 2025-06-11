'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

export function DashboardClock() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className='mt-4 md:mt-0 flex items-center bg-gray-900/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-800/50 shadow-inner'>
      <Clock className='w-4 h-4 text-gray-400 mr-2' />
      <span className='text-gray-300 sf-pro-text'>
        {formatTime(currentTime)}
      </span>
    </div>
  )
}
