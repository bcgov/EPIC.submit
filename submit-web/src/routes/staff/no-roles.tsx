import NoRoles from "@/components/Shared/NoRoles";
import { EPIC_SUBMIT_ROLE } from "@/models/Role";
import { USER_TYPE } from "@/models/User";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/staff/no-roles")({
  component: NoRolesPage,
  beforeLoad: ({ context: { account } }) => {
    if (!account.isLoading) {
      if (account?.userType !== USER_TYPE.STAFF) {
        return redirect({
          to: "/unauthorized",
        });
      }
      if (account?.roles?.includes(EPIC_SUBMIT_ROLE.eao_view)) {
        return redirect({
          to: "/staff/projects",
        });
      }

      return redirect({
        to: "/logout",
      });
    }
  },
});

function NoRolesPage() {
  return <NoRoles />;
}
