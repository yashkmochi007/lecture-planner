import { useState } from 'react';
import type { Config, Lecture, PlanDay } from '../types';
import { isWeekend, sortLectures } from '../utils';

export function usePlanGenerator() {
  const [plan, setPlan] = useState<PlanDay[]>([]);

  const generatePlan = (lectures: Lecture[], config: Config) => {
    // pick unfinished lectures in sorted order
    const remaining = sortLectures(lectures.filter((l) => !l.completed));
    const res: PlanDay[] = [];
    let ptr = 0;

    let curDate = new Date(config.startDate);
    if (isNaN(curDate.getTime())) curDate = new Date();

    while (ptr < remaining.length) {
      const dayIsWeekend = isWeekend(curDate);
      const todayHours = dayIsWeekend ? config.weekendHours : config.weekdayHours;
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

      res.push({
        date: curDate.toISOString().slice(0, 10),
        isWeekend: dayIsWeekend,
        capacity: todayHours,
        used,
        lectures: todays,
      });

      curDate = new Date(curDate.getTime() + 24 * 60 * 60 * 1000);
    }

    setPlan(res);
  };

  return {
    plan,
    generatePlan,
  };
}
