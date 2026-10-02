CREATE TABLE "pix_payments" (
	"id" uuid PRIMARY KEY,
	"provider_id" text NOT NULL UNIQUE,
	"amount_cents" integer NOT NULL,
	"copy_paste" text NOT NULL,
	"qrcode_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
