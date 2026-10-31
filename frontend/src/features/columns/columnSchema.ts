import { z } from 'zod';

export const columnSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Column title is required')
    .max(
      100,
      'Column title must be 100 characters or less',
    ),
});

export type ColumnFormValues =
  z.infer<typeof columnSchema>;