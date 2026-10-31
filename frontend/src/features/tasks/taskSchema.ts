import { z } from 'zod';

export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Task title is required')
    .max(
      200,
      'Task title must be 200 characters or less',
    ),

  description: z
    .string()
    .trim()
    .max(
      10_000,
      'Description must be 10000 characters or less',
    ),

  assigneeId: z.union([
    z.uuid(),
    z.literal(''),
  ]),

  deadline: z.union([
    z.iso.date(),
    z.literal(''),
  ]),
});

export type TaskFormValues =
  z.infer<typeof taskSchema>;