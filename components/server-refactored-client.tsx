'use client'

import { Shell } from '@/components/shell'
import { Card, CardContent } from '@/components/ui/card'

type ServerRefactoredClientComponentProps = {
  user: { id: string; email?: string }
  profile: { role: string | null; name: string | null } | null
}

export function ServerRefactoredClientComponent({
  user,
  profile,
}: ServerRefactoredClientComponentProps) {
  return (
    <Shell user={user} profile={profile}>
      <div className='p-6'>
        <h1 className='text-3xl font-bold text-white mb-6'>
          Server Refactored
        </h1>
        <Card className='bg-gray-800/40 border-gray-700'>
          <CardContent className='p-6'>
            <div className='text-center'>
              <h2 className='text-xl font-semibold text-white mb-2'>
                Refactored Server Interface
              </h2>
              <p className='text-gray-400'>Optimized server workflow system</p>
              <div className='mt-4 text-sm text-gray-500'>
                <div>User: {user.email}</div>
                <div>Role: {profile?.role || 'N/A'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}
