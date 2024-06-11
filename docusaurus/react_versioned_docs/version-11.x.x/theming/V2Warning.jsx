import React from 'react';
import Link from '@docusaurus/Link';

const V2Warning = ({ introductionPath = '../themingv2', themingAndCSSPath }) => {
  return (
    <>
      This part of the documentation refers to the new version of the theming and customization
      system which won't work with the old system, please refer to the{' '}
      <Link to={introductionPath}>theme-v2 documentation</Link> to learn more about the new system
      or <Link to={themingAndCSSPath}>CSS and Theming</Link> if you need documentation for the old system
      (also known as v1 or version 1).
    </>
  );
};

export default V2Warning;
