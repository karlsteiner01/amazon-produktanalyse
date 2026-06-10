'use client'

import { useState } from 'react'
import { PackageSearch } from 'lucide-react'

const SIZE = { sm: 'size-9', md: 'size-12', lg: 'size-14' } as const

export function ProductThumb({
  src,
  title,
  size = 'md',
}: {
  src: string | null
  title?: string
  size?: keyof typeof SIZE
}) {
  const [failed, setFailed] = useState(false)
  const show = src && !failed
  return (
    <div
      className={`flex ${SIZE[size]} shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white p-1 shadow-sm dark:bg-muted`}
    >
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={title ? `${title} Produktbild` : 'Produktbild'}
          className="block h-full w-full object-contain"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <PackageSearch className="size-5 text-muted-foreground" />
      )}
    </div>
  )
}
