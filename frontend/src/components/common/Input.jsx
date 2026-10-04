export default function Input({ label, type = 'text', error, className = '', ...props }) {
  return (
    <label className="block w-full text-sm text-slate-700">
      {label && <span className="mb-2 block font-medium">{label}</span>}
      <input
        type={type}
        className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 ${error ? 'border-red-300' : ''} ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}
