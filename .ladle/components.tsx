import type { GlobalProvider } from "@ladle/react";
import React from 'react';

import "./styles.css";


export const Provider: GlobalProvider = ({ children }) => (
  <>
    {children}
  </>
);
