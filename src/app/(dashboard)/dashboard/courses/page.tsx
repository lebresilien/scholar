'use client';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css'; //if using mantine date picker features
import 'mantine-react-table/styles.css'; //make sure MRT styles were imported in your app root (once)
import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { modals, ModalsProvider } from '@mantine/modals';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { IconDownload } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { download, generateCsv, mkConfig } from 'export-to-csv';
import {
	MantineReactTable,
  MRT_EditActionButtons,
  // createRow,
  // eslint-disable-next-line sort-imports
  type MRT_ColumnDef,
  type MRT_Row,
  type MRT_TableOptions,
  useMantineReactTable,
} from 'mantine-react-table';
import { useMemo, useState } from 'react';
import api from '@/lib/api';
import { Course, Unit} from '@/services/courses/types';

type CourseUnit = {
	state: Course[],
	additional: Unit[]
}

const csvConfig = mkConfig({
  fieldSeparator: ',',
  decimalSeparator: '.',
  useKeysAsHeaders: true,
});

const CoursePage = () => {
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});

  //call CREATE hook
  const { mutateAsync: createCourse, isPending: isCreatingCourse } =
    useCreateCourse();
  //call READ hook
  const {
    data,
    isError: isLoadingCoursesError,
    isFetching: isFetchingCourses,
    isLoading: isLoadingCourses,
  } = useGetCourses();
  //call UPDATE hook
  const { mutateAsync: updateCourse, isPending: isUpdatingCourse } = useUpdateCourse();
  //call DELETE hook
  const { mutateAsync: deleteCourse, isPending: isDeletingCourse } = useDeleteCourse();

	const handleExportRows = (rows: MRT_Row<Course>[]) => {
    const rowData = rows.map((row) => row.original);
    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  };

  const handleExportData = () => {
    const csv = generateCsv(csvConfig)(data ? data.state : []);
    download(csvConfig)(csv);
  };

	const columns = useMemo<MRT_ColumnDef<Course>[]>(
    () => [
      {
        accessorKey: 'index',
        header: 'N°',
      },
      {
        accessorKey: 'name',
        header: 'Name',
        mantineEditTextInputProps: {
          type: 'email',
          required: true,
          error: validationErrors?.name,
          //remove any previous validation errors when Course focuses on the input
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              name: undefined,
            }),
          //optionally add validation checking for onBlur or onChange
        },
      },
      {
        accessorKey: 'coeff',
        header: 'Coefficient',
        mantineEditTextInputProps: {
          type: 'email',
          required: true,
          error: validationErrors?.coeff,
          //remove any previous validation errors when Course focuses on the input
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              coeff: undefined,
            }),
        },
      },
      {
        accessorKey: 'description',
        header: 'Description',
        mantineEditTextInputProps: {
          type: 'email',
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              description: undefined,
            }),
        },
      },
      {
        accessorKey: 'group.label',
        header: 'Groupe',
        editVariant: 'select'
      },
    ],
    [validationErrors],
  );

  //CREATE action
  const handleCreateCourse: MRT_TableOptions<Course>['onCreatingRowSave'] = async ({
    values,
    exitCreatingMode,
  }) => {
    const newValidationErrors = validateCourse(values);
    if (Object.values(newValidationErrors).some((error) => error)) {
      setValidationErrors(newValidationErrors);
      return;
    }
    setValidationErrors({});
    await createCourse(values);
    exitCreatingMode();
  };

  //UPDATE action
  const handleSaveCourse: MRT_TableOptions<Course>['onEditingRowSave'] = async ({
    values,
    table,
  }) => {
    const newValidationErrors = validateCourse(values);
    if (Object.values(newValidationErrors).some((error) => error)) {
      setValidationErrors(newValidationErrors);
      return;
    }
    setValidationErrors({});
    await updateCourse(values);
    table.setEditingRow(null); //exit editing mode
  };

  //DELETE action
  const openDeleteConfirmModal = (row: Course) =>
    modals.openConfirmModal({
      title: 'Are you sure you want to delete this Course?',
      children: (
        <Text>
          Are you sure you want to delete {row.name}? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteCourse(row.id),
    });

  const table = useMantineReactTable({
    columns,
    data: data ? data.state : [],
		enableRowSelection: true,
		columnFilterDisplayMode: 'popover',
		positionToolbarAlertBanner: 'bottom',
    createDisplayMode: 'modal', //default ('row', and 'custom' are also available)
    editDisplayMode: 'modal', //default ('row', 'cell', 'table', and 'custom' are also available)
    enableEditing: true,
    getRowId: (row) => row.id,
    mantineToolbarAlertBannerProps: isLoadingCoursesError
      ? {
          color: 'red',
          children: 'Error loading data',
        }
      : undefined,
    mantineTableContainerProps: {
      style: {
        minHeight: '500px',
      },
    },
    onCreatingRowCancel: () => setValidationErrors({}),
    onCreatingRowSave: handleCreateCourse,
    onEditingRowCancel: () => setValidationErrors({}),
    onEditingRowSave: handleSaveCourse,
    renderCreateRowModalContent: ({ table, row, internalEditComponents }) => (
      <Stack>
        <Title order={3}>Create New Course</Title>
        {internalEditComponents}
        <Flex justify="flex-end" mt="xl">
          <MRT_EditActionButtons variant="text" table={table} row={row} />
        </Flex>
      </Stack>
    ),
    renderEditRowModalContent: ({ table, row, internalEditComponents }) => (
      <Stack>
        <Title order={3}>Edit Course</Title>
        {internalEditComponents}
        <Flex justify="flex-end" mt="xl">
          <MRT_EditActionButtons variant="text" table={table} row={row} />
        </Flex>
      </Stack>
    ),
    renderRowActions: ({ row, table }) => (
      <Flex gap="md">
        <Tooltip label="Edit">
          <ActionIcon onClick={() => table.setEditingRow(row)}>
            <IconEdit />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Delete">
          <ActionIcon color="red" onClick={() => openDeleteConfirmModal(row)}>
            <IconTrash />
          </ActionIcon>
        </Tooltip>
      </Flex>
    ),
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
        onClick={() => {
          table.setCreatingRow(true); //simplest way to open the create row modal with no default values
          //or you can pass in a row object to set default values with the `createRow` helper function
          // table.setCreatingRow(
          //   createRow(table, {
          //     //optionally pass in default values for the new row, useful for nested data or other complex scenarios
          //   }),
          // );
        }}
      >
        Create New Course
      </Button>
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
    state: {
      isLoading: isLoadingCourses,
      isSaving: isCreatingCourse || isUpdatingCourse || isDeletingCourse,
      showAlertBanner: isLoadingCoursesError,
      showProgressBars: isFetchingCourses,
    },
  });

  return <MantineReactTable table={table} />;
};

export default CoursePage;

//CREATE hook (post new Course to api)
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
        ['courses'],
        (prevCourses: any) =>
          [
            ...prevCourses,
            {
              ...newCourseInfo,
              id: (Math.random() + 1).toString(36).substring(7),
            },
          ] as Course[],
      );
    },
    // onSettled: () => queryClient.invalidateQueries({ queryKey: ['Courses'] }), //refetch Courses after mutation, disabled for demo
  });
}

//READ hook (get Courses from api)
function useGetCourses() {
  return useQuery<CourseUnit>({
    queryKey: ['courses'],
    queryFn: async () =>
      //send api request here
      api
        .get('v1/courses')
        .then((res) => res.data),

    refetchOnWindowFocus: false,
  });
}

//UPDATE hook (put Course in api)
function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (course: Course) => {
      //send api update request here
      await new Promise((resolve) => setTimeout(resolve, 1000)); //fake api call
      return Promise.resolve();
    },
    //client side optimistic update
    onMutate: (newCourseInfo: Course) => {
      queryClient.setQueryData(['courses'], (prevCourses: any) =>
        prevCourses?.map((prevCourse: Course) =>
          prevCourse.id === newCourseInfo.id ? newCourseInfo : prevCourse,
        ),
      );
    },
    // onSettled: () => queryClient.invalidateQueries({ queryKey: ['Courses'] }), //refetch Courses after mutation, disabled for demo
  });
}

//DELETE hook (delete Course in api)
function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) => {
      //send api update request here
      await new Promise((resolve) => setTimeout(resolve, 1000)); //fake api call
      return Promise.resolve();
    },
    //client side optimistic update
    onMutate: (courseId: string) => {
      queryClient.setQueryData(['courses'], (prevCourses: any) =>
        prevCourses?.filter((course: Course) => course.id !== courseId),
      );
    },
    // onSettled: () => queryClient.invalidateQueries({ queryKey: ['Courses'] }), //refetch Courses after mutation, disabled for demo
  });
}

const validateRequired = (value: string) => !!value.length;
const validateEmail = (email: string) =>
  !!email.length &&
  email
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    );

function validateCourse(course: Course) {
  return {
    name: !validateRequired(course.name)
      ? 'First Name is Required'
      : '',
    coeff: !validateRequired(course.coeff.toString()) ? 'Last Name is Required' : '',
    unit_id: !validateEmail(course.description) ? 'Group is Required' : '',
  };
}
