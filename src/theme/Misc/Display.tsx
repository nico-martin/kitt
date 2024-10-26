import React from "react";
import styles from "./Display.module.css";
import cn from "@utils/classnames.ts";

const Display: React.FC<{
  messages?: Array<string | React.ReactElement>;
  className?: string;
}> = ({ messages = [], className = "" }) => {
  return (
    <div className={cn(styles.root, className)}>
      <div className={cn(styles.messages)}>
        {messages.map((message, i) => (
          <p key={i}>{message}</p>
        ))}
      </div>
    </div>
  );
};

export default Display;
