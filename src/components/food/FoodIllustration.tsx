import { useId } from 'react'
import type { IllustratedFood } from './illustrations'

type FoodIllustrationProps = {
  kind: IllustratedFood
  size?: number
  label: string
}

export function FoodIllustration({ kind, size = 200, label }: FoodIllustrationProps) {
  // Gradient ids must be unique per instance: the same food can appear many times on a page.
  const id = useId().replace(/:/g, '')
  const g = `${id}-g`
  const g2 = `${id}-g2`
  const s = `${id}-s`

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={label}>
      <defs>
        <filter id={s} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        {kind === 'poma' && (
          <>
            <radialGradient id={g} cx="35%" cy="32%" r="75%">
              <stop offset="0" stopColor="#FF8A7A" />
              <stop offset="0.45" stopColor="#E5322D" />
              <stop offset="1" stopColor="#8C1212" />
            </radialGradient>
            <linearGradient id={g2} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#9CCC65" />
              <stop offset="1" stopColor="#33691E" />
            </linearGradient>
          </>
        )}
        {kind === 'platan' && (
          <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFE873" />
            <stop offset="0.6" stopColor="#F6C324" />
            <stop offset="1" stopColor="#D49A00" />
          </linearGradient>
        )}
        {kind === 'arros' && (
          <>
            <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#D6D6DC" />
            </linearGradient>
            <radialGradient id={g2} cx="45%" cy="35%" r="70%">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#EDEBE1" />
            </radialGradient>
          </>
        )}
        {kind === 'pollastre' && (
          <radialGradient id={g} cx="40%" cy="35%" r="75%">
            <stop offset="0" stopColor="#F7D9A6" />
            <stop offset="0.5" stopColor="#DDA058" />
            <stop offset="1" stopColor="#9E5B20" />
          </radialGradient>
        )}
        {kind === 'mel' && (
          <linearGradient id={g} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#B85F00" />
            <stop offset="0.35" stopColor="#FFB938" />
            <stop offset="0.7" stopColor="#F0A010" />
            <stop offset="1" stopColor="#A35200" />
          </linearGradient>
        )}
      </defs>

      {kind === 'poma' && (
        <>
          <ellipse cx="100" cy="182" rx="50" ry="7" fill="#000" opacity="0.16" filter={`url(#${s})`} />
          <path
            d="M100 62 C82 48 38 50 38 102 C38 146 70 180 92 174 C97 172 103 172 108 174 C130 180 162 146 162 102 C162 50 118 48 100 62 Z"
            fill={`url(#${g})`}
          />
          <path d="M100 64 C100 52 103 42 109 33" stroke="#4E342E" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M107 47 C119 31 141 31 147 37 C138 52 119 55 107 47 Z" fill={`url(#${g2})`} />
          <ellipse cx="72" cy="88" rx="10" ry="17" fill="#fff" opacity="0.32" transform="rotate(-20 72 88)" />
        </>
      )}

      {kind === 'platan' && (
        <>
          <ellipse cx="104" cy="176" rx="60" ry="6" fill="#000" opacity="0.15" filter={`url(#${s})`} />
          <path
            d="M28 66 C34 140 112 176 170 126 C176 120 174 110 166 112 C120 142 66 124 46 64 C43 55 27 56 28 66 Z"
            fill={`url(#${g})`}
          />
          <path d="M44 82 C64 128 116 144 158 122" stroke="#FFF6C2" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />
          <path d="M38 60 C36 50 39 42 45 37" stroke="#6D5A2B" strokeWidth="7" strokeLinecap="round" fill="none" />
          <circle cx="171" cy="118" r="4" fill="#4E342E" />
        </>
      )}

      {kind === 'arros' && (
        <>
          <ellipse cx="100" cy="184" rx="56" ry="6" fill="#000" opacity="0.15" filter={`url(#${s})`} />
          <path d="M26 104 C30 152 64 176 100 176 C136 176 170 152 174 104 Z" fill={`url(#${g})`} />
          <path d="M34 128 C60 140 140 140 166 128" stroke="#0A0A0A" strokeWidth="1.5" fill="none" opacity="0.45" />
          <ellipse cx="100" cy="104" rx="74" ry="10" fill="#E5E5EA" />
          <path d="M34 104 C38 70 72 52 100 52 C128 52 162 70 166 104 Z" fill={`url(#${g2})`} />
          {[
            [70, 80, -20],
            [90, 68, 15],
            [112, 74, -35],
            [130, 86, 25],
            [84, 94, 40],
            [104, 90, -10],
            [122, 100, 10],
            [60, 98, 30],
            [142, 98, -25],
            [100, 60, 0],
          ].map(([cx, cy, r]) => (
            <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="5" ry="2.4" fill="#DFDBCB" transform={`rotate(${r} ${cx} ${cy})`} />
          ))}
        </>
      )}

      {kind === 'pollastre' && (
        <>
          <ellipse cx="100" cy="174" rx="62" ry="7" fill="#000" opacity="0.16" filter={`url(#${s})`} />
          <path
            d="M36 118 C28 80 78 52 120 58 C162 64 180 100 162 132 C148 158 100 168 68 158 C52 152 40 138 36 118 Z"
            fill={`url(#${g})`}
          />
          <path
            d="M64 92 L92 140 M92 76 L124 140 M124 70 L150 116"
            stroke="#6B3410"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
            opacity="0.35"
          />
          <ellipse cx="82" cy="84" rx="18" ry="8" fill="#fff" opacity="0.25" transform="rotate(-25 82 84)" />
        </>
      )}

      {kind === 'mel' && (
        <>
          <ellipse cx="100" cy="184" rx="54" ry="6" fill="#000" opacity="0.16" filter={`url(#${s})`} />
          <rect x="46" y="68" width="108" height="112" rx="26" fill={`url(#${g})`} />
          <rect x="58" y="82" width="9" height="80" rx="4.5" fill="#fff" opacity="0.45" />
          <rect x="76" y="110" width="62" height="36" rx="8" fill="#fff" opacity="0.92" />
          <rect x="86" y="122" width="42" height="3" rx="1.5" fill="#0A0A0A" />
          <rect x="92" y="130" width="30" height="2" rx="1" fill="#8E8E93" />
          <rect x="58" y="44" width="84" height="26" rx="8" fill="#1C1C1E" />
          <rect x="58" y="44" width="84" height="6" rx="3" fill="#3A3A3C" />
        </>
      )}
    </svg>
  )
}
