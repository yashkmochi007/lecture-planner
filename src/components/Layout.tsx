interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  error?: string;
}

export function Layout({ children, title, subtitle, error }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* <header className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        {subtitle && <p className="text-slate-500 mt-2">{subtitle}</p>}
      </header> */}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded mt-4">
          Error: {error}
        </div>
      )}

      {children}

      <footer className="mt-6 text-center text-sm text-slate-500">
        Built for your study workflow • Local-first (data saved in your browser)
      </footer>
    </div>
  );
}
