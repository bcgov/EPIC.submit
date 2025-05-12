import { useState, useMemo } from "react";
import { useRecordUserTermsOfService } from "@/hooks/api/useAccountUsers";
import { USER_TYPE } from "@/models/User";
import { isAxiosError } from "axios";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";

export function useTermsAgreement(data: any, isFetched: boolean) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  const isReady =
    isFetched && !!data?.userId && data.userType === USER_TYPE.PROPONENT && data.accountId !== 0;

  const needsTermsAgreement = useMemo(() => {
    if (!isReady) return false;
    
    return !Boolean(data?.hasAgreedToTerms) && !termsAccepted;
  }, [isReady, data?.hasAgreedToTerms, termsAccepted]);

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
    if (!data?.userManagementRole?.account_user_id || !versionId) return;

    recordTermsOfService({
      account_user_id: data.userManagementRole.account_user_id,
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
