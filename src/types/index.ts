export interface RawLectureInput {
  module: number | string;
  submodule: number | string;
  topic?: string;
  title?: string;
  size?: number | string;
  size_mb?: number | string;
  duration?: number | string;
  duration_hr?: number | string;
  completed?: boolean;
}

export interface Lecture {
  id?: number; // From Supabase
  user_id?: string; // From Supabase
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
  id?: number; // From Supabase
  user_id?: string; // From Supabase
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