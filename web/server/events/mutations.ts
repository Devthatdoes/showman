import { db } from "@/db";
import { events, type NewEvent } from "@/db/schema";

export async function recordEvent(event: NewEvent): Promise<void> {
  await db.insert(events).values(event);
}
