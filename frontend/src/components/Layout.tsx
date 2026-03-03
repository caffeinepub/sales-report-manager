import React from 'react';
import { BarChart3, Calendar, TrendingUp, Package, Download, ChevronRight } from 'lucide-react';

export type NavSection = 'dashboard' | 'weekly' | 'monthly' | 'stock' | 'export';

interface LayoutProps {
  children: React.ReactNode;
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
}

const navItems: { id: NavSection; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={18} />, description: 'Daily Report' },
  { id: 'weekly', label: 'Weekly Report', icon: <Calendar size={18} />, description: 'Week Summary' },
  { id: 'monthly', label: 'Monthly Report', icon: <TrendingUp size={18} />, description: 'Month Summary' },
  { id: 'stock', label: 'Purchase & Stock', icon: <Package size={18} />, description: 'Inventory' },
  { id: 'export', label: 'Export Reports', icon: <Download size={18} />, description: 'PDF & Excel' },
];

export default function Layout({ children, activeSection, onNavigate }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className="flex flex-col w-64 flex-shrink-0 h-full overflow-y-auto"
        style={{ backgroundColor: 'oklch(0.22 0.07 240)' }}
      >
        {/* Logo / Brand */}
        <div
          className="flex items-center gap-3 px-4 py-4 border-b"
          style={{ borderColor: 'oklch(0.30 0.06 240)' }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: 'oklch(0.55 0.18 200)' }}
          >
            <img
              src="/assets/generated/app-logo.dim_128x128.png"
              alt="Logo"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight" style={{ color: 'oklch(0.95 0.01 240)' }}>
              Sales Report
            </div>
            <div className="text-xs" style={{ color: 'oklch(0.65 0.03 240)' }}>
              Manager ERP
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: 'oklch(0.55 0.04 240)' }}>
            Navigation
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all group ${
                activeSection === item.id ? 'nav-item active' : 'nav-item'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.label}</div>
                <div
                  className="text-xs truncate"
                  style={{
                    color: activeSection === item.id ? 'oklch(0.85 0.05 200)' : 'oklch(0.55 0.03 240)',
                  }}
                >
                  {item.description}
                </div>
              </div>
              {activeSection === item.id && (
                <ChevronRight size={14} className="flex-shrink-0 opacity-70" />
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div
          className="px-4 py-3 border-t text-xs"
          style={{ borderColor: 'oklch(0.30 0.06 240)', color: 'oklch(0.50 0.03 240)' }}
        >
          <div className="font-medium mb-1" style={{ color: 'oklch(0.65 0.03 240)' }}>
            Sales Report Manager
          </div>
          <div>v1.0 · {new Date().getFullYear()}</div>
          <div className="mt-1">
            Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'sales-report-manager')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
              style={{ color: 'oklch(0.55 0.18 200)' }}
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 py-3 border-b bg-card flex-shrink-0"
          style={{ borderColor: 'oklch(0.88 0.01 240)' }}
        >
          <div>
            <h1 className="text-base font-semibold" style={{ color: 'oklch(0.22 0.07 240)' }}>
              {navItems.find((n) => n.id === activeSection)?.label}
            </h1>
            <p className="text-xs text-muted-foreground">
              {navItems.find((n) => n.id === activeSection)?.description}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-medium" style={{ color: 'oklch(0.22 0.07 240)' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
