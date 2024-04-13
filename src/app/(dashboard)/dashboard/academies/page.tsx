"use client"

import { MantineReactTable, MRT_ColumnDef, useMantineReactTable } from 'mantine-react-table';
import { useMemo, useState } from 'react';
import { PageContainer } from '@/components/PageContainer/PageContainer';
import { useAcademies } from '@/services/academies';
import { Academy } from '@/services/academies/types';

export default function AcademiesPage() {
    
    const [validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({});

    const columns = useMemo<MRT_ColumnDef<Academy>[]>(
        () => [
          {
            accessorKey: 'name',
            header: 'Name',
            mantineEditTextInputProps: {
              type: 'email',
              required: true,
              error: validationErrors?.name,
              //remove any previous validation errors when user focuses on the input
              onFocus: () =>
                setValidationErrors({
                  ...validationErrors,
                  name: undefined,
                }),
              //optionally add validation checking for onBlur or onChange
            },
          },
          {
            accessorKey: 'status',
            header: 'Status',
            editVariant: 'select',
            mantineEditSelectProps: {
              data: ["Oui", "Non"],
              error: validationErrors?.status,
            },
          },
         
        ],
        [validationErrors],
    );

    const {
        data: fetchedUsers = [],
        isError: isLoadingUsersError,
        isFetching: isFetchingUsers,
        isLoading: isLoadingUsers,
    } = useAcademies();

    const table = useMantineReactTable({
        columns,
        data: fetchedUsers,
        createDisplayMode: 'modal', //default ('row', and 'custom' are also available)
        editDisplayMode: 'modal', //default ('row', 'cell', 'table', and 'custom' are also available)
        enableEditing: true,
        getRowId: (row) => row.id,
        state: {
          isLoading: isLoadingUsers,
          showAlertBanner: isLoadingUsersError,
          showProgressBars: isFetchingUsers,
        },
      });

	return (
		<PageContainer title="Academies">
			<MantineReactTable table={table} />
		</PageContainer>
	);
}