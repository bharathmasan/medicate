import { useState } from 'react';
import { Wind } from 'lucide-react';

interface ResilientImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle,
}: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F5F3FF] via-[#EFF6FF] to-[#E8ECF8] text-[#5B49B8] ${className}`}
      >
        <Wind className="h-7 w-7 opacity-60" aria-hidden="true" />
        {fallbackTitle && (
          <span className="mt-2 px-4 text-center text-xs font-medium text-[#5A617A]">
            {fallbackTitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
