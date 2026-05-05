import { SubmissionPackage } from "@/models/Package";
import { Box, Stack } from "@mui/material";
import PackageStatusChip from ".";

type PackageStatusChipStackProps = {
  submissionPackage: SubmissionPackage;
};
export const PackageStatusChipStack = ({
  submissionPackage,
}: PackageStatusChipStackProps) => {
  const { status } = submissionPackage;

  const filteredStatus = (status || []).filter(Boolean);

  return (
    <Box sx={{ display: "inline-block", width: "fit-content" }}>
      <Stack direction="column" spacing={1} alignItems={"flex-end"}>
        {filteredStatus.length > 0 ? (
          filteredStatus.map((value) => (
            <PackageStatusChip key={value} status={value} />
          ))
        ) : (
          <PackageStatusChip status={"CREATED"} />
        )}
      </Stack>
    </Box>
  );
};
