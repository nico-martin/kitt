import { AgentLogEntry } from "./types.ts";

class AgentLog extends EventTarget {
  private _log: Array<AgentLogEntry> = [
    /*{
      type: AgentType.SYSTEM,
      content: "Your are great",
    },
    {
      type: AgentType.USER,
      content: "Hello, how are you?",
    },
    {
      type: AgentType.AGENT,
      content:
        "I'm doing well, thank you. How can I help you today? I'm doing well, thank you. How can I help you today? I'm doing well, thank you. How can I help you today? I'm doing well, thank you. How can I help you today? I'm doing well, thank you. How can I help you today? I'm doing well, thank you. How can I help you today? I'm doing well, thank you. How can I help you today? I'm doing well, thank you. How can I help you today? I'm doing well, thank you. How can I help you today? I'm doing well, thank you. How can I help you today? I'm doing well, thank you. How can I help you today? I'm doing well, thank you. How can I help you today? v I'm doing well, thank you. How can I help you today? I'm doing well, thank you. How can I help you today? I'm doing well, thank you. How can I help you today? I'm doing well, thank you. How can I help you today? I'm doing well, thank you. How can I help you today? I'm doing well, thank you. How can I help you today?I'm doing well, thank you. How can I help you today?I'm doing well, thank you. How can I help you today?I'm doing well, thank you. How can I help you today?I'm doing well, thank you. How can I help you today?I'm doing well, thank you. How can I help you today?I'm doing well, thank you. How can I help you today?I'm doing well, thank you. How can I help you today?I'm doing well, thank you. How can I help you today?I'm doing well, thank you. How can I help you today?I'm doing well, thank you. How can I help you today?I'm doing well, thank you. How can I help you today?I'm doing well, thank you. How can I help you today?",
      parsed: {
        content: "I'm doing well, thank you. How can I help you today?",
        functions: [
          {
            name: "searchContent",
            args: [{ name: "query", value: "I need help with my computer." }],
          },
        ],
      },
    },
    {
      type: AgentType.FUNCTION,
      content: "I need help with my computer.",
    },
    {
      type: AgentType.AGENT,
      content: "",
    },*/
  ];

  constructor() {
    super();
  }

  public get log() {
    return this._log;
  }

  public set log(value: Array<AgentLogEntry>) {
    this._log = value;
    this.dispatchEvent(new Event("logChange"));
  }

  public addEntry = (entry: AgentLogEntry): number => {
    this.log = [...this.log, entry];
    return this.log.length - 1;
  };

  public updateEntry = (index: number, entry: Partial<AgentLogEntry>) => {
    this.log = this.log.map((e, i) => (i === index ? { ...e, ...entry } : e));
  };

  public onLogChange = (callback: (log: Array<AgentLogEntry>) => void) => {
    const listener = () => {
      callback(this.log);
    };
    this.addEventListener("logChange", listener);
    return () => this.removeEventListener("logChange", listener);
  };

  public clearLog = () => {
    this.log = [];
  };
}

export default AgentLog;
