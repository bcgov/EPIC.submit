import { EntityBanner } from "@/components/App/AccountRegistration/EntityBanner";
import { useCreateAccountFormStore } from "@/components/App/AccountRegistration/formStore";
// import SaveLaterFooter from "@/components/App/AccountRegistration/SaveLaterFooter";
import { useGetProponent } from "@/hooks/api/useProponents";
import { Box } from "@mui/material";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/proponent/account-registration")({
  component: AccountRegistration,
});

function AccountRegistration() {
  const { invitation, setEntityName } = useCreateAccountFormStore();
  const { data: proponent } = useGetProponent(invitation?.proponent_id ?? 0);

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
