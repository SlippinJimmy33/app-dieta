import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from '../features/auth/AuthProvider'
import { LoginPage } from '../features/auth/LoginPage'
import { RequireAuth } from '../features/auth/RequireAuth'
import { FoodFormPage } from '../features/pantry/FoodFormPage'
import { createMemoryPantryApi, demoFoods } from '../features/pantry/memoryPantryApi'
import { PantryPage } from '../features/pantry/PantryPage'
import { createSupabasePantryApi } from '../features/pantry/supabasePantryApi'
import { ComingSoonPage } from '../features/placeholder/ComingSoonPage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { TodayPage } from '../features/today/TodayPage'
import { supabase } from '../lib/supabase'
import type { Api } from './apiContext'
import { AppShell } from './AppShell'
import { DataProvider } from './DataProvider'

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
        {/* Full-screen forms: no tab bar, the save button takes its place. */}
        <Route path="rebost/nou" element={<FoodFormPage />} />
        <Route path="rebost/:id" element={<FoodFormPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Without Supabase (development demo) the pantry lives in memory, seeded with the sample foods.
const api: Api = {
  pantry: supabase ? createSupabasePantryApi(supabase) : createMemoryPantryApi(demoFoods),
}

export function App() {
  return (
    <AuthProvider client={supabase?.auth ?? null} allowDemo={import.meta.env.DEV}>
      <DataProvider api={api}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  )
}
