import React from 'react';
import ReactDOM from 'react-dom';

import { ShadowBox } from '../index';
import { Props } from './ShadowBox';

const Portal = ({ children }: { children?: React.ReactElement }) =>
  ReactDOM.createPortal(children, document.querySelector('#shadowbox'));

const Modal: React.FC<Props> = (props) => (
  <Portal>
    <ShadowBox {...props} />
  </Portal>
);

export default Modal;
