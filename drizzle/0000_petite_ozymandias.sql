CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`contact_method` text NOT NULL,
	`contact_value` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE TABLE `self_tests` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`questions` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE TABLE `therapists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`bio` text NOT NULL,
	`image_url` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now'))
);
