import React, { MouseEventHandler } from 'react';
import styles from './Button.module.css';
import cn from '@utils/classnames.ts';

interface ButtonProps {
  children?: React.JSX.Element | React.JSX.Element[] | string;
  className?: string;
  color?: 'yellow' | 'green' | 'red';
  onClick?: MouseEventHandler<HTMLButtonElement>;
  [key: string]: any;
}

const Button: React.ForwardRefExoticComponent<ButtonProps> = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ children, className, color = 'red', onClick = null, ...props }, ref) => {
  return (
    <button
      className={cn(styles.root, className, {
        [styles.colorYellow]: color === 'yellow',
        [styles.colorGreen]: color === 'green',
      })}
      ref={ref}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
