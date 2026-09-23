CREATE TABLE `ad_rewards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`transaction_id` text NOT NULL,
	`tickets` integer NOT NULL,
	`reward_item` text,
	`source` text DEFAULT 'client' NOT NULL,
	`timestamp` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`raffle_id` text NOT NULL,
	`raffle_title` text,
	`tickets_used` integer NOT NULL,
	`timestamp` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`raffle_id`) REFERENCES `raffles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`logo` text,
	`photo` text,
	`category` text NOT NULL,
	`sponsored` integer DEFAULT false NOT NULL,
	`contact_info` text,
	`email` text,
	`whatsapp` text,
	`line` text,
	`address` text,
	`location` text,
	`latitude` real,
	`longitude` real,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `raffles` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`image` text,
	`category` text NOT NULL,
	`partner_id` text NOT NULL,
	`partner_name` text,
	`location` text,
	`address` text,
	`prizes_available` integer NOT NULL,
	`prizes_remaining` integer NOT NULL,
	`ticket_cost` integer DEFAULT 10 NOT NULL,
	`prize_value` real DEFAULT 0 NOT NULL,
	`prize_value_usd` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'THB' NOT NULL,
	`game_price` real DEFAULT 0 NOT NULL,
	`draw_date` integer NOT NULL,
	`minimum_draw_date` integer,
	`last_extension_date` integer,
	`validity_months` integer DEFAULT 3 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`total_entries` integer DEFAULT 0 NOT NULL,
	`total_tickets_collected` integer DEFAULT 0 NOT NULL,
	`draw_status` text DEFAULT 'pending' NOT NULL,
	`is_digital_prize` integer DEFAULT false NOT NULL,
	`secret_codes` text DEFAULT '[]' NOT NULL,
	`used_secret_codes` text DEFAULT '[]' NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`allowed_countries` text DEFAULT '["TH"]' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`drawn_at` integer,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rewards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`raffle_id` text NOT NULL,
	`raffle_title` text NOT NULL,
	`prize_details` text NOT NULL,
	`partner_name` text NOT NULL,
	`claim_status` text DEFAULT 'unclaimed' NOT NULL,
	`contact_info` text,
	`won_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`claimed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`raffle_id`) REFERENCES `raffles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`session_token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`picture` text,
	`phone` text,
	`password_hash` text,
	`tickets` integer DEFAULT 50 NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`daily_streak` integer DEFAULT 0 NOT NULL,
	`last_login` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`reset_token` text,
	`reset_token_expiry` integer,
	`used_referral_code` integer DEFAULT false NOT NULL,
	`referred_by` text
);
--> statement-breakpoint
CREATE TABLE `vouchers` (
	`id` text PRIMARY KEY NOT NULL,
	`voucher_ref` text NOT NULL,
	`user_id` text NOT NULL,
	`user_name` text NOT NULL,
	`user_email` text NOT NULL,
	`raffle_id` text NOT NULL,
	`raffle_title` text NOT NULL,
	`partner_id` text NOT NULL,
	`partner_name` text NOT NULL,
	`prize_value` real NOT NULL,
	`currency` text NOT NULL,
	`is_digital_prize` integer NOT NULL,
	`secret_code` text,
	`verification_code` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`valid_until` integer NOT NULL,
	`redeemed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`partner_email` text,
	`partner_whatsapp` text,
	`partner_line` text,
	`partner_address` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`raffle_id`) REFERENCES `raffles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `winners` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`raffle_id` text NOT NULL,
	`entry_id` text NOT NULL,
	`voucher_id` text NOT NULL,
	`draw_date` integer NOT NULL,
	`notified` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`raffle_id`) REFERENCES `raffles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ad_rewards_transaction_id_unique` ON `ad_rewards` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `ad_rewards_user_id_timestamp_idx` ON `ad_rewards` (`user_id`,`timestamp`);--> statement-breakpoint
CREATE INDEX `entries_user_id_idx` ON `entries` (`user_id`);--> statement-breakpoint
CREATE INDEX `entries_raffle_id_idx` ON `entries` (`raffle_id`);--> statement-breakpoint
CREATE INDEX `raffles_active_draw_idx` ON `raffles` (`active`,`draw_status`,`draw_date`);--> statement-breakpoint
CREATE INDEX `raffles_category_idx` ON `raffles` (`category`);--> statement-breakpoint
CREATE INDEX `rewards_user_id_idx` ON `rewards` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_sessions_user_id_idx` ON `user_sessions` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_reset_token_idx` ON `users` (`reset_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `vouchers_voucher_ref_unique` ON `vouchers` (`voucher_ref`);--> statement-breakpoint
CREATE INDEX `vouchers_user_id_idx` ON `vouchers` (`user_id`);--> statement-breakpoint
CREATE INDEX `winners_user_id_idx` ON `winners` (`user_id`);