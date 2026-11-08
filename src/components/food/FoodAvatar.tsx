type FoodAvatarProps = {
  name: string
  size: number
}

/** Stand-in for the cut-out photo (step 5): the food's initial, set like a type specimen. */
export function FoodAvatar({ name, size }: FoodAvatarProps) {
  const initial = Array.from(name.trim())[0]?.toLocaleUpperCase('ca') ?? '·'

  return (
    <div
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgb(10_10_10/0.06)]"
      style={{ width: size, height: size }}
    >
      <span className="leading-none font-light tracking-[-0.04em] text-ink" style={{ fontSize: size * 0.46 }}>
        {initial}
      </span>
    </div>
  )
}
