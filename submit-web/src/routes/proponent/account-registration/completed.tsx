import RegistrationCompletedForm from "@/components/App/AccountRegistration/RegistrationCompletedForm";
import { RegistrationPageTitle } from "@/components/App/AccountRegistration/RegistrationPageTitle";
import { createFileRoute } from "@tanstack/react-router";
import { DoneRounded } from "@mui/icons-material";

export const Route = createFileRoute(
  "/proponent/account-registration/completed"
)({
  component: Completed,
});

function Completed() {
  return (
    <>
      <RegistrationPageTitle
        mainTitle="Your Account is successfully set-up"
        mainTitleExtension={<DoneRounded color="success" sx={{ fontSize: 32 }} />}
      />
      <RegistrationCompletedForm />
    </>
  );
}
