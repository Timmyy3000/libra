type DerivedCharacter = {
  name: string;
  description: string;
  aliases: string[];
  sampleLineCount: number;
};

const COMMON_NON_CHARACTER_TOKENS = new Set([
  "chapter",
  "one",
  "two",
  "three",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
  "london",
  "paris",
  "york",
  "north",
  "south",
  "east",
  "west",
]);

function normalizeCandidate(raw: string) {
  return raw.replace(/^The\s+/u, "").trim();
}

function isValidCharacterCandidate(name: string) {
  const tokens = name.split(/\s+/u).filter(Boolean);
  if (tokens.length === 0) return false;

  return tokens.every((token) => !COMMON_NON_CHARACTER_TOKENS.has(token.toLowerCase()));
}

export function deriveCharactersFromText(text: string): DerivedCharacter[] {
  const matches = text.match(/\b(?:The\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/gu) ?? [];
  const counts = new Map<string, number>();

  for (const match of matches) {
    const candidate = normalizeCandidate(match);
    if (!isValidCharacterCandidate(candidate)) continue;

    counts.set(candidate, (counts.get(candidate) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .map(([name, count]) => {
      const tokens = name.split(/\s+/u);

      return {
        name,
        description: `${name} appears ${count} times in the source text.`,
        aliases: tokens.length > 1 ? [tokens[tokens.length - 1] ?? name] : [],
        sampleLineCount: count,
      } satisfies DerivedCharacter;
    });
}
