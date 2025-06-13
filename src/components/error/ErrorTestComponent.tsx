/**
 * Test component for demonstrating and testing Error Boundary functionality
 * This component should only be used in development for testing purposes
 */

import React, { useState } from 'react';

interface ErrorTestComponentProps {
  shouldError?: boolean;
}

const ErrorTestComponent: React.FC<ErrorTestComponentProps> = ({
  shouldError = false,
}) => {
  const [triggerError, setTriggerError] = useState(shouldError);

  if (triggerError) {
    // Intentionally throw an error to test Error Boundary
    throw new Error('This is a test error thrown by ErrorTestComponent');
  }

  const handleTriggerError = () => {
    setTriggerError(true);
  };

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div
      style={{
        padding: '16px',
        margin: '16px 0',
        border: '2px dashed #dc3545',
        borderRadius: '8px',
        backgroundColor: '#fff5f5',
      }}
    >
      <h3 style={{ color: '#dc3545', marginBottom: '8px' }}>
        🧪 Error Boundary Test Component (Development Only)
      </h3>
      <p style={{ marginBottom: '12px', fontSize: '0.9rem' }}>
        Click the button below to trigger an error and test the Error Boundary:
      </p>
      <button
        type="button"
        onClick={handleTriggerError}
        style={{
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Trigger Test Error
      </button>
    </div>
  );
};

export default ErrorTestComponent;
