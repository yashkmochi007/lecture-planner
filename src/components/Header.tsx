interface HeaderProps {
  onQuickAdd: () => void;
  onExport: () => void;
  onClear: () => void;
}

export function Header({ onQuickAdd, onExport, onClear }: HeaderProps) {
  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Lecture Planner</h1>
        <p className="text-slate-500 mt-1">
          Upload, track completion, and auto-generate a day-wise study plan.
        </p>
      </div>

      <div className="flex gap-2 items-center">
        <button
          className="px-3 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          onClick={onQuickAdd}
        >
          Quick add 500 demo
        </button>
        <button
          className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          onClick={onExport}
        >
          Export JSON
        </button>
        <button
          className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
          onClick={onClear}
        >
          Clear All
        </button>
      </div>
    </header>
  );
}
