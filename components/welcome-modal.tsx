'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/modassembly/supabase/client'

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  
  useEffect(() => {
    const checkGuestUser = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          
        setProfile(userProfile)
        
        if (userProfile?.email === 'guest@demo.plate' && !sessionStorage.getItem('welcome-shown')) {
          setIsOpen(true)
          sessionStorage.setItem('welcome-shown', 'true')
        }
      }
    }
    
    checkGuestUser()
  }, [])
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Clean header */}
        <div className="bg-gray-900 px-6 py-8 text-white relative">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          
          <h1 className="text-3xl font-bold mb-2">Plate</h1>
          <p className="text-gray-300">
            by Mike Young • Rethinking restaurant systems
          </p>
        </div>
        
        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-gray-600 mb-6 leading-relaxed">
            Experience the future of restaurant operations with voice-enabled 
            ordering, real-time kitchen displays, and intelligent customer insights.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">
              Key Features to Explore:
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></span>
                Voice ordering: Just speak naturally
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></span>
                Real-time kitchen synchronization
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></span>
                Smart order suggestions
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></span>
                Multi-station workflow
              </li>
            </ul>
          </div>
          
          {/* Clean attribution */}
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Mike Young</p>
              <p className="text-xs text-gray-500">Creator & Developer</p>
            </div>
            
            <a
              href="https://linkedin.com/in/mikeyoung304"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Connect →
            </a>
          </div>
        </div>
        
        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium
                     hover:bg-gray-800 transition-colors"
          >
            Explore Demo
          </button>
        </div>
      </div>
    </div>
  )
}