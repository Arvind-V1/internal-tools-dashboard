import { Outlet } from 'react-router-dom'
import { Header } from './Header'

export function Layout() {
  return (
    <div className="bg-grid min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-6 pt-8.5 pb-10">
        <Outlet />
      </main>
    </div>
  )
}
