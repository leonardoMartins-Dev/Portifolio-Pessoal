import { Html } from '@react-three/drei';

/**
 * Objeto clicável da mesa: cursor de mão, rótulo flutuante no hover e
 * clique (só quando a cena está esperando o visitante).
 */
export function Interactive({
  id,
  label,
  labelPosition = [0, 1, 0],
  enabled,
  hovered,
  onHover,
  onActivate,
  children,
  ...props
}) {
  return (
    <group
      {...props}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(id);
        if (enabled) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        onHover(null, id);
        document.body.style.cursor = '';
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (enabled) onActivate();
      }}
    >
      {children}
      {enabled && hovered && label && (
        <Html
          position={labelPosition}
          center
          zIndexRange={[20, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <span className="block rounded-full bg-black/70 px-3 py-1.5 text-[13px] font-medium whitespace-nowrap text-white shadow-lg backdrop-blur-md">
            {label}
          </span>
        </Html>
      )}
    </group>
  );
}
