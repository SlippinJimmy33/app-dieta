import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon } from './Icon'

type ScreenShellProps = {
  /** Where the back button goes. */
  backTo: string
  backLabel: string
  title?: string
  /** Optional control on the right of the top bar. */
  action?: ReactNode
  children: ReactNode
}

/** Full-screen page without the tab bar: forms and flows that end with their own button. */
export function ScreenShell({ backTo, backLabel, title, action, children }: ScreenShellProps) {
  return (
    <div className="relative mx-auto min-h-dvh max-w-[430px] overflow-x-clip bg-white">
      <header className="relative z-10 flex items-center gap-3 px-6 pt-[calc(24px+env(safe-area-inset-top))]">
        <Link
          to={backTo}
          aria-label={backLabel}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-ink"
        >
          <Icon name="back" size={20} strokeWidth={1.8} />
        </Link>
        {title && <h1 className="m-0 min-w-0 flex-1 truncate text-[22px] font-medium tracking-[-0.02em]">{title}</h1>}
        {action && <div className="ml-auto">{action}</div>}
      </header>
      {children}
    </div>
  )
}

/** Floating glass bar at the bottom that holds a screen's main action. */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="glass fixed bottom-[calc(16px+env(safe-area-inset-bottom))] left-1/2 z-20 w-[calc(min(100vw,430px)-40px)] -translate-x-1/2 rounded-full p-1.5">
      {children}
    </div>
  )
}
