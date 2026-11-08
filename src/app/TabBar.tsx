import { NavLink, useLocation } from 'react-router'
import { Icon, type IconName } from '../components/ui/Icon'

type Tab = { to: string; label: string; icon: IconName }

const leftTabs: Tab[] = [
  { to: '/', label: 'Avui', icon: 'today' },
  { to: '/rebost', label: 'Rebost', icon: 'pantry' },
]

const rightTabs: Tab[] = [
  { to: '/progres', label: 'Progrés', icon: 'progress' },
  { to: '/perfil', label: 'Perfil', icon: 'user' },
]

function TabLink({ to, label, icon }: Tab) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      aria-label={label}
      className={({ isActive }) =>
        `flex size-12 flex-col items-center justify-center gap-1 rounded-full transition-colors ${
          isActive ? 'text-ink' : 'text-faint hover:text-ink-soft'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon name={icon} />
          <span className={`size-1 rounded-full ${isActive ? 'bg-accent' : 'bg-transparent'}`} />
        </>
      )}
    </NavLink>
  )
}

export function TabBar() {
  const location = useLocation()
  // From a past day on the day view, the + logs to that day.
  const day = location.pathname === '/' ? new URLSearchParams(location.search).get('dia') : null
  const addTo = day ? `/afegir?${new URLSearchParams({ dia: day })}` : '/afegir'

  return (
    <nav
      aria-label="Navegació principal"
      className="glass fixed bottom-[calc(16px+env(safe-area-inset-bottom))] left-1/2 z-20 flex h-[68px] w-[calc(min(100vw,430px)-40px)] -translate-x-1/2 items-center justify-around rounded-full px-2"
    >
      {leftTabs.map((tab) => (
        <TabLink key={tab.to} {...tab} />
      ))}
      <NavLink
        to={addTo}
        aria-label="Afegir"
        className="flex size-[52px] items-center justify-center rounded-full bg-ink text-white shadow-[0_6px_18px_rgb(10_10_10/0.25)] transition-transform active:scale-95"
      >
        <Icon name="plus" strokeWidth={2} />
      </NavLink>
      {rightTabs.map((tab) => (
        <TabLink key={tab.to} {...tab} />
      ))}
    </nav>
  )
}
