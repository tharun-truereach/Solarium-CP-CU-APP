/**
 * Example lazy-loaded component to demonstrate code splitting
 * This component will be loaded only when needed
 */
import React from 'react';

const LazyExample: React.FC = () => {
  return (
    <div className="lazy-example-page">
      <div className="lazy-example-content">
        <h1>Lazy Loaded Component</h1>
        <p>
          This component was loaded dynamically using React.lazy() and Suspense.
          It demonstrates code splitting functionality in the routing system.
        </p>
        <div className="lazy-example-info">
          <h3>Benefits of Lazy Loading:</h3>
          <ul>
            <li>Reduced initial bundle size</li>
            <li>Faster initial page load</li>
            <li>Components loaded on-demand</li>
            <li>Better performance for large applications</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LazyExample;
