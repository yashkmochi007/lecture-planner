import { useEffect, useMemo, useState, useCallback } from "react";
import type {
  Config,
  Filter,
  Lecture,
  PlanDay,
  RawLectureInput,
} from "./types/index";
import { sortLectures, isWeekend, defaultConfig } from "./utils";
import { ConfigPanel } from "./components/ConfigPanel";
import { FilterPanel } from "./components/FilterPanel";
import { LectureList } from "./components/LectureList";
import { PlannerPanel } from "./components/PlannerPanel";
import { Header } from "./components/Header";
import { Layout } from "./components/Layout";
import { LectureListHeader } from "./components/LectureListHeader";
import { Welcome } from "./components/Welcome";
import { supabase } from "./supabaseClient";
import { Auth } from "./components/Auth";
import type { Session, User } from "@supabase/supabase-js";

// Main App component that handles auth state
export default function LecturePlannerApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-gray-100 p-4">Loading...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  return <Planner key={session.user.id} user={session.user} />;
}

// Planner component, shown when user is logged in
function Planner({ user }: { user: User }) {
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
  }, [filter.showCompleted, lectures.length]);
  // Track whether initial load is complete
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch profile which contains config
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("config")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        // PGRST116: no rows found
        throw profileError;
      }
      if (profile && profile.config) {
        setConfig(profile.config);
      }

      // Fetch lectures
      const { data: lecturesData, error: lecturesError } = await supabase
        .from("lectures")
        .select("*")
        .eq("user_id", user.id);

      if (lecturesError) throw lecturesError;
      setLectures(
        sortLectures(lecturesData || []).map((l, i) => ({ ...l, sr: i + 1 }))
      );

      // Fetch plan
      const { data: planData, error: planError } = await supabase
        .from("plan")
        .select("*")
        .eq("user_id", user.id);

      if (planError) throw planError;
      setPlan(planData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoaded(true);
    }
  }, [user.id]);

  // Load initial from Supabase
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handleConfigChange = async (newConfig: Config) => {
    setConfig(newConfig);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      config: newConfig,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      setError(error.message);
      setConfig(config); // Revert on error
    }
  };

  const toggleCompleted = async (lectureId: number) => {
    const lecture = lectures.find((l) => l.id === lectureId);
    if (!lecture) return;

    const newCompletedStatus = !lecture.completed;

    // Update Supabase first
    const { error } = await supabase
      .from("lectures")
      .update({ completed: newCompletedStatus })
      .eq("id", lectureId)
      .eq("user_id", user.id);

    if (error) {
      setError("Failed to update lecture status.");
    } else {
      await supabase.from("plan").delete().eq("user_id", user.id);
      const planToInsert = plan.map(({ id, ...day }) => ({
        ...day,
        user_id: user.id,
        lectures: day.lectures.map((l) =>
          l.id === lectureId ? { ...l, completed: newCompletedStatus } : l
        ),
      }));
      const { error: planError } = await supabase
        .from("plan")
        .insert(planToInsert);
      // Update local state on success
      if (planError) {
        setError("Failed to update plan lecture status.");
      } else {
        setLectures((prev) =>
          prev.map((l) =>
            l.id === lectureId ? { ...l, completed: newCompletedStatus } : l
          )
        );
        setPlan((prev) =>
          prev.map((day) => ({
            ...day,
            lectures: day.lectures.map((l) =>
              l.id === lectureId ? { ...l, completed: newCompletedStatus } : l
            ),
          }))
        );
      }
    }
  };

  const addLectures = async (items: RawLectureInput[]) => {
    // Normalize items => ensure fields: module (int), submodule (int), topic, size, duration, completed
    const normalized = items.map((it) => ({
      module: Number(it.module),
      submodule: Number(it.submodule),
      topic: it.topic || it.title || "Untitled",
      size: Number(it.size || it.size_mb || 0),
      duration: Number(it.duration || it.duration_hr || 0),
      completed: Boolean(it.completed || false),
      user_id: user.id,
    }));

    const { error } = await supabase.from("lectures").insert(normalized);

    if (error) {
      setError(error.message);
    } else {
      // Refetch all data to ensure consistency and get new IDs
      await fetchData();
    }
  };

  const clearAll = async () => {
    if (!confirm("Clear all lectures and progress? This cannot be undone.")) {
      return;
    }
    await supabase.from("plan").delete().eq("user_id", user.id);
    await supabase.from("lectures").delete().eq("user_id", user.id);
    setLectures([]);
    setPlan([]);
    setSelectedIds(new Set());
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
    const payload = {
      lectures,
      config,
      plan,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lecture_planner_export_${
      user.id
    }_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Planner generator
  const generatePlan = async (opts: Partial<Config> = {}) => {
    const cfg = { ...config, ...opts };
    console.log("Generating plan with config:", {
      weekdayHours: cfg.weekdayHours,
      weekendHours: cfg.weekendHours,
      startDate: cfg.startDate,
    });
    if (cfg.weekdayHours <= 0 && cfg.weekendHours <= 0) {
      alert("Please set positive hours for weekdays and/or weekends.");
      return;
    }
    if (cfg.weekdayHours > 24 || cfg.weekendHours > 24) {
      alert("Hours per day cannot exceed 24.");
      return;
    }
    if (isNaN(new Date(cfg.startDate).getTime())) {
      alert("Please set a valid start date.");
      return;
    }

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

      const myObj: PlanDay = {
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

    // Save to Supabase
    await supabase.from("plan").delete().eq("user_id", user.id);
    if (res.length > 0) {
      const planToInsert = res.map(({ id, ...p }) => ({
        ...p,
        user_id: user.id,
      }));
      console.log(JSON.stringify(planToInsert));
      const { error: planError } = await supabase
        .from("plan")
        .insert(planToInsert);
      if (planError) {
        setError(planError.message);
      }
    }
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Layout error={error}>
      <Header
        onQuickAdd={() => quickAddDemo(500)}
        onExport={onExport}
        onClear={clearAll}
      />
      <div className="flex justify-between items-center mb-4">
        <p className="text-slate-600">
          Signed in as: <strong>{user.email}</strong>
        </p>
        <button
          onClick={handleSignOut}
          className="px-3 py-1 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
        >
          Sign Out
        </button>
      </div>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        {!isLoaded ? (
          <div className="lg:col-span-12 text-center p-8">
            Loading your planner...
          </div>
        ) : lectures.length === 0 ? (
          <Welcome onImport={onFileImport} />
        ) : (
          <>
            <div className="lg:col-span-3">
              <ConfigPanel
                config={config}
                onConfigChange={handleConfigChange}
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
                    const lectureToToggle = visibleLectures[idx];
                    if (lectureToToggle && lectureToToggle.id) {
                      toggleCompleted(lectureToToggle.id);
                    }
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
