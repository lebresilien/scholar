'use client';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css'; //if using mantine date picker features
import 'mantine-react-table/styles.css'; //make sure MRT styles were imported in your app root (once)
import { ActionIcon, Box, Button, Flex, Stack, Text, Title, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
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
import { Group, Unit } from '@/services/courses/types';

const csvConfig = mkConfig({
	fieldSeparator: ',',
	decimalSeparator: '.',
	useKeysAsHeaders: true,
});

const UnitPage = () => {
	const [validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({});
	const [selectedValue, setSelectedValue] = useState<string | undefined>('');
	//call CREATE hook
	const { mutateAsync: createUnit, isPending: isCreatingUnit } = useCreateUnit();
	//call READ hook
	const {
		data,
		isError: isLoadingUnitsError,
		isFetching: isFetchingUnits,
		isLoading: isLoadingUnits,
	} = useGetUnits();

	const { data: unitData } = useGetGroups();

	//call UPDATE hook
	const { mutateAsync: updateUnit, isPending: isUpdatingUnit } = useUpdateUnit();
	//call DELETE hook
	const { mutateAsync: deleteUnit, isPending: isDeletingUnit } = useDeleteUnit();

	const handleExportRows = (rows: MRT_Row<Unit>[]) => {
		const rowData = rows.map(row => row.original);
		const csv = generateCsv(csvConfig)(rowData);
		download(csvConfig)(csv);
	};

	const handleExportData = () => {
		const csv = generateCsv(csvConfig)(data ? data : []);
		download(csvConfig)(csv);
	};

	const columns = useMemo<MRT_ColumnDef<Unit>[]>(
		() => [
			{
				accessorKey: 'name',
				header: 'Nom',
				mantineEditTextInputProps: {
					type: 'text',
					required: true,
					error: validationErrors?.name,
					//remove any previous validation errors when Unit focuses on the input
					onFocus: () =>
						setValidationErrors({
							...validationErrors,
							name: undefined,
						}),
					//optionally add validation checking for onBlur or onChange
				},
			},
			{
				accessorKey: 'group_id',
				accessorFn: originalRow => originalRow.group?.label,
				header: 'Groupe',
				editVariant: 'select',
				mantineEditSelectProps: row => {
					setSelectedValue(row.row.original.group?.value.toString());
					return {
						data: unitData?.map((group: Group) => ({
							value: group.id,
							label: group.name,
						})),
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
	const handleCreateUnit: MRT_TableOptions<Unit>['onCreatingRowSave'] = async ({
		values,
		exitCreatingMode,
	}) => {
		const newValidationErrors = validateUnit(values);
		if (Object.values(newValidationErrors).some(error => error)) {
			setValidationErrors(newValidationErrors);
			return;
		}
		setValidationErrors({});
		await createUnit(values);
		exitCreatingMode();
	};

	//UPDATE action
	const handleSaveUnit: MRT_TableOptions<Unit>['onEditingRowSave'] = async ({ values, table }) => {
		const newValidationErrors = validateUnit(values);
		if (Object.values(newValidationErrors).some(error => error)) {
			setValidationErrors(newValidationErrors);
			return;
		}
		setValidationErrors({});

		await updateUnit(values);
		table.setEditingRow(null); //exit editing mode
	};

	//DELETE action
	const openDeleteConfirmModal = (row: MRT_Row<Unit>) =>
		modals.openConfirmModal({
			title: 'Etes-vous sûre de vouloir supprimer ce cours?',
			children: (
				<Text>
					Voulez vous vraiment supprimer {row.original.name}? Cette action est irrévocable.
				</Text>
			),
			labels: { confirm: 'Supprimer', cancel: 'Cancel' },
			confirmProps: { color: 'red' },
			onConfirm: () => deleteUnit(row.original.id),
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
		mantineToolbarAlertBannerProps: isLoadingUnitsError
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
		onCreatingRowSave: handleCreateUnit,
		onEditingRowCancel: () => setValidationErrors({}),
		onEditingRowSave: handleSaveUnit,
		renderCreateRowModalContent: ({ table, row, internalEditComponents }) => (
			<Stack>
				<Title order={3}>Create New Unit</Title>
				{internalEditComponents}
				<Flex justify="flex-end" mt="xl">
					<MRT_EditActionButtons variant="text" table={table} row={row} />
				</Flex>
			</Stack>
		),
		renderEditRowModalContent: ({ table, row, internalEditComponents }) => (
			<Stack>
				<Title order={3}>Edit Unit</Title>
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
					Nouveau Enseignement
				</Button>
				<Button
					color="lightblue"
					//export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
					onClick={handleExportData}
					leftSection={<IconDownload />}
					variant="filled"
				>
					Exporter tout
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
			isLoading: isLoadingUnits,
			isSaving: isCreatingUnit || isUpdatingUnit || isDeletingUnit,
			showAlertBanner: isLoadingUnitsError,
			showProgressBars: isFetchingUnits,
		},
	});

	useEffect(() => {
		setSelectedValue(undefined);
		//setSelectedValue(table.getState().editingRow?.original.group?.value.toString() ?? '9')
	}, [selectedValue]);

	return <MantineReactTable table={table} />;
};

export default UnitPage;

//CREATE hook (post new Unit to api)
function useCreateUnit() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (unit: Unit) => {
			//send api update request here
			api
				.post('v1/units', unit)
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
		onSettled: () => queryClient.invalidateQueries({ queryKey: ['units'] }), //refetch Units after mutation, disabled for demo
	});
}

//READ hook (get Units from api)
function useGetUnits() {
	return useQuery<Unit[]>({
		queryKey: ['units'],
		queryFn: async () =>
			//send api request here
			api.get('v1/units').then(res => res.data.data),

		refetchOnWindowFocus: false,
	});
}

function useGetGroups() {
	return useQuery<any[]>({
		queryKey: ['groups'],
		queryFn: async () =>
			//send api request here
			api.get('v1/groups').then(res => res.data.data),
		refetchOnWindowFocus: false,
	});
}

//UPDATE hook (put Unit in api)
function useUpdateUnit() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (unit: Unit) => {
			//send api update request here
			api
				.put(`v1/units/${unit.id}`, unit)
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
		onSettled: () => queryClient.invalidateQueries({ queryKey: ['units'] }), //refetch Units after mutation, disabled for demo
	});
}

//DELETE hook (delete Unit in api)
function useDeleteUnit() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (unitId: string) => {
			//send api update request here
			api.delete(`v1/units/${unitId}`);
		},
		//client side optimistic update
		onMutate: (unitId: string) => {
			queryClient.setQueryData(
				['units'],
				(prevUnits: Unit[]) => prevUnits?.filter((unit: Unit) => unit.id !== unitId),
			);
		},
		//onSettled: () => queryClient.invalidateQueries({ queryKey: ['units'] }), //refetch Units after mutation, disabled for demo
	});
}

const validateRequired = (value: string) => !!value.length;

function validateUnit(unit: Unit) {
	return {
		unit_id: !validateRequired(unit.unit_id) ? 'Unit is required' : '',
		name: !validateRequired(unit.name) ? 'Name is required' : '',
		coeff: !validateRequired(unit.coeff.toString()) ? 'Coeff is required' : '',
		//unit_id: !validateEmail(unit.description) ? 'Group is Required' : '',
	};
}
