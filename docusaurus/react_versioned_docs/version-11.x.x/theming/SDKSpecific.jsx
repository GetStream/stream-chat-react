import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

const SDKSpecific = ({ children, name = 'angular' }) => (
  <BrowserOnly>
    {() => window.location.pathname.includes(`/sdk/${name}`) ? children : null}
  </BrowserOnly>
);

export default SDKSpecific;
