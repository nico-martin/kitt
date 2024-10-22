import React from 'react';
import interpolate, { InterpolateOptions } from '@utils/interpolate.ts';

const useInterpolation = (
  inputRange: readonly number[],
  outputRange: readonly number[],
  fps: number = 30,
  options?: InterpolateOptions
): { value: number; start: () => void } => {
  const [value, setValue] = React.useState(outputRange[0]);
  const length = inputRange[inputRange.length - 1];

  const start = () => {
    let frame = 0;
    const interval = setInterval(() => {
      try {
        setValue(interpolate(frame, inputRange, outputRange, options));
      } catch (e) {
        console.error(e);
        clearInterval(interval);
      }
      frame++;
      if (frame > length) {
        clearInterval(interval);
      }
    }, 1000 / fps);
  };

  return { value, start };
};

export default useInterpolation;
