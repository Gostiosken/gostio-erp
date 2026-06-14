import type { ActionResult } from "@/lib/types/action";
import { isDatabaseConfigured } from "@/lib/db-availability";

export { isDatabaseConfigured };

/**
 * Determina si el ERP debe operar con datos mock.
 * Con NEXT_PUBLIC_USE_MOCK_DATA=false los mocks quedan desactivados por completo.
 */
export function shouldUseMockData(): boolean {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") {
    return false;
  }

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
