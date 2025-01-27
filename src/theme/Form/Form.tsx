import React from 'react';

import cn from '@utils/classnames.ts';

import styles from './Form.module.css';

const Form: React.FC<{
  className?: string;
  children?: React.ReactElement | string | Array<React.ReactElement | string>;
  onSubmit?: Function;
  ref?: React.RefObject<HTMLFormElement>;
  [key: string]: any;
}> = ({ className = '', children, onSubmit = () => {}, ref, ...props }) => (
  <form
    className={cn(className, styles.form)}
    onSubmit={(data) => onSubmit(data)}
    ref={ref}
    {...props}
  >
    {children}
  </form>
);

export default Form;
