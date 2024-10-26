import React from "react";
import { Button } from "@theme";
import cn from "@utils/classnames.ts";

const ConnectCar: React.FC<{ className?: string; disabled: boolean }> = ({
  className = "",
  disabled,
}) => {
  return (
    <Button
      onClick={() => alert("todo")}
      className={cn(className)}
      color="yellow"
      disabled={disabled}
    >
      Connect
    </Button>
  );
};

export default ConnectCar;
