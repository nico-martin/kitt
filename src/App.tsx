import React from "react";
import { createRoot } from "react-dom/client";

import BrainContextProvider from "@utils/brain/BrainContextProvider.tsx";
import combineProvider from "@utils/combineProvider.tsx";
import LlmContextProvider from "@utils/llm/LlmContextProvider.tsx";
import RouterContextProvider from "@utils/router/RouterContextProvider.tsx";
import useRouteParam from "@utils/router/useRouteParam.ts";
import TranscriberContextProvider from "@utils/transcriber/TranscriberContextProvider.tsx";
import VoiceContextProvider from "@utils/voice/VoiceContextProvider.tsx";

import Cockpit from "./Cockpit.tsx";
import Parser from "./parser/Parser.tsx";

const Providers = combineProvider(
  RouterContextProvider,
  LlmContextProvider,
  VoiceContextProvider,
  TranscriberContextProvider,
  BrainContextProvider
);

const Wrapper: React.FC = () => (
  <Providers>
    <App />
  </Providers>
);

const App: React.FC = () => {
  const page = useRouteParam(1);
  return (
    <React.Fragment>
      {page === "parser" ? <Parser /> : <Cockpit />}
    </React.Fragment>
  );
};

createRoot(document.getElementById("root")!).render(<Wrapper />);
