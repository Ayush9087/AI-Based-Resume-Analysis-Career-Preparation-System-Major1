import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout({ children, title, subtitle, actions }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Sidebar />
      <div className="main-panel">
        <Topbar title={title} subtitle={subtitle} actions={actions} />
        <main id="main-content" className="page-content" tabIndex="-1">{children}</main>
      </div>
    </div>
  );
}
