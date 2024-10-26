import { createRoot } from "react-dom/client";
import React from "react";

import Cockpit from "./Cockpit.tsx";
import TranscriberContextProvider from "@utils/transcriber/TranscriberContextProvider.tsx";
import VoiceContextProvider from "@utils/voice/VoiceContextProvider.tsx";
import LlmContextProvider from "@utils/llm/LlmContextProvider.tsx";

const App: React.FC = () => {
  return (
    <LlmContextProvider>
      <VoiceContextProvider>
        <TranscriberContextProvider>
          <Cockpit />
        </TranscriberContextProvider>
      </VoiceContextProvider>
    </LlmContextProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
