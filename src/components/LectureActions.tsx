interface LectureActionsProps {
  onSort: () => void;
  onMarkAllCompleted: () => void;
  onMarkAllUncompleted: () => void;
  onRemoveSelected: () => void;
}

export function LectureActions({
  onSort,
  onMarkAllCompleted,
  onMarkAllUncompleted,
  onRemoveSelected,
}: LectureActionsProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <button
        className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
        onClick={onSort}
      >
        Sort module→submodule
      </button>
      <button
        className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
        onClick={onMarkAllCompleted}
      >
        Mark all completed
      </button>
      <button
        className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
        onClick={onMarkAllUncompleted}
      >
        Mark all uncompleted
      </button>
      <button
        className="px-3 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
        onClick={onRemoveSelected}
      >
        Remove selected
      </button>
    </div>
  );
}
