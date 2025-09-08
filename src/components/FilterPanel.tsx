import type { Filter } from "../types";

interface FilterPanelProps {
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
}

export function FilterPanel({ filter, onFilterChange }: FilterPanelProps) {
  return (
    <div>
      <h3 className="text-sm font-medium">Quick Filters</h3>
      <div className="mt-2 flex flex-col gap-2">
        <input
          placeholder="Search topic / module.submodule"
          className="border p-2 rounded"
          value={filter.q}
          onChange={(e) => onFilterChange({ ...filter, q: e.target.value })}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filter.showCompleted}
            onChange={(e) =>
              onFilterChange({ ...filter, showCompleted: e.target.checked })
            }
          />{" "}
          Show completed
        </label>
        <input
          placeholder="Filter module (e.g. 12)"
          className="border p-2 rounded"
          value={filter.module}
          onChange={(e) =>
            onFilterChange({ ...filter, module: e.target.value })
          }
        />
      </div>
    </div>
  );
}
