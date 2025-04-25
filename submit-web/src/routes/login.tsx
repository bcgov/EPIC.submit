import { LoginOptions } from "@/components/Login/LoginOptions";
import { PageGrid } from "@/components/Shared/PageGrid";
import { PageLoader } from "@/components/Shared/PageLoader";
import { useAccount } from "@/store/accountStore";
import { OidcConfig } from "@/utils/config";
import { Grid } from "@mui/material";
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/login")({
  component: Login,
  validateSearch: (search) => ({
    from: typeof search.from === "string" ? search.from : "",
  }),
});

export const REDIRECT = {
  proponent: "/proponent",
  staff: "/staff",
};

function Login() {
  const { signinRedirect, isAuthenticated } = useAuth();
  const { reset } = useAccount();
  const navigate = useNavigate();
  const { from } = useSearch({
    from: "/login",
  });
  useEffect(() => {
    if (!isAuthenticated) {
      if (from === REDIRECT.staff) {
        signinRedirect({
          redirect_uri: `${OidcConfig.redirect_uri}`,
          extraQueryParams: {
            kc_idp_hint: OidcConfig.kc_idp_hint,
          },
        });
      } else if (from !== REDIRECT.proponent) {
        navigate({
          to: "/logout",
        });
        reset();
      }
    } else {
      navigate({
        to: "/oidc-callback",
      });
    }
  }, [isAuthenticated, navigate, signinRedirect]);

  if (!isAuthenticated && from !== REDIRECT.staff) {
    return (
      <PageGrid>
        <Grid item xs={12}>
          <LoginOptions />
        </Grid>
      </PageGrid>
    );
  }

  return <PageLoader />;
}
