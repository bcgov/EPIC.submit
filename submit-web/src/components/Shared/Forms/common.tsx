import React from "react";
import { UseFormReturn } from "react-hook-form";

type FormProps = {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
  methods: UseFormReturn<any>;
} & React.FormHTMLAttributes<HTMLFormElement>;

const SCROLL_CONSTANTS = {
  DURATION: 800,
  OFFSET: 150,
  ANIMATION_FRAME_RATE: 20,
  FOCUS_DELAY: 50,
} as const;

// Custom hook for smooth scrolling
const useSmoothScroll = () => {
  const calculateEasing = (
    elapsedTime: number,
    startPosition: number,
    distance: number,
    duration: number
  ): number => {
    const halfDuration = duration / 2;
    elapsedTime /= halfDuration;

    if (elapsedTime < 1) {
      return (distance / 2) * elapsedTime * elapsedTime + startPosition;
    }

    elapsedTime--;
    return (
      (-distance / 2) * (elapsedTime * (elapsedTime - 2) - 1) + startPosition
    );
  };

  const scrollTo = React.useCallback((targetPosition: number) => {
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let elapsedTime = 0;

    const animateScroll = () => {
      elapsedTime += SCROLL_CONSTANTS.ANIMATION_FRAME_RATE;

      const nextPosition = calculateEasing(
        elapsedTime,
        startPosition,
        distance,
        SCROLL_CONSTANTS.DURATION
      );

      window.scrollTo(0, nextPosition);

      const isAnimationComplete = elapsedTime < SCROLL_CONSTANTS.DURATION;
      if (isAnimationComplete) {
        window.requestAnimationFrame(animateScroll);
      }
    };

    animateScroll();
  }, []);

  return scrollTo;
};

// Custom hook for form error handling
const useFormError = (methods: UseFormReturn<any>) => {
  const smoothScrollTo = useSmoothScroll();
  const {
    formState: { errors, isSubmitted },
  } = methods;

  React.useEffect(() => {
    const hasErrors = Object.keys(errors).length > 0;
    if (!isSubmitted || !hasErrors) return;

    const errorElement = document.querySelector(".Mui-error") as HTMLElement;
    if (!errorElement) return;

    const errorContainer =
      errorElement.closest(".MuiGrid-item") || errorElement;
    const elementPosition = errorContainer.getBoundingClientRect();
    const scrollTarget =
      window.pageYOffset + elementPosition.top - SCROLL_CONSTANTS.OFFSET;

    // Scroll to error
    smoothScrollTo(scrollTarget);

    // Focus the input after scroll completes
    const focusTimeout = setTimeout(() => {
      const inputElement = errorElement.querySelector("input") || errorElement;
      if (inputElement instanceof HTMLElement) {
        inputElement.focus();
      }
    }, SCROLL_CONSTANTS.DURATION + SCROLL_CONSTANTS.FOCUS_DELAY);

    return () => clearTimeout(focusTimeout);
  }, [isSubmitted, errors, smoothScrollTo]);
};

// Custom hook for preventing Enter key form submission
const usePreventEnterSubmit = () => {
  return React.useCallback((event: React.KeyboardEvent) => {
    const isEnterKey = event.key === "Enter";
    const isInputElement = (event.target as HTMLElement).tagName === "INPUT";

    if (isEnterKey && isInputElement) {
      event.preventDefault();
    }
  }, []);
};

export default function Form({ children, methods, ...rest }: FormProps) {
  useFormError(methods);
  const handleKeyDown = usePreventEnterSubmit();

  return (
    <form onKeyDown={handleKeyDown} {...rest}>
      {children}
    </form>
  );
}
