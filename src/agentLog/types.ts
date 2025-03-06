export enum AgentType {
  AGENT = "Agent",
  USER = "User Query",
  FUNCTION = "Function Result",
  SYSTEM = "System Prompt",
}

export interface AgentLogEntry {
  type: AgentType;
  content: string;
  parsed?: {
    content: string;
    functions: Array<{
      name: string;
      args: Array<{ name: string; value: string | number }>;
    }>;
  };
}
