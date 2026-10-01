import { useOS } from '../../lib/os-store.js';
import { getWallpaper } from '../../lib/wallpapers.js';

export function Wallpaper({ className = '' }) {
  const wallpaper = getWallpaper(useOS((state) => state.wallpaper));
  return (
    <div
      aria-hidden
      className={`absolute inset-0 bg-cover bg-center ${className}`}
      style={{ backgroundImage: `url(${wallpaper.src})`, backgroundColor: wallpaper.base }}
    />
  );
}
