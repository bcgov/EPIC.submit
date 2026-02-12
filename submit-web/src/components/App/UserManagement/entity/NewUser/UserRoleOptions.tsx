import { SubmitRadio } from "@/components/Shared/SubmitRadio";
import { Box, IconButton, Tooltip } from "@mui/material";
import { Info } from "@mui/icons-material";
import { roleDetails, USER_MANAGEMENT_ROLE } from "@/models/Role";
import { Fragment } from "react/jsx-runtime";
import { When } from "react-if";
import { useGetAccountProjectsByAccount } from "@/hooks/api/useProjects";
import { useAccount } from "@/store/accountStore";
import { useMemo } from "react";

type UserRoleOptionsProps = {
  error: boolean;
  disabled?: boolean;
  selectionsNode?: React.ReactNode;
  selectedRole?: string;
};

export const UserRoleOptions = ({
  error = true,
  disabled = false,
  selectionsNode,
  selectedRole,
}: UserRoleOptionsProps) => {
  const { accountId } = useAccount();
  const { data: accountProjects } = useGetAccountProjectsByAccount({
    accountId,
  });

  const roleDetailOptions = useMemo<
    Record<string, { label: string; info: string }>
  >(() => {
    if (accountProjects && accountProjects.length > 1) {
      roleDetails[USER_MANAGEMENT_ROLE.PROJECT_ADMIN].label =
        "Project Administrator - All Projects";
      return roleDetails;
    }
    const { [USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN]: _, ...rest } =
      roleDetails;
    return rest;
  }, [accountProjects]);

  return (
    <>
      {Object.entries(roleDetailOptions).map(([role, { label, info }]) => (
        <Fragment key={role}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <SubmitRadio
              value={role}
              label={label}
              error={error}
              disabled={disabled}
            />
            <Tooltip title={info} arrow>
              <IconButton sx={{ p: 0, ml: -1 }}>
                <Info fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <When condition={selectedRole === role}>{selectionsNode}</When>
        </Fragment>
      ))}
    </>
  );
};
