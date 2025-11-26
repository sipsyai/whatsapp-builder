/**
 * Generate a UUID v4
 * Falls back to manual generation when crypto.randomUUID() is not available
 * (e.g., non-HTTPS contexts)
 */
export function generateUUID(): string {
  // Try native crypto.randomUUID() first
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fall through to manual generation
    }
  }

  // Fallback: Manual UUID v4 generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
