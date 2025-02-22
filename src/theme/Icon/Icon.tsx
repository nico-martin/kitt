import { LucideProps } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import React from "react";

import cn from "@utils/classnames.ts";

import styles from "./Icon.module.css";

interface IconProps extends Omit<LucideProps, "ref"> {
  name: keyof typeof dynamicIconImports;
}

const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  return (
    <DynamicIcon
      name={name}
      {...props}
      className={cn(props.className, styles.icon)}
    />
  );
};

export default Icon;
