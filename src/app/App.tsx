import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { PantryPage } from '../features/pantry/PantryPage'
import { ComingSoonPage } from '../features/placeholder/ComingSoonPage'
import { TodayPage } from '../features/today/TodayPage'
import { AppShell } from './AppShell'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<TodayPage />} />
        <Route path="rebost" element={<PantryPage />} />
        <Route path="afegir" element={<ComingSoonPage eyebrow="Nou registre" title="Afegir" />} />
        <Route path="progres" element={<ComingSoonPage eyebrow="La teva evolució" title="Progrés" />} />
        <Route path="perfil" element={<ComingSoonPage eyebrow="Compte i objectius" title="Perfil" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
