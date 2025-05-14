import { Dialog, DialogActions, DialogContent, Button, Box } from "@mui/material";
import { useRef, useState } from "react";
import { useTermsOfServiceData } from "@/hooks/api/useTermsOfService";
import { useModal } from "./modalStore";

type TermsModalProps = {
  onAgreeConfirmed: (agreedTermsVersionId: number | null) => void;
  setVersionId?: (id: number | null) => void;
};

const TermsModal: React.FC<TermsModalProps> = ({
  onAgreeConfirmed,
  setVersionId
}) => {
  const { setClose } = useModal();
  const scrollBoxRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const { data: termsData } = useTermsOfServiceData();

  const handleScroll = () => {
    const el = scrollBoxRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAgree = () => {
    if (termsData?.version) {
      setVersionId?.(termsData.version);
      onAgreeConfirmed(termsData.version); // pass the ID directly
      setClose();
    }
  };

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
        sx={{ maxHeight: '400px', overflowY: 'auto' }}
      >
        <Box
          sx={{ typography: "body2" }}
          dangerouslySetInnerHTML={{ __html: termsData?.content || "<p>Loading...</p>" }}
        />
      </DialogContent>
      <DialogActions
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          marginRight: '10px',
        }}
      >
        <Button
          variant="contained"
          onClick={handleAgree}
          disabled={!hasScrolledToBottom}
        >
          I Agree to the Terms and Conditions
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TermsModal;
