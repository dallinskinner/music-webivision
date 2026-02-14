/**
 * Loading state overlay with animated messages
 */

import { useEffect, useState } from 'react';
import './LoadingState.css';

interface LoadingStateProps {
  message?: string;
  steps?: string[];
}

const DEFAULT_MESSAGES = [
  '> SCANNING ARTIST DATABASE...',
  '> LOCATING VIDEO TRANSMISSIONS...',
  '> COMPILING BROADCAST QUEUE...',
];

export function LoadingState({ message, steps = DEFAULT_MESSAGES }: LoadingStateProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState('');

  // Cycle through loading steps
  useEffect(() => {
    if (steps.length === 0) return;

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 1500);

    return () => clearInterval(stepInterval);
  }, [steps]);

  // Animate dots
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(dotInterval);
  }, []);

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner-large">◐</div>

        {message && (
          <div className="loading-message">{message}{dots}</div>
        )}

        {steps.length > 0 && (
          <div className="loading-steps">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`loading-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              >
                {index < currentStep ? '✓' : index === currentStep ? '▸' : '○'} {step}
              </div>
            ))}
          </div>
        )}

        <div className="loading-progress">
          <div className="loading-progress-bar"></div>
        </div>
      </div>
    </div>
  );
}
