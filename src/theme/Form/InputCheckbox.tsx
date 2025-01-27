import React from 'react';

import cn from '@utils/classnames.ts';

import styles from './InputCheckbox.module.css';
import { FormElementFieldCheckbox } from './types.ts';

export interface FieldCheckbox {
  type: 'checkbox';
  indeterminate?: boolean;
}

const InputCheckbox: React.FC<FormElementFieldCheckbox> = ({
  name,
  value = false,
  className = '',
  onChange = () => ({}),
  indeterminate = false,
}) => {
  const checkboxRef = React.useRef<HTMLInputElement>(null);
  return (
    <React.Fragment>
      <input
        value="checked"
        id={name}
        name={name}
        className={cn(styles.input)}
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
        tabIndex={-1}
        ref={checkboxRef}
      />
      <span
        role="checkbox"
        aria-checked={Boolean(value)}
        aria-labelledby={`label-${name}`}
        tabIndex={0}
        onClick={() => checkboxRef.current && checkboxRef.current.click()}
        onKeyDown={(e) => {
          if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            onChange(!Boolean(value));
          }
        }}
        className={cn(className, styles.spanInput, {
          [styles.isActive]: Boolean(value),
          [styles.isIndeterminate]: !Boolean(value) && indeterminate,
        })}
      />
    </React.Fragment>
  );
};

InputCheckbox.displayName = 'InputCheckbox';

export default InputCheckbox;
