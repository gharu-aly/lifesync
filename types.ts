
export enum ModuleType {
  FITNESS = 'FITNESS',
  HEALTH = 'HEALTH',
  WORK_STUDY = 'WORK_STUDY',
  FINANCE = 'FINANCE',
  PROFILE = 'PROFILE'
}

export interface UserProfile {
  nickname: string;
  avatar: string;
  gender: 'MALE' | 'FEMALE';
  age: number;
  height: number;
  weight: number;
}

export interface HealthLog {
  id: string;
  date: string;
  weight: number;
  waterIntake: number;
  caloriesIn: number;
  caloriesOut: number;
  sleepHours: number;
}

export interface FitnessSettings {
  gender: 'MALE' | 'FEMALE';
  age: number;
  height?: number;
  weight?: number;
  goal: 'LOSE_WEIGHT' | 'GAIN_MUSCLE' | 'MAINTAIN';
  activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE';
}

export interface HealthSettings {
  cycleLength: number;
  periodLength: number;
  lastPeriodStart?: string;
  lastPeriodEnd?: string;
  lastPeriodFlow?: 'LIGHT' | 'MEDIUM' | 'HEAVY';
  userHeight?: number;
}

export interface Task {
  id: string;
  title: string;
  category: 'WORK' | 'STUDY' | 'ENTERTAINMENT';
  status: 'TODO' | 'DOING' | 'DONE';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  isPriority: boolean;
  dueDate: string;
  duration: number;
}

export interface FinanceRecord {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  date: string;
  note: string;
}

export interface AppState {
  profile: UserProfile;
  theme: 'LIGHT' | 'DARK';
  healthLogs: HealthLog[];
  tasks: Task[];
  financeRecords: FinanceRecord[];
  activeModule: ModuleType;
  healthSettings: HealthSettings;
  fitnessSettings: FitnessSettings;
}
