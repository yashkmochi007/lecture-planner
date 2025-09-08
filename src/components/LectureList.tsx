import type { Lecture } from "../types";
import { convertDecimalHoursToHHMM, formatId } from "../utils";

interface LectureListProps {
  lectures: Lecture[];
  selectedIds: Set<string>;
  onToggleSelect: (key: string) => void;
  onToggleCompleted: (idx: number) => void;
  visibleCount: number;
  filteredLength: number;
  onLoadMore: () => void;
}

export function LectureList({
  lectures,
  selectedIds,
  onToggleSelect,
  onToggleCompleted,
  visibleCount,
  filteredLength,
  onLoadMore,
}: LectureListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="text-left text-sm text-slate-600">
            <th className="p-2 border-b">Sr.</th>
            <th className="p-2 border-b">ID</th>
            <th className="p-2 border-b">Topic</th>
            <th className="p-2 border-b">Duration (hh:mm)</th>
            <th className="p-2 border-b">Size (MB)</th>
            <th className="p-2 border-b">Status</th>
          </tr>
        </thead>
        <tbody>
          {lectures.map((l, idx) => (
            <tr
              key={`${l.module}-${l.submodule}-${idx}`}
              className="align-top hover:bg-gray-50"
            >
              <td className="p-2 border-b">{l.sr}</td>
              {/* <td className="p-2 border-b">
                <input
                  type="checkbox"
                  checked={selectedIds.has(formatId(l))}
                  onChange={() => onToggleSelect(formatId(l))}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
              </td> */}
              <td className="p-2 border-b font-mono">{formatId(l)}</td>
              <td className="p-2 border-b">{l.topic}</td>
              <td className="p-2 border-b">
                {convertDecimalHoursToHHMM(l.duration || 0)}
              </td>
              <td className="p-2 border-b">{(l.size || 0).toFixed(1)}</td>
              <td className="p-2 border-b">
                <button
                  className={`px-2 py-1 rounded transition-colors ${
                    l.completed
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => onToggleCompleted(idx)}
                >
                  {l.completed ? "Done" : "Mark"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredLength > visibleCount && (
        <div className="mt-4 text-center">
          <button
            onClick={onLoadMore}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
          >
            Load More (showing {visibleCount} of {filteredLength})
          </button>
        </div>
      )}
    </div>
  );
}
