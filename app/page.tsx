import { redirect } from 'next/navigation'
import Image from 'next/image'
import { AuthForm } from '@/components/auth/AuthForm'
import { createClient } from '@/lib/modassembly/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className='min-h-screen w-full bg-gradient-to-br from-black via-gray-900 to-black flex flex-col items-center justify-center p-4 relative overflow-hidden'>
      {/* Background effects */}
      <div className='absolute inset-0 bg-gradient-radial from-apple-blue/10 via-transparent to-transparent opacity-50'></div>
      <div className='absolute inset-0 bg-noise opacity-[0.02] pointer-events-none'></div>
      
      <div className='w-full max-w-md space-y-12 relative z-10'>
        <div className='flex flex-col items-center'>
          <div className='w-24 h-24 relative mb-8 group'>
            <Image
              src='https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Plate_Logo_HighRes_Transparent-KHpujinpES74Q3nyKx1Nd3ogN1r9t7.png'
              alt='Plate Logo'
              fill
              className='object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500'
              priority
            />
          </div>
          <p className='text-lg text-apple-gray-5/60 text-center font-sans font-light leading-relaxed mt-4'>
            Streamlined Restaurant Systems
          </p>
          
          {/* Quick Demo Login Helper */}
          <div className='text-center mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl'>
            <h3 className='text-sm font-medium text-blue-300 mb-2'>Demo Account</h3>
            <p className='text-xs text-blue-200/80'>
              Email: guest@restaurant.plate<br />
              Password: guest123
            </p>
          </div>
        </div>

        <div className='backdrop-blur-xl bg-black/20 p-8 rounded-3xl border border-white/10 shadow-2xl'>
          <AuthForm />
        </div>
      </div>
    </div>
  )
}
