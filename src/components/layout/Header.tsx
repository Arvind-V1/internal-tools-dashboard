import { clsx } from 'clsx'
import { Bell, ChevronDown, LogOut, Menu, Moon, Settings, Sun, User, X, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTheme } from '../../hooks/themeContext'
import { useDashboard } from '../../hooks/useDashboard'
import { buildNotifications } from '../../lib/dashboard'
import { Dropdown, DropdownItem } from '../ui/Dropdown'
import { SearchInput } from './SearchInput'


const NAV_ITEMS = [
  { to: '/', label: 'Dashboard' },
  { to: '/tools', label: 'Tools' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/settings', label: 'Settings' },
]

const iconButton =
  'relative flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none'

function NavItems({ onNavigate, className, linkClassName }: { onNavigate?: () => void; className: string; linkClassName?: string }) {
  return (
    <nav aria-label="Main" className={className}>
      {NAV_ITEMS.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx('transition-colors hover:text-fg', isActive ? 'text-fg' : 'text-fg-muted', linkClassName)
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button type="button" onClick={toggleTheme} aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'} className={iconButton}>
      {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
    </button>
  )
}

function NotificationsMenu() {
  const { data } = useDashboard()
  const notifications = data ? buildNotifications(data.tools) : []
  const count = notifications.length

  return (
    <Dropdown
      label={count ? `Notifications, ${count} unread` : 'Notifications'}
      triggerClassName={iconButton}
      panelClassName="w-80"
      trigger={
        <>
          <Bell size={20} />
          {count > 0 && <span data-testid="notifications-badge" className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500" />}
        </>
      }
    >
      {() => (
        <>
          <p className="px-3 py-2 text-sm font-semibold">
            Notifications <span className="font-normal text-fg-muted">({count})</span>
          </p>
          {count === 0 ? (
            <p className="px-3 pb-3 text-sm text-fg-muted">You're all caught up.</p>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li key={n.id} className="rounded-lg px-3 py-2 hover:bg-hover">
                  <p className="text-sm">{n.title}</p>
                  <p className="text-xs text-fg-muted">{n.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Dropdown>
  )
}

function UserMenu() {
  return (
    <Dropdown
      label="User menu"
      triggerClassName="flex items-center gap-2 rounded-full focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
      trigger={
        <>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-500 dark:bg-gray-100">AT</span>
          <ChevronDown size={16} className="hidden text-fg-muted sm:block" />
        </>
      }
    >
      {(close) => (
        <>
          <div className="px-3 py-2">
            <p className="text-sm font-semibold">Arvind T.</p>
            <p className="text-xs text-fg-muted">IT Admin</p>
          </div>
          <div className="my-1 border-t border-line" />
          <DropdownItem icon={<User size={16} />} onSelect={close}>Profile</DropdownItem>
          <DropdownItem icon={<Settings size={16} />} onSelect={close}>Settings</DropdownItem>
          <DropdownItem icon={<LogOut size={16} />} danger onSelect={close}>Sign out</DropdownItem>
        </>
      )}
    </Dropdown>
  )
}

export function Header() {
  const [menuOpenAt, setMenuOpenAt] = useState<string | null>(null)
  const { pathname } = useLocation()
  const menuOpen = menuOpenAt === pathname

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-header">
      <div className="mx-auto flex h-16.75 max-w-7xl items-center px-6">
        <Link to="/" className="flex items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-violet-600 text-white">
            <Zap size={18} />
          </span>
          <span className="text-xl font-semibold tracking-tight">TechCorp</span>
        </Link>

        <NavItems className="ml-8 hidden items-center gap-6 lg:flex" />

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <SearchInput className="hidden w-52 lg:block xl:w-64" />
          <ThemeToggle />
          <NotificationsMenu />
          <Link to="/settings" aria-label="Settings" className={clsx(iconButton, 'hidden lg:flex')}>
            <Settings size={20} />
          </Link>
          <UserMenu />
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpenAt(menuOpen ? null : pathname)}
            className={clsx(iconButton, 'lg:hidden')}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="mobile-nav" className="border-t border-line px-6 pt-4 pb-5 lg:hidden">
          <SearchInput className="mb-3" />
          <NavItems className="flex flex-col" linkClassName="rounded-lg px-3 py-2.5 text-base hover:bg-hover" onNavigate={() => setMenuOpenAt(null)} />
        </div>
      )}
    </header>
  )
}
