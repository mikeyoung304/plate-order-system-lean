'use client'

// Simple debug component to test if basic KDS rendering works

export function SimpleKDSDebug() {
  return (
    <div className="p-8 bg-yellow-400 text-black border-4 border-red-500">
      <h1 className="text-3xl font-bold mb-4">🔥 SIMPLE KDS DEBUG TEST 🔥</h1>
      <p className="text-xl mb-4">If you see this yellow box, the KDS component system is working!</p>
      
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold">Test Order #1</h3>
          <p>Table 1 - Burger and Fries</p>
          <p className="text-green-600">Status: Ready</p>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold">Test Order #2</h3>
          <p>Table 2 - Pizza</p>
          <p className="text-orange-600">Status: Preparing</p>
        </div>
      </div>
    </div>
  )
}