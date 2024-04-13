import { useMutation, useQuery } from '@tanstack/react-query';
import baseApi from '@/lib/api';
import { Academy } from './types';

export const getAcademies = async () => {
	const res = await baseApi.get('v1/academies').json<{ data: Academy[] }>();
	
	return res.data;
};

export const addAcademy = async (academy: Academy) => {
	const res = await baseApi.post('v1/academies', {
        json: academy,
    }).json();
	console.log("response", res);
	return res;
}	

export const useAcademies = () =>
	useQuery<Academy[]>({
		queryKey: ['academies'],
		queryFn: () => getAcademies(),
        refetchOnWindowFocus: false,
	});




