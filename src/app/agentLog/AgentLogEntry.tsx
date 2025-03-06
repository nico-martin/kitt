import { Icon } from "@theme";
import React from "react";

import cn from "@utils/classnames.ts";

import { AGENT_LOG_ENTRY_ICONS } from "../../agentLog/constants.ts";
import { AgentType, AgentLogEntry as Type } from "../../agentLog/types.ts";
import nl2brJsx from "../../utils/formatters/nl2brJsx.tsx";
import styles from "./AgentLogEntry.module.css";

const AgentLogEntry: React.FC<{ className?: string; entry: Type }> = ({
  className = "",
  entry,
}) => {
  const shouldCut = entry.content.length >= 1000;
  const [showMore, setShowMore] = React.useState<boolean>(false);
  const [showParsed, setShowParsed] = React.useState<boolean>(false);
  return (
    <div className={cn(className, styles.root)}>
      <div
        className={cn(
          styles.bubble,
          entry.type === AgentType.AGENT && styles.bubbleIsAgent
        )}
      >
        <div
          style={{
            maxHeight: showMore || !shouldCut ? "none" : "100px",
            overflow: "hidden",
          }}
        >
          {!entry.parsed || !showParsed ? (
            <p className={styles.bubbleContent}>
              <span className={styles.entryType}>
                <Icon
                  name={AGENT_LOG_ENTRY_ICONS[entry.type]}
                  className={styles.entryTypeIcon}
                />{" "}
                {entry.type}
              </span>
              {entry.content === "" ? (
                <i className={styles.thinking}>thinking..</i>
              ) : (
                nl2brJsx(entry.content)
              )}
            </p>
          ) : (
            <div className={styles.parsed}>
              <p>
                <span className={styles.entryType}>
                  <Icon
                    name={AGENT_LOG_ENTRY_ICONS[entry.type]}
                    className={styles.entryTypeIcon}
                  />{" "}
                  {entry.type}
                </span>
                {entry.parsed.content}
              </p>
              {entry.parsed.functions.length !== 0 && (
                <div className={styles.parsedFunctions}>
                  <p className={styles.parsedFunctionsTitle}>
                    Parsed Functions
                  </p>
                  <ul className={styles.parsedFunctionsList}>
                    {entry.parsed.functions.map((func, i) => (
                      <li key={i}>
                        {func.name}
                        <ul>
                          {func.args.map((arg, i) => (
                            <li key={i}>
                              {arg.name}: {arg.value}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <div className={styles.controls}>
          {entry.parsed && (
            <button
              className={styles.control}
              onClick={() => setShowParsed((m) => !m)}
            >
              {showParsed ? "raw" : "parsed"}
            </button>
          )}
          {shouldCut && (
            <button
              className={styles.control}
              onClick={() => setShowMore((m) => !m)}
            >
              {showMore ? "less" : "more"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentLogEntry;
