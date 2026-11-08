import { Outlet } from 'react-router'
import { TabBar } from './TabBar'

export function AppShell() {
  return (
    <div className="relative mx-auto min-h-dvh max-w-[430px] bg-white">
      <main className="pb-[calc(120px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
