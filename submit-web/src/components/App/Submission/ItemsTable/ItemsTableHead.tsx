import { TableHead, TableRow, Typography, Tooltip, Box } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmitTableHeadCell } from "@/components/Shared/Table/common";
import { SubmissionPackageApprovalType } from "@/models/Package";
import InfoIcon from "@mui/icons-material/Info";
import TypeASvg from "@/assets/approval_type_svgs/submission-flow-type-a.svg";
import TypeCSvg from "@/assets/approval_type_svgs/submission-flow-type-c.svg";
import { useAccount } from "@/store/accountStore";
import { USER_TYPE } from "@/models/User";

type ItemsTableHeadProps = Readonly<{
  approvalType?: SubmissionPackageApprovalType;
}>;

export default function ItemsTableHead({ approvalType }: ItemsTableHeadProps) {
  const { userType } = useAccount();
  const isStaffUser = userType === USER_TYPE.STAFF;

  const getSvgForApprovalType = () => {
    if (!approvalType) return null;
    return approvalType === SubmissionPackageApprovalType.A ? TypeASvg : TypeCSvg;
  };

  const svgSrc = getSvgForApprovalType();
  return (
    <TableHead
      sx={{
        ".MuiTableCell-root": {
          p: BCDesignTokens.layoutPaddingXsmall,
        },
      }}
    >
      <TableRow>
        <SubmitTableHeadCell width={"45%"}>
          <Typography
            variant="body2"
            sx={{
              color: BCDesignTokens.themeGray70,
              "&:hover": {
                color: "#EDEBE9",
              },
            }}
          >
            Form/Document
          </Typography>
        </SubmitTableHeadCell>
        <SubmitTableHeadCell width={"10%"} align="left">
          Uploaded by
        </SubmitTableHeadCell>
        <SubmitTableHeadCell width={"10%"} align="right" sx={{
          paddingRight: "0.5rem !important"
        }}>
          Version
        </SubmitTableHeadCell>
        <SubmitTableHeadCell width={"18%"} align="left" sx={{
          paddingLeft: "0.75rem !important"
        }}>
          Status
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          width="17%"
          align="right"
          sx={{
            paddingRight: "16px !important",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
            Actions
            {svgSrc && isStaffUser && (
              <Tooltip
                title={
                  <Box
                    component="img"
                    src={svgSrc}
                    alt={`Type ${approvalType} submission flow`}
                    sx={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                    }}
                  />
                }
                placement="bottom-end"
                arrow
                PopperProps={{
                  disablePortal: false,
                  modifiers: [
                    {
                      name: "preventOverflow",
                      options: {
                        boundary: "viewport",
                      },
                    },
                  ],
                }}
                slotProps={{
                  tooltip: {
                    sx: {
                      bgcolor: "white",
                      maxWidth: "95vw", // Increased from 90vw to 95vw
                      width: "90vw",
                      p: 1.5,
                      boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)",
                      "& .MuiTooltip-arrow": {
                        color: "white",
                      },
                    },
                  },
                }}
              >
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  <InfoIcon
                    sx={{
                      fontSize: "20px",
                      color: BCDesignTokens.surfaceColorPrimaryButtonDefault,
                      cursor: "pointer",
                      "&:hover": {
                        color: BCDesignTokens.surfaceColorPrimaryButtonHover,
                      },
                    }}
                  />
                </Box>
              </Tooltip>
            )}
          </Box>
        </SubmitTableHeadCell>
      </TableRow>
    </TableHead>
  );
}
