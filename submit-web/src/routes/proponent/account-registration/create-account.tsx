import { createFileRoute } from "@tanstack/react-router";
import { RegistrationPageTitle } from "@/components/App/AccountRegistration/RegistrationPageTitle";
import ContactInformationForm from "@/components/App/AccountRegistration/ContactInformationForm";
import { useCreateAccountFormStore } from "@/components/App/AccountRegistration/formStore";
import { TermsOfServiceProvider } from "@/components/Shared/TermsOfService";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";

export const Route = createFileRoute(
  "/proponent/account-registration/create-account"
)({
  component: CreateAccount,
});

function getSubTitle(
  entityName: string,
  roleName?: USER_MANAGEMENT_ROLE,
  isFirstTime?: boolean
): string {
  switch (roleName) {
    case USER_MANAGEMENT_ROLE.PROJECT_ADMIN:
    case USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN:
      return `Welcome to EPIC.submit. Please create your account as a Project Administrator for ${entityName}. You have full access to the projects you are assigned to, can create and submit packages to the EAO for those projects, and can manage users for those projects.`;
    case USER_MANAGEMENT_ROLE.SUBMISSION_ADMIN:
    case USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR:
      return `Welcome to EPIC.submit. Please create your account as a Collaborator for ${entityName}. You can view and contribute to the submissions you are assigned to, including uploading documents.`;
    case USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN:
    default:
      if (isFirstTime) {
        return `Welcome to EPIC.submit. Thank you for taking a few minutes to set up the ${entityName} account. Please create your account as a Regulated Party Account Administrator for ${entityName}. Regulated Party Account Administrators have full access to every project associated with the account, can create and submit packages to the EAO, and can manage all users. This is a highly trusted role, so assign it only to people who should have account-owner control of ${entityName}.`;
      }
      return `Welcome to EPIC.submit. Please create your account as a Regulated Party Account Administrator for ${entityName}. Regulated Party Account Administrators have full access to every project associated with the account, can create and submit packages to the EAO, and can manage all users.`;
  }
}

function CreateAccount() {
  const { entityName, invitation } = useCreateAccountFormStore();

  const subTitle = getSubTitle(
    entityName ?? "",
    invitation?.role?.role_name,
    invitation?.is_first_time
  );

  return (
    <>
      <RegistrationPageTitle
        mainTitle="First, create your account."
        subTitle={subTitle}
      />
      <TermsOfServiceProvider>
        <ContactInformationForm />
      </TermsOfServiceProvider>
    </>
  );
}
