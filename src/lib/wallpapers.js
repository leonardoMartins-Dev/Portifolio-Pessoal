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
