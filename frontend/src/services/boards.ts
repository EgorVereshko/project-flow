import type { Board } from '../types/board';

export const mockBoards: Board[] = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Redesign the company website',
    tasksCount: 5,
    createdAt: '2026-09-15',
    columns: [
      {
        id: 'todo',
        title: 'To Do',
        tasks: [
          {
            id: 'task-1',
            title: 'Create landing page',
            description: 'Build the main landing page layout',
            assignee: 'Alex',
            deadline: '2026-10-15',
          },
          {
            id: 'task-2',
            title: 'Design API structure',
            description: 'Define API endpoints for the project',
            assignee: 'Maria',
            deadline: '2026-10-18',
          },
        ],
      },
      {
        id: 'progress',
        title: 'In Progress',
        tasks: [
          {
            id: 'task-3',
            title: 'Header component',
            description: 'Implement responsive website header',
            assignee: 'Alex',
            deadline: '2026-10-12',
          },
          {
            id: 'task-4',
            title: 'Login page',
            description: 'Create login page UI',
            assignee: 'John',
            deadline: null,
          },
        ],
      },
      {
        id: 'done',
        title: 'Done',
        tasks: [
          {
            id: 'task-5',
            title: 'Project setup',
            description: 'Initialize frontend project',
            assignee: 'Maria',
            deadline: null,
          },
        ],
      },
    ],
  },

  {
    id: '2',
    name: 'Mobile Application',
    description: 'Development of the mobile application',
    tasksCount: 3,
    createdAt: '2026-09-20',
    columns: [
      {
        id: 'todo',
        title: 'To Do',
        tasks: [
          {
            id: 'task-6',
            title: 'Create mobile layout',
            description: 'Prepare initial mobile screens',
            assignee: 'Alex',
            deadline: '2026-10-20',
          },
        ],
      },
      {
        id: 'progress',
        title: 'In Progress',
        tasks: [
          {
            id: 'task-7',
            title: 'Authentication',
            description: 'Implement authentication screens',
            assignee: 'John',
            deadline: '2026-10-22',
          },
        ],
      },
      {
        id: 'done',
        title: 'Done',
        tasks: [
          {
            id: 'task-8',
            title: 'Project initialization',
            description: 'Initialize mobile project',
            assignee: 'Maria',
            deadline: null,
          },
        ],
      },
    ],
  },

  {
    id: '3',
    name: 'Marketing Campaign',
    description: 'Prepare the next marketing campaign',
    tasksCount: 2,
    createdAt: '2026-09-25',
    columns: [
      {
        id: 'todo',
        title: 'To Do',
        tasks: [
          {
            id: 'task-9',
            title: 'Prepare campaign plan',
            description: 'Create campaign strategy',
            assignee: 'Maria',
            deadline: '2026-10-25',
          },
        ],
      },
      {
        id: 'progress',
        title: 'In Progress',
        tasks: [
          {
            id: 'task-10',
            title: 'Create advertising materials',
            description: 'Prepare visual materials',
            assignee: 'Alex',
            deadline: '2026-10-28',
          },
        ],
      },
      {
        id: 'done',
        title: 'Done',
        tasks: [],
      },
    ],
  },

  {
    id: '4',
    name: 'Internal Tools',
    description: 'Build internal tools for the team',
    tasksCount: 2,
    createdAt: '2026-09-28',
    columns: [
      {
        id: 'todo',
        title: 'To Do',
        tasks: [
          {
            id: 'task-11',
            title: 'Define requirements',
            description: 'Collect requirements from the team',
            assignee: 'John',
            deadline: null,
          },
        ],
      },
      {
        id: 'progress',
        title: 'In Progress',
        tasks: [],
      },
      {
        id: 'done',
        title: 'Done',
        tasks: [
          {
            id: 'task-12',
            title: 'Research',
            description: 'Research existing solutions',
            assignee: 'Maria',
            deadline: null,
          },
        ],
      },
    ],
  },
];