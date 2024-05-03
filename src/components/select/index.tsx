import { Select, TextInput } from '@mantine/core';
import {
	JSXElementConstructor,
	Key,
	PromiseLikeOfReactNode,
	ReactElement,
	ReactNode,
	ReactPortal,
} from 'react';

const MyEditSelect = ({ value, options, initialValue, onChange }) => {
	const [selectedValue, setSelectedValue] = useState(initialValue || value);

	const handleEditOption = optionValue => {
		// Implement logic to edit the option (e.g., open a modal)
	};

	return (
		<Select
			value={selectedValue}
			onChange={v => {
				setSelectedValue(v);
				onChange(v);
			}}
		>
			{options.map(
				(option: {
					value: Key | readonly string[] | null | undefined;
					label:
						| string
						| number
						| boolean
						| ReactElement<any, string | JSXElementConstructor<any>>
						| Iterable<ReactNode>
						| ReactPortal
						| PromiseLikeOfReactNode
						| null
						| undefined;
				}) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				),
			)}
		</Select>
	);
};

export default MyEditSelect;
