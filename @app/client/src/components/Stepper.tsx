import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils.ts";

export interface Step {
  title: string;
  slug: string;
}
interface StepperProps {
  steps: Step[];
  activeStep: string;
  hasLastStepValidated?: boolean;
  onClickStep?: (step: Step) => void;
}

export const Stepper = ({
  steps,
  activeStep,
  hasLastStepValidated,
  onClickStep,
}: StepperProps) => {
  const activeStepNb = steps.findIndex((step) => step.slug === activeStep);
  const handleClickStep = (step: Step) => () => {
    if (onClickStep) {
      onClickStep(step);
    }
  };

  useEffect(() => {
    const step = document.getElementById(`step-${activeStep}`);
    if (step) {
      step.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }, [activeStep]);
  return (
    <div className="overflow-auto hide-scrollbar">
      <div className={cn("flex flex-row w-full")}>
        {steps.map((step, index) => {
          const isCurrent = index === activeStepNb;
          const isLast = index === steps.length - 1;
          const isFirst = index === 0;
          const isValidated =
            index < activeStepNb ||
            (hasLastStepValidated && isLast && isCurrent);
          const isNext = index > activeStepNb;
          return (
            <div
              id={`step-${step.slug}`}
              key={step.slug}
              className={cn("flex-1 text-center")}
            >
              <div className="relative h-7 w-full">
                <div
                  className={cn(
                    "absolute rounded-r-sm h-1 top-1/2 -translate-y-1/2",
                    {
                      hidden: isFirst,
                      "bg-gray-300": isNext || (isCurrent && !isValidated),
                      "w-[calc(50%-18px)]": !isFirst && !isLast,
                      "w-[calc(100%-32px)] right-[32px]": isLast,
                      "bg-info": isValidated,
                    }
                  )}
                />
                <div
                  role="button"
                  onClick={isValidated ? handleClickStep(step) : undefined}
                  className={cn(
                    "absolute w-7 h-7 flex flex-col items-center justify-center rounded-full border-2 border-current z-10 text-xs text-center",
                    {
                      "bg-info text-white border-info cursor-pointer":
                        isValidated,
                      "text-gray-300 bg-white":
                        isNext || (isCurrent && !isValidated),
                      "left-0": isFirst,
                      "right-0": isLast,
                      "left-1/2 -translate-x-1/2": !isFirst && !isLast,
                    }
                  )}
                >
                  {isValidated ? <Check className="h-4 w-4" /> : null}
                </div>
                <div
                  className={cn(
                    "absolute h-1 rounded-l-sm top-1/2 -translate-y-1/2",
                    {
                      hidden: isLast,
                      "bg-info": isValidated,
                      "bg-gray-300": isNext || isCurrent,
                      "w-[calc(50%-18px)] left-[calc(50%+18px)]":
                        !isFirst && !isLast,
                      "w-[calc(100%-32px)] left-[32px]": isFirst,
                    }
                  )}
                />
              </div>
              <div
                className={cn("mt-2 text-sm", {
                  "text-left": isFirst,
                  "text-right": isLast,
                  "font-semibold text-black": isCurrent,
                  "text-black": isValidated,
                  "text-gray-500": isNext,
                })}
              >
                {step.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface UseStepperReturn {
  setStep: (slug: string) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  currentStep: string;
  currentStepIndex: number;
  isLastStepValidated: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useStepper = (
  steps: Step[],
  defaultStep = steps[0]
): UseStepperReturn => {
  const [currentStep, setCurrentStep] = useState(defaultStep.slug);
  const [isLastStepValidated, setIsLastStepValidated] = useState(false);

  const handleSetStep = (slug: string) => {
    setIsLastStepValidated(false);
    setCurrentStep(slug);
  };

  const handleNextStep = () => {
    const currentIndex = steps.findIndex((step) => step.slug === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].slug);
      setIsLastStepValidated(false);
    } else {
      setIsLastStepValidated(true);
    }
  };
  const handlePreviousStep = () => {
    const currentIndex = steps.findIndex((step) => step.slug === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].slug);
      setIsLastStepValidated(false);
    }
  };
  const currentStepIndex = steps.findIndex((step) => step.slug === currentStep);
  return {
    setStep: handleSetStep,
    goToNextStep: handleNextStep,
    goToPreviousStep: handlePreviousStep,
    currentStep,
    currentStepIndex,
    isLastStepValidated,
  };
};
