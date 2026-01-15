import { DataTable, Column } from "@/components/Shared/DataTable";
import { getProponentOptions } from "@/hooks/api/useProponents";
import { TableProps } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { Project } from "@/models/Project";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useSuspenseQuery } from "@tanstack/react-query";

export const ProjectsTable = (props: TableProps) => {
  const [selectedProjectsIds, setSelectedProjectsIds] = useState<(string | number)[]>([]);

  const { proponentId } = useParams({
    from: "/staff/_staffLayout/proponents/$proponentId",
  });
  
  const { data: proponent, isPending, isError } = useSuspenseQuery(
    getProponentOptions(proponentId, {
      includeProjects: true,
      // TODO: invitations will be brought out to the entity level, not project level
      includeInvitations: true,
    }),
  );

  useEffect(() => {
    if (isError) {
      notify.error("Error fetching projects");
    }
  }, [isError]);

  const columns: Column<Project>[] = [
    {
      id: "name",
      label: "Projects",
      sortable: true,
      getValue: (row) => row.name,
    },
    {
      id: "current_work",
      label: "Current Work",
      sortable: true,
      getValue: () => "not_mapped",
    },
    {
      id: "phase",
      label: "Phase",
      sortable: true,
      getValue: () => "not_mapped",
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={proponent.projects ? proponent.projects : []}
      isLoading={isPending}
      isError={isError}
      errorMessage="Error fetching projects"
      emptyMessage="No eligible projects at this time"
      getRowId={(row) => row.id}
      sortable={false}
      paginated={false}
      tableProps={props}
      selectable
      selected={selectedProjectsIds}
      onSelectionChange={setSelectedProjectsIds}
    />
  );
};
