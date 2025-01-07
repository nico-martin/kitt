import React from 'react';

const combineProvider = (...components: Array<any>): any => {
  return components.reduce(
    (AccumulatedComponents, CurrentComponent) => {
      return ({ children }: { children: Array<React.ReactNode> }) => {
        return (
          <AccumulatedComponents>
            <CurrentComponent>{children}</CurrentComponent>
          </AccumulatedComponents>
        );
      };
    },
    ({ children }: { children: Array<React.ReactNode> }) => (
      <React.Fragment>{children}</React.Fragment>
    )
  );
};

export default combineProvider;
