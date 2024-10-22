import { createRoot } from 'react-dom/client';
import React from 'react';
import cn from '@utils/classnames.ts';

import styles from './App.module.css';
import { Button, Kitt } from '@theme';
import Display from '@app/Display.tsx';
import useInterpolation from '@utils/hooks/useInterpolation.ts';
import useWriteText from '@utils/hooks/useWriteText.ts';

const App: React.FC = () => {
  const { value, start } = useInterpolation(
    [0, 20, 40, 60, 80, 100, 120],
    [0, 1, 0, 1, 0, 1, 0]
  );
  const { value: text, start: startWriting } = useWriteText(
    'Hello world. This is a test..'
  );
  return (
    <div className={cn(styles.root)}>
      <Display className={styles.message} message={text} />
      <Kitt volume={value} />
      <Button
        onClick={() => {
          start().then(() => console.log('Done'));
        }}
      >
        Load
      </Button>
      <Button
        onClick={() => {
          startWriting().then(() => console.log('Done writing'));
        }}
        color="green"
      >
        Load Loader
      </Button>
      <Button color="yellow">Load</Button>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
