'use client';

import {
	Alert,
	Anchor,
	Button,
	Card,
	Checkbox,
	Group,
	PasswordInput,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { StringDecoder } from 'string_decoder';
import useAuthStore from '@/app/store/authStore';
import api from '@/lib/api';

interface AuthType {
	email: string;
	password: string;
	device_name: string;
}
export function LoginForm() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const router = useRouter();
	const icon = <IconAlertTriangle />;
	const { edit } = useAuthStore();

	const form = useForm({
		initialValues: {
			email: '',
			password: '',
			device_name: 'web',
		},
	});

	const handleSubmit = async (values: AuthType) => {
		setLoading(true);
		setError('');
		api
			.post('signin', values)
			.then(res => {
				edit(res.data.user);
				localStorage.setItem('token', res.data.token);
				setLoading(false);
				router.push('/dashboard');
			})
			.catch(err => {
				setLoading(false);
				setError(err.response.data.message);
			});
	};

	return (
		<Card withBorder shadow="md" p={30} mt={30} radius="md">
			{error && <Alert variant="light" my={10} color="red" title={error} icon={icon} />}
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<TextInput
					label="Email"
					placeholder="john.doe@gmail.com"
					{...form.getInputProps('email')}
					required
				/>
				<PasswordInput
					label="Mot de passe"
					placeholder="votre mot de passe"
					required
					{...form.getInputProps('password')}
					mt="md"
				/>
				<Group mt="md" justify="space-between">
					<Checkbox label="Remember me" />
					<Anchor size="sm" href="#">
						Mot de passe oublié？
					</Anchor>
				</Group>
				<Button fullWidth mt="xl" type="submit" loading={loading} loaderProps={{ type: 'dots' }}>
					Se connecter
				</Button>
			</form>
		</Card>
	);
}
