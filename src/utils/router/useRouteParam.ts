import React from "react";

import RouterContext from "./RouterContext.ts";

const useRouteParam = (param: number | Array<number>) => {
  const { route } = React.use(RouterContext);
  return Array.isArray(param)
    ? param.map((p) => route[p - 1] || null)
    : route[param - 1] || null;
};

export default useRouteParam;
