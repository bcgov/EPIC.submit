import { useQuery } from "@tanstack/react-query";
import { submitRequest } from "@/utils/axiosUtils";
import { QUERY_KEY } from "./constants";
import { useState, useMemo } from "react";
import { useRecordUserTermsOfService } from "@/hooks/api/useAccountUsers";
import { USER_TYPE } from "@/models/User";
import { isAxiosError } from "axios";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useAccount } from "@/store/accountStore";

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
  const account = useAccount();
  const isReady =
    !account.isLoading && !!account?.userId && account.userType === USER_TYPE.PROPONENT && account.accountId !== 0;

  const needsTermsAgreement = useMemo(() => {
    if (!isReady) return false;
    
    return !account?.hasAgreedToTerms && !termsAccepted;
  }, [isReady, account?.hasAgreedToTerms, termsAccepted]);

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

  const handleAgree = (versionId: number | null) => {
    if (!account?.userManagementRole?.account_user_id || !versionId) return;

    recordTermsOfService({
      account_user_id: account.userManagementRole.account_user_id,
      terms_of_service_version_id: versionId,
      has_agreed_to_terms: true,
    });
  };

  return {
    isReady,
    needsTermsAgreement,
    handleAgree,
    termsAccepted,
  };
}
