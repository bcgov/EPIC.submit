import { createFileRoute } from "@tanstack/react-router";
import { RegistrationPageTitle } from "@/components/App/AccountRegistration/RegistrationPageTitle";
import ContactInformationForm from "@/components/App/AccountRegistration/ContactInformationForm";
import { useCreateAccountFormStore } from "@/components/App/AccountRegistration/formStore";
import { Fragment } from "react/jsx-runtime";

export const Route = createFileRoute(
  "/proponent/account-registration/create-account"
)({
  component: CreateAccount,
});

function CreateAccount() {
  const { entityName } = useCreateAccountFormStore();

  return (
    <>
      <RegistrationPageTitle
        mainTitle="First, create your account."
        subTitle={
          <Fragment>
            Welcome to EPIC.submit. Thank you for taking a few minutes to set
            up the {entityName} account. First off, please create your Account
            as an Account Administrator of EPIC.submit for {entityName}.
            <br />
            <br />
            Account Administrators have access to all the projects associated
            with your Account in part, submit and/or manage workflows. This is
            a highly trusted role for your Account in this solution, and only
            assign where you should assure account owner control of {entityName}.
          </Fragment>
        }
      />
      <ContactInformationForm />
    </>
  );
}
