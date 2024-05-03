'use client';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css'; //if using mantine date picker features
import 'mantine-react-table/styles.css'; //make sure MRT styles were imported in your app root (once)
import {
	ActionIcon,
	Box,
	Button,
	ComboboxItem,
	Flex,
	Stack,
	Text,
	Title,
	Tooltip,
} from '@mantine/core';
import { modals, ModalsProvider } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
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
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { Course } from '@/services/courses/types';

const csvConfig = mkConfig({
	fieldSeparator: ',',
	decimalSeparator: '.',
	useKeysAsHeaders: true,
});

const CoursePage = () => {
	const [validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({});
	const [selectedValue, setSelectedValue] = useState<string | undefined>('');
	//call CREATE hook
	const { mutateAsync: createCourse, isPending: isCreatingCourse } = useCreateCourse();
	//call READ hook
	const {
		data,
		isError: isLoadingCoursesError,
		isFetching: isFetchingCourses,
		isLoading: isLoadingCourses,
	} = useGetCourses();

	const { data: unitData } = useGetUnits();

	//call UPDATE hook
	const { mutateAsync: updateCourse, isPending: isUpdatingCourse } = useUpdateCourse();
	//call DELETE hook
	const { mutateAsync: deleteCourse, isPending: isDeletingCourse } = useDeleteCourse();

	const handleExportRows = (rows: MRT_Row<Course>[]) => {
		const rowData = rows.map(row => row.original);
		const csv = generateCsv(csvConfig)(rowData);
		download(csvConfig)(csv);
	};

	const handleExportData = () => {
		const csv = generateCsv(csvConfig)(data ? data : []);
		download(csvConfig)(csv);
	};

	const columns = useMemo<MRT_ColumnDef<Course>[]>(
		() => [
			{
				accessorKey: 'name',
				header: 'Nom',
				mantineEditTextInputProps: {
					type: 'text',
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
					type: 'number',
					required: true,
					error: validationErrors?.coeff,
					onFocus: () =>
						setValidationErrors({
							...validationErrors,
							coeff: undefined,
						}),
				},
			},
			{
				accessorKey: 'unit_id',
				accessorFn: originalRow => originalRow.group?.label,
				header: 'Unité Enseignement',
				editVariant: 'select',
				mantineEditSelectProps: row => {
					setSelectedValue(row.row.original.group?.value.toString());
					return {
						data: unitData,
						value: selectedValue,
						/* required: true,
						error: validationErrors?.unit_id,
						onFocus: () =>
						setValidationErrors({
							...validationErrors,
							unit_id: undefined,
						}), */
						onChange: value => setSelectedValue(value.toString()),
					};
				},
			},
			{
				accessorKey: 'description',
				header: 'Description',
				mantineEditTextInputProps: {
					type: 'text',
					onFocus: () =>
						setValidationErrors({
							...validationErrors,
							description: undefined,
						}),
				},
			},
		],
		[selectedValue, unitData, validationErrors],
	);

	//CREATE action
	const handleCreateCourse: MRT_TableOptions<Course>['onCreatingRowSave'] = async ({
		values,
		exitCreatingMode,
	}) => {
		const newValidationErrors = validateCourse(values);
		if (Object.values(newValidationErrors).some(error => error)) {
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
		if (Object.values(newValidationErrors).some(error => error)) {
			setValidationErrors(newValidationErrors);
			return;
		}
		setValidationErrors({});

		await updateCourse(values);
		table.setEditingRow(null); //exit editing mode
	};

	//DELETE action
	const openDeleteConfirmModal = (row: MRT_Row<Course>) =>
		modals.openConfirmModal({
			title: 'Etes-vous sûre de vouloir supprimer ce cours?',
			children: (
				<Text>
					Voulez vous vraiment supprimer {row.original.name}? Cette action est irrévocable.
				</Text>
			),
			labels: { confirm: 'Supprimer', cancel: 'Cancel' },
			confirmProps: { color: 'red' },
			onConfirm: () => deleteCourse(row.original.id),
		});

	const table = useMantineReactTable({
		columns,
		data: data ? data : [],
		enableRowSelection: true,
		columnFilterDisplayMode: 'popover',
		positionToolbarAlertBanner: 'bottom',
		createDisplayMode: 'modal', //default ('row', and 'custom' are also available)
		editDisplayMode: 'modal', //default ('row', 'cell', 'table', and 'custom' are also available)
		enableEditing: true,
		getRowId: row => row.id,
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
					Nouveau Cours
				</Button>
				<Button
					color="lightblue"
					//export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
					onClick={handleExportData}
					leftSection={<IconDownload />}
					variant="filled"
				>
					Exporter tous les cours
				</Button>
				<Button
					disabled={table.getPrePaginationRowModel().rows.length === 0}
					//export all rows, including from the next page, (still respects filtering and sorting)
					onClick={() => handleExportRows(table.getPrePaginationRowModel().rows)}
					leftSection={<IconDownload />}
					variant="filled"
				>
					Exporter toutes les lignes
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
					disabled={!table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
					//only export selected rows
					onClick={() => handleExportRows(table.getSelectedRowModel().rows)}
					leftSection={<IconDownload />}
					variant="filled"
				>
					Exporter les lignes selectionnées
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

	useEffect(() => {
		setSelectedValue(undefined);
		//setSelectedValue(table.getState().editingRow?.original.group?.value.toString() ?? '9')
	}, [selectedValue]);

	return <MantineReactTable table={table} />;
};

export default CoursePage;

//CREATE hook (post new Course to api)
function useCreateCourse() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (course: Course) => {
			//send api update request here
			api
				.post('v1/courses', course)
				.then(() => {
					notifications.show({
						title: 'Default notification',
						message: 'Hey there, your code is awesome! 🤥',
					});
				})
				.catch(err => {
					notifications.show({
						title: 'Error',
						message: err.data.response.message,
					});
				});
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: ['courses'] }), //refetch Courses after mutation, disabled for demo
	});
}

//READ hook (get Courses from api)
function useGetCourses() {
	return useQuery<Course[]>({
		queryKey: ['courses'],
		queryFn: async () =>
			//send api request here
			api.get('v1/courses').then(res => res.data.data),

		refetchOnWindowFocus: false,
	});
}

function useGetUnits() {
	return useQuery<any[]>({
		queryKey: ['units'],
		queryFn: async () =>
			//send api request here
			api.get('v1/units/create').then(res => res.data.data),
		refetchOnWindowFocus: false,
	});
}

//UPDATE hook (put Course in api)
function useUpdateCourse() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (course: Course) => {
			//send api update request here
			api
				.put(`v1/courses/${course.id}`, course)
				.then(() => {
					notifications.show({
						title: 'Default notification',
						message: 'Hey there, your code is awesome! 🤥',
					});
				})
				.catch(err => {
					console.log('error', err);
				});
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: ['courses'] }), //refetch Courses after mutation, disabled for demo
	});
}

//DELETE hook (delete Course in api)
function useDeleteCourse() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (courseId: string) => {
			//send api update request here
			api.delete(`v1/courses/${courseId}`);
		},
		//client side optimistic update
		onMutate: (courseId: string) => {
			queryClient.setQueryData(
				['courses'],
				(prevCourses: Course[]) => prevCourses?.filter((course: Course) => course.id !== courseId),
			);
		},
		//onSettled: () => queryClient.invalidateQueries({ queryKey: ['courses'] }), //refetch Courses after mutation, disabled for demo
	});
}

const validateRequired = (value: string) => !!value.length;

function validateCourse(course: Course) {
	return {
		unit_id: !validateRequired(course.unit_id) ? 'Unit is required' : '',
		name: !validateRequired(course.name) ? 'Name is required' : '',
		coeff: !validateRequired(course.coeff.toString()) ? 'Coeff is required' : '',
		//unit_id: !validateEmail(course.description) ? 'Group is Required' : '',
	};
}
