import { createRoot } from 'react-dom/client';
import React from 'react';
import cn from '@utils/classnames.ts';

import styles from './App.module.css';
import { Button, Kitt } from '@theme';
import Display from '@app/Display.tsx';

const App: React.FC = () => {
  return (
    <div className={cn(styles.root)}>
      <Display className={styles.message} message={'loading..'} />
      <Kitt volume={0.5} />
      <Button>Load</Button>
      <Button color="green">Load Loader </Button>
      <Button color="yellow">Load</Button>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
