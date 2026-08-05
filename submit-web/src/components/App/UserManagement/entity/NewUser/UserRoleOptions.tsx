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
  excludeRoles?: string[];
};

export const UserRoleOptions = ({
  error = true,
  disabled = false,
  selectionsNode,
  selectedRole,
  excludeRoles = [],
}: UserRoleOptionsProps) => {
  const { accountId } = useAccount();
  const { data: accountProjects } = useGetAccountProjectsByAccount({
    accountId,
  });

  const roleDetailOptions = useMemo<
    Record<string, { label: string; info: string }>
  >(() => {
    let options = { ...roleDetails };

    if (accountProjects && accountProjects.length > 1) {
      roleDetails[USER_MANAGEMENT_ROLE.PROJECT_ADMIN].label =
        "Project Administrator - All Projects";
    } else {
      options = Object.fromEntries(
        Object.entries(options).filter(
          ([key]) => key !== USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN,
        ),
      ) as typeof options;
    }

    // Filter out excluded roles
    if (excludeRoles.length > 0) {
      options = Object.fromEntries(
        Object.entries(options).filter(([key]) => !excludeRoles.includes(key)),
      ) as typeof options;
    }

    return options;
  }, [accountProjects, excludeRoles]);

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
