import { RoundedBox } from '@react-three/drei';
import { useLayoutEffect, useRef } from 'react';
import { Object3D } from 'three';
import { BASE, HINGE, LID, SCREEN } from './laptop-geometry.js';

const COLORS = {
  light: {
    metal: '#c3c6cc',
    keys: '#1c1d21',
    well: '#a9adb5',
    trackpad: '#b9bcc3',
    logo: '#9ea2ab',
  },
  dark: {
    metal: '#5c5f66',
    keys: '#141518',
    well: '#46484e',
    trackpad: '#55585f',
    logo: '#8b909a',
  },
};

const KEY = { size: 0.158, gap: 0.03, height: 0.02 };
const KEY_COLUMNS = 13;
const KEY_ROWS = 6;

/** Posições e escalas das teclas: 6 fileiras, com barra de espaço na última. */
function keyLayout() {
  const pitch = KEY.size + KEY.gap;
  const width = KEY_COLUMNS * pitch - KEY.gap;
  const keys = [];
  for (let row = 0; row < KEY_ROWS; row++) {
    const z = -0.86 + row * pitch;
    const scaleZ = row === 0 ? 0.55 : 1; // fileira de função mais baixa
    if (row === KEY_ROWS - 1) {
      // Última fileira: 4 teclas, espaço largo, 4 teclas.
      const small = [0, 1, 2, 3, 9, 10, 11, 12];
      small.forEach((col) =>
        keys.push({ x: -width / 2 + KEY.size / 2 + col * pitch, z, sx: 1, sz: 1 }),
      );
      const spaceW = 5 * pitch - KEY.gap;
      keys.push({ x: -width / 2 + 4 * pitch + spaceW / 2, z, sx: spaceW / KEY.size, sz: 1 });
    } else {
      for (let col = 0; col < KEY_COLUMNS; col++) {
        keys.push({ x: -width / 2 + KEY.size / 2 + col * pitch, z, sx: 1, sz: scaleZ });
      }
    }
  }
  return keys;
}

const KEYS = keyLayout();

/**
 * Notebook montado em código (sem Blender): base com teclado em
 * instancedMesh e trackpad; tampa com pivô na dobradiça, moldura, tela 16:10
 * e o logo do autor na parte de trás. O LED na borda da frente pulsa enquanto
 * o notebook espera o clique.
 */
export function Laptop({ theme, lidRef, ledRef, screenTexture, logoTexture, ...props }) {
  const colors = COLORS[theme] ?? COLORS.dark;
  const keysRef = useRef(null);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    KEYS.forEach((key, index) => {
      dummy.position.set(key.x, BASE.h + 0.004, key.z);
      dummy.scale.set(key.sx, 1, key.sz);
      dummy.updateMatrix();
      keysRef.current.setMatrixAt(index, dummy.matrix);
    });
    keysRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  const metal = (
    <meshStandardMaterial
      color={colors.metal}
      metalness={0.9}
      roughness={0.38}
      envMapIntensity={1.2}
    />
  );

  return (
    <group {...props}>
      {/* Base */}
      <RoundedBox
        args={[BASE.w, BASE.h, BASE.d]}
        radius={0.05}
        smoothness={4}
        position={[0, BASE.h / 2, 0]}
        castShadow
        receiveShadow
      >
        {metal}
      </RoundedBox>

      {/* LED de "dormindo" na borda da frente */}
      <mesh position={[BASE.w * 0.38, BASE.h * 0.55, BASE.d / 2 + 0.002]}>
        <planeGeometry args={[0.07, 0.022]} />
        <meshBasicMaterial ref={ledRef} color="#ffffff" toneMapped={false} />
      </mesh>

      {/* Área do teclado, levemente mais escura (efeito rebaixado) */}
      <mesh rotation-x={-Math.PI / 2} position={[0, BASE.h + 0.0008, -0.38]}>
        <planeGeometry args={[2.6, 1.18]} />
        <meshStandardMaterial color={colors.well} metalness={0.6} roughness={0.5} />
      </mesh>

      {/* Teclas */}
      <instancedMesh ref={keysRef} args={[undefined, undefined, KEYS.length]}>
        <boxGeometry args={[KEY.size, KEY.height, KEY.size]} />
        <meshStandardMaterial color={colors.keys} metalness={0.2} roughness={0.55} />
      </instancedMesh>

      {/* Trackpad */}
      <RoundedBox
        args={[1.1, 0.004, 0.68]}
        radius={0.002}
        smoothness={2}
        position={[0, BASE.h + 0.0012, 0.62]}
      >
        <meshStandardMaterial color={colors.trackpad} metalness={0.7} roughness={0.28} />
      </RoundedBox>

      {/* Tampa: o grupo gira em torno da dobradiça */}
      <group ref={lidRef} position={[0, HINGE.y, HINGE.z]}>
        <RoundedBox
          args={[BASE.w, LID.h, LID.t]}
          radius={0.03}
          smoothness={4}
          position={[0, LID.h / 2, -LID.t / 2]}
          castShadow
        >
          {metal}
        </RoundedBox>
        {/* Moldura */}
        <mesh position={[0, LID.h / 2, 0.0012]}>
          <planeGeometry args={[BASE.w - 0.05, LID.h - 0.05]} />
          <meshStandardMaterial color="#050506" metalness={0.3} roughness={0.15} />
        </mesh>
        {/* Tela 16:10 */}
        <mesh position={[0, SCREEN.centerY, SCREEN.z]}>
          <planeGeometry args={[SCREEN.w, SCREEN.h]} />
          <meshBasicMaterial map={screenTexture} toneMapped={false} />
        </mesh>
        {/* Logo discreto na parte de trás (legível de frente com a tampa fechada) */}
        <mesh position={[0, LID.h * 0.52, -LID.t - 0.0015]} rotation={[0, Math.PI, Math.PI]}>
          <planeGeometry args={[0.34, 0.34]} />
          <meshStandardMaterial
            map={logoTexture}
            transparent
            color={colors.logo}
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
      </group>
    </group>
  );
}
