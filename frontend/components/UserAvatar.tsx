'use client';

import Image from 'next/image';
import type { User } from '@/lib/types';

interface UserAvatarProps {
  user: Pick<User, 'id' | 'name'> & {
    displayName?: string | null;
    avatarUrl?: string | null;
  };
  subtitle?: string | null;
  size?: 'sm' | 'md';
}

export function UserAvatar({ user, subtitle, size = 'md' }: UserAvatarProps) {
  const name = user.displayName || user.name;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const avatarSize = size === 'sm' ? 32 : 48;

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-8 w-8 sm:h-10 sm:w-10 overflow-hidden rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-xs font-semibold text-white">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={name}
            fill
            sizes={`${avatarSize}px`}
            className="object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-white">{name}</span>
        {subtitle && (
          <span className="text-xs text-[var(--text-secondary)] line-clamp-1">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

