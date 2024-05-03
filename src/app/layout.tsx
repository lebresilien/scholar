import '@mantine/core/styles.css';
import 'mantine-react-table/styles.css';

import { ColorSchemeScript, DirectionProvider, MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { Analytics } from '@vercel/analytics/react';
import { quickSand } from '@/styles/fonts';
import { theme } from '@/styles/theme';
import { AppProvider } from './provider';

export const metadata = {
	metadataBase: new URL('https://mantine-admin.vercel.app/'),
	title: { default: 'Mantine Admin', template: '%s | Mantine Admin' },
	description: 'A Modern Dashboard with Next.js.',
	keywords: ['Ecole', 'Eleve', 'Cours', 'Classe', 'school', 'Student', 'Enseignant'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en-US" className={quickSand.className}>
			<head>
				<ColorSchemeScript />
				<meta
					name="viewport"
					content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
				/>
			</head>
			<body>
				<DirectionProvider>
					<MantineProvider theme={theme}>
						<ModalsProvider>
							<AppProvider>{children}</AppProvider>
							<Analytics />
						</ModalsProvider>
						<Notifications />
					</MantineProvider>
				</DirectionProvider>
			</body>
		</html>
	);
}
