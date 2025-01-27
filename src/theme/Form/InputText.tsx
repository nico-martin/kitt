import React from 'react';

import cn from '@utils/classnames.ts';

import inputStyles from './Input.module.css';
import { FormElementFieldText } from './types.ts';

export interface FieldText {
  type: 'text';
  inputType?:
    | 'text'
    | 'color'
    | 'email'
    | 'hidden'
    | 'month'
    | 'number'
    | 'password'
    | 'search'
    | 'tel'
    | 'time'
    | 'url'
    | 'week';
  ref?: React.RefObject<HTMLInputElement>;
}

const InputText: React.FC<FormElementFieldText> = ({
  name,
  value,
  inputType = 'text',
  onChange,
  ref = null,
}) => (
  <input
    value={value}
    ref={ref}
    name={name}
    className={cn(inputStyles.input)}
    id={name}
    type={inputType}
    onChange={(e) => onChange(e.target.value)}
  />
);

export default InputText;
