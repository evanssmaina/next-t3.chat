CREATE TABLE "stream" (
	"id" text PRIMARY KEY NOT NULL,
	"chatId" text NOT NULL,
	"user_id" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stream" ADD CONSTRAINT "stream_chatId_chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream" ADD CONSTRAINT "stream_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stream_chatId_index" ON "stream" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX "stream_user_id_index" ON "stream" USING btree ("user_id");