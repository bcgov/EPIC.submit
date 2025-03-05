import { ContentBox } from "@/components/Shared/ContentBox";
import { PageGrid } from "@/components/Shared/PageGrid";
import { EntityTable } from "@/components/UserManagement/staff/EntityTable";
import { Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/staff/_staffLayout/user-management/")({
  component: UserManagement,
});

function UserManagement() {
  return (
    <PageGrid>
      <ContentBox
        mainLabel="User Management"
        sx={{ width: "100%", height: "fit-content" }}
      >
        <Typography variant="subtitle1">
          Select a Certificate Holder and/or Exemption Holder
        </Typography>
        <EntityTable sx={{ marginTop: "2em" }} />
      </ContentBox>
    </PageGrid>
  );
}
