import { useCallback, useMemo, useEffect, ReactNode } from "react";
import { useRecordUserTermsOfService } from "@/hooks/api/useAccountUsers";
import { useAccount } from "@/store/accountStore";
import { useModal } from "@/components/Shared/Modals/modalStore";
import TermsModal from "@/components/Shared/Modals/TermsModal";
import { isAxiosError } from "axios";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { USER_TYPE } from "@/models/User";
import { useTermsStore } from "@/store/termsStore";

export const TermsOfServiceProvider = ({ children }: { children: ReactNode }) => {
  const {
    termsAccepted,
    setTermsAccepted,
    setVersionId,
    showTermsModalFlag,
    setShowTermsModalFlag
  } = useTermsStore();

  const account = useAccount();
  const { setOpen: setOpenModal } = useModal();

  const isProponent = account?.userType === USER_TYPE.PROPONENT;

  const isReady =
    !account.isLoading &&
    !!account?.userId &&
    isProponent &&
    account.accountId !== 0;

  const needsTermsAgreement = useMemo(() => {
    if (!isProponent || termsAccepted || showTermsModalFlag) return false;
    if (account?.hasAgreedToTerms !== undefined) {
      return !account.hasAgreedToTerms;
    }
    return true;
  }, [isProponent, termsAccepted, account?.hasAgreedToTerms, showTermsModalFlag]);

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

  const handleAgree = useCallback((acceptedVersionId: number | null) => {
    if (!showTermsModalFlag) {
      if (!account?.userManagementRole?.account_user_id || !acceptedVersionId) return;

      setVersionId(acceptedVersionId);

      recordTermsOfService({
        account_user_id: account.userManagementRole.account_user_id,
        terms_of_service_version_id: acceptedVersionId,
        has_agreed_to_terms: true,
      });
    } else {
      setTermsAccepted(true);
      setVersionId(acceptedVersionId);
      setShowTermsModalFlag(false);
    }
  },
    [
      showTermsModalFlag,
      account?.userManagementRole?.account_user_id,
      setVersionId,
      recordTermsOfService,
      setTermsAccepted,
      setShowTermsModalFlag,
    ]
  );

  useEffect(() => {
    if ((isReady && needsTermsAgreement) || showTermsModalFlag) {
      setOpenModal(
        <TermsModal
          onAgreeConfirmed={handleAgree}
          setVersionId={setVersionId}
        />
      );
    }
  }, [isReady, needsTermsAgreement, showTermsModalFlag, handleAgree, setVersionId, setOpenModal]);

  return <>{children}</>
};