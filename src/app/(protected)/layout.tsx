import React from 'react'
import ProtectedNavbar from '@/components/protected-navbar'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <ProtectedNavbar />
      <main className="flex-1 mx-auto max-w-7xl px-4 py-6">
        {children}
      </main>
    </div>
  )
}

