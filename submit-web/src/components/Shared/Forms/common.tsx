import React from "react";
import { UseFormReturn } from "react-hook-form";

type FormProps = {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
  methods: UseFormReturn<any>;
} & React.FormHTMLAttributes<HTMLFormElement>;

const SCROLL_CONSTANTS = {
  DURATION: 800,
  OFFSET: 150, // Increased offset for better visibility
  ANIMATION_FRAME_RATE: 20,
  FOCUS_DELAY: 50,
} as const;

// Custom hook for smooth scrolling
const useSmoothScroll = () => {
  const easeInOutQuad = (
    t: number,
    b: number,
    c: number,
    d: number
  ): number => {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  };

  const scrollTo = React.useCallback((targetPosition: number) => {
    const start = window.pageYOffset;
    const change = targetPosition - start;
    let currentTime = 0;

    const animate = () => {
      currentTime += SCROLL_CONSTANTS.ANIMATION_FRAME_RATE;
      const position = easeInOutQuad(
        currentTime,
        start,
        change,
        SCROLL_CONSTANTS.DURATION
      );
      window.scrollTo(0, position);

      if (currentTime < SCROLL_CONSTANTS.DURATION) {
        window.requestAnimationFrame(animate);
      }
    };

    animate();
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
    if (!isSubmitted || Object.keys(errors).length === 0) return;

    const errorElement = document.querySelector(".Mui-error") as HTMLElement;
    if (!errorElement) return;

    const errorContainer =
      errorElement.closest(".MuiGrid-item") || errorElement;
    const rect = errorContainer.getBoundingClientRect();
    const scrollPosition =
      window.pageYOffset + rect.top - SCROLL_CONSTANTS.OFFSET;

    // Scroll to error
    smoothScrollTo(scrollPosition);

    // Focus the input after scroll completes
    const timeoutId = setTimeout(() => {
      const inputToFocus = errorElement.querySelector("input") || errorElement;
      if (inputToFocus instanceof HTMLElement) {
        inputToFocus.focus();
      }
    }, SCROLL_CONSTANTS.DURATION + SCROLL_CONSTANTS.FOCUS_DELAY);

    return () => clearTimeout(timeoutId);
  }, [isSubmitted, errors, smoothScrollTo]);
};

// Custom hook for preventing Enter key form submission
const usePreventEnterSubmit = () => {
  return React.useCallback((event: React.KeyboardEvent) => {
    if (
      event.key === "Enter" &&
      (event.target as HTMLElement).tagName === "INPUT"
    ) {
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
