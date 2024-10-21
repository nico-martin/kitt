import React from 'react';
import styles from './Display.module.css';
import cn from '@utils/classnames.ts';

const Display: React.FC<{ message?: string; className?: string }> = ({
  message = '',
  className = '',
}) => {
  return (
    <div className={cn(styles.root, className)}>
      <p className={cn(styles.message)}>{message}</p>
    </div>
  );
};

export default Display;
