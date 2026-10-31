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
      150,
      'Board name must be 150 characters or less',
    ),

  description: z
    .string()
    .trim()
    .max(
      10_000,
      'Description must be 10000 characters or less',
    ),
});

export type BoardFormValues =
  z.infer<typeof boardSchema>;