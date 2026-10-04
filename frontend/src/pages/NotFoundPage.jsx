import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';

export default function NotFoundPage() {
  return (
    <AppLayout title="Page not found" subtitle="The link may be outdated or the address may be incorrect.">
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">404</p>
        <h2 className="mt-4 text-3xl font-bold text-slate-900">Page not found</h2>
        <p className="mt-3 text-slate-600">The page you are looking for does not exist.</p>
        <div className="mt-6 flex justify-center">
          <Link to="/" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40">Return home</Link>
        </div>
      </div>
    </AppLayout>
  );
}
