import { ProponentStatusChip } from "@/components/App/ProponentStatusChip";
import { Column, DataTable } from "@/components/Shared/DataTable";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useGetAllProponents } from "@/hooks/api/useProponents";
import { Proponent } from "@/models/Proponent";
import { Link as MuiLink, TableProps } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo } from "react";
import { useProponentsHoldersTable } from "./proponentsHoldersTableStore";

export const ProponentsHoldersTable = (props: TableProps) => {
  const { searchText, statusFilters } = useProponentsHoldersTable();
  const { data = [], isPending, isError } = useGetAllProponents();
  const navigate = useNavigate();

  useEffect(() => {
    if (isError) {
      notify.error("Error fetching proponents");
    }
  }, [isError]);

  const filteredProponents = useMemo(() => {
    let filtered = data;

    if (searchText.trim()) {
      const normalizedSearch = searchText
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
      filtered = filtered.filter((proponent) =>
        proponent.name?.toLowerCase().includes(normalizedSearch),
      );
    }

    if (statusFilters.length > 0) {
      filtered = filtered.filter(
        (proponent) =>
          proponent.status && statusFilters.includes(proponent.status),
      );
    }

    return filtered;
  }, [data, searchText, statusFilters]);

  const handleViewProponent = useCallback(
    (id: number) => {
      navigate({ to: `/staff/proponents/${id}` });
    },
    [navigate],
  );

  const columns: Column<Proponent>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Entities",
        width: "50%",
        sortable: true,
        getValue: (row) => row.name,
      },
      {
        id: "status",
        label: "Status",
        width: "25%",
        sortable: false,
        renderCell: (row) => <ProponentStatusChip status={row.status} />,
      },
      {
        id: "actions",
        label: "Actions",
        width: "25%",
        sortable: false,
        renderCell: (row) => (
          <MuiLink
            component="button"
            sx={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              "&:hover": {
                textDecoration: "underline",
                cursor: "pointer",
              },
            }}
            onClick={() => handleViewProponent(row.id)}
          >
            View Proponent Information
          </MuiLink>
        ),
      },
    ],
    [handleViewProponent],
  );

  return (
    <DataTable
      columns={columns}
      data={filteredProponents}
      isLoading={isPending}
      isError={isError}
      errorMessage="Error fetching proponents"
      emptyMessage="No proponents/holders found"
      getRowId={(row) => row.id}
      defaultSortKey="name"
      defaultSortOrder="asc"
      tableProps={props}
    />
  );
};
