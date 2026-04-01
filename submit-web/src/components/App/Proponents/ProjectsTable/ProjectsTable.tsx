import { Column, DataTable } from "@/components/Shared/DataTable";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { Project } from "@/models/Project";
import { TableProps } from "@mui/material";
import { useEffect } from "react";
import { useProponentStore } from "@/store/proponentStore";

type ProjectsTableProps = TableProps & {
  projects?: Project[];
  pendingProjectIds?: number[];
  isLoading?: boolean;
  isError?: boolean;
  selectedProjectsIds?: (string | number)[]; // Can be overridden for read-only tables
  readonly?: boolean;
};

export const ProjectsTable = ({
  projects = [],
  pendingProjectIds = [],
  isLoading = false,
  isError = false,
  selectedProjectsIds: externalSelectedProjectsIds,
  readonly = false,
  ...tableProps
}: ProjectsTableProps) => {
  // Use store for selection unless explicitly overridden (for read-only tables like OnboardedProjectsTable)
  const storeSelectedProjectsIds = useProponentStore(
    (state) => state.selectedProjectsIds,
  );
  const setSelectedProjectsIds = useProponentStore(
    (state) => state.setSelectedProjectsIds,
  );

  const selectedProjectsIds =
    externalSelectedProjectsIds ?? storeSelectedProjectsIds;
  const onSelectionChange = readonly ? undefined : setSelectedProjectsIds;

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
      getValue: (row) => row.works?.at(-1)?.current_phase?.work_type_name,
    },
    {
      id: "phase",
      label: "Phase",
      sortable: true,
      getValue: (row) => row.works?.at(-1)?.current_phase?.display_name,
    },
  ];

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
