import React from "react";
import { TranscriberContextI, TranscriberStatus } from "./types.ts";

const TranscriberContext = React.createContext<TranscriberContextI>({
  status: TranscriberStatus.IDLE,
  setup: () => {},
  createListener: () => ({
    start: () => {},
    end: async () => "",
  }),
});

export default TranscriberContext;
