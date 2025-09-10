import type { Config } from "../types";

interface ConfigPanelProps {
  config: Config;
  onConfigChange: (config: Config) => void;
  onImport: (file: File) => void;
  onGeneratePlan: () => void;
}

export function ConfigPanel({
  config,
  onConfigChange,
  onImport,
  onGeneratePlan,
}: ConfigPanelProps) {
  return (
    <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-2">Import / Config</h2>

      <div className="mb-3">
        <label className="block text-sm text-slate-600 mb-1">
          Upload JSON (array of lectures)
        </label>
        <input
          type="file"
          accept="application/json"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files?.[0]) onImport(e.target.files[0]);
          }}
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm text-slate-600">Weekday hours</label>
        <input
          type="number"
          className="mt-1 w-full border p-2 rounded"
          value={config.weekdayHours}
          onChange={(e) =>
            onConfigChange({ ...config, weekdayHours: Number(e.target.value) })
          }
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm text-slate-600">Weekend hours</label>
        <input
          type="number"
          className="mt-1 w-full border p-2 rounded"
          value={config.weekendHours}
          onChange={(e) =>
            onConfigChange({ ...config, weekendHours: Number(e.target.value) })
          }
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm text-slate-600">Start date</label>
        <input
          type="date"
          className="mt-1 w-full border p-2 rounded"
          value={config.startDate}
          onChange={(e) =>
            onConfigChange({ ...config, startDate: e.target.value })
          }
        />
      </div>

      <div className="flex gap-2">
        <button
          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={onGeneratePlan}
        >
          Generate Plan
        </button>
        {/* <button
          className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          onClick={() => {
            onGeneratePlan();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          Generate & Scroll Up
        </button> */}
      </div>
    </div>
  );
}
