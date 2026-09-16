CREATE TABLE "mascot_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"prompt" text NOT NULL,
	"style" varchar(50) NOT NULL,
	"mode" varchar(20) DEFAULT 'prompt' NOT NULL,
	"provider" varchar(50) NOT NULL,
	"model" varchar(100) NOT NULL,
	"directions_r2_url" text NOT NULL,
	"reactions_r2_url" text NOT NULL,
	"user_ip" varchar(100),
	"user_agent" text,
	"device" varchar(50),
	"boop_shift_px" numeric(5, 2),
	"palette_match_percent" numeric(5, 2),
	"shoulder_variance_percent" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
