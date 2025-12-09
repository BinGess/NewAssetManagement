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

export const AssetUpdateSchema = z.object({
  name: z.string().min(1),
  typeId: z.number().int().positive(),
  amount: z.number().positive(),
  currency: z.string().min(1),
  valuationDate: z.preprocess((v) => new Date(v as string), z.date()),
  notes: z.string().optional(),
});

export const LiabilityUpdateSchema = z.object({
  name: z.string().min(1),
  typeId: z.number().int().positive(),
  amount: z.number().positive(),
  interestRate: z.number().nonnegative().nullable().optional(),
  currency: z.string().min(1),
  dueDate: z.preprocess((v) => (v ? new Date(v as string) : null), z.date().nullable().optional()),
  notes: z.string().optional(),
});

export const TypeCreateSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  enabled: z.boolean().optional(),
  order: z.number().int().nonnegative().optional(),
});

export const TypeUpdateSchema = z.object({
  label: z.string().min(1),
  enabled: z.boolean().optional(),
  order: z.number().int().nonnegative().optional(),
});

export const HoldingCreateSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().positive(),
  notes: z.string().optional(),
});

export const HoldingUpdateSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().positive(),
  notes: z.string().optional(),
});

export const AssetChangeCreateSchema = z.object({
  beforeAmount: z.number(),
  afterAmount: z.number(),
  notes: z.string().optional(),
});