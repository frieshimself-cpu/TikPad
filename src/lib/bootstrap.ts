import { isDemoMode } from "./config";
import { db } from "./db";
import { seedDemoData } from "./demo";

/** Open the DB and, in demo mode, make sure sample data exists. Safe to call on every request. */
export function ready() {
  db();
  if (isDemoMode()) seedDemoData();
}
