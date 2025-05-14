import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRecordUserTermsOfService } from "@/hooks/api/useAccountUsers";
import { useAccount } from "@/store/accountStore";
import { useModal } from "@/components/Shared/Modals/modalStore";
import TermsModal from "@/components/Shared/Modals/TermsModal";
import { isAxiosError } from "axios";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { USER_TYPE } from "@/models/User";

type TermsContextType = {
  isReady: boolean;
  needsTermsAgreement: boolean;
  termsAccepted: boolean;
  versionId: number | null;
  setVersionId: (id: number | null) => void;
  setTermsAccepted: (accepted: boolean) => void;
  showTermsModal: () => void;
};

const TermsContext = createContext<TermsContextType | undefined>(undefined);

export const TermsOfServiceProvider = ({ children }: { children: ReactNode }) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [versionId, setVersionId] = useState<number | null>(null);
  const { setOpen: setOpenModal } = useModal();
  const account = useAccount();

  const isProponent = account?.userType === USER_TYPE.PROPONENT;

  const isReady =
    !account.isLoading &&
    !!account?.userId &&
    account.userType === USER_TYPE.PROPONENT &&
    account.accountId !== 0;

  const needsTermsAgreement = useMemo(() => {
    if (!isProponent || termsAccepted) return false;
    if (account?.hasAgreedToTerms !== undefined) {
      return !account.hasAgreedToTerms;
    }
    return true;
  }, [isProponent, termsAccepted, account?.hasAgreedToTerms]);

  const { mutate: recordTermsOfService } = useRecordUserTermsOfService({
    onSuccess: () => setTermsAccepted(true),
    onError: (error) => {
      const defaultMessage = "Failed to record terms of service";
      const errorMessage = isAxiosError(error)
        ? (error.response?.data as any)?.message ?? defaultMessage
        : defaultMessage;
      notify.error(errorMessage);
    },
  });

  const handleAgree = (acceptedVersionId: number | null) => {
    if (!account?.userManagementRole?.account_user_id || !acceptedVersionId) return;

    setVersionId(acceptedVersionId);

    recordTermsOfService({
      account_user_id: account.userManagementRole.account_user_id,
      terms_of_service_version_id: acceptedVersionId,
      has_agreed_to_terms: true,
    });
  };

  const showTermsModal = () => {
    setTermsAccepted(true);
    setOpenModal(
      <TermsModal
        onAgreeConfirmed={handleAgree}
        setVersionId={setVersionId}
      />
    );
  };

  useEffect(() => {
    if (isReady && needsTermsAgreement) {
      setOpenModal(
        <TermsModal
          onAgreeConfirmed={handleAgree}
          setVersionId={setVersionId}
        />
      );
    }
  }, [isReady, needsTermsAgreement]);

  const value = {
    isReady,
    needsTermsAgreement,
    termsAccepted,
    versionId,
    setVersionId,
    setTermsAccepted,
    showTermsModal,
  };

  return (
    <TermsContext.Provider value={value}>{children}</TermsContext.Provider>
  );
};

export const useTermsOfService = () => {
  const context = useContext(TermsContext);
  if (context === undefined) {
    throw new Error("useTermsOfService must be used within a TermsOfServiceProvider");
  }
  return context;
};
