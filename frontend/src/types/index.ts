export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  TEAM_MEMBER = 'TEAM_MEMBER',
}

export enum ProficiencyLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TaskType {
  PROJECT = 'PROJECT',
  TRAINING = 'TRAINING',
  PTO = 'PTO',
  OTHER = 'OTHER',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
  skills?: UserSkill[];
  developmentAreas?: string[];
}

export interface UserSkill {
  id: string;
  userId: string;
  skillName: string;
  proficiencyLevel: ProficiencyLevel;
  certified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  client?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  budgetHours?: number;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
  requirements?: ProjectRequirement[];
}

export interface ProjectRequirement {
  id: string;
  projectId: string;
  skillName: string;
  requiredLevel: ProficiencyLevel;
  priority: number;
  createdAt: string;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  type: TaskType;
  projectId?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
}

