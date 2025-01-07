import React from "react";

import { BrainContextI, BrainStatus } from "./types.ts";

const BrainContext = React.createContext<BrainContextI>({
  status: BrainStatus.IDLE,
});

export default BrainContext;
