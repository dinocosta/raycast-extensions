/**
 * Formats a duration, given in seconds, into a compact human-readable string.
 *
 * Only non-zero units are shown, from hours down to seconds.
 *
 * @param seconds - The duration in seconds
 * @returns A compact string such as "45s", "25m", "1m 30s" or "1h 5m 10s"
 * @example
 * durationString(45)   // "45s"
 * durationString(1500) // "25m"
 * durationString(3661) // "1h 1m 1s"
 */
export function durationString(seconds: number): string {
  const totalSeconds = Math.max(0, Math.round(seconds));

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);

  return parts.join(" ");
}

/**
 * Formats a session count into a human-readable string with proper pluralization
 *
 * @param length - The number of sessions
 * @returns A string representation with "session" or "sessions" based on the value
 */
export function sessionString(length: number): string {
  const suffix = length === 1 ? "session" : "sessions";
  return `${length} ${suffix}`;
}

/**
 * Formats a Date object into a string in the format "YYYY-MM-DD HH:MM:SS"
 *
 * @param date - The Date object to format
 * @returns A string representation of the time in 24-hour format with leading zeros
 * @example
 * // Returns "2025-05-11 14:05:09" for a date representing May 11, 2025 at 2:05:09 PM
 * formatDate(new Date())
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day} ${formatTime(date)}`;
}

/**
 * Formats a Date object's time part into a time string in the format "HH:MM:SS"
 *
 * @param date - The Date object to format
 * @returns A string representation of the time in 24-hour format with leading zeros
 * @example
 * // Returns "14:05:09" for a date representing 2:05:09 PM
 * formatTime(new Date())
 */
export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}
