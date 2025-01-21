import { BrainStatus } from "@brain/types.ts";
import useBrain from "@brain/useBrain.ts";
import { Button } from "@theme";
import React from "react";

import cn from "@utils/classnames.ts";

const Listener: React.FC<{ className?: string; disabled: boolean }> = ({
  className = "",
  disabled,
}) => {
  const { status } = useBrain();
  return (
    <Button
      onClick={() => alert("todo")}
      className={cn(className)}
      color="yellow"
      disabled={disabled}
    >
      {status === BrainStatus.LISTENING ? "Listening.." : "Listen"}
    </Button>
  );
};

export default Listener;
