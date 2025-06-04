'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell'
import {
  ProtectedRoute,
  useIsRole,
  useRole,
} from '@/lib/modassembly/supabase/auth'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  ChefHat,
  Clock,
  LayoutGrid,
  Mic,
  Settings,
  Shield,
  TrendingUp,
  User,
  Utensils,
} from 'lucide-react'

function DashboardContent() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const userRole = useRole()
  const isServer = useIsRole('server')
  const isCook = useIsRole('cook')
  const isAdmin = useIsRole('admin')

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Animation classes are now handled via CSS for better performance

  return (
    <Shell>
      {/* Subtle texture overlay */}
      <div className='absolute inset-0 bg-noise opacity-5 pointer-events-none'></div>

      <div className='container py-8 md:py-12 relative z-10'>
        <div className='dashboard-header flex flex-col md:flex-row items-start md:items-center justify-between mb-12'>
          <div>
            <h1 className='text-3xl md:text-4xl font-semibold tracking-tight sf-pro-display text-white drop-shadow-sm mb-2'>
              Plate
            </h1>
            <p className='mt-2 text-gray-400 sf-pro-text font-light'>
              Restaurant operations dashboard
            </p>
          </div>

          <div className='mt-4 md:mt-0 flex items-center bg-gray-900/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-800/50 shadow-inner'>
            <Clock className='w-4 h-4 text-gray-400 mr-2' />
            <span className='text-gray-300 sf-pro-text'>
              {formatTime(currentTime)}
            </span>
          </div>
        </div>

        <div className='dashboard-container grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8'>
          {/* Server Station - Orders & Tables */}
          <div className='dashboard-item dashboard-item-1'>
            <Link href='/server' className='block h-full'>
              <Card className='h-full dashboard-card bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-700 border-blue-500/50 hover:border-blue-400/70 transition-all duration-500 overflow-hidden group shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02]'>
                <CardContent className='p-0'>
                  <div className='p-8 flex flex-col h-full relative'>
                    {/* Enhanced glow effect */}
                    <div className='absolute -top-32 -right-32 w-64 h-64 bg-cyan-300/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700'></div>

                    <div className='w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:bg-white/20 transition-all duration-300 shadow-2xl border border-white/20'>
                      <Utensils className='w-8 h-8 text-white drop-shadow-lg' />
                    </div>
                    <h2 className='text-2xl font-semibold sf-pro-display mb-3 text-white drop-shadow-sm'>
                      Server Station
                    </h2>
                    <p className='text-blue-100 sf-pro-text font-light text-sm leading-relaxed'>
                      Orders & Tables Management
                    </p>
                    <div className='mt-4 flex flex-wrap items-center gap-3 text-xs text-blue-100'>
                      <div className='flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full'>
                        <Mic className='w-3 h-3' />
                        <span>Voice Orders</span>
                      </div>
                      <div className='flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full'>
                        <User className='w-3 h-3' />
                        <span>Table Management</span>
                      </div>
                    </div>
                    <div className='mt-auto pt-8'>
                      <div className='flex items-center justify-between'>
                        <div className='text-white font-medium text-sm sf-pro-text group-hover:translate-x-2 transition-transform duration-300'>
                          Access Station →
                        </div>
                        <div className='w-3 h-3 bg-white rounded-full animate-pulse shadow-lg'></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Kitchen Display - Order Queue & Timing */}
          <div className='dashboard-item dashboard-item-2'>
            <Link href='/kitchen' className='block h-full'>
              <Card className='h-full bg-gradient-to-br from-green-600 via-green-700 to-emerald-700 border-green-500/50 hover:border-green-400/70 transition-all duration-500 overflow-hidden group shadow-2xl hover:shadow-green-500/20 hover:scale-[1.02]'>
                <CardContent className='p-0'>
                  <div className='p-8 flex flex-col h-full relative'>
                    {/* Enhanced glow effect */}
                    <div className='absolute -top-32 -right-32 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700'></div>

                    <div className='w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:bg-white/20 transition-all duration-300 shadow-2xl border border-white/20'>
                      <ChefHat className='w-8 h-8 text-white drop-shadow-lg' />
                    </div>
                    <h2 className='text-2xl font-semibold sf-pro-display mb-3 text-white drop-shadow-sm'>
                      Kitchen Display
                    </h2>
                    <p className='text-green-100 sf-pro-text font-light text-sm leading-relaxed'>
                      Order Queue & Timing Analytics
                    </p>
                    <div className='mt-4 flex flex-wrap items-center gap-3 text-xs text-green-100'>
                      <div className='flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full'>
                        <Clock className='w-3 h-3' />
                        <span>Real-time Queue</span>
                      </div>
                      <div className='flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full'>
                        <TrendingUp className='w-3 h-3' />
                        <span>Timing Analytics</span>
                      </div>
                    </div>
                    <div className='mt-auto pt-8'>
                      <div className='flex items-center justify-between'>
                        <div className='text-white font-medium text-sm sf-pro-text group-hover:translate-x-2 transition-transform duration-300'>
                          View Kitchen →
                        </div>
                        <div className='w-3 h-3 bg-white rounded-full animate-pulse shadow-lg'></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Expo Station - Quality & Dispatch */}
          <div className='dashboard-item dashboard-item-3'>
            <Link href='/expo' className='block h-full'>
              <Card className='h-full bg-gradient-to-br from-orange-600 via-orange-700 to-amber-700 border-orange-500/50 hover:border-orange-400/70 transition-all duration-500 overflow-hidden group shadow-2xl hover:shadow-orange-500/20 hover:scale-[1.02]'>
                <CardContent className='p-0'>
                  <div className='p-8 flex flex-col h-full relative'>
                    {/* Enhanced glow effect */}
                    <div className='absolute -top-32 -right-32 w-64 h-64 bg-amber-300/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700'></div>

                    <div className='w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:bg-white/20 transition-all duration-300 shadow-2xl border border-white/20'>
                      <Shield className='w-8 h-8 text-white drop-shadow-lg' />
                    </div>
                    <h2 className='text-2xl font-semibold sf-pro-display mb-3 text-white drop-shadow-sm'>
                      Expo Station
                    </h2>
                    <p className='text-orange-100 sf-pro-text font-light text-sm leading-relaxed'>
                      Quality Control & Dispatch
                    </p>
                    <div className='mt-4 flex flex-wrap items-center gap-3 text-xs text-orange-100'>
                      <div className='flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full'>
                        <Shield className='w-3 h-3' />
                        <span>Quality Check</span>
                      </div>
                      <div className='flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full'>
                        <User className='w-3 h-3' />
                        <span>Delivery Coord</span>
                      </div>
                    </div>
                    <div className='mt-auto pt-8'>
                      <div className='flex items-center justify-between'>
                        <div className='text-white font-medium text-sm sf-pro-text group-hover:translate-x-2 transition-transform duration-300'>
                          Access Expo →
                        </div>
                        <div className='w-3 h-3 bg-white rounded-full animate-pulse shadow-lg'></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Floor Plan Manager - Layout & Sections */}
          <div className='dashboard-item dashboard-item-4'>
            <Link href='/admin' className='block h-full'>
              <Card className='h-full bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 border-purple-500/50 hover:border-purple-400/70 transition-all duration-500 overflow-hidden group shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02]'>
                <CardContent className='p-0'>
                  <div className='p-8 flex flex-col h-full relative'>
                    {/* Enhanced glow effect */}
                    <div className='absolute -top-32 -right-32 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700'></div>

                    <div className='w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:bg-white/20 transition-all duration-300 shadow-2xl border border-white/20'>
                      <LayoutGrid className='w-8 h-8 text-white drop-shadow-lg' />
                    </div>
                    <h2 className='text-2xl font-semibold sf-pro-display mb-3 text-white drop-shadow-sm'>
                      Floor Plan Manager
                    </h2>
                    <p className='text-purple-100 sf-pro-text font-light text-sm leading-relaxed'>
                      Layout Design & Section Management
                    </p>
                    <div className='mt-4 flex flex-wrap items-center gap-3 text-xs text-purple-100'>
                      <div className='flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full'>
                        <LayoutGrid className='w-3 h-3' />
                        <span>Edit Layout</span>
                      </div>
                      <div className='flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full'>
                        <User className='w-3 h-3' />
                        <span>Assign Sections</span>
                      </div>
                    </div>
                    <div className='mt-auto pt-8'>
                      <div className='flex items-center justify-between'>
                        <div className='text-white font-medium text-sm sf-pro-text group-hover:translate-x-2 transition-transform duration-300'>
                          Manage Layout →
                        </div>
                        <div className='w-3 h-3 bg-white rounded-full animate-pulse shadow-lg'></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Cook Station - Prep & Recipes */}
          <div className='dashboard-item dashboard-item-5'>
            <Link href='/kitchen/kds' className='block h-full'>
              <Card className='h-full bg-gradient-to-br from-red-600 via-red-700 to-pink-700 border-red-500/50 hover:border-red-400/70 transition-all duration-500 overflow-hidden group shadow-2xl hover:shadow-red-500/20 hover:scale-[1.02]'>
                <CardContent className='p-0'>
                  <div className='p-8 flex flex-col h-full relative'>
                    {/* Enhanced glow effect */}
                    <div className='absolute -top-32 -right-32 w-64 h-64 bg-pink-300/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700'></div>

                    <div className='w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:bg-white/20 transition-all duration-300 shadow-2xl border border-white/20'>
                      <ChefHat className='w-8 h-8 text-white drop-shadow-lg' />
                    </div>
                    <h2 className='text-2xl font-semibold sf-pro-display mb-3 text-white drop-shadow-sm'>
                      Cook Station
                    </h2>
                    <p className='text-red-100 sf-pro-text font-light text-sm leading-relaxed'>
                      Kitchen Display System & Prep Lists
                    </p>
                    <div className='mt-4 flex flex-wrap items-center gap-3 text-xs text-red-100'>
                      <div className='flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full'>
                        <ChefHat className='w-3 h-3' />
                        <span>Prep Lists</span>
                      </div>
                      <div className='flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full'>
                        <Settings className='w-3 h-3' />
                        <span>KDS View</span>
                      </div>
                    </div>
                    <div className='mt-auto pt-8'>
                      <div className='flex items-center justify-between'>
                        <div className='text-white font-medium text-sm sf-pro-text group-hover:translate-x-2 transition-transform duration-300'>
                          Access KDS →
                        </div>
                        <div className='w-3 h-3 bg-white rounded-full animate-pulse shadow-lg'></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Analytics Hub - Performance & Insights */}
          <div className='dashboard-item dashboard-item-6'>
            <Link href='/kitchen/metrics' className='block h-full'>
              <Card className='h-full bg-gradient-to-br from-violet-600 via-violet-700 to-purple-700 border-violet-500/50 hover:border-violet-400/70 transition-all duration-500 overflow-hidden group shadow-2xl hover:shadow-violet-500/20 hover:scale-[1.02]'>
                <CardContent className='p-0'>
                  <div className='p-8 flex flex-col h-full relative'>
                    {/* Enhanced glow effect */}
                    <div className='absolute -top-32 -right-32 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700'></div>

                    <div className='w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:bg-white/20 transition-all duration-300 shadow-2xl border border-white/20'>
                      <Shield className='w-8 h-8 text-white drop-shadow-lg' />
                    </div>
                    <h2 className='text-2xl font-semibold sf-pro-display mb-3 text-white drop-shadow-sm'>
                      Analytics Hub
                    </h2>
                    <p className='text-violet-100 sf-pro-text font-light text-sm leading-relaxed'>
                      Performance Metrics & Business Insights
                    </p>
                    <div className='mt-4 flex flex-wrap items-center gap-3 text-xs text-violet-100'>
                      <div className='flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full'>
                        <Shield className='w-3 h-3' />
                        <span>Sales Reports</span>
                      </div>
                      <div className='flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full'>
                        <TrendingUp className='w-3 h-3' />
                        <span>Forecasting</span>
                      </div>
                    </div>
                    <div className='mt-auto pt-8'>
                      <div className='flex items-center justify-between'>
                        <div className='text-white font-medium text-sm sf-pro-text group-hover:translate-x-2 transition-transform duration-300'>
                          View Analytics →
                        </div>
                        <div className='w-3 h-3 bg-white rounded-full animate-pulse shadow-lg'></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </Shell>
  )
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
