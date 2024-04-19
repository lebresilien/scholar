"use client";

import { Container } from '@mantine/core';
import { Box, Button } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query'
import { download, generateCsv, mkConfig } from 'export-to-csv';
import {
  MantineReactTable,
  type MRT_ColumnDef,
  type MRT_Row,
  useMantineReactTable,
} from 'mantine-react-table';
import { useMemo, useState } from 'react';
import { PageContainer } from '@/components/PageContainer/PageContainer';
import api from '@/lib/api';
import { Course } from '@/services/courses/types';
import CourseTemplate from '@/components/templates/Course';

/* const columns: MRT_ColumnDef<Course>[] = [
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
]; */


const csvConfig = mkConfig({
  fieldSeparator: ',',
  decimalSeparator: '.',
  useKeysAsHeaders: true,
});

export default function CoursePage() {

	const { isLoading, error, data } = useQuery({
    queryKey: ['courseList'],
    queryFn: () =>
      api
        .get('v1/courses')
        .then((res) => res.data.state)
  })

  if (isLoading) return 'Loading...'

  if (error) return 'An error has occurred: ' + error.message

	return (
				<CourseTemplate data={data} />
	);
}
