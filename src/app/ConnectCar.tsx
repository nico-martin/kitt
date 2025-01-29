import useBrain from "@brain/useBrain.ts";
import { Button } from "@theme";
import React from "react";

import cn from "@utils/classnames.ts";

const ConnectCar: React.FC<{
  className?: string;
  disabled: boolean;
  connected?: boolean;
}> = ({ className = "", disabled, connected }) => {
  const { brain } = useBrain();
  return (
    <Button
      onClick={() => {
        if (connected) {
          brain.motorCortext.disconnect();
        } else {
          brain.motorCortext.connect();
        }
      }}
      className={cn(className)}
      color="yellow"
      disabled={disabled}
    >
      {connected ? "Disconnect" : "Connect"}
    </Button>
  );
};

export default ConnectCar;
