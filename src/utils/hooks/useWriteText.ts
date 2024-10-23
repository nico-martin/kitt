import React from "react";

const useWriteText = (
  text: string,
  cps: number = 20
): { value: string; start: () => Promise<void> } => {
  const [writtenText, setWrittenText] = React.useState("");
  const textLength = text.length;

  const start = (): Promise<void> =>
    new Promise((resolve) => {
      let index = 0;
      const interval = setInterval(() => {
        setWrittenText(text.slice(0, index));
        index++;
        if (index > textLength) {
          resolve();
          clearInterval(interval);
        }
      }, 1000 / cps);
    });

  return { value: writtenText, start };
};

export default useWriteText;
