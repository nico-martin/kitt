import React from "react";
import { Button } from "@theme";
import cn from "@utils/classnames.ts";
import useTranscriber from "@utils/transcriber/useTranscriber.ts";

const Listener: React.FC<{ className?: string; disabled: boolean }> = ({
  className = "",
  disabled,
}) => {
  const { isListening } = useTranscriber();
  return (
    <Button
      onClick={() => alert("todo")}
      className={cn(className)}
      color="yellow"
      disabled={disabled}
    >
      {isListening ? "Listening.." : "Listen"}
    </Button>
  );
};

export default Listener;
