/**
 * Papéis de parede originais (SVG em public/wallpapers). O mesmo arquivo
 * aparece na tela do notebook 3D, para a transição ficar contínua.
 */
export const WALLPAPERS = [
  { id: 'aurora', src: '/wallpapers/aurora.svg', base: '#0c1024' },
  { id: 'dune', src: '/wallpapers/dune.svg', base: '#e9d3b8' },
  { id: 'tide', src: '/wallpapers/tide.svg', base: '#06262a' },
  { id: 'graphite', src: '/wallpapers/graphite.svg', base: '#16171b' },
];

export function getWallpaper(id) {
  return WALLPAPERS.find((wallpaper) => wallpaper.id === id) ?? WALLPAPERS[0];
}

/** Papel de parede claro (pede um véu mais escuro sob texto branco)? */
export function isLightWallpaper(wallpaper) {
  const hex = wallpaper.base.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5;
}
