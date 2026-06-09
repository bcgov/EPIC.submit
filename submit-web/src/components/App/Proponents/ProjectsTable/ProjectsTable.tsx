import { Column, DataTable } from "@/components/Shared/DataTable";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { TableProps } from "@mui/material";
import { useEffect } from "react";
import { useProponentStore, EligibilityEntry } from "@/store/proponentStore";

type ProjectsTableProps = TableProps & {
  entries?: EligibilityEntry[];
  pendingEntryIds?: string[];
  isLoading?: boolean;
  isError?: boolean;
  selectedEntryIds?: string[];
  readonly?: boolean;
};

export const ProjectsTable = ({
  entries = [],
  pendingEntryIds,
  isLoading = false,
  isError = false,
  selectedEntryIds: externalSelectedEntryIds,
  readonly = false,
  ...tableProps
}: ProjectsTableProps) => {
  // Use store for selection unless explicitly overridden (for read-only tables like OnboardedProjectsTable)
  const storeSelectedEntryIds = useProponentStore(
    (state) => state.selectedEntryIds,
  );
  const setSelectedEntryIds = useProponentStore(
    (state) => state.setSelectedEntryIds,
  );

  const selectedEntryIds =
    externalSelectedEntryIds ?? storeSelectedEntryIds;
  
  // Type-safe selection change handler
  const onEntrySelectionChange = readonly ? undefined : setSelectedEntryIds;

  useEffect(() => {
    if (isError) {
      notify.error("Error fetching projects");
    }
  }, [isError]);

  // Columns for EligibilityEntry format
  const entryColumns: Column<EligibilityEntry>[] = [
    {
      id: "name",
      label: "Projects",
      sortable: true,
      getValue: (row) => row.project_name,
    },
    {
      id: "current_work",
      label: "Current Work",
      sortable: true,
      getValue: (row) => row.current_work,
    },
    {
      id: "phase",
      label: "Phase",
      sortable: true,
      getValue: (row) => row.current_phase,
    },
  ];

  return (
    <DataTable
      columns={entryColumns}
      data={entries}
      isLoading={isLoading}
      isError={isError}
      errorMessage="Error fetching projects"
      emptyMessage="No eligible projects at this time"
      getRowId={(row) => row.id}
      sortable={false}
      paginated={false}
      tableProps={tableProps}
      selectable
      selected={selectedEntryIds}
      onSelectionChange={onEntrySelectionChange as any}
      successfulRows={pendingEntryIds}
    />
  );
};
