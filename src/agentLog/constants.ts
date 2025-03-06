import dynamicIconImports from "lucide-react/dynamicIconImports";

import { AgentType } from "./types.ts";

export const AGENT_LOG_ENTRY_ICONS: Record<
  AgentType,
  keyof typeof dynamicIconImports
> = {
  [AgentType.AGENT]: "bot",
  [AgentType.USER]: "user",
  [AgentType.FUNCTION]: "parentheses",
  [AgentType.SYSTEM]: "bot-message-square",
};
