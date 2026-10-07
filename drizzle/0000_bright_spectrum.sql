CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`slot_id` text NOT NULL,
	`month` text NOT NULL,
	`target_key` text NOT NULL,
	`target_name` text NOT NULL,
	`manager_name` text NOT NULL,
	`phone` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`slot_id`) REFERENCES `slots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bookings_month` ON `bookings` (`month`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_bookings_active_slot` ON `bookings` (`slot_id`) WHERE "bookings"."status" IN ('pending', 'approved');--> statement-breakpoint
CREATE UNIQUE INDEX `idx_bookings_active_target_month` ON `bookings` (`target_key`,`month`) WHERE "bookings"."status" IN ('pending', 'approved');--> statement-breakpoint
CREATE TABLE `slots` (
	`id` text PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`time` text NOT NULL,
	`minute` integer NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_slots_day_enabled` ON `slots` (`day`,`enabled`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_slots_active_start` ON `slots` (`day`,`minute`) WHERE "slots"."enabled" = 1;