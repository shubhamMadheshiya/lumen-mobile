import React from 'react';
import { AuroraCanvas, AuroraCanvasProps } from './AuroraCanvas';

export type AuroraBackgroundProps = AuroraCanvasProps;

/**
 * Aurora Background alias for AuroraCanvas with continuous breathing animation.
 */
export const AuroraBackground: React.FC<AuroraBackgroundProps> = (props) => {
  return <AuroraCanvas {...props} />;
};

export default AuroraBackground;
