import React from "react";
import { createRoot } from "react-dom/client";

import combineProvider from "@utils/combineProvider.tsx";

import BrainContextProvider from "@brain/BrainContextProvider.tsx";

import Cockpit from "./Cockpit.tsx";

const Providers = combineProvider(BrainContextProvider);

console.log("KITT Version", VERSION);

const App: React.FC = () => (
  <Providers>
    <Cockpit />
  </Providers>
);

createRoot(document.getElementById("root")!).render(<App />);
