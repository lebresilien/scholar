export type Course = {
	id: string;
	name: string;
	coeff: number;
	unit_id: string;
	description: string;
	group?: T;
};

export type Unit = {
	id: string;
	name: string;
	description: string;
	group?: T;
};

export type Group = {
	id: string;
	name: string;
	description: string;
};

type T = {
	value: string;
	label: string;
};
