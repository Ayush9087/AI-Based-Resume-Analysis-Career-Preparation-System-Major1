const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-500',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
};

export default function Button({ children, variant = 'primary', type = 'button', className = '', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
