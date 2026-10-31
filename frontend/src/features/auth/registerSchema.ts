import { z } from 'zod';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .max(255, 'Email must be 255 characters or less')
  .regex(emailPattern, 'Provide a valid email address');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Password must contain at least 8 characters')
    .refine(
      (password) => new TextEncoder().encode(password).length <= 72,
      'Password must be no more than 72 bytes',
    ),
  confirmPassword: z.string(),
}).refine(
  ({ password, confirmPassword }) => password === confirmPassword,
  {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  },
);

export type RegisterFormValues = z.infer<typeof registerSchema>;
