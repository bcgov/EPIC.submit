import {
  Box,
  Button,
  Table,
  TableBody,
  TableContainer,
  Stack,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { ContentBoxSkeleton } from "../../Shared/ContentBox/ContentBoxSkeleton";
import UserTableHead from "./UserTableHead";
import UserTableRow from "./UserTableRow";
import { TableBox } from "../../Shared/TableBox";
import { Add } from "@mui/icons-material";
import { useNavigate } from "@tanstack/react-router";
import { AccountUserWithRole } from "@/models/AccountUser";

export const UserTable = ({ users }: { users: AccountUserWithRole[] }) => {
  const navigate = useNavigate();

  return (
    <TableBox
      mainLabel={"User Management"}
      actionBox={
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() =>
            navigate({
              to: "/proponent/user-management/new-user",
            })
          }
        >
          Add New User
        </Button>
      }
    >
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        sx={{
          pt: BCDesignTokens.layoutPaddingMedium,
          pb: BCDesignTokens.layoutPaddingXlarge,
        }}
      >
        <TableContainer component={Box} sx={{ height: "100%" }}>
          <Table>
            <UserTableHead />
            <TableBody>
              {users.map((user) => (
                <UserTableRow key={user.id} user={user} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </TableBox>
  );
};

export const DataSkeleton = () => {
  return (
    <Stack spacing={2} direction={"column"}>
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
    </Stack>
  );
};
