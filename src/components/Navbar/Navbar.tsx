'use client';

import { Accordion, Button, ScrollArea } from '@mantine/core';

import { useRouter } from 'next/navigation';
import useAuthStore from '@/app/store/authStore';
import { UserButton } from '@/components/UserButton/UserButton';
import { NavItem } from '@/types/nav-item';
import classes from './Navbar.module.css';
import { NavLinksGroup } from './NavLinksGroup';

interface Props {
	data: NavItem[];
	hidden?: boolean;
}

export function Navbar({ data }: Props) {
	const router = useRouter();
	const signout = () => {
		localStorage.removeItem('token');
		router.push('/login');
	};
	const links = data.map(item => <NavLinksGroup key={item.label} {...item} />);

	return (
		<>
			<ScrollArea className={classes.links}>
				<div className={classes.linksInner}>{links}</div>
			</ScrollArea>

			<div className={classes.footer}>
				<Accordion>
					<Accordion.Item value="hello">
						<Accordion.Control>
							<UserButton
								image="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=255&q=80"
								name="Harriette"
								email="hspoon@outlook.com"
							/>
						</Accordion.Control>
						<Accordion.Panel>
							<Button variant="filled" onClick={signout}>
								Déconnexion
							</Button>
						</Accordion.Panel>
					</Accordion.Item>
				</Accordion>
			</div>
		</>
	);
}
