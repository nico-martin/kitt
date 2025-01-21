import BrainContextProvider from "@brain/BrainContextProvider.tsx";
import React from "react";
import { createRoot } from "react-dom/client";

import combineProvider from "@utils/combineProvider.tsx";

import Cockpit from "./Cockpit.tsx";

const Providers = combineProvider(BrainContextProvider);

const App: React.FC = () => (
  <Providers>
    <Cockpit />
  </Providers>
);

createRoot(document.getElementById("root")!).render(<App />);
