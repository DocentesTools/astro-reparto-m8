import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DataTable } from "../src/runtime/react/default-ui/data-table.js";

const labels = {
  columns: "Columns",
  filter: "All",
  firstPage: "First page",
  lastPage: "Last page",
  nextPage: "Next page",
  page: (current: number, total: number) => `Page ${current} / ${total}`,
  previousPage: "Previous page",
  rowsPerPage: "Rows per page",
  search: "Search"
};

describe("canonical data-table selection adaptation", () => {
  it("renders first-column visible selection and actions above and below the table", () => {
    const rows = [
      { id: "group-a", name: "Group A" },
      { id: "group-b", name: "Group B" }
    ];
    const html = renderToStaticMarkup(
      <DataTable
        columns={[{ id: "name", label: "Name", value: (row) => row.name }]}
        data={rows}
        emptyLabel="No results"
        labels={labels}
        rowKey={(row) => row.id}
        rowName="group"
        searchFields={[(row) => row.name]}
        selection={{
          actions: <button type="button">Delete selected (1)</button>,
          onSelectedKeysChange: () => undefined,
          selectedKeys: new Set(["group-a"]),
          selectAllVisibleLabel: "Select all visible groups",
          selectRowLabel: (row) => `Select ${row.name}`
        }}
        tableName="groups"
      />
    );

    expect(html).toContain('data-data-table-select-all="visible"');
    expect(html).toContain('aria-checked="mixed"');
    expect(html).toContain('data-data-table-row-selection="group-a"');
    expect(html).toContain('data-data-table-row-selection="group-b"');
    expect(html.match(/data-data-table-selection-actions=/g)).toHaveLength(2);
    expect(html.match(/Delete selected \(1\)/g)).toHaveLength(2);
    expect(html.match(/class="flex justify-end py-3"/g)).toHaveLength(2);
  });
});
