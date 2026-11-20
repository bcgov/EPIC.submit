import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Column, DataTable } from "./DataTable";

type Row = { id: number; name: string };

const columns: Column<Row>[] = [
  { id: "name", label: "Name", getValue: (row) => row.name },
];

const makeRows = (count: number): Row[] =>
  Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));

describe("DataTable", () => {
  it("renders only the data rows when there are fewer rows than the page size", () => {
    render(
      <DataTable columns={columns} data={makeRows(3)} getRowId={(r) => r.id} />,
    );

    // 1 header row + 3 data rows, with no filler row padding the table out
    // to the full page size.
    expect(screen.getAllByRole("row")).toHaveLength(4);
  });

  it("renders a full page of rows when the data fills the page", () => {
    render(
      <DataTable columns={columns} data={makeRows(12)} getRowId={(r) => r.id} />,
    );

    // 1 header row + 10 data rows (default page size).
    expect(screen.getAllByRole("row")).toHaveLength(11);
  });
});
