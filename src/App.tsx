import { createRoot } from 'react-dom/client';
import React from 'react';
import cn from '@utils/classnames.ts';

import styles from './App.module.css';
import { Button, Kitt } from '@theme';
import Display from '@app/Display.tsx';
import useInterpolation from '@utils/hooks/useInterpolation.ts';

const App: React.FC = () => {
  const { value, start } = useInterpolation(
    [0, 20, 40, 60, 80, 100, 120],
    [0, 1, 0, 1, 0, 1, 0]
  );
  return (
    <div className={cn(styles.root)}>
      <Display className={styles.message} message={'loading..'} />
      <Kitt volume={value} />
      <Button onClick={() => start()}>Load</Button>
      <Button color="green">Load Loader </Button>
      <Button color="yellow">Load</Button>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
