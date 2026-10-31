export type Task = {
  id: string;
  title: string;
  description: string;
  assigneeId?: string | null;
  assignee: string;
  deadline: string | null;
};

export type BoardMember = {
  id: string;
  name: string;
  email: string;
};

export type BoardColumn = {
  id: string;
  title: string;
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