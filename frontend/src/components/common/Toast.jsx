export default function Toast({ message, type = 'info' }) {
  const styles = {
    info: 'border-blue-200 bg-blue-50 text-blue-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    error: 'border-red-200 bg-red-50 text-red-700',
  };

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium shadow-sm ${styles[type]}`} role={type === 'error' ? 'alert' : 'status'} aria-live={type === 'error' ? 'assertive' : 'polite'}>
      {message}
    </div>
  );
}
