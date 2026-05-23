import { useLunaStore } from "@/stores/use-luna-store";
import { useOrbitStore } from "@/stores/use-orbit-store";
import { useSolarisStore } from "@/stores/use-solaris-store";

interface Suggestion {
  text: string;
  weight: number;
}

function getTimeContext(): {
  isMorning: boolean;
  isAfternoon: boolean;
  isEvening: boolean;
} {
  const hour = new Date().getHours();
  return {
    isMorning: hour < 12,
    isAfternoon: hour >= 12 && hour < 18,
    isEvening: hour >= 18,
  };
}

export function getWelcomeHeadline(): string {
  const { isMorning, isAfternoon } = getTimeContext();
  if (isMorning) return "Good morning";
  if (isAfternoon) return "Good afternoon";
  return "Good evening";
}

function getLocationFromMemories(memories: { text: string }[]): string | null {
  const locMem = memories.find((m) =>
    m.text.toLowerCase().startsWith("user lives in") ||
    m.text.toLowerCase().startsWith("i live in") ||
    m.text.toLowerCase().startsWith("i'm from"),
  );
  if (!locMem) return null;
  const match = locMem.text.match(/(?:lives in|live in|from)\s+(.+)/i);
  return match?.[1].trim() ?? null;
}

function getWorkFromMemories(memories: { text: string }[]): string | null {
  const workMem = memories.find((m) =>
    m.text.toLowerCase().startsWith("user works at") ||
    m.text.toLowerCase().startsWith("i work at") ||
    m.text.toLowerCase().startsWith("i work for"),
  );
  if (!workMem) return null;
  const match = workMem.text.match(/(?:works at|work at|work for)\s+(.+)/i);
  return match?.[1].trim() ?? null;
}

function getPreferencesFromMemories(memories: { text: string }[]): string[] {
  return memories
    .filter((m) =>
      m.text.toLowerCase().startsWith("user prefers") ||
      m.text.toLowerCase().startsWith("user likes") ||
      m.text.toLowerCase().startsWith("user's favorite"),
    )
    .map((m) => m.text)
    .slice(0, 3);
}

function getRecentTopics(conversations: { title: string; messages: { role: string; content: string }[] }[]): string[] {
  const topics: string[] = [];
  const recentConv = conversations.slice(0, 5);
  for (const conv of recentConv) {
    if (conv.title && conv.title !== "New chat") {
      topics.push(conv.title);
    }
    const userMsgs = conv.messages.filter((m) => m.role === "user").slice(-3);
    for (const msg of userMsgs) {
      const content = msg.content.toLowerCase();
      if (content.includes("weather")) topics.push("weather");
      if (content.includes("task") || content.includes("todo")) topics.push("tasks");
      if (content.includes("note")) topics.push("notes");
      if (content.includes("url") || content.includes("link") || content.includes("shorten")) topics.push("links");
      if (content.includes("project")) topics.push("projects");
    }
  }
  return [...new Set(topics)].slice(0, 4);
}

export function generateSuggestions(): string[] {
  const { memories, conversations } = useLunaStore.getState();
  const { tasks } = useOrbitStore.getState();
  const { selectedLocation } = useSolarisStore.getState();
  const { isMorning, isAfternoon, isEvening } = getTimeContext();

  const candidates: Suggestion[] = [];
  const location = getLocationFromMemories(memories) || selectedLocation?.name;
  const work = getWorkFromMemories(memories);
  const preferences = getPreferencesFromMemories(memories);
  const recentTopics = getRecentTopics(conversations);
  const pendingTasks = tasks.filter((t) => !t.completed);

  // Time-of-day prompts to send Luna (not self-greetings)
  if (isMorning) {
    candidates.push({ text: "What should I focus on today?", weight: 7 });
  } else if (isAfternoon) {
    candidates.push({ text: "What should I tackle next?", weight: 6 });
  } else if (isEvening) {
    candidates.push({ text: "Help me wrap up my day", weight: 6 });
  }

  // Weather based on location
  if (location) {
    candidates.push({ text: `What's the weather in ${location}?`, weight: 9 });
  } else {
    candidates.push({ text: "What's the weather like today?", weight: 4 });
  }

  // Pending tasks
  if (pendingTasks.length > 0) {
    const nextTask = pendingTasks[0];
    candidates.push({
      text: `Mark "${nextTask.title}" as done`,
      weight: 9,
    });
    candidates.push({
      text: `Show my pending tasks`,
      weight: 7,
    });
  } else {
    candidates.push({ text: "Add a task for tomorrow", weight: 5 });
  }

  // Work-related
  if (work) {
    candidates.push({
      text: `Add a work note about ${work}`,
      weight: 6,
    });
  }

  // Preferences
  for (const pref of preferences) {
    const short = pref.replace(/^User (?:prefers|likes|')/i, "").trim();
    if (short.length > 3 && short.length < 50) {
      candidates.push({
        text: `Tell me more about ${short}`,
        weight: 6,
      });
    }
  }

  // Recent topics follow-up
  for (const topic of recentTopics) {
    if (topic === "weather") {
      if (location) {
        candidates.push({ text: `Weather forecast for ${location}`, weight: 7 });
      }
    } else if (topic === "tasks" || topic === "todo") {
      candidates.push({ text: "What tasks do I have this week?", weight: 7 });
    } else if (topic === "notes") {
      candidates.push({ text: "Show my recent notes", weight: 6 });
    } else if (topic === "links") {
      candidates.push({ text: "Shorten a URL for me", weight: 6 });
    } else if (topic === "projects") {
      candidates.push({ text: "List my projects", weight: 6 });
    } else if (topic.length > 3 && topic.length < 40) {
      candidates.push({ text: `Continue talking about ${topic}`, weight: 5 });
    }
  }

  // Morning/evening contextual
  if (isMorning) {
    candidates.push({ text: "What's on my schedule today?", weight: 6 });
  }
  if (isEvening) {
    candidates.push({ text: "Summarize my day", weight: 6 });
  }

  // Generic but useful fallbacks (lower weight)
  const fallbacks: Suggestion[] = [
    { text: "What can you help me with?", weight: 2 },
    { text: "Add a quick task", weight: 3 },
    { text: "Shorten this URL for me", weight: 2 },
    { text: "Help me plan my week", weight: 3 },
    { text: "Create a new project", weight: 2 },
    { text: "Write a note", weight: 2 },
  ];

  // Merge and deduplicate
  const seen = new Set<string>();
  const all = [...candidates, ...fallbacks]
    .filter((c) => {
      const key = c.text.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.weight - a.weight);

  // Pick top 4, or pad with fallbacks if needed
  const result = all.slice(0, 4).map((c) => c.text);
  while (result.length < 4) {
    const fb = fallbacks.find((f) => !result.includes(f.text));
    if (fb) result.push(fb.text);
    else break;
  }

  return result;
}
