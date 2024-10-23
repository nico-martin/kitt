import React from "react";
import styles from "./TextLoader.module.css";

const CHARACTERS = ["-", "\\", "|", "/"];

const TextLoader: React.FC<{ done?: boolean }> = ({ done = true }) => {
  const [index, setIndex] = React.useState<number>(0);

  React.useEffect(() => {
    if (done) return;
    const interval = setInterval(
      () => setIndex((prev) => (prev + 1) % CHARACTERS.length),
      100
    );
    return () => clearInterval(interval);
  }, [done]);

  return <span className={styles.font}>{done ? "_" : CHARACTERS[index]}</span>;
};

export default TextLoader;
