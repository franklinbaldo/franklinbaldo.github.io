export function isNormalEditorialTierKey(key: string): boolean {
  return !key.startsWith("music-");
}

export function isNormalEditorialPost(
  data: Record<string, unknown>,
  key: string,
): boolean {
  return data.postType !== "music" && isNormalEditorialTierKey(key);
}
