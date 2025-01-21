import React from "react";

import Brain from "./Brain.ts";
import BrainContext from "./BrainContext.ts";
import { BrainStatus } from "./types.ts";

const BrainContextProvider: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const brain = React.useMemo(() => new Brain(), []);
  const status = React.useSyncExternalStore(
    (cb) => brain.onStatusChange(cb),
    () => brain.status
  );
  const ready = React.useMemo(
    () => status !== BrainStatus.IDLE && status !== BrainStatus.WAKING_UP,
    [status]
  );

  React.useEffect(() => {
    if (ready) {
      const listener = brain.registerListeners();
      return () => listener();
    }
  }, [ready]);

  return (
    <BrainContext value={{ status, ready, brain }}>{children}</BrainContext>
  );
};

export default BrainContextProvider;
