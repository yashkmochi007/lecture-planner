import { useEffect, useMemo, useState } from "react";
import type {
  Config,
  Filter,
  Lecture,
  PlanDay,
  RawLectureInput,
} from "./types/index";
import { formatId, sortLectures, isWeekend } from "./utils";
import { ConfigPanel } from "./components/ConfigPanel";
import { FilterPanel } from "./components/FilterPanel";
import { LectureList } from "./components/LectureList";
import { PlannerPanel } from "./components/PlannerPanel";
import { Header } from "./components/Header";
import { Layout } from "./components/Layout";
import { LectureListHeader } from "./components/LectureListHeader";
import { LectureActions } from "./components/LectureActions";
import { Welcome } from "./components/Welcome";

// Production-ready React component (default export)
// - Tailwind CSS utility classes used for layout and styling
// - Uses localStorage for persistence
// - Upload / Import JSON, Export progress
// - Sorts by module -> submodule
// - Mark lectures completed, bulk actions
// - Day-wise planner generator (configurable weekday/weekend hours & start date)
// - Highlights "today's" lectures based on start date
// - Progress dashboard and filters

// NOTE: This file assumes you have Tailwind set up in your project.
// To run:
// 1. Create a React app (Vite or CRA)
// 2. Ensure Tailwind is configured.
// 3. Drop this file in src/ and import it in main.jsx / index.jsx.

import { LOCAL_KEY, loadFromLocal, saveToLocal, defaultConfig } from "./utils";

export default function LecturePlannerApp() {
  // App state
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [config, setConfig] = useState<Config>(defaultConfig());
  const [plan, setPlan] = useState<PlanDay[]>([]);
  const [visibleCount, setVisibleCount] = useState(15);
  const [error, setError] = useState<string>("");
  const [filter, setFilter] = useState<Filter>({
    q: "",
    showCompleted: false,
    module: "",
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (filter.showCompleted) {
      setVisibleCount(lectures.length);
    } else {
      setVisibleCount(15);
    }
  }, [filter.showCompleted]);
  // Track whether initial load is complete
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial from localStorage
  useEffect(() => {
    try {
      const persisted = loadFromLocal();
      if (persisted) {
        setLectures(sortLectures(persisted.lectures || []));
        setConfig(persisted.config || defaultConfig());
        setPlan(persisted.plan || []);
      }
      setIsLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      setIsLoaded(true);
    }
  }, []);

  // Save to local whenever lectures or config change, but only after initial load
  useEffect(() => {
    if (!isLoaded) return; // Skip saving until initial load is complete
    saveToLocal({ lectures, config, plan });
  }, [lectures, config, plan, isLoaded]);

  // Derived values
  const totalDuration = useMemo(
    () => lectures.reduce((s, l) => s + (l.duration || 0), 0),
    [lectures]
  );
  const spentDuration = useMemo(
    () =>
      lectures
        .filter((x) => x.completed)
        .reduce((s, l) => s + (l.duration || 0), 0),
    [lectures]
  );
  const completedCount = useMemo(
    () => lectures.filter((l) => l.completed).length,
    [lectures]
  );

  const toggleCompleted = (idx: number): void => {
    setLectures((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], completed: !copy[idx].completed };
      return sortLectures(copy); // Keep lectures sorted after state changes
    });
    setPlan((prev) => {
      const dayPlans = prev.map((day) => {
        const updatedLectures = day.lectures.map((l) => {
          const toggledLecture =
            l.module === lectures[idx].module &&
            l.submodule === lectures[idx].submodule &&
            l.topic === lectures[idx].topic;

          if (toggledLecture) {
            return { ...l, completed: !l.completed };
          } else {
            return l;
          }
        });
        return { ...day, lectures: updatedLectures };
      });
      return dayPlans;
    });
  };

  const addLectures = (items: RawLectureInput[]): void => {
    // Normalize items => ensure fields: module (int), submodule (int), topic, size, duration, completed
    let normalized = items.map((it) => ({
      sr: 0,
      module: Number(it.module),
      submodule: Number(it.submodule),
      topic: it.topic || it.title || "Untitled",
      size: Number(it.size || it.size_mb || 0),
      duration: Number(it.duration || it.duration_hr || 0),
      completed: Boolean(it.completed || false),
    }));
    normalized = sortLectures(normalized);
    normalized = normalized.map((l, i) => ({ ...l, sr: i + 1 }));

    setLectures((prev) => sortLectures([...prev, ...normalized]));
  };

  const clearAll = () => {
    if (!confirm("Clear all lectures and progress? This cannot be undone."))
      return;
    // Clear in-memory state
    setLectures([]);
    setConfig(defaultConfig());
    setPlan([]);
    setSelectedIds(new Set());

    // Remove persisted state
    try {
      localStorage.removeItem(LOCAL_KEY);
    } catch (e) {
      console.error("Failed to remove local state", e);
    }
  };

  // File import (JSON) handler
  const onFileImport = (file: File): void => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        if (!e.target?.result || typeof e.target.result !== "string") {
          throw new Error("Failed to read file content");
        }
        const parsed = JSON.parse(e.target.result);
        if (!Array.isArray(parsed))
          throw new Error("Uploaded JSON must be an array of lecture objects.");
        addLectures(parsed);
        alert(`Imported ${parsed.length} lectures`);
      } catch (err) {
        alert(
          "Failed to import JSON: " +
            (err instanceof Error ? err.message : "Unknown error")
        );
      }
    };
    reader.readAsText(file);
  };

  // Export current lectures + config
  const onExport = () => {
    const payload = { lectures, config, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lecture_planner_export_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Planner generator
  const generatePlan = (opts: Partial<Config> = {}) => {
    const cfg = { ...config, ...opts };
    console.log("Generating plan with config:", {
      weekdayHours: cfg.weekdayHours,
      weekendHours: cfg.weekendHours,
      startDate: cfg.startDate,
    });

    // pick unfinished lectures in sorted order
    const remaining = sortLectures(lectures.filter((l) => !l.completed));

    const res = [];
    let dayIndex = 0; // day 0 = startDate
    let ptr = 0;

    // starting date from cfg.startDate
    let curDate = new Date(cfg.startDate);
    if (isNaN(curDate.getTime())) curDate = new Date();

    while (ptr < remaining.length) {
      const dayIsWeekend = isWeekend(curDate);
      const todayHours = dayIsWeekend ? cfg.weekendHours : cfg.weekdayHours;
      let used = 0;
      const todays = [];

      while (
        ptr < remaining.length &&
        used + (remaining[ptr].duration || 0) <= todayHours + 1e-9
      ) {
        todays.push(remaining[ptr]);
        used += remaining[ptr].duration || 0;
        ptr++;
      }

      const myObj = {
        date: curDate.toISOString().slice(0, 10),
        isWeekend: dayIsWeekend,
        capacity: todayHours,
        used,
        lectures: todays,
      };
      console.log(myObj);
      res.push(myObj);

      // Next day - create new Date object to avoid mutation issues
      curDate = new Date(curDate.getTime() + 24 * 60 * 60 * 1000);
      dayIndex++;
    }

    setPlan(res);
  };

  // Bulk actions
  const toggleSelect = (key: string): void => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(key)) copy.delete(key);
      else copy.add(key);
      return copy;
    });
  };

  const removeSelected = () => {
    if (selectedIds.size === 0) return;
    if (!confirm("Remove selected lectures?")) return;
    setLectures((prev) => prev.filter((l) => !selectedIds.has(formatId(l))));
    setSelectedIds(new Set());
  };

  // Quick-add demo (for testing large lists)
  const quickAddDemo = (n = 100) => {
    const items = [];
    for (let i = 0; i < n; i++) {
      const module = Math.floor(Math.random() * 50) + 1;
      const submodule = Math.floor(Math.random() * 30) + 1;
      items.push({
        module,
        submodule,
        topic: `Demo Lecture ${i + 1}`,
        size: 20 + Math.random() * 100,
        duration: +(0.2 + Math.random() * 1).toFixed(2),
        completed: false,
      });
    }
    addLectures(items);
  };

  // Render helpers
  const filteredLectures = useMemo(() => {
    const q = (filter.q || "").toLowerCase().trim();
    return lectures.filter((l) => {
      if (!filter.showCompleted && l.completed) return false;
      if (filter.module && String(l.module) !== String(filter.module))
        return false;
      if (!q) return true;
      return (
        `${l.topic}`.toLowerCase().includes(q) ||
        `${l.module}.${l.submodule}`.includes(q)
      );
    });
  }, [lectures, filter]);

  const visibleLectures = useMemo(() => {
    return filteredLectures.slice(0, visibleCount);
  }, [filteredLectures, visibleCount]);

  // Today's lectures (based on plan)
  const todayIso = new Date().toISOString().slice(0, 10);
  const todaysInPlan = plan.find((p) => p.date === todayIso) || null;

  return (
    <Layout
      title="Lecture Planner"
      subtitle="Plan your lecture watching schedule"
      error={error}
    >
      <Header
        onQuickAdd={() => quickAddDemo(500)}
        onExport={onExport}
        onClear={clearAll}
      />

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        {lectures.length === 0 ? (
          <Welcome
            config={config}
            onConfigChange={setConfig}
            onImport={onFileImport}
            onGeneratePlan={generatePlan}
          />
        ) : (
          <>
            <div className="lg:col-span-3">
              <ConfigPanel
                config={config}
                onConfigChange={setConfig}
                onImport={onFileImport}
                onGeneratePlan={generatePlan}
              />
              <hr className="my-4" />
              <FilterPanel filter={filter} onFilterChange={setFilter} />
            </div>

            <div className="lg:col-span-5">
              <div className="bg-white p-4 rounded shadow">
                <LectureListHeader
                  lectureCount={lectures.length}
                  spentDuration={spentDuration}
                  totalDuration={totalDuration}
                  completedCount={completedCount}
                />

                {/* <LectureActions
                  onSort={() => setLectures(sortLectures(lectures))}
                  onMarkAllCompleted={() =>
                    setLectures(
                      lectures.map((l) => ({ ...l, completed: true }))
                    )
                  }
                  onMarkAllUncompleted={() =>
                    setLectures(
                      lectures.map((l) => ({ ...l, completed: false }))
                    )
                  }
                  onRemoveSelected={removeSelected}
                /> */}

                <LectureList
                  lectures={visibleLectures}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onToggleCompleted={(idx) => {
                    const realIdx = lectures.findIndex(
                      (x) =>
                        x.module === visibleLectures[idx].module &&
                        x.submodule === visibleLectures[idx].submodule &&
                        x.topic === visibleLectures[idx].topic
                    );
                    if (realIdx >= 0) toggleCompleted(realIdx);
                    // generatePlan(); // Regenerate plan when completion status changes
                  }}
                  visibleCount={visibleCount}
                  filteredLength={filteredLectures.length}
                  onLoadMore={() => setVisibleCount((prev) => prev + 10)}
                />
              </div>
            </div>

            <PlannerPanel
              config={config}
              plan={plan}
              todaysInPlan={todaysInPlan}
              onGeneratePlan={generatePlan}
              onExport={onExport}
            />
          </>
        )}
      </main>
    </Layout>
  );
}
