import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to the top of the page on route change
  }, [pathname, search]); // Listen for changes in the pathname and search properties

  return null;
};

export default ScrollToTop;
