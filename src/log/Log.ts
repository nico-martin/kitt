import { LogEntry } from "./types.ts";

class Log extends EventTarget {
  private _log: Array<LogEntry> = [];
  private persist: boolean;

  constructor(persist: boolean = false) {
    super();
    this.persist = persist;
    this._log = this.persist
      ? JSON.parse(window.localStorage.getItem("log") || "[]")
      : [];
  }

  public get log() {
    return this._log;
  }

  public addEntry = (entry: Partial<LogEntry>) => {
    this._log.push({
      type: "info",
      category: "misc",
      title: "",
      message: [],
      timestamp: new Date(),
      ...entry,
    });
    this.persist &&
      window.localStorage.setItem("log", JSON.stringify(this._log));
    this.dispatchEvent(new Event("logChange"));
  };

  public onLogChange = (callback: (log: Array<LogEntry>) => void) => {
    const listener = () => {
      callback(this.log);
    };
    this.addEventListener("logChange", listener);
    return () => this.removeEventListener("logChange", listener);
  };
}

export default Log;
