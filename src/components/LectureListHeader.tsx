import { convertDecimalHoursToHHMM } from "../utils";

interface LectureListHeaderProps {
  lectureCount: number;
  spentDuration: number;
  totalDuration: number;
  completedCount: number;
}

export function LectureListHeader({
  lectureCount,
  spentDuration,
  totalDuration,
  completedCount,
}: LectureListHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold">Lectures ({lectureCount})</h2>

      <div className="flex items-center gap-2">
        <div className="text-sm text-slate-500">
          <strong>{convertDecimalHoursToHHMM(spentDuration)}</strong> /{" "}
          <strong>{convertDecimalHoursToHHMM(totalDuration)}</strong> Hrs
        </div>
        <div className="w-64 bg-slate-200 h-5 rounded overflow-hidden">
          <div
            className="h-full bg-green-500"
            style={{
              padding: "0 4px",
              fontSize: "0.80rem",
              color: "white",
              textAlign: "right",
              width: `${
                lectureCount ? (completedCount / lectureCount) * 100 : 0
              }%`,
            }}
          >
            {(lectureCount
              ? (completedCount / lectureCount) * 100
              : 0
            ).toFixed()}
            %
          </div>
        </div>
        <div className="text-sm text-slate-600">
          {completedCount}/{lectureCount} completed
        </div>
      </div>
    </div>
  );
}
