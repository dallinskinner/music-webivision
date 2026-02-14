/**
 * Convert ISO 8601 duration to readable format
 * Converts YouTube's PT4M15S format to "4:15"
 *
 * @param isoDuration - ISO 8601 duration string (e.g., "PT4M15S")
 * @returns Formatted duration string (e.g., "4:15")
 */
export function formatDuration(isoDuration: string): string {
  // Match ISO 8601 duration pattern: PT(hours)H(minutes)M(seconds)S
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) {
    return '0:00';
  }

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  // Format: H:MM:SS or M:SS
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
