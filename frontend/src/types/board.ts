export type WorkflowStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type ProfileTaskStatus = WorkflowStatus | 'overdue';

export type Task = {
  id: string;
  title: string;
  description: string;
  assigneeId?: string | null;
  assignee: string;
  deadline: string | null;
  priority: TaskPriority;
};

export type AppUser = {
  id: string;
  username: string;
  email: string;
};

export type BoardColumn = {
  id: string;
  title: string;
  workflowStatus: WorkflowStatus;
  tasks: Task[];
};

export type Board = {
  id: string;
  name: string;
  description: string;
  tasksCount: number;
  createdAt: string;
  columns: BoardColumn[];
};