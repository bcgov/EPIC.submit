import { RegistrationPageTitle } from "@/components/App/AccountRegistration/RegistrationPageTitle";
import SecondAdminForm from "@/components/App/AccountRegistration/SecondAdminForm";
import { createFileRoute } from "@tanstack/react-router";
import { Fragment } from "react/jsx-runtime";

export const Route = createFileRoute(
  "/proponent/account-registration/second-admin"
)({
  component: SecondAdmin,
});

function SecondAdmin() {
  return (
    <>
      <RegistrationPageTitle
        mainTitle="Invite a second Administrator to your account"
        subTitle={
          <Fragment>
            We recommend having at least two Regulated Party Account Administrator on your
            account. You can always add more Regulated Party Account Administrator to your
            account after your account is created.
          </Fragment>
        }
      />
      <SecondAdminForm />
    </>
  );
}
