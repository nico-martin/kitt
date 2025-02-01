export interface LogEntry {
  type: "error" | "warn" | "info";
  category: string;
  title: string;
  message?: Array<{ title: string; content?: any }>;
  timestamp: Date;
}
