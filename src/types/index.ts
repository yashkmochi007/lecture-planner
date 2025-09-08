export interface Lecture {
    sr: number;
    module: number;
    submodule: number;
    topic: string;
    size: number;
    duration: number;
    completed: boolean;
}

export interface Config {
    weekdayHours: number;
    weekendHours: number;
    startDate: string;
}

export interface PlanDay {
    date: string;
    isWeekend: boolean;
    capacity: number;
    used: number;
    lectures: Lecture[];
}

export interface Filter {
    q: string;
    showCompleted: boolean;
    module: string;
}

export interface StoredState {
    lectures: Lecture[];
    config: Config;
    plan: PlanDay[];
}

export interface RawLectureInput {
    module: string | number;
    submodule: string | number;
    topic?: string;
    title?: string;
    size?: number;
    size_mb?: number;
    duration?: number;
    duration_hr?: number;
    completed?: boolean;
}
