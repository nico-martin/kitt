import React from "react";
import { Controller, useFormContext } from "react-hook-form";

import cn from "@utils/classnames.ts";

import styles from "./FormElement.module.css";
import InputSelect from "./InputSelect.tsx";
import InputText from "./InputText.tsx";
import InputTextarea from "./InputTextarea.tsx";
import { FormElementProp } from "./types.ts";

const FormElement: React.FC<FormElementProp> = ({
  className = "",
  label,
  instructions = "",
  instructionsFull = "",
  name,
  options = {},
  stacked = false,
  ...props
}) => {
  const {
    formState: { errors },
    control,
  } = useFormContext();
  const error = errors[name];

  const errorText: string = React.useMemo(() => {
    if (!error) return "";
    if (error.type === "required") {
      return `"${label}" is required`;
    }

    return error.message.toString();
  }, [error]);

  return (
    <div
      className={cn(className, styles.root, {
        [styles.rootHasError]: Boolean(errorText),
        [styles.stacked]: stacked,
      })}
    >
      {label && (
        <div className={styles.labelContainer}>
          <label htmlFor={name} id={`label-${name}`} className={styles.label}>
            {label}
            {"required" in options && "*"}
          </label>
          {Boolean(instructions) && (
            <p className={styles.instructions}>{instructions}</p>
          )}
        </div>
      )}
      <div className={styles.content}>
        <div className={styles.inputContainer}>
          <Controller
            render={({ field: { value, onChange, onBlur } }) =>
              props.type === "text" ? (
                <InputText
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  inputType={props.inputType}
                  name={name}
                  {...props}
                />
              ) : props.type === "select" ? (
                <InputSelect
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  name={name}
                  choices={props.choices}
                  {...props}
                />
              ) : props.type === "textarea" ? (
                <InputTextarea
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  name={name}
                  {...props}
                />
              ) : null
            }
            control={control}
            name={name}
            rules={options}
          />
          {Boolean(errorText) && <p className={styles.error}>{errorText}</p>}
        </div>
        {Boolean(instructionsFull) && (
          <p className={styles.instructionsFull}>{instructionsFull}</p>
        )}
      </div>
    </div>
  );
};

export default FormElement;
