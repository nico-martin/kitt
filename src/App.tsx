import { createRoot } from "react-dom/client";
import React from "react";

import Cockpit from "./Cockpit.tsx";

const App: React.FC = () => {
  return <Cockpit />;
};

createRoot(document.getElementById("root")!).render(<App />);
