# App Dieta

PWA per registrar els teus aliments habituals (amb foto retallada), comptar calories i macros, i organitzar els àpats.

## Stack

Vite + React + TypeScript, Tailwind CSS v4, React Router. Tests amb Vitest i Testing Library.

## Comandes

```bash
npm install        # instal·lar dependències
npm run dev        # servidor de desenvolupament (http://localhost:5173)
npm run check      # tipatge + lint + tests (executar abans de cada commit)
npm run build      # build de producció a dist/
```

## Estructura

- `src/app` — rutes, layout i barra de navegació
- `src/components/ui` — sistema de disseny (botons, anell de progrés, xips…)
- `src/components/food` — il·lustracions provisionals dels aliments
- `src/features/*` — pantalles per funcionalitat (avui, rebost…)
- `src/lib` — lògica pura i testejada (nutrició, format de números)
- `src/mocks` — dades d'exemple de la fase de disseny; desapareixen quan hi hagi base de dades
- `supabase/migrations` — esquema de la base de dades (SQL), en ordre d'aplicació
- `supabase/tests` — tests de l'esquema i de la seguretat per usuari, executats amb PGlite (Postgres local)

## Base de dades

Cada usuari només pot llegir i escriure les seves pròpies files (row level security), i les fotos van a
`food-photos/<id d'usuari>/…`. Els registres del dia guarden una còpia dels valors de l'aliment, calculada pel
servidor, perquè editar o esborrar un aliment no canviï els dies passats.
