'use client';

import { AppShell, Burger, Text, useMantineColorScheme, useMantineTheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useAuthStore from '@/app/store/authStore';
import { AdminHeader } from '@/components/Headers/AdminHeader';
import { Navbar } from '@/components/Navbar/Navbar';
import { navLinks } from '@/config';
import api from '@/lib/api';

interface Props {
	children: React.ReactNode;
}

export default function DashboardLayout({ children }: Props) {
	const router = useRouter();
	const [opened, { toggle }] = useDisclosure();
	const { colorScheme } = useMantineColorScheme();
	const theme = useMantineTheme();

	const bg = colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0];

	const { user, edit } = useAuthStore();

	useEffect(() => {
		const storedValue = localStorage.getItem('token');
		if (!storedValue) {
			router.push('/login');
		}
	}, [router]);

	useEffect(() => {
		if (!user) {
			api('user').then(res => edit(res.data) )
		}
	}, [edit, user]);

	return (
		<AppShell
			header={{ height: 60 }}
			navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
			padding="md"
			transitionDuration={500}
			transitionTimingFunction="ease"
		>
			<AppShell.Navbar>
				<Navbar data={navLinks} hidden={!opened} />
			</AppShell.Navbar>
			<AppShell.Header>
				<AdminHeader
					burger={<Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" mr="xl" />}
				/>
			</AppShell.Header>
			<AppShell.Main bg={bg}>{children}</AppShell.Main>
			<AppShell.Footer>
				<Text w="full" size="sm" c="gray">
					CopyRight © 2024 Negro
				</Text>
			</AppShell.Footer>
		</AppShell>
	);
}
