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
import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/PageContainer/PageContainer';
import { Course, Unit } from '@/services/courses/types';
import api from '@/lib/api';
import { useMutation } from '@tanstack/react-query';

const csvConfig = mkConfig({
  fieldSeparator: ',',
  decimalSeparator: '.',
  useKeysAsHeaders: true,
});

type courseProps = {
	data: Course[],
	additionals: Unit[]
}

const CourseTemplate = ({ data, additionals }: courseProps) => {

	const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});

	const handleExportRows = (rows: MRT_Row<Course>[]) => {
    const rowData = rows.map((row) => row.original);
    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  };

  const handleExportData = () => {
    const csv = generateCsv(csvConfig)(data);
    download(csvConfig)(csv);
  };

	const columns = useMemo<MRT_ColumnDef<Course>[]>(
		() => [
		{
			accessorKey: 'index',
			header: 'N°',
			size: 40,
		},
		{
			accessorKey: 'name',
			header: 'Nom',
			mantineEditTextInputProps: {
				type: 'email',
				required: true,
				error: validationErrors?.name,
				onFocus: () =>
					setValidationErrors({
						...validationErrors,
						name: undefined,
					}),
			}
		},
		{
			accessorKey: 'coeff',
			header: 'Coefficient',
			mantineEditTextInputProps: {
				type: 'email',
				required: true,
				error: validationErrors?.coeff,
				onFocus: () =>
					setValidationErrors({
						...validationErrors,
						coeff: undefined,
					}),
			}
		},
		{
			accessorKey: 'group.label',
			header: 'Groupe',
			editVariant: 'select',
			mantineEditSelectProps: {
				data: ['1','2'],
				error: validationErrors?.unit_id,
			},
		},
		{
			accessorKey: 'description',
			header: 'Description',
			mantineEditTextInputProps: {
				type: 'email',
				required: true,
				error: validationErrors?.description,
				onFocus: () =>
					setValidationErrors({
						...validationErrors,
						description: undefined,
					}),
			}
		},
	],
	[validationErrors],
	);

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

	 //call CREATE hook
	 const { mutateAsync: createCourse, isPending: isCreatingCourse } =
	 useCreateCourse();
 //call READ hook
 const {
	 data: fetchedUsers = [],
	 isError: isLoadingUsersError,
	 isFetching: isFetchingUsers,
	 isLoading: isLoadingUsers,
 } = useGetUsers();

	return (
		<PageContainer title="Courses">
			<Container fluid>
				<MantineReactTable table={table} />
			</Container>
		</PageContainer>
	)

}

export default CourseTemplate;

//CREATE hook (post new user to api)
function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (course: Course) => {
      //send api update request here
      await new Promise((resolve) => setTimeout(resolve, 1000)); //fake api call
      return Promise.resolve();
    },
    //client side optimistic update
    onMutate: (newCourseInfo: Course) => {
      queryClient.setQueryData(
        ['users'],
        (prevCourse: any) =>
          [
            ...prevCourse,
            {
              ...newCourseInfo,
              id: (Math.random() + 1).toString(36).substring(7),
            },
          ] as Course[],
      );
    },
    // onSettled: () => queryClient.invalidateQueries({ queryKey: ['users'] }), //refetch users after mutation, disabled for demo
  });
}
