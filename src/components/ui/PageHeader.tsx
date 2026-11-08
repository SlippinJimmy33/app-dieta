import type { ReactNode } from 'react'

type PageHeaderProps = {
  eyebrow: string
  title: string
  size?: 'large' | 'compact'
  action?: ReactNode
}

export function PageHeader({ eyebrow, title, size = 'large', action }: PageHeaderProps) {
  return (
    <header className="flex items-end justify-between gap-4 px-6 pt-7">
      <div className="flex flex-col gap-1.5">
        <span className="label-mono">{eyebrow}</span>
        <h1
          className={
            size === 'large'
              ? 'm-0 text-5xl leading-none font-normal tracking-[-0.05em]'
              : 'm-0 text-[22px] font-medium tracking-[-0.02em]'
          }
        >
          {title}
        </h1>
      </div>
      {action}
    </header>
  )
}
