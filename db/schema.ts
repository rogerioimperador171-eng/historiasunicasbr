import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const pixPayments = pgTable("pix_payments", {
  id: uuid("id").primaryKey(),
  providerId: text("provider_id").notNull().unique(),
  amountCents: integer("amount_cents").notNull(),
  copyPaste: text("copy_paste").notNull(),
  qrcodeUrl: text("qrcode_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
