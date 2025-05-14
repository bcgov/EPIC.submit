import { useQuery } from "@tanstack/react-query";
import { submitRequest } from "@/utils/axiosUtils";
import { QUERY_KEY } from "./constants";
import { useState, useMemo } from "react";
import { useRecordUserTermsOfService } from "@/hooks/api/useAccountUsers";
import { USER_TYPE } from "@/models/User";
import { isAxiosError } from "axios";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useAccount } from "@/store/accountStore";
import TermsModal from "@/components/Shared/Modals/TermsModal";
import { useModal } from "@/components/Shared/Modals/modalStore";

const fetchTermsOfService = () => {
  return submitRequest({ url: "/terms-of-service" });
};

export const useTermsOfServiceData = () => {
  return useQuery({
    queryKey: [QUERY_KEY.TERMS_OF_SERVICE],
    queryFn: fetchTermsOfService,
  });
}

export function useTermsOfService() {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [versionId, setVersionId] = useState<number | null>(null);
  const { setOpen: setOpenModal } = useModal();

  const account = useAccount();

  const isProponent = account?.userType === USER_TYPE.PROPONENT;

  const isReady =
    !account.isLoading && !!account?.userId && account.userType === USER_TYPE.PROPONENT && account.accountId !== 0;

  const needsTermsAgreement = useMemo(() => {
    if (!isProponent || termsAccepted) return false;

    if (account?.hasAgreedToTerms !== undefined) {
      return !account.hasAgreedToTerms;
    }

    // If no account info yet, assume user hasn't agreed
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

  const checkAndShowTermsModal = () => {
    if (!needsTermsAgreement) return;

    setOpenModal(
      <TermsModal
        onAgreeConfirmed={handleAgree}
        setVersionId={setVersionId}
      />
    );
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

  return {
    isReady,
    needsTermsAgreement,
    termsAccepted,
    versionId,
    setVersionId,
    setTermsAccepted,
    checkAndShowTermsModal,
    showTermsModal,
  };
}
