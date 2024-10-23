import React from "react";
import { Button } from "@theme";
import cn from "@utils/classnames.ts";

const ConnectCar: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <Button
      onClick={() => alert("todo")}
      className={cn(className)}
      color="yellow"
    >
      Connect
    </Button>
  );
};

export default ConnectCar;
