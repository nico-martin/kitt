import React from "react";

const NavLink: React.FC<{
  to: string;
  children?: React.ReactElement | string | Array<React.ReactElement | string>;
  [key: string]: any;
}> = ({ children, to, ...props }) => (
  <a href={`#${to}`} {...props}>
    {children}
  </a>
);

export default NavLink;
