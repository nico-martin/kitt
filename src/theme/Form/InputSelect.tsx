import React from "react";

import cn from "@utils/classnames.ts";

import inputStyles from "./Input.module.css";
import { FormElementFieldSelect } from "./types.ts";

export interface FieldSelect {
  type: "select";
  choices?: Array<{ value: string; label: string }>;
  ref?: React.RefObject<HTMLSelectElement>;
}

const InputSelect: React.FC<FormElementFieldSelect> = ({
  name,
  onChange,
  choices = [],
  className = "",
  ref = null,
  value,
}) => (
  <select
    ref={ref}
    name={name}
    className={cn(inputStyles.input, inputStyles.select, className)}
    id={name}
    onChange={(e) => onChange(e.target.value)}
    value={value}
  >
    {choices.map(({ value, label }) => (
      <option key={value} value={value}>
        {label}
      </option>
    ))}
  </select>
);

export default InputSelect;
