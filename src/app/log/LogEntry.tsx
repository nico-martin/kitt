import { Icon } from "@theme";
import React from "react";

import cn from "@utils/classnames.ts";

import { LogEntry as LogEntryI } from "../../log/types.ts";
import styles from "./LogEntry.module.css";

const LogEntry: React.FC<{ entry: LogEntryI; className?: string }> = ({
  entry,
  className,
}) => {
  const [detailsOpen, setDetailsOpen] = React.useState<boolean>(false);

  return (
    <div className={cn(className, styles.root)}>
      <div className={styles.details}>
        <button
          className={styles.summary}
          onClick={() => setDetailsOpen(!detailsOpen)}
        >
          <Icon name={detailsOpen ? "chevron-down" : "chevron-right"} /> [
          {entry.category}] {entry.title}{" "}
        </button>
        {detailsOpen && (
          <div className={styles.detailsContent}>
            {entry.message.map((message, i) => (
              <div className={styles.message} key={i}>
                <p className={styles.messageTitle}>{message.title}</p>
                {message.content && (
                  <code className={styles.messageContent}>
                    {typeof message.content === "string"
                      ? message.content
                      : JSON.stringify(message.content, null, "  ")}
                  </code>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogEntry;
