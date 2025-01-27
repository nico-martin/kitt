import React from 'react';

import cn from '@utils/classnames.ts';

import inputStyles from './Input.module.css';
import { FormElementFieldTextarea } from './types.ts';

export interface FieldTextarea {
  type: 'textarea';
}

const InputTextarea: React.FC<FormElementFieldTextarea> = ({
  name,
  value,
  onChange,
}) => (
  <textarea
    value={value}
    name={name}
    className={cn(inputStyles.input, inputStyles.textarea)}
    id={name}
    onChange={(e) => onChange(e.target.value)}
  />
);

export default InputTextarea;
