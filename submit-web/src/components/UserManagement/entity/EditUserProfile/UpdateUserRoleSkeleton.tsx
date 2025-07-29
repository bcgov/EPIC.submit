import { TableBox } from "@/components/Shared/TableBox";
import { Paper, Skeleton, Stack } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export default function UpdateUserRoleSkeleton() {
  return (
    <TableBox mainLabel={"User Management"}>
      <Paper
        sx={{
          maxWidth: "1448px",
          minHeight: "500px",
          border: `1px solid ${BCDesignTokens.themeGray40}`,
          p: 3,
        }}
      >
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
        <Skeleton
          variant="rectangular"
          width="100%"
          height={80}
          sx={{ mb: 2 }}
        />
        <Skeleton variant="text" width={200} height={30} sx={{ mb: 2 }} />
        <Skeleton
          variant="rectangular"
          width="100%"
          height={40}
          sx={{ mb: 2 }}
        />
        <Skeleton variant="text" width={250} height={30} sx={{ mb: 2 }} />
        <Skeleton
          variant="rectangular"
          width="100%"
          height={60}
          sx={{ mb: 2 }}
        />
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Skeleton variant="rectangular" width={100} height={36} />
          <Skeleton variant="rectangular" width={100} height={36} />
        </Stack>
      </Paper>
    </TableBox>
  );
}
