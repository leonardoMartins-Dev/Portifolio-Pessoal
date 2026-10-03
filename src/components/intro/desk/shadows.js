import { createContext, useContext } from 'react';

/**
 * As sombras só são recalculadas quando algo se mexe (o mapa não atualiza
 * sozinho a cada quadro). Quem anima chama `invalidateShadows()`.
 */
export const ShadowContext = createContext(() => {});

export function useInvalidateShadows() {
  return useContext(ShadowContext);
}
