import { z } from 'zod';

export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Task title is required')
    .max(
      100,
      'Task title must be 100 characters or less',
    ),

  description: z
    .string()
    .trim()
    .max(
      500,
      'Description must be 500 characters or less',
    ),

  assignee: z
    .string()
    .trim()
    .min(1, 'Assignee is required')
    .max(
      100,
      'Assignee must be 100 characters or less',
    ),

  deadline: z
    .string()
    .nullable(),
});

export type TaskFormValues =
  z.infer<typeof taskSchema>;