import React from 'react';

import cn from '@utils/classnames.ts';

import { Icon } from '../index.ts';
import styles from './ShadowBox.module.css';

export enum ShadowBoxSize {
  SMALL = 'small',
  LARGE = 'large',
}

export interface Props {
  title?: string;
  subtitle?: string;
  children?: React.JSX.Element | React.JSX.Element[] | string;
  size?: ShadowBoxSize;
  className?: string;
  classNameContent?: string;
  classNameBox?: string;
  show: boolean;
  setShow: (show: boolean) => void;
  preventClose?: boolean;
  onButtonRef?: (ref: HTMLButtonElement) => void;
}

const ShadowBox: React.FC<Props> = ({
  title,
  subtitle = '',
  children,
  size = ShadowBoxSize.LARGE,
  className = '',
  classNameBox = '',
  classNameContent = '',
  show,
  setShow,
  preventClose = false,
  onButtonRef = () => {},
}) => {
  const [mounted, setMounted] = React.useState<boolean>(false);
  const [visible, setVisible] = React.useState<boolean>(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    onButtonRef(buttonRef?.current);
  }, [buttonRef, mounted]);

  React.useEffect(() => {
    if (show) {
      setMounted(true);
      window.setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
      window.setTimeout(() => setMounted(false), 150);
    }
  }, [show]);

  const onClose = () => {
    if (preventClose) {
      return;
    }
    setVisible(false);
    window.setTimeout(() => {
      setShow(false);
    }, 200);
  };

  return mounted ? (
    <div
      className={cn(className, styles.root, {
        [styles.isSmall]: size === ShadowBoxSize.SMALL,
      })}
      data-visible={visible}
    >
      <div
        className={cn(styles.shadow, {
          [styles.shadowNoPointer]: preventClose,
        })}
        onClick={onClose}
      />
      <article className={cn(styles.box, classNameBox)}>
        <header className={cn(styles.header)}>
          {title !== null && (
            <div className={styles.titleContainer}>
              <h2 className={styles.title}>{title}</h2>
              {subtitle !== '' && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
          )}{' '}
          {!preventClose && (
            <button
              className={styles.close}
              onClick={onClose}
              title="close"
              ref={buttonRef}
            >
              <Icon name="x" />
            </button>
          )}
        </header>
        <div className={cn(styles.content, classNameContent)}>{children}</div>
      </article>
    </div>
  ) : null;
};

export default ShadowBox;
