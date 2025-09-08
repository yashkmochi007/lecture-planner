import type { Config, PlanDay } from "../types";
import { convertDecimalHoursToHHMM, formatId } from "../utils";

interface PlannerPanelProps {
  config: Config;
  plan: PlanDay[];
  todaysInPlan: PlanDay | null;
  onGeneratePlan: () => void;
  onExport: () => void;
}

export function PlannerPanel({
  config,
  plan,
  todaysInPlan,
  onGeneratePlan,
  onExport,
}: PlannerPanelProps) {
  return (
    <div className="lg:col-span-4 bg-white p-4 rounded shadow">
      <h2 className="text-lg font-semibold">Planner</h2>

      <div className="mt-2">
        <p className="text-sm text-slate-600">
          Start date: <strong>{config.startDate}</strong>
        </p>
        <p className="text-sm text-slate-600">
          Weekday: {config.weekdayHours} hrs • Weekend: {config.weekendHours}{" "}
          hrs
        </p>
      </div>

      <div className="mt-3">
        <button
          className="px-3 py-2 bg-blue-600 text-white rounded w-full"
          onClick={onGeneratePlan}
        >
          Regenerate Plan
        </button>
      </div>

      {plan.filter(
        (p) =>
          new Date(p.date) <
            new Date(new Date().setDate(new Date().getDate() - 1)) &&
          p.lectures.some((l) => !l.completed)
      ).length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium">Overdue</h3>
          <div className="space-y-2 mt-2 text-sm">
            {plan
              .filter(
                (p) =>
                  new Date(p.date) <
                    new Date(new Date().setDate(new Date().getDate() - 1)) &&
                  p.lectures.some((l) => !l.completed)
              )
              .map((d, i) => (
                <div key={i} className="p-2 border rounded">
                  <div className="flex justify-between">
                    <div>
                      {d.date} (
                      {new Date(d.date).toLocaleDateString("en-US", {
                        weekday: "long",
                      })}
                      )
                    </div>
                    <div>
                      {convertDecimalHoursToHHMM(
                        d.lectures
                          .filter((l) => l.completed)
                          .reduce((prev, curr) => prev + curr.duration, 0)
                      )}
                      /{convertDecimalHoursToHHMM(d.used)} (
                      {d.lectures.filter((l) => l.completed).length}/
                      {d.lectures.length} lectures)
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    <strong>
                      Pending:{" "}
                      {convertDecimalHoursToHHMM(
                        d.lectures
                          .filter((l) => !l.completed)
                          .reduce(
                            (prev, curr) => prev + (curr.duration || 0),
                            0
                          )
                      )}{" "}
                      hrs - {d.lectures.filter((l) => !l.completed).length}{" "}
                      lectures
                    </strong>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {d.lectures
                      .filter((x) => !x.completed)
                      .map((x) => formatId(x))
                      .join(", ")}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <h3 className="font-medium">Today</h3>
        {todaysInPlan ? (
          <div className="mt-2 border rounded p-2 shadow-sm">
            <div className="text-sm text-slate-500">
              Date: {todaysInPlan.date} (
              {todaysInPlan.isWeekend ? "Weekend" : "Weekday"})&nbsp;&nbsp; (
              {convertDecimalHoursToHHMM(
                todaysInPlan.lectures
                  .filter((l) => l.completed)
                  .reduce((prev, curr) => prev + (curr.duration || 0), 0)
              )}
              /
              {convertDecimalHoursToHHMM(
                todaysInPlan.lectures.reduce(
                  (prev, curr) => prev + (curr.duration || 0),
                  0
                )
              )}{" "}
              hrs) ({todaysInPlan.lectures.filter((l) => l.completed).length}/
              {todaysInPlan.lectures.length} lectures)
            </div>
            <div className="text-sm text-slate-500 mt-1">
              <strong>
                Pending:{" "}
                {convertDecimalHoursToHHMM(
                  todaysInPlan.lectures
                    .filter((l) => !l.completed)
                    .reduce((prev, curr) => prev + (curr.duration || 0), 0)
                )}{" "}
                hrs - {todaysInPlan.lectures.filter((l) => !l.completed).length}{" "}
                lectures
              </strong>
            </div>
            <ul className="mt-2 ml-4 list-disc text-sm">
              {todaysInPlan.lectures.length === 0 ? (
                <li>No lectures scheduled today</li>
              ) : (
                todaysInPlan.lectures
                  .filter((x) => !x.completed)
                  .map((l, i) => (
                    <li key={i}>
                      {formatId(l)} - {l.topic} (
                      {convertDecimalHoursToHHMM(l.duration || 0)})
                    </li>
                  ))
              )}
            </ul>
          </div>
        ) : (
          <div className="text-sm text-slate-500 mt-2">
            No plan generated yet or nothing scheduled for today.
          </div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="font-medium">Upcoming</h3>
        <div className="space-y-2 mt-2 text-sm">
          {plan
            .filter((p) => new Date(p.date) > new Date())
            .map((d, i) => (
              <div key={i} className="p-2 border rounded">
                <div className="flex justify-between">
                  <div>
                    {d.date} (
                    {new Date(d.date).toLocaleDateString("en-US", {
                      weekday: "long",
                    })}
                    )
                  </div>
                  <div>
                    {convertDecimalHoursToHHMM(d.used)}/{d.capacity} (
                    {d.lectures.length} lectures)
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  {d.lectures
                    .filter((x) => !x.completed)
                    .map((x) => formatId(x))
                    .join(", ")}
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-medium">Actions</h3>
        <div className="flex gap-2 mt-2">
          <button
            className="px-3 py-2 bg-gray-100 rounded"
            onClick={() => {
              const copy = [...plan].map((d) => ({ ...d }));
              navigator.clipboard &&
                navigator.clipboard
                  .writeText(JSON.stringify(copy))
                  .then(() => alert("Copied to clipboard"));
            }}
          >
            Copy plan JSON
          </button>
          <button className="px-3 py-2 bg-gray-100 rounded" onClick={onExport}>
            Download export
          </button>
        </div>
      </div>
    </div>
  );
}
