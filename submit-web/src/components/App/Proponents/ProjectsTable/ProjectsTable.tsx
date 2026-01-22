import { Column, DataTable } from "@/components/Shared/DataTable";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { Project } from "@/models/Project";
import { TableProps } from "@mui/material";
import { useEffect } from "react";

type ProjectsTableProps = TableProps & {
  projects?: Project[];
  pendingProjectIds?: number[];
  isLoading?: boolean;
  isError?: boolean;
  selectedProjectsIds: (string | number)[];
  onSelectionChange: (selected: (string | number)[]) => void;
};

export const ProjectsTable = ({
  projects = [],
  pendingProjectIds = [],
  isLoading = false,
  isError = false,
  selectedProjectsIds,
  onSelectionChange,
  ...tableProps
}: ProjectsTableProps) => {
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
      data={projects}
      isLoading={isLoading}
      isError={isError}
      errorMessage="Error fetching projects"
      emptyMessage="No eligible projects at this time"
      getRowId={(row) => row.id}
      sortable={false}
      paginated={false}
      tableProps={tableProps}
      selectable
      selected={selectedProjectsIds}
      onSelectionChange={onSelectionChange}
      successfulRows={pendingProjectIds}
    />
  );
};
