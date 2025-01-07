import { Button } from "@theme";
import React from "react";

import { BrainStatus } from "@utils/brain/types.ts";
import useBrain from "@utils/brain/useBrain.ts";
import cn from "@utils/classnames.ts";

const Listener: React.FC<{ className?: string; disabled: boolean }> = ({
  className = "",
  disabled,
}) => {
  const { status } = useBrain();
  console.log(status);
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
