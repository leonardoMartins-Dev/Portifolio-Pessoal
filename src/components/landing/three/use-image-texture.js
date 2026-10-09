import { useEffect, useState } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';

/**
 * Textura a partir de uma imagem, sem suspender a cena: devolve null até
 * carregar (e continua null se falhar — o objeto fica neutro). Com
 * `height`, a imagem é rasterizada nessa altura (útil para SVG).
 */
export function useImageTexture(src, { height } = {}) {
  const [texture, setTexture] = useState(null);
  useEffect(() => {
    if (!src) return;
    let active = true;
    let created = null;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (!active) return;
      const scale = height ? height / image.naturalHeight : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      created = new CanvasTexture(canvas);
      created.colorSpace = SRGBColorSpace;
      created.anisotropy = 8;
      setTexture(created);
    };
    image.src = src;
    return () => {
      active = false;
      image.onload = null;
      created?.dispose();
    };
  }, [src, height]);
  return texture;
}
