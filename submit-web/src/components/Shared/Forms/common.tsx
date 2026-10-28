import React from "react";
import type { UseFormReturn } from "react-hook-form";
import get from "lodash/get";

type FormProps = {
  children: React.ReactNode;
  methods: UseFormReturn<any>;
} & React.FormHTMLAttributes<HTMLFormElement>;

const useFormError = (methods: UseFormReturn<any>, formRef: React.RefObject<HTMLFormElement>) => {
  const { formState: { errors, isSubmitted, submitCount }, setFocus } = methods;
  const handledAttempt = React.useRef(0);

  React.useEffect(() => {
    if (!isSubmitted) { handledAttempt.current = 0; return; }
    if (!submitCount || handledAttempt.current === submitCount) return;
    handledAttempt.current = submitCount;
    const form = formRef.current;
    if (!form) return;

    // Use document order inside this form, without depending on MUI classes or picker DOM internals.
    const anchor = Array.from(form.querySelectorAll<HTMLElement>("[data-form-field], [name]"))
      .find((element) => {
        const name = element.getAttribute("data-form-field") ?? element.getAttribute("name");
        return name && get(errors, name);
      });
    const name = anchor?.getAttribute("data-form-field") ?? anchor?.getAttribute("name");
    if (!anchor || !name) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    anchor.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    const initialFocus = document.activeElement;
    const timeout = window.setTimeout(() => {
      if (document.activeElement !== initialFocus && !anchor.contains(document.activeElement)) return;
      setFocus(name, { shouldSelect: false });
      // Uploaders and other composite controls may expose a focusable element without a registered input ref.
      if (!anchor.contains(document.activeElement)) {
        anchor.querySelector<HTMLElement>('input:not([type="hidden"]):not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]')?.focus();
      }
    }, reduceMotion ? 0 : 850);
    return () => window.clearTimeout(timeout);
  }, [errors, formRef, isSubmitted, setFocus, submitCount]);
};

export default function Form({ children, methods, onKeyDown, ...props }: FormProps) {
  const formRef = React.useRef<HTMLFormElement>(null);
  useFormError(methods, formRef);

  return (
    <form
      {...props}
      ref={formRef}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        const target = event.target;
        if (event.key === "Enter" && !event.defaultPrevented && target instanceof HTMLElement &&
          (target.tagName === "INPUT" || target.closest('[role="spinbutton"]'))) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}
