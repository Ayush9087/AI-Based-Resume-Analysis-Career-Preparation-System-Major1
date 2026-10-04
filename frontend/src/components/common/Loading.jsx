export default function Loading({ text = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-soft" role="status" aria-live="polite">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent motion-reduce:animate-none" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
