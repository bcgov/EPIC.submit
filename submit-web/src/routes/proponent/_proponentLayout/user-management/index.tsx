import { PageGrid } from "@/components/Shared/PageGrid";
import { DataSkeleton, UserTable } from "@/components/UserManagement";
import { User } from "@/models/User";
import { Grid } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import { Else, If, Then } from "react-if";

export const Route = createFileRoute(
  "/proponent/_proponentLayout/user-management/"
)({
  component: UsersPage,
  meta: () => [{ title: "User Management" }],
});

function UsersPage() {
  const mockUsers: User[] = [
    {
      id: 1,
      auth_guid: "123e4567-e89b-12d3-a456-426614174000",
      type: "PROPONENT",
      account_user: {
        id: 101,
        account_id: 1001,
        first_name: "John",
        last_name: "Doe",
        full_name: "John Doe",
        position: "Software Engineer",
        work_email_address: "john.doe@example.com",
        work_contact_number: "123-456-7890",
        auth_guid: "123e4567-e89b-12d3-a456-426614174001",
        account: {
          id: 1001,
          proponent_id: 1001,
        },
      },
      staff_user: {
        id: 201,
        first_name: "John",
        last_name: "Doe",
        work_email_address: "john.doe@example.com",
        user_id: 1,
      },
    },
    {
      id: 2,
      auth_guid: "223e4567-e89b-12d3-a456-426614174000",
      type: "STAFF",
      account_user: {
        id: 102,
        account_id: 1002,
        first_name: "Jane",
        last_name: "Smith",
        full_name: "Jane Smith",
        position: "Project Manager",
        work_email_address: "jane.smith@example.com",
        work_contact_number: "987-654-3210",
        auth_guid: "223e4567-e89b-12d3-a456-426614174001",
        account: {
          id: 1002,
          proponent_id: 1001,
        },
      },
      staff_user: {
        id: 202,
        first_name: "Jane",
        last_name: "Smith",
        work_email_address: "jane.smith@example.com",
        user_id: 2,
      },
    },
  ];

  return (
    <PageGrid>
      <Grid item xs={12}>
        <If condition={false}>
          <Then>
            <DataSkeleton />
          </Then>
          <Else>
            <UserTable users={mockUsers} />
          </Else>
        </If>
      </Grid>
    </PageGrid>
  );
}
