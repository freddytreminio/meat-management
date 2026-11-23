CREATE TABLE "infrastructure_probe" (
	"id" integer PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "infrastructure_probe" ("id") VALUES (1);
