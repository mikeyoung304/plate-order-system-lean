// TEMPORARY: Direct server page access without auth wrapper
import ServerPage from '@/app/(auth)/server/page'

export default function ServerBypass() {
  return (
    <div>
      <div className="bg-red-600 text-white p-2 text-center">
        ⚠️ AUTH BYPASSED - TESTING ONLY
      </div>
      <ServerPage />
    </div>
  )
}