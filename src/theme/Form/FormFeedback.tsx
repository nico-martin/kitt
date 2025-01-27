import { Message, MessageType } from '@theme';
import React from 'react';

import cn from '@utils/classnames.ts';

const FormFeedback: React.FC<{
  className?: string;
  feedback: string;
  type: MessageType;
}> = ({ className = '', feedback, type }) => (
  <Message className={cn(className)} type={type}>
    {feedback}
  </Message>
);

export default FormFeedback;
