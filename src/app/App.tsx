import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from '../features/auth/AuthProvider'
import { LoginPage } from '../features/auth/LoginPage'
import { RequireAuth } from '../features/auth/RequireAuth'
import { PantryPage } from '../features/pantry/PantryPage'
import { ComingSoonPage } from '../features/placeholder/ComingSoonPage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { TodayPage } from '../features/today/TodayPage'
import { supabase } from '../lib/supabase'
import { AppShell } from './AppShell'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="entrar" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<TodayPage />} />
          <Route path="rebost" element={<PantryPage />} />
          <Route path="afegir" element={<ComingSoonPage eyebrow="Nou registre" title="Afegir" />} />
          <Route path="progres" element={<ComingSoonPage eyebrow="La teva evolució" title="Progrés" />} />
          <Route path="perfil" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export function App() {
  return (
    <AuthProvider client={supabase?.auth ?? null} allowDemo={import.meta.env.DEV}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
