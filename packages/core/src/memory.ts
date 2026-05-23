const PATTERNS: { regex: RegExp; extract: (match: RegExpMatchArray) => string }[] = [
  { regex: /my name is ([a-z]+(?:\s[a-z]+)?)/i, extract: (m) => `User's name is ${m[1]}` },
  { regex: /(?:call me|go by|i'm called) ([a-z]+)/i, extract: (m) => `User goes by ${m[1]}` },
  { regex: /i work (?:at|for|as) (.+?)(?:\.|,|$)/i, extract: (m) => `User works at ${m[1].trim()}` },
  { regex: /i live in (.+?)(?:\.|,|$)/i, extract: (m) => `User lives in ${m[1].trim()}` },
  { regex: /i'm from (.+?)(?:\.|,|$)/i, extract: (m) => `User is from ${m[1].trim()}` },
  { regex: /i prefer (.+?)(?:\.|,| over| instead|$)/i, extract: (m) => `User prefers ${m[1].trim()}` },
  { regex: /i like (.+?)(?:\.|,|$)/i, extract: (m) => `User likes ${m[1].trim()}` },
  { regex: /i love (.+?)(?:\.|,|$)/i, extract: (m) => `User loves ${m[1].trim()}` },
  { regex: /i hate (.+?)(?:\.|,|$)/i, extract: (m) => `User dislikes ${m[1].trim()}` },
  { regex: /my favorite (.+?) is (.+?)(?:\.|,|$)/i, extract: (m) => `User's favorite ${m[1].trim()} is ${m[2].trim()}` },
  { regex: /i'm allergic to (.+?)(?:\.|,|$)/i, extract: (m) => `User is allergic to ${m[1].trim()}` },
  { regex: /i don't eat (.+?)(?:\.|,|$)/i, extract: (m) => `User doesn't eat ${m[1].trim()}` },
  { regex: /my (?:birthday|birth date|dob) is (.+?)(?:\.|,|$)/i, extract: (m) => `User's birthday is ${m[1].trim()}` },
  { regex: /i (?:study|major in) (.+?)(?:\.|,|$)/i, extract: (m) => `User studies ${m[1].trim()}` },
  { regex: /i speak (.+?)(?:\.|,|$)/i, extract: (m) => `User speaks ${m[1].trim()}` },
  { regex: /remind me that (.+?)(?:\.|,|$)/i, extract: (m) => `Remember: ${m[1].trim()}` },
  { regex: /i need to remember (.+?)(?:\.|,|$)/i, extract: (m) => `Remember: ${m[1].trim()}` },
  {
    regex: /store (?:this |that )?in memory[,:]?\s*(.+?)(?:\.|$)/i,
    extract: (m) => m[1].trim(),
  },
  {
    regex: /save to memory[,:]?\s*(.+?)(?:\.|$)/i,
    extract: (m) => m[1].trim(),
  },
];

export const MAX_MEMORY_LENGTH = 140;

export function normalizeMemoryText(text: string): string {
  return text.trim().toLowerCase();
}

export function extractMemories(userMessage: string): string[] {
  const results: string[] = [];
  for (const { regex, extract } of PATTERNS) {
    const match = userMessage.match(regex);
    if (match) {
      const memory = extract(match);
      if (memory.length > 5 && memory.length <= MAX_MEMORY_LENGTH) {
        results.push(memory);
      }
    }
  }
  const seen = new Set<string>();
  return results.filter((m) => {
    const key = normalizeMemoryText(m);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
