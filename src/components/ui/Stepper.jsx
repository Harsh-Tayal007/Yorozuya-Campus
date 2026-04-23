import React, { useState, Children, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const stepVariants = {
  enter: (dir) => ({
    x: dir >= 0 ? '-100%' : '100%',
    opacity: 0
  }),
  center: {
    x: '0%',
    opacity: 1
  },
  exit: (dir) => ({
    x: dir >= 0 ? '50%' : '-50%',
    opacity: 0
  })
};

export function Step({ children }) {
  return <div className="px-0">{children}</div>;
}

function CheckIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
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

function StepIndicator({ step, currentStep, onClickStep, disableStepIndicators = false, renderCustom }) {
  const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete';

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) {
      onClickStep(step);
    }
  };

  // Use custom render if provided
  if (renderCustom) {
    return renderCustom({ step, currentStep, onStepClick: handleClick });
  }

  return (
    <motion.div
      onClick={handleClick}
      className={`relative outline-none focus:outline-none ${disableStepIndicators ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
      animate={status}
      initial={false}
    >
      <motion.div
        variants={{
          inactive: { 
            scale: 1, 
            backgroundColor: 'rgb(241 245 249)', // slate-100
            borderColor: 'rgb(226 232 240)', // slate-200
            color: 'rgb(148 163 184)' // slate-400
          },
          active: { 
            scale: 1, 
            backgroundColor: '#5227FF', 
            borderColor: '#5227FF',
            color: '#ffffff' 
          },
          complete: { 
            scale: 1, 
            backgroundColor: 'rgb(34 197 94)', // green-500
            borderColor: 'rgb(34 197 94)',
            color: '#ffffff' 
          }
        }}
        transition={{ duration: 0.3 }}
        className="flex h-8 w-8 items-center justify-center rounded-full font-semibold border-2"
      >
        {status === 'complete' ? (
          <CheckIcon className="h-4 w-4 text-white" />
        ) : status === 'active' ? (
          <span className="text-sm font-bold text-white">{step}</span>
        ) : (
          <span className="text-sm font-medium">{step}</span>
        )}
      </motion.div>
    </motion.div>
  );
}

function StepConnector({ isComplete }) {
  const lineVariants = {
    incomplete: { width: 0, backgroundColor: 'rgb(226 232 240)' }, // slate-200
    complete: { width: '100%', backgroundColor: '#5227FF' }
  };

  return (
    <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
      <motion.div
        className="absolute left-0 top-0 h-full"
        variants={lineVariants}
        initial={false}
        animate={isComplete ? 'complete' : 'incomplete'}
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
      transition={{ duration: 0.3, ease: 'easeInOut' }}
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
      <AnimatePresence initial={false} mode="sync" custom={direction}>
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
  hideIndicators = false,
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

  // Sync with prop if it changes
  useLayoutEffect(() => {
    if (initialStep !== currentStep) {
      setDirection(initialStep > currentStep ? 1 : -1);
      setCurrentStep(initialStep);
    }
  }, [initialStep]);

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
    <div
      className={`flex min-h-full flex-1 flex-col ${rest.className || ''}`}
      {...rest}
    >
      <div className={`mx-auto w-full ${stepCircleContainerClassName}`}>
        {!hideIndicators && (
          <div className={`${stepContainerClassName} flex w-full items-center mb-6`}>
            {stepsArray.map((_, index) => {
              const stepNumber = index + 1;
              const isNotLastStep = index < totalSteps - 1;
              return (
                <React.Fragment key={stepNumber}>
                  <StepIndicator
                    step={stepNumber}
                    disableStepIndicators={disableStepIndicators}
                    currentStep={currentStep}
                    onClickStep={clicked => {
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    }}
                    renderCustom={renderStepIndicator}
                  />
                  {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
                </React.Fragment>
              );
            })}
          </div>
        )}

        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          className={`${contentClassName}`}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {!isCompleted && (
          <div className={`${footerClassName}`}>
            <div className={`mt-6 flex ${currentStep !== 1 ? 'justify-between' : 'justify-end'}`}>
              {currentStep !== 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className={`rounded px-3 py-1.5 text-sm transition ${
                    currentStep === 1
                      ? 'pointer-events-none opacity-50 text-slate-400'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                  {...backButtonProps}
                >
                  {backButtonText}
                </button>
              )}
              <button
                type="button"
                onClick={isLastStep ? handleComplete : handleNext}
                className="flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-2 px-4 text-sm font-semibold tracking-tight text-white transition shadow-lg shadow-blue-600/25"
                {...nextButtonProps}
              >
                {isLastStep ? 'Complete' : nextButtonText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}