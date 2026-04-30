'use client'

import * as React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useCurrentUserImage } from '@/hooks/use-current-user-image'
import { useCurrentUserName } from '@/hooks/use-current-user-name'
import { cn } from '@/lib/utils'

export const CurrentUserAvatar = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<typeof Avatar>
>(({ className, ...props }, ref) => {
  const profileImage = useCurrentUserImage()
  const name = useCurrentUserName()
  const initials = name
    ?.split(' ')
    ?.map((word) => word[0])
    ?.join('')
    ?.toUpperCase()

  return (
    <Avatar
      ref={ref}
      className={cn('cursor-pointer transition-transform hover:scale-110', className)}
      {...props}
    >
      {profileImage && <AvatarImage src={profileImage} alt={initials} />}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
})

CurrentUserAvatar.displayName = 'CurrentUserAvatar'
