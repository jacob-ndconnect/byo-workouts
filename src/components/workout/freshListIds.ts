/** Ids that should play the add animation. The first list is the baseline. */
export function nextFreshIds(
  previousKey: string | null,
  ids: readonly string[],
): { key: string; fresh: Set<string> } {
  const key = ids.join("\0");
  if (previousKey === null) return { key, fresh: new Set() };
  const previous = new Set(previousKey === "" ? [] : previousKey.split("\0"));
  return {
    key,
    fresh: new Set(ids.filter((id) => !previous.has(id))),
  };
}
