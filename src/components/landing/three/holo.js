import { AdditiveBlending, Color, DoubleSide, ShaderMaterial } from 'three';

/**
 * Holograma: borda acesa (fresnel) e linhas horizontais que sobem devagar,
 * somando luz. Respeita os planos de corte (o scanner do Sobre) e funciona
 * em malhas instanciadas (os cachos do boneco).
 */
export function createHoloMaterial(color = '#5fd0ff') {
  return new ShaderMaterial({
    uniforms: { uColor: { value: new Color(color) }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      #include <common>
      #include <clipping_planes_pars_vertex>
      varying float vFresnel;
      varying float vWorldY;
      void main() {
        #include <beginnormal_vertex>
        #include <defaultnormal_vertex>
        #include <begin_vertex>
        #include <project_vertex>
        #include <clipping_planes_vertex>
        vec4 worldPosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          worldPosition = instanceMatrix * worldPosition;
        #endif
        worldPosition = modelMatrix * worldPosition;
        vWorldY = worldPosition.y;
        vFresnel = pow(1.0 - abs(dot(normalize(transformedNormal), normalize(-mvPosition.xyz))), 2.0);
      }
    `,
    fragmentShader: /* glsl */ `
      #include <clipping_planes_pars_fragment>
      uniform vec3 uColor;
      uniform float uTime;
      varying float vFresnel;
      varying float vWorldY;
      void main() {
        #include <clipping_planes_fragment>
        float line = abs(fract(vWorldY * 4.0 - uTime * 0.5) - 0.5);
        float lines = 0.35 + 0.65 * smoothstep(0.18, 0.32, line);
        float alpha = (0.1 + vFresnel * 0.8) * lines;
        gl_FragColor = vec4(uColor * (0.75 + vFresnel * 0.9), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    clipping: true,
  });
}

/** Facho de luz do pedestal: some com a altura. */
export function createBeamMaterial(color = '#4cc4ff') {
  return new ShaderMaterial({
    uniforms: { uColor: { value: new Color(color) } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float fade = pow(1.0 - vUv.y, 2.2);
        gl_FragColor = vec4(uColor, fade * 0.22);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  });
}
