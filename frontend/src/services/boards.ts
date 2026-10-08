import type { Board } from '../types/board';

export const mockBoards: Board[] = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Redesign the company website',
    tasksCount: 12,
    createdAt: '2026-09-15',
  },
  {
    id: '2',
    name: 'Mobile Application',
    description: 'Development of the mobile application',
    tasksCount: 8,
    createdAt: '2026-09-20',
  },
  {
    id: '3',
    name: 'Marketing Campaign',
    description: 'Prepare the next marketing campaign',
    tasksCount: 5,
    createdAt: '2026-09-25',
  },
  {
    id: '4',
    name: 'Internal Tools',
    description: 'Build internal tools for the team',
    tasksCount: 7,
    createdAt: '2026-09-28',
  },
];