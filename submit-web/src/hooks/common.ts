import { useFileStore } from "@/store/fileStore";
import { useMediaQuery, useTheme } from "@mui/material";
import { useEffect } from "react";

export const useIsMobile = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return isMobile;
};

// useMounted is a useEffect with empty dependencies array
export const useMounted = (callback: () => void) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(callback, []);
};

export const useHoldForPendingFiles = () => {
  const { pendingFiles } = useFileStore();
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (pendingFiles.length > 0) {
        event.preventDefault();
        alert(
          "You have unfinished uploads. If you leave this page, you will lose your uploads.",
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pendingFiles]);
};
