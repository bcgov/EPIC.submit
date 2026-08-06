import { Stack } from "@mui/material";
import { useParams } from "@tanstack/react-router";
import { getStaffSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";
import { SUBMISSION_ITEM_TYPE, SubmissionItem } from "@/models/SubmissionItem";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SubmissionStatusChipStack } from "@/components/App/SubmissionStatusChip";
import { Case, Default, Switch } from "react-if";
import { CRStaffCell } from "./CRStaffCell";

type StaffStatusCellProps = Readonly<{ submissionItem: SubmissionItem }>;
export default function StaffStatusCell({
  submissionItem,
}: StaffStatusCellProps) {
  const { submissionPackageId } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout",
  });

  const { data: submissionPackage, isPending: isPackagePending } =
    useSuspenseQuery(
      getStaffSubmissionPackageQueryOptions({
        packageId: Number(submissionPackageId),
      }),
    );

  const { status, type } = submissionItem;

  if (isPackagePending) {
    return null;
  }

  return (
    <Stack
      mr={2}
      direction={"column"}
      alignItems={"flex-end"}
      spacing={1}
      margin={0}
    >
      <Switch>
        <Case
          condition={type.name === SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD}
        >
          <CRStaffCell
            status={status}
            packageStatus={submissionPackage.status}
            submissionItemId={submissionItem.id}
          />
        </Case>
        <Default>
          <SubmissionStatusChipStack
            status={status}
            packageStatus={submissionPackage.status}
          />
        </Default>
      </Switch>
    </Stack>
  );
}
