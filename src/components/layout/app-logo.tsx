'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface AppLogoProps {
  compact?: boolean
  className?: string
}

export function AppLogo({ compact = false, className }: AppLogoProps) {
  const sizeClass = compact ? 'h-10 w-40' : 'h-16 w-full max-w-[220px]'

  return (
    <div className={cn('flex min-w-0 items-center', className)}>
      <Image
        src="/amazon-product-research-logo-light.svg"
        alt="Amazon Product Research"
        width={420}
        height={168}
        priority
        className={cn('block object-contain object-left dark:hidden', sizeClass)}
      />
      <Image
        src="/amazon-product-research-logo.svg"
        alt=""
        width={420}
        height={168}
        priority
        aria-hidden="true"
        className={cn('hidden object-contain object-left dark:block', sizeClass)}
      />
    </div>
  )
}
