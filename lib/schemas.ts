import { z } from 'zod';

export const AssetCreateSchema = z.object({
  name: z.string().min(1),
  typeId: z.number().int().positive(),
  amount: z.number().positive(),
  currency: z.string().min(1),
  valuationDate: z.preprocess((v) => new Date(v as string), z.date()),
  notes: z.string().optional(),
});

export const LiabilityCreateSchema = z.object({
  name: z.string().min(1),
  typeId: z.number().int().positive(),
  amount: z.number().positive(),
  interestRate: z.number().nonnegative().optional(),
  currency: z.string().min(1),
  dueDate: z.preprocess((v) => (v ? new Date(v as string) : undefined), z.date().optional()),
  notes: z.string().optional(),
});