import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const slots = sqliteTable('slots', {
  id: text('id').primaryKey(),
  day: text('day').notNull(),
  time: text('time').notNull(),
  minute: integer('minute').notNull(),
  enabled: integer('enabled').notNull().default(1),
  createdAt: text('created_at').notNull(),
}, (t) => [
  index('idx_slots_day_enabled').on(t.day, t.enabled),
  uniqueIndex('idx_slots_active_start').on(t.day, t.minute).where(sql`${t.enabled} = 1`),
]);

export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey(),
  slotId: text('slot_id').notNull().references(() => slots.id),
  month: text('month').notNull(),
  targetKey: text('target_key').notNull(),
  targetName: text('target_name').notNull(),
  managerName: text('manager_name').notNull(),
  phone: text('phone').notNull(),
  status: text('status', { enum: ['pending','approved','rejected','cancelled'] }).notNull().default('pending'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (t) => [
  index('idx_bookings_month').on(t.month),
  uniqueIndex('idx_bookings_active_slot').on(t.slotId).where(sql`${t.status} IN ('pending', 'approved')`),
  uniqueIndex('idx_bookings_active_target_month').on(t.targetKey, t.month).where(sql`${t.status} IN ('pending', 'approved')`),
]);
