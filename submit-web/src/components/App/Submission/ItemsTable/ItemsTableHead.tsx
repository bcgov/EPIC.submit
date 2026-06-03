import { TableHead, TableRow, Typography, Tooltip, Box } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmitTableHeadCell } from "@/components/Shared/Table/common";
import { SubmissionPackageApprovalType } from "@/models/Package";
import InfoIcon from "@mui/icons-material/Info";
import TypeASvg from "@/assets/approval_type_svgs/submission-flow-type-a.svg";
import TypeCSvg from "@/assets/approval_type_svgs/submission-flow-type-c.svg";

type ItemsTableHeadProps = Readonly<{
  approvalType?: SubmissionPackageApprovalType;
}>;

export default function ItemsTableHead({ approvalType }: ItemsTableHeadProps) {
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
        <SubmitTableHeadCell width={"10%"} align="right">
          Version
        </SubmitTableHeadCell>
        <SubmitTableHeadCell width={"18%"} align="center">
          Status
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          width="17%"
          align="right"
          sx={{
            paddingRight: "2% !important",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
            <Typography variant="body2">Actions</Typography>
            {svgSrc && (
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
                      maxWidth: "min(900px, 90vw)",
                      width: "900px",
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
