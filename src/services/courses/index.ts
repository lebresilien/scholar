import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Course } from './types';

export const getCourses = async (): Promise<Course[]> => {
	const res = await api.get('v1/courses');
	return res.data.state;
};

