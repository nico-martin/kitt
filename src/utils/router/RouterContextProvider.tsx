import React from "react";

import RouterContext from "./RouterContext.ts";

const getHash = (): Array<string> =>
  (window.location.hash.slice(1) || "").split("/").filter(Boolean);

const RouterContextProvider: React.FC<{
  children: React.ReactElement | Array<React.ReactElement>;
}> = ({ children }) => {
  const [route, setRoute] = React.useState<Array<string>>(getHash());

  React.useEffect(() => {
    const handleHashChange = () => {
      setRoute(getHash());
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return <RouterContext value={{ route }}>{children}</RouterContext>;
};

export default RouterContextProvider;
