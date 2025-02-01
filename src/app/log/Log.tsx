import LogInstance from "@log";
import React from "react";

import cn from "@utils/classnames.ts";

import styles from "./Log.module.css";
import LogEntry from "./LogEntry.tsx";

const Log: React.FC<{
  className?: string;
  toggleOpen: () => void;
}> = ({ className = "", toggleOpen }) => {
  const log = React.useSyncExternalStore(
    (cb) => LogInstance.onLogChange(cb),
    () => LogInstance.log
  );

  return (
    <div className={cn(className, styles.root)}>
      <button onClick={toggleOpen} className={styles.toggler}>
        Agent Log
      </button>
      <div className={styles.content}>
        <h2 className={styles.title}>Agent Log</h2>
        <ul className={styles.logBook}>
          {log.map((entry, i) => (
            <li key={i}>
              <LogEntry entry={entry} className={styles.entry} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Log;
