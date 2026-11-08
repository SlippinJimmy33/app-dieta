import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from '../features/auth/AuthProvider'
import { LoginPage } from '../features/auth/LoginPage'
import { RequireAuth } from '../features/auth/RequireAuth'
import { GoalsPage } from '../features/goals/GoalsPage'
import { AddFoodPage } from '../features/log/AddFoodPage'
import { AddPortionPage, EditEntryPage } from '../features/log/PortionPages'
import { createSupabaseGoalsApi, createSupabaseLogApi } from '../features/log/supabaseLogApi'
import { FoodFormPage } from '../features/pantry/FoodFormPage'
import { PantryPage } from '../features/pantry/PantryPage'
import { createSupabasePantryApi } from '../features/pantry/supabasePantryApi'
import { createSupabasePlanApi } from '../features/plan/planApi'
import { PlanDayPage } from '../features/plan/PlanDayPage'
import { ComingSoonPage } from '../features/placeholder/ComingSoonPage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { TodayPage } from '../features/today/TodayPage'
import { supabase } from '../lib/supabase'
import type { Api } from './apiContext'
import { AppShell } from './AppShell'
import { DataProvider } from './DataProvider'
import { createDemoApi } from './memoryApi'
import { ScrollToTop } from './ScrollToTop'

export function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="entrar" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<TodayPage />} />
            <Route path="rebost" element={<PantryPage />} />
            <Route path="progres" element={<ComingSoonPage eyebrow="La teva evolució" title="Progrés" />} />
            <Route path="perfil" element={<ProfilePage />} />
          </Route>
          {/* Full-screen flows: no tab bar, their main button takes its place. */}
          <Route path="afegir" element={<AddFoodPage />} />
          <Route path="afegir/:foodId" element={<AddPortionPage />} />
          <Route path="registre/:entryId" element={<EditEntryPage />} />
          <Route path="rebost/nou" element={<FoodFormPage />} />
          <Route path="rebost/:id" element={<FoodFormPage />} />
          <Route path="perfil/objectius" element={<GoalsPage />} />
          <Route path="pla" element={<PlanDayPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

// Without Supabase (development demo) everything lives in memory, seeded with sample data.
const api: Api = supabase
  ? {
      pantry: createSupabasePantryApi(supabase),
      log: createSupabaseLogApi(supabase),
      goals: createSupabaseGoalsApi(supabase),
      plan: createSupabasePlanApi(supabase),
    }
  : createDemoApi()

export function App() {
  return (
    <AuthProvider client={supabase?.auth ?? null} allowDemo={import.meta.env.DEV}>
      <DataProvider api={api}>
        {/* BASE_URL is "/" locally and "/app-dieta/" on GitHub Pages. */}
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppRoutes />
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  )
}
