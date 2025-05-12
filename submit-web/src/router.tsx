import { RouterProvider } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "./store/accountStore";
import { useEffect, useState } from "react";
import { getAccountQueryOptions } from "./hooks/api/useAccounts";
import TermsModal from "@/components/Shared/Modals/TermsModal";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useRecordUserTermsOfService } from "@/hooks/api/useAccountUsers";
import { USER_TYPE } from "@/models/User";
import { isAxiosError } from "axios";

type RouterProviderWithAuthContextProps = Readonly<{
  router: any;
}>;
export default function RouterProviderWithAuthContext({
  router,
}: RouterProviderWithAuthContextProps) {
  const authentication = useAuth();
  const { data, isFetched } = useQuery(
    getAccountQueryOptions({
      guid: authentication?.user?.profile.sub,
      accessToken: authentication.user?.access_token,
    }),
  );

  const account = useAccount();
  const { setAccount } = account;

  const [termsAccepted, setTermsAccepted] = useState(false);
  const hasValidAccountData = !!data?.userId;
  const needsTermsAgreement =
    isFetched &&
    hasValidAccountData &&
    !data.agreedTerms &&
    !termsAccepted &&
    data.userType !== USER_TYPE.STAFF;

  const { mutate: recordTermsOfService } = useRecordUserTermsOfService({
    onSuccess: () => {
      setTermsAccepted(true);
    },
    onError: (error) => {
      const defaultMessage = "Failed to record terms of service";
      const errorMessage = isAxiosError(error)
        ? (error.response?.data as any)?.message ?? defaultMessage
        : defaultMessage;

      notify.error(errorMessage);
    },
  });

  useEffect(() => {
    if (isFetched) {
      router.invalidate();
      setAccount({
        ...data,
      });
    }
  }, [isFetched, data, setAccount, router]);

  useEffect(() => {
    // the `return` is important - addAccessTokenExpiring() returns a cleanup function

    return authentication.events.addAccessTokenExpiring(() => {
      // eslint-disable-next-line no-console
      console.log("AccessTokenExpiring: Refreshing token");
      authentication.signinSilent();
    });
  }, [authentication]);

  useEffect(() => {
    if (authentication.user?.expired) {
      // eslint-disable-next-line no-console
      console.log("AccessToken expired");
    }
  }, [authentication.user?.expired]);

  const handleAgree = (termsId: number | null) => {
    if (!data?.userManagementRole?.account_user_id || !termsId) return;

    recordTermsOfService({
      account_user_id: data.userManagementRole.account_user_id,
      agreed_terms_of_service_id: termsId,
      agreed_terms: true,
    });
  };

  return (
    <>
      {needsTermsAgreement && (
        <TermsModal
          open
          onClose={() => {}}
          onAgreeConfirmed={handleAgree}
        />
      )}
      {!needsTermsAgreement && (
        <RouterProvider
          router={router}
          context={{
            authentication,
            account: {
              ...account,
              ...(data ?? {}),
            },
          }}
        />
      )}
    </>
  );
}
