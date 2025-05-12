import { Dialog, DialogActions, DialogContent, Button, Box } from "@mui/material";
import { useRef, useState, useEffect } from "react";
import { useTermsOfServiceData } from "@/hooks/api/useTermsOfService";

type TermsModalProps = {
  open: boolean;
  onClose: () => void;
  onAgreeConfirmed: (agreedTermsId: number | null) => void;
  settermsId?: (id: number | null) => void;
};

const TermsModal: React.FC<TermsModalProps> = ({
  open,
  onClose,
  onAgreeConfirmed,
  settermsId
}) => {
  const scrollBoxRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const { data: termsData } = useTermsOfServiceData();

  const handleScroll = () => {
    const el = scrollBoxRef.current;
if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
  setHasScrolledToBottom(true);
}
  };

  useEffect(() => {
    if (!open) {
      setHasScrolledToBottom(false);
    }
  }, [open]);

  const handleAgree = () => {
    if (termsData?.id) {
      settermsId?.(termsData.id);
      onAgreeConfirmed(termsData.id); // pass the ID directly
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
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
