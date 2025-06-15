export default function Loading() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
        <p className="text-white/60 text-lg">Loading Plate Restaurant...</p>
      </div>
    </div>
  )
}