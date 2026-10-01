/** Esqueleto de carregamento mostrado enquanto o código do app é baixado. */
export function AppSkeleton() {
  return (
    <div aria-hidden className="flex h-full animate-pulse flex-col gap-4 p-7">
      <div className="h-5 w-1/3 rounded-sm bg-surface-2" />
      <div className="h-3 w-2/3 rounded-sm bg-surface-2" />
      <div className="h-3 w-1/2 rounded-sm bg-surface-2" />
      <div className="mt-2 h-28 w-full rounded-md bg-surface-2" />
      <div className="h-3 w-3/5 rounded-sm bg-surface-2" />
    </div>
  );
}
