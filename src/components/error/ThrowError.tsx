/**
 * Component that throws an error for testing error boundaries
 */

import React from 'react';

interface ThrowErrorProps {
  message?: string;
}

const ThrowError: React.FC<ThrowErrorProps> = ({ message = 'Test error' }) => {
  throw new Error(message);
};

export default ThrowError;
