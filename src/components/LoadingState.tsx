/**
 * Loading state overlay with animated messages
 */

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './LoadingState.module.css';

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
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingSpinnerLarge}>◐</div>

        {message && (
          <div className={styles.loadingMessage}>{message}{dots}</div>
        )}

        {steps.length > 0 && (
          <div className={styles.loadingSteps}>
            {steps.map((step, index) => (
              <div
                key={index}
                className={clsx(styles.loadingStep, index === currentStep && styles.active, index < currentStep && styles.completed)}
              >
                {index < currentStep ? '✓' : index === currentStep ? '▸' : '○'} {step}
              </div>
            ))}
          </div>
        )}

        <div className={styles.loadingProgress}>
          <div className={styles.loadingProgressBar}></div>
        </div>
      </div>
    </div>
  );
}
