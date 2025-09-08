import { useEffect, useState } from 'react';
import type { Config, Lecture, PlanDay } from '../types';
import { defaultConfig, loadFromLocal, saveToLocal } from '../utils';

export function useLecturePlanner() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [config, setConfig] = useState<Config>(defaultConfig());
  const [plan, setPlan] = useState<PlanDay[]>([]);

  // Load initial from localStorage
  useEffect(() => {
    const persisted = loadFromLocal();
    if (persisted) {
      setLectures(persisted.lectures || []);
      setConfig(persisted.config || defaultConfig());
      setPlan(persisted.plan || []);
    } else {
      // empty default
      setLectures([]);
    }
  }, []);

  // Save to local whenever lectures or config change
  useEffect(() => {
    saveToLocal({ lectures, config, plan });
  }, [lectures, config, plan]);

  return {
    lectures,
    setLectures,
    config,
    setConfig,
    plan,
    setPlan
  };
}

// Add other hooks as needed
