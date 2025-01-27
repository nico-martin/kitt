import React from "react";
import { RegisterOptions } from "react-hook-form";

import { FieldCheckbox } from "./InputCheckbox.tsx";
import { FieldSelect } from "./InputSelect.tsx";
import { FieldText } from "./InputText.tsx";
import { FieldTextarea } from "./InputTextarea.tsx";

interface FormElementBase {
  className?: string;
  label: string;
  instructions?: string | React.ReactNode;
  instructionsFull?: string | React.ReactNode;
  name: string;
  options?: RegisterOptions;
  disabled?: boolean;
  stacked?: boolean;
}

export interface FormElementField<T = string> {
  value: T;
  onChange: (value: T) => void;
  onBlur?: (value: T) => void;
  name: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Element Types
 */

interface FormElementText extends FormElementBase, FieldText {}
interface FormElementSelect extends FormElementBase, FieldSelect {}
interface FormElementTextarea extends FormElementBase, FieldTextarea {}
interface FormElementCheckbox extends FormElementBase, FieldCheckbox {}

export type FormElementProp =
  | FormElementText
  | FormElementSelect
  | FormElementTextarea
  | FormElementCheckbox;

/**
 * Field Types
 */

export interface FormElementFieldText
  extends FormElementField<string>,
    Partial<FieldText> {}

export interface FormElementFieldSelect
  extends FormElementField<string>,
    Partial<FieldSelect> {}

export interface FormElementFieldCheckbox
  extends FormElementField<boolean>,
    Partial<FieldCheckbox> {}

export interface FormElementFieldTextarea
  extends FormElementField<string>,
    Partial<FieldTextarea> {}
