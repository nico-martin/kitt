import React from 'react';

import { RouterContextI } from './types';

const RouterContext = React.createContext<RouterContextI>({
  route: [],
});

export default RouterContext;
