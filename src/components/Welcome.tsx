import type { Config } from "../types";

interface WelcomeProps {
  config: Config;
  onConfigChange: (config: Config) => void;
  onImport: (file: File) => void;
  onGeneratePlan: () => void;
}

export function Welcome({
  config,
  onConfigChange,
  onImport,
  onGeneratePlan,
}: WelcomeProps) {
  return (
    <div className="lg:col-span-12 bg-white p-8 rounded-lg shadow-md text-center">
      <h2 className="text-xl font-semibold mb-4">Welcome to Lecture Planner</h2>
      <p className="text-slate-600 mb-6">
        Start by uploading your lecture data
      </p>
      <div className="max-w-md mx-auto">
        <label className="block text-sm text-slate-600 mb-2">
          Upload JSON (array of lectures)
        </label>
        <input
          type="file"
          accept="application/json"
          className="w-full mb-4"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files?.[0]) onImport(e.target.files[0]);
          }}
        />
        <p className="text-sm text-slate-500 mt-2">
          Or use the "Quick add demo" button above to try out the app
        </p>
      </div>
    </div>
  );
}
