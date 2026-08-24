CREATE TABLE `learner_progress_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`payload` text NOT NULL,
	`updated_at` integer NOT NULL,
	`archived_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_learner_progress_history_user_archived` ON `learner_progress_history` (`user_id`,`archived_at`);
--> statement-breakpoint
PRAGMA optimize;
