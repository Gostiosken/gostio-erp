import type { ActionResult } from "@/lib/types/action";
import { isDatabaseConfigured } from "@/lib/db-availability";

export { isDatabaseConfigured };

/** Solo usar datos mock cuando no hay DATABASE_URL configurada. */
export function shouldUseMockData(): boolean {
  return !isDatabaseConfigured();
}

export function mockReadResult<T>(data: T): ActionResult<T> {
  return { success: true, data, usingMockData: true };
}

export function dbReadError<T>(
  message: string,
  error?: unknown
): ActionResult<T> {
  if (!isDatabaseConfigured()) {
    return { success: false, error: message };
  }
  console.error(message, error);
  return {
    success: false,
    error: `${message} Verifique que PostgreSQL esté activo.`,
  };
}
