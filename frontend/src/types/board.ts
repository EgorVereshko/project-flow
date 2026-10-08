export type Task = {
  id: string;
  title: string;
  description: string;
  assignee: string;
  deadline: string | null;
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