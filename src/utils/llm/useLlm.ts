import React from "react";

import { LlmContext } from "./LlmContext.ts";
import { LlmContextI } from "./types.ts";

const useLlm = (): LlmContextI => React.use(LlmContext);

export default useLlm;
