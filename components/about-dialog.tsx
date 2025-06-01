'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export function AboutTrigger() {
  const [showAbout, setShowAbout] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowAbout(true)}
        className='text-xs text-gray-500 hover:text-gray-700 transition-colors'
      >
        About
      </button>

      {showAbout && (
        <div
          className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
          onClick={() => setShowAbout(false)}
        >
          <div
            className='bg-white rounded-lg p-6 max-w-sm shadow-xl animate-in zoom-in-95 duration-200'
            onClick={e => e.stopPropagation()}
          >
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-bold'>Plate</h2>
              <button
                onClick={() => setShowAbout(false)}
                className='text-gray-400 hover:text-gray-600 transition-colors'
              >
                <X size={20} />
              </button>
            </div>

            <p className='text-gray-600 mb-4 leading-relaxed'>
              Rethinking restaurant systems with voice-enabled ordering and
              real-time operations.
            </p>

            <div className='bg-gray-50 rounded-lg p-3 mb-4'>
              <p className='text-sm text-gray-700 font-medium mb-1'>
                Created by Mike Young
              </p>
              <p className='text-xs text-gray-500'>
                Full-stack developer passionate about improving restaurant
                workflows
              </p>
            </div>

            <div className='flex gap-3'>
              <a
                href='https://linkedin.com/in/mikeyoung304'
                target='_blank'
                rel='noopener noreferrer'
                className='flex-1 bg-blue-600 text-white py-2 px-4 rounded text-center text-sm
                         hover:bg-blue-700 transition-colors'
              >
                Connect
              </a>
              <button
                onClick={() => setShowAbout(false)}
                className='flex-1 bg-gray-900 text-white py-2 px-4 rounded text-sm
                         hover:bg-gray-800 transition-colors'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
