import React from "react";

import { BrainContextI, BrainStatus } from "./types.ts";

const BrainContext = React.createContext<BrainContextI>({
  status: BrainStatus.IDLE,
  ready: false,
  brain: null,
});

export default BrainContext;
