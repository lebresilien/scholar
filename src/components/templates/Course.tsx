"use client";

import { Container } from '@mantine/core';
import { Box, Button } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { download, generateCsv, mkConfig } from 'export-to-csv';
import {
  MantineReactTable,
  type MRT_ColumnDef,
  type MRT_Row,
  useMantineReactTable,
} from 'mantine-react-table';
import { useState } from 'react';
import { PageContainer } from '@/components/PageContainer/PageContainer';
import { Course } from '@/services/courses/types';
import api from '@/lib/api';

const csvConfig = mkConfig({
  fieldSeparator: ',',
  decimalSeparator: '.',
  useKeysAsHeaders: true,
});

const columns: MRT_ColumnDef<Course>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 40,
  },
  {
    accessorKey: 'name',
    header: 'Nom',
    size: 120,
  },
  {
    accessorKey: 'coeff',
    header: 'Coefficient',
    size: 120,
  },
	{
    accessorKey: 'unit_id',
    header: 'unit_id',
    size: 120,
  },
	{
    accessorKey: 'description',
    header: 'Description',
    size: 120,
  }
];

type courseProps = {
	data: Course[]
}

const CourseTemplate = ({ data }: courseProps) => {

	const handleExportRows = (rows: MRT_Row<Course>[]) => {
    const rowData = rows.map((row) => row.original);
    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  };

  const handleExportData = () => {
    const csv = generateCsv(csvConfig)(data);
    download(csvConfig)(csv);
  };

	const table = useMantineReactTable({
    columns,
    data,
    enableRowSelection: true,
    columnFilterDisplayMode: 'popover',
    paginationDisplayMode: 'pages',
    positionToolbarAlertBanner: 'bottom',
    renderTopToolbarCustomActions: ({ table }) => (
      <Box
        style={{
          display: 'flex',
          gap: '16px',
          padding: '8px',
          flexWrap: 'wrap',
        }}
      >
        <Button
          color="lightblue"
          //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
          onClick={handleExportData}
          leftSection={<IconDownload />}
          variant="filled"
        >
          Export All Data
        </Button>
        <Button
          disabled={table.getPrePaginationRowModel().rows.length === 0}
          //export all rows, including from the next page, (still respects filtering and sorting)
          onClick={() =>
            handleExportRows(table.getPrePaginationRowModel().rows)
          }
          leftSection={<IconDownload />}
          variant="filled"
        >
          Export All Rows
        </Button>
        <Button
          disabled={table.getRowModel().rows.length === 0}
          //export all rows as seen on the screen (respects pagination, sorting, filtering, etc.)
          onClick={() => handleExportRows(table.getRowModel().rows)}
          leftSection={<IconDownload />}
          variant="filled"
        >
          Export Page Rows
        </Button>
        <Button
          disabled={
            !table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
          }
          //only export selected rows
          onClick={() => handleExportRows(table.getSelectedRowModel().rows)}
          leftSection={<IconDownload />}
          variant="filled"
        >
          Export Selected Rows
        </Button>
      </Box>
    ),
  });

	return (
		<PageContainer title="Courses">
			<Container fluid>
				<MantineReactTable table={table} />
			</Container>
		</PageContainer>
	)

}

export default CourseTemplate;
