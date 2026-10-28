export function PageLoading({ label }: { label: string }) {
  return (
    <main className="page-loading" aria-busy="true">
      <p className="page-loading-label" role="status">
        <span className="brand-mark" aria-hidden="true">
          V
        </span>
        {label}
      </p>
      <div className="page-loading-skeleton" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </main>
  );
}
