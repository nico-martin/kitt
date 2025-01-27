import React from 'react';

import cn from '@utils/classnames.ts';

import { Icon } from '../index.ts';
import styles from './Message.module.css';

export enum MessageType {
  INFO = 'info',
  ERROR = 'error',
  SUCCESS = 'success',
}

const Message: React.FC<{
  children: string | React.ReactElement;
  type?: MessageType;
  noIcon?: boolean;
  className?: string;
}> = ({
  children,
  type = MessageType.INFO,
  noIcon = false,
  className = '',
}) => (
  <div
    className={cn(styles.root, className, {
      [styles.typeError]: type === MessageType.ERROR,
      [styles.typeSuccess]: type === MessageType.SUCCESS,
    })}
  >
    {!noIcon && (
      <Icon
        className={styles.icon}
        name={
          type === MessageType.ERROR
            ? 'triangle-alert'
            : type === MessageType.SUCCESS
              ? 'check'
              : 'info'
        }
      />
    )}
    <div className={styles.bkg} />
    <div className={styles.content}>
      {typeof children === 'string' ? <p>{children}</p> : children}
    </div>
  </div>
);

export default Message;
