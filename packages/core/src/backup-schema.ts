import { z } from "zod";

const llmConfigSchema = z.object({
  provider: z.enum(["openai", "anthropic"]),
  apiKey: z.string(),
  baseUrl: z.string(),
  model: z.string(),
});

const lunaControlsSchema = z.object({
  decisionStyle: z.enum(["measured", "balanced", "decisive"]),
  personalityIntensity: z.enum(["subtle", "balanced", "sharp"]),
  responseStyle: z.enum(["concise", "balanced", "detailed"]),
  creativity: z.enum(["neutral", "moderate", "creative"]),
  clarification: z.boolean(),
  shopping: z.boolean(),
  research: z.boolean(),
  translation: z.boolean(),
});

export const nebulaBackupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  app: z.literal("nebula"),
  data: z.object({
    settings: z.object({
      llmConfig: llmConfigSchema.optional(),
      deepseekKey: z.string().optional(),
      tavilyKey: z.string().optional(),
      searchProvider: z.enum(["builtin", "tavily"]).optional(),
      webSearchEnabled: z.boolean().optional(),
      lunaControls: lunaControlsSchema,
    }),
    luna: z.object({
      conversations: z.array(z.unknown()),
      memories: z.array(z.unknown()),
      activeConversationId: z.string().nullable(),
    }),
    orbit: z.object({
      tasks: z.array(z.unknown()),
      notes: z.array(z.unknown()),
      projects: z.array(z.unknown()),
    }),
    solaris: z.object({
      selectedLocation: z.unknown().nullable(),
      recentLocations: z.array(z.unknown()),
    }),
    hyperlane: z.object({
      history: z.array(z.unknown()),
    }),
  }),
});

export type NebulaBackup = z.infer<typeof nebulaBackupSchema>;
