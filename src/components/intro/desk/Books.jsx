import { RoundedBox } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { MeshStandardMaterial } from 'three';
import { BOOK_TITLES } from '../desk-objects.js';
import { Interactive } from './Interactive.jsx';
import { LAYOUT } from './layout.js';
import { noiseTexture, pagesTexture, spineTexture } from './textures.js';

// Livros deitados, lombada para a câmera: largura (x) = altura do livro.
const BOOKS = [
  { w: 2.45, h: 0.44, d: 1.72, color: '#27344a', x: 0, rot: 0.04 },
  { w: 2.3, h: 0.36, d: 1.62, color: '#5a2626', x: 0.06, rot: -0.08 },
  { w: 2.38, h: 0.4, d: 1.66, color: '#2f4a3a', x: -0.04, rot: 0.05 },
  { w: 2.15, h: 0.32, d: 1.52, color: '#2b2b2e', x: 0.08, rot: -0.13 },
];
const BOARD = 0.028; // espessura da capa
const OVERHANG = 0.035; // a capa passa um pouco das folhas

/** Materiais de cada livro: capa de tecido (com relevo), lombada gravada e folhas. */
function buildBooks() {
  const cloth = noiseTexture({ seed: 7, size: 128, grain: 0.6 });
  cloth.repeat.set(6, 6);
  const pages = new MeshStandardMaterial({ map: pagesTexture(), roughness: 0.9 });
  const books = [];
  let y = 0;
  for (const [index, book] of BOOKS.entries()) {
    const cover = new MeshStandardMaterial({
      color: book.color,
      roughness: 0.82,
      bumpMap: cloth,
      bumpScale: 0.8,
    });
    const spine = new MeshStandardMaterial({
      map: spineTexture({ title: BOOK_TITLES[index] ?? '', color: book.color }),
      roughness: 0.75,
      bumpMap: cloth,
      bumpScale: 0.8,
    });
    books.push({ ...book, y: y + book.h / 2, cover, spine, pages });
    y += book.h;
  }
  return { books, cloth };
}

/** Pilha de livros com as tecnologias do autor na lombada. Clique → Skills. */
export function Books({ interaction, onActivate }) {
  const { books, cloth } = useMemo(() => buildBooks(), []);

  useEffect(
    () => () => {
      cloth.dispose();
      for (const book of books) {
        book.cover.dispose();
        book.spine.map.dispose();
        book.spine.dispose();
      }
      books[0].pages.map.dispose();
      books[0].pages.dispose();
    },
    [books, cloth],
  );

  const top = books.at(-1).y + 0.6;

  return (
    <Interactive
      {...interaction}
      {...LAYOUT.books}
      labelPosition={[0, top + 0.5, 0]}
      onActivate={onActivate}
    >
      {books.map((book) => (
        <group key={book.color} position={[book.x, book.y, 0]} rotation-y={book.rot}>
          {/* Folhas (recuadas) */}
          <mesh position-z={-OVERHANG / 2} material={book.pages} castShadow receiveShadow>
            <boxGeometry args={[book.w - OVERHANG * 2, book.h - BOARD * 2, book.d - OVERHANG]} />
          </mesh>
          {/* Capas de cima e de baixo */}
          {[1, -1].map((side) => (
            <RoundedBox
              key={side}
              args={[book.w, BOARD, book.d]}
              radius={0.012}
              smoothness={2}
              position-y={side * (book.h / 2 - BOARD / 2)}
              material={book.cover}
              castShadow
              receiveShadow
            />
          ))}
          {/* Lombada: a face da frente leva o título */}
          <mesh
            position-z={book.d / 2 - BOARD / 2}
            material={[book.cover, book.cover, book.cover, book.cover, book.spine, book.cover]}
            castShadow
          >
            <boxGeometry args={[book.w, book.h, BOARD]} />
          </mesh>
        </group>
      ))}
    </Interactive>
  );
}
