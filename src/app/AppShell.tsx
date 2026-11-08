import { Outlet } from 'react-router'
import { useAuth } from '../features/auth/authContext'
import { TabBar } from './TabBar'

export function AppShell() {
  const { status } = useAuth()

  return (
    <div className="relative mx-auto min-h-dvh max-w-[430px] bg-white">
      {status === 'demo' && (
        <div className="flex justify-center pt-[calc(8px+env(safe-area-inset-top))]">
          <span className="label-mono rounded-full bg-surface px-3 py-1 text-[10px]">Mode demo · Supabase no connectat</span>
        </div>
      )}
      <main className="pb-[calc(120px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
