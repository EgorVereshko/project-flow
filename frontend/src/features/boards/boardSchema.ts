import { z } from 'zod';

export const boardSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      1,
      'Board name is required',
    )
    .max(
      100,
      'Board name must be 100 characters or less',
    ),

  description: z
    .string()
    .trim()
    .max(
      300,
      'Description must be 300 characters or less',
    ),
});

export type BoardFormValues =
  z.infer<typeof boardSchema>;