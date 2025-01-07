import React from "react";
import { createRoot } from "react-dom/client";

import BrainContextProvider from "@utils/brain/BrainContextProvider.tsx";
import combineProvider from "@utils/combineProvider.tsx";
import LlmContextProvider from "@utils/llm/LlmContextProvider.tsx";
import TranscriberContextProvider from "@utils/transcriber/TranscriberContextProvider.tsx";
import VoiceContextProvider from "@utils/voice/VoiceContextProvider.tsx";

import Cockpit from "./Cockpit.tsx";

const Providers = combineProvider(
  LlmContextProvider,
  VoiceContextProvider,
  TranscriberContextProvider,
  BrainContextProvider
);

const App: React.FC = () => (
  <Providers>
    <Cockpit />
  </Providers>
);

createRoot(document.getElementById("root")!).render(<App />);
