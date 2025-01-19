import { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import React from 'react';

import cn from '@utils/classnames.ts';

import styles from './Icon.module.css';

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: keyof typeof dynamicIconImports;
}

const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const LucideIcon = React.lazy(dynamicIconImports[name]);

  return (
    <React.Suspense fallback={null}>
      <LucideIcon {...props} className={cn(props.className, styles.icon)} />
    </React.Suspense>
  );
};

export default Icon;
