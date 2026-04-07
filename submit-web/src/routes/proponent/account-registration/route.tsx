import { EntityBanner } from "@/components/App/AccountRegistration/EntityBanner";
import { useCreateAccountFormStore } from "@/components/App/AccountRegistration/formStore";
// import SaveLaterFooter from "@/components/App/AccountRegistration/SaveLaterFooter";
import { useGetProponent } from "@/hooks/api/useProponents";
import { useAccount } from "@/store/accountStore";
import { Box } from "@mui/material";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/proponent/account-registration")({
  component: AccountRegistration,
});

function AccountRegistration() {
  const { invitation, setEntityName, completed } = useCreateAccountFormStore();
  const { data: proponent } = useGetProponent(invitation?.proponent_id ?? 0);
  const navigate = useNavigate();
  const { userId, accountId } = useAccount();

  useEffect(() => {
    if (completed) {
      navigate({ to: "/proponent/projects", replace: true });
    }
  }, [completed, navigate]);

  useEffect(() => {
    if (userId && accountId) {
      navigate({
        to: "/proponent/account-registration/registration-error",
        replace: true,
      });
    }
  }, [userId, accountId, navigate]);

  useEffect(() => {
    if (proponent) {
      setEntityName(proponent.name);
    }
  }, [proponent, setEntityName]);

  return (
    <>
      <EntityBanner />
      <Box sx={{ px: "76px", pt: "56px" }}>
        <Outlet />
      </Box>
      {/* <SaveLaterFooter /> */}
    </>
  );
}
