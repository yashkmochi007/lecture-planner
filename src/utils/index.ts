import type { Config, Lecture } from '../types/index';


export const LOCAL_KEY = "lecture_planner_v1";

export function formatId(item: Lecture): string {
    return `${item.module}.${String(item.submodule).padStart(2, "0")}`;
}

export function defaultConfig(): Config {
    return {
        weekdayHours: 2,
        weekendHours: 8,
        startDate: new Date().toISOString().slice(0, 10)
    };
}

export function sortLectures(arr: Lecture[]): Lecture[] {
    return [...arr].sort((a, b) => {
        if (a.module !== b.module) return a.module - b.module;
        return a.submodule - b.submodule;
    });
}

// export function loadFromLocal(): StoredState | null {
//     try {
//         const raw = localStorage.getItem(LOCAL_KEY);
//         if (!raw) {
//             console.log('No saved state found');
//             return null;
//         }
//         const parsed = JSON.parse(raw) as StoredState;
//         if (!parsed || !Array.isArray(parsed.lectures)) {
//             console.log('Invalid saved state format');
//             return null;
//         }
//         console.log(`Loaded ${parsed.lectures.length} lectures from storage`);
//         return parsed;
//     } catch (e) {
//         console.error("Failed to load local state", e);
//         return null;
//     }
// }

// export function saveToLocal(state: StoredState): void {
//     try {
//         if (!state || !Array.isArray(state.lectures)) {
//             console.error("Invalid state format", state);
//             return;
//         }
//         localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
//         console.log(`Saved ${state.lectures.length} lectures to storage`);
//     } catch (e) {
//         console.error("Failed to save local state", e);
//     }
// }

export function isWeekend(d: Date): boolean {
    const day = d.getDay(); // 0 Sun - 6 Sat
    return day === 0 || day === 6;
}


export function convertDecimalHoursToHHMM(decimalHours: number): string {
    // Get the whole number part for hours
    let hours = Math.floor(decimalHours);

    // Get the decimal part and convert it to minutes
    let minutes = Math.round((decimalHours - hours) * 60);
    if (minutes === 60) {
        hours += 1;
        minutes = 0;
    }

    // Format minutes to always be two digits (e.g., 5 becomes "05")
    const formattedMinutes = minutes < 10 ? '0' + minutes : '' + minutes;
    if (formattedMinutes == '00') return hours.toString();
    return hours + ':' + formattedMinutes;
}