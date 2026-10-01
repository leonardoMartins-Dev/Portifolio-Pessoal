import { LoaderCircle } from 'lucide-react';

export function Spinner({ className = 'size-4', label }) {
  return (
    <LoaderCircle
      className={`animate-spin ${className}`}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
    />
  );
}
