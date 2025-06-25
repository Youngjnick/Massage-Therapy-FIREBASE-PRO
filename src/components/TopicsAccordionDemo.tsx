import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Example hierarchical topics data
const topics = [
	{
		name: 'Anatomy',
		children: [
			{
				name: 'Muscular System',
				children: [
					{ name: 'Upper Limb', children: [] },
					{ name: 'Lower Limb', children: [] },
				],
			},
			{
				name: 'Nervous System',
				children: [
					{ name: 'Central Nervous System', children: [] },
					{ name: 'Peripheral Nervous System', children: [] },
				],
			},
		],
	},
	{
		name: 'Modalities',
		children: [
			{
				name: 'Massage Techniques',
				children: [
					{ name: 'Swedish Massage', children: [] },
					{ name: 'Deep Tissue Massage', children: [] },
				],
			},
		],
	},
];

interface Topic {
	name: string;
	children: Topic[];
	level?: number;
}

function renderTopics(topics: Topic[]) {
	return topics.map((topic: Topic) => (
		<Accordion key={topic.name} sx={{ ml: topic.level ? topic.level * 2 : 0 }}>
			<AccordionSummary expandIcon={<ExpandMoreIcon />}>
				<Typography>{topic.name}</Typography>
			</AccordionSummary>
			<AccordionDetails>
				{topic.children && topic.children.length > 0 ? (
					renderTopics(
						topic.children.map((child: Topic) => ({ ...child, level: (topic.level || 0) + 1 }))
					)
				) : (
					<Typography variant="body2" color="text.secondary">
						No subtopics
					</Typography>
				)}
			</AccordionDetails>
		</Accordion>
	));
}

export default function TopicsAccordionDemo() {
	return <div style={{ maxWidth: 500, margin: '2rem auto' }}>{renderTopics(topics)}</div>;
}
