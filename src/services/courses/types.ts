export type Course = {
	id: string;
	name: string;
	coeff: number;
	unit_id: string;
	description: string;
	group?: Init;
};

export type Unit = {
	id: string;
	name: string;
	coeff: number;
	description: string;
};

type Init = {
	value: string;
	label: string;
};
