import {
  Dialog,
  DialogActions,
  DialogContent,
  Button,
  Box,
} from "@mui/material";
import { useRef, useState, useEffect } from "react";
import { useTermsOfServiceData } from "@/hooks/api/useTermsOfService";
import { useModal } from "./modalStore";
import { BCDesignTokens } from "epic.theme";
import DOMPurify from "dompurify";
import "@/styles/termsStyles.scss";

type TermsModalProps = {
  onAgreeConfirmed: (agreedTermsVersionId: number | null) => void;
  setVersionId?: (id: number | null) => void;
};

const TermsModal: React.FC<TermsModalProps> = ({
  onAgreeConfirmed,
  setVersionId,
}) => {
  const { setClose } = useModal();
  const scrollBoxRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const { data: termsData } = useTermsOfServiceData();
  const [showMessage, setShowMessage] = useState(false);

  const handleFakeClick = () => {
    setShowMessage(true);
  };

  const handleScroll = () => {
    const el = scrollBoxRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
      setHasScrolledToBottom(true);
    }
  };

  useEffect(() => {
    if (hasScrolledToBottom) {
      setShowMessage(false);
    }
  }, [hasScrolledToBottom]);

  const handleAgree = () => {
    if (!hasScrolledToBottom) {
      return;
    }

    if (termsData?.version) {
      setVersionId?.(termsData.version);
      onAgreeConfirmed(termsData.version); // pass the ID directly
      setClose();
    }
  };

  const sanitizedTermsContent = DOMPurify.sanitize(termsData?.content ?? "");

  return (
    <Dialog
      open
      onClose={() => {}}
      maxWidth="lg"
      fullWidth
      disableEscapeKeyDown
    >
      <DialogContent
        onScroll={handleScroll}
        ref={scrollBoxRef}
        sx={{ maxHeight: "400px", overflowY: "auto" }}
      >
        <Box
          className="terms-wrapper"
          style={{ fontFamily: BCDesignTokens.typographyFontFamiliesBcSans }}
        >
          <div
            className="content"
            dangerouslySetInnerHTML={{
              __html: sanitizedTermsContent || "<p>Loading...</p>",
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          borderTop: "1px solid",
          borderColor: "divider",
          flexDirection: "column",
          alignItems: "stretch",
          px: 3,
          py: 2,
          gap: 1.5,
        }}
      >
        <Box sx={{ position: "relative", alignSelf: "flex-end" }}>
          <Button
            variant="contained"
            onClick={handleAgree}
            disabled={!hasScrolledToBottom}
          >
            I Agree to the Terms and Conditions
          </Button>

          {!hasScrolledToBottom && (
            <Box
              onClick={handleFakeClick}
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                cursor: "not-allowed",
                zIndex: 1,
              }}
            />
          )}
        </Box>

        {showMessage && (
          <Box
            sx={{
              backgroundColor: BCDesignTokens.themeGold10,
              padding: "12px 16px",
              borderRadius: "4px",
              mt: 1,
              border: `1px solid ${BCDesignTokens.supportBorderColorWarning}`,
              fontFamily: BCDesignTokens.typographyFontFamiliesBcSans,
            }}
          >
            To continue, please read the Terms and Conditions. The agreement
            button will unlock once you scroll to the end.
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TermsModal;
