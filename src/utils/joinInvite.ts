/** Extract invite token from `/join/:token` paths (works even without a matching Route). */
export function parseJoinTokenFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/join\/([^/?#]+)/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}
