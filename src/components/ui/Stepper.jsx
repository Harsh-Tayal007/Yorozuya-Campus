import React, { useState, Children, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const stepVariants = {
  enter: (dir) => ({
    x: dir >= 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: {
    x: '0%',
    opacity: 1
  },
  exit: (dir) => ({
    x: dir >= 0 ? '-50%' : '50%',
    opacity: 0
  })
};

export function Step({ children }) {
  return <div className="w-full">{children}</div>;
}

function CheckIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          delay: 0.1,
          type: 'tween',
          ease: 'easeOut',
          duration: 0.3
        }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function StepIndicator({ step, currentStep, onClickStep, disableStepIndicators = false }) {
  const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete';

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) {
      onClickStep(step);
    }
  };

  return (
    <motion.div
      onClick={handleClick}
      className={`relative outline-none focus:outline-none ${disableStepIndicators ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
      animate={status}
      initial={false}
    >
      <motion.div
        variants={{
          inactive: { scale: 1, backgroundColor: 'rgba(0,0,0,0.1)', color: '#a3a3a3' },
          active: { scale: 1, backgroundColor: '#3b82f6', color: '#fff' },
          complete: { scale: 1, backgroundColor: '#10b981', color: '#fff' }
        }}
        transition={{ duration: 0.3 }}
        className="flex h-8 w-8 items-center justify-center rounded-full font-semibold text-xs transition-colors"
      >
        {status === 'complete' ? (
          <CheckIcon className="h-4 w-4 text-white" />
        ) : (
          <span>{step}</span>
        )}
      </motion.div>
    </motion.div>
  );
}

function StepConnector({ isComplete }) {
  return (
    <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded bg-slate-200 dark:bg-white/10">
      <motion.div
        className="absolute left-0 top-0 h-full bg-green-500"
        initial={false}
        animate={{ width: isComplete ? '100%' : '0%' }}
        transition={{ duration: 0.4 }}
      />
    </div>
  );
}

function SlideTransition({ children, direction, onHeightReady }) {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      onHeightReady(containerRef.current.offsetHeight);
    }
  }, [children, onHeightReady]);

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: "easeInOut" }}
      style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
    >
      {children}
    </motion.div>
  );
}

function StepContentWrapper({ isCompleted, currentStep, direction, children, className = '' }) {
  const [parentHeight, setParentHeight] = useState(0);

  return (
    <motion.div
      style={{ position: 'relative', overflow: 'hidden' }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={className}
    >
      <AnimatePresence initial={false} mode="popLayout" custom={direction}>
        {!isCompleted && (
          <SlideTransition key={currentStep} direction={direction} onHeightReady={h => setParentHeight(h)}>
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  stepCircleContainerClassName = '',
  stepContainerClassName = '',
  contentClassName = '',
  footerClassName = '',
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  disableStepIndicators = false,
  renderStepIndicator,
  onBeforeNext,
  ...rest
}) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) {
      onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = async () => {
    if (onBeforeNext) {
      const canProceed = await onBeforeNext(currentStep);
      if (!canProceed) return;
    }
    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = async () => {
    if (onBeforeNext) {
      const canProceed = await onBeforeNext(currentStep);
      if (!canProceed) return;
    }
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  return (
    <div className="w-full flex flex-col" {...rest}>
      <div className={`w-full flex items-center justify-between mb-8 ${stepContainerClassName}`}>
        {stepsArray.map((_, index) => {
          const stepNumber = index + 1;
          const isNotLastStep = index < totalSteps - 1;
          return (
            <React.Fragment key={stepNumber}>
              {renderStepIndicator ? (
                renderStepIndicator({
                  step: stepNumber,
                  currentStep,
                  onStepClick: clicked => {
                    setDirection(clicked > currentStep ? 1 : -1);
                    updateStep(clicked);
                  }
                })
              ) : (
                <StepIndicator
                  step={stepNumber}
                  disableStepIndicators={disableStepIndicators}
                  currentStep={currentStep}
                  onClickStep={clicked => {
                    setDirection(clicked > currentStep ? 1 : -1);
                    updateStep(clicked);
                  }}
                />
              )}
              {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
            </React.Fragment>
          );
        })}
      </div>

      <StepContentWrapper
        isCompleted={isCompleted}
        currentStep={currentStep}
        direction={direction}
        className={contentClassName}
      >
        {stepsArray[currentStep - 1]}
      </StepContentWrapper>

      {!isCompleted && (
        <div className={`mt-8 flex gap-3 ${currentStep !== 1 ? 'justify-between' : 'justify-end'} ${footerClassName}`}>
          {currentStep !== 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              {...backButtonProps}
            >
              {backButtonText}
            </button>
          )}
          <button
            type="button"
            onClick={isLastStep ? handleComplete : handleNext}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            {...nextButtonProps}
          >
            {isLastStep ? 'Complete' : nextButtonText}
          </button>
        </div>
      )}
    </div>
  );
}
