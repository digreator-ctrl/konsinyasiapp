CREATE TABLE `sales_stocks` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`sales_id` text NOT NULL,
	`product_id` text NOT NULL,
	`batch_id` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sales_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`batch_id`) REFERENCES `stock_batches`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_stocks_sales_batch_idx` ON `sales_stocks` (`sales_id`,`batch_id`);--> statement-breakpoint
CREATE INDEX `sales_stocks_tenant_idx` ON `sales_stocks` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `sales_stocks_sales_idx` ON `sales_stocks` (`sales_id`);--> statement-breakpoint
CREATE INDEX `sales_stocks_product_idx` ON `sales_stocks` (`product_id`);