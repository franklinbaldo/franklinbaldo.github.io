// Public provider catalog only. These portals do NOT assert an active session.
// Live agent/session edges must come from separately verified observations.
export const AGENT_LANE_HEIGHT = 200;

export const agentProviders = Object.freeze([
  {
    id: "claude",
    label: "Claude",
    platform: "Anthropic",
    adapter: "Agent SDK / Managed Agents",
    documentation: "https://platform.claude.com/docs/en/cli-sdks-libraries/overview",
  },
  {
    id: "codex",
    label: "Codex",
    platform: "OpenAI",
    adapter: "Codex SDK / app-server",
    documentation: "https://developers.openai.com/blog/codex-as-a-platform",
  },
  {
    id: "antigravity",
    label: "Antigravity",
    platform: "Google",
    adapter: "Interactions API / SDK",
    documentation: "https://ai.google.dev/gemini-api/docs/antigravity-agent",
  },
  {
    id: "jules",
    label: "Jules",
    platform: "Google",
    adapter: "Jules REST API",
    documentation: "https://jules.google/docs/api/reference/",
  },
]);
