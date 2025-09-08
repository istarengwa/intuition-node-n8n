import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';

import { GraphQLClient } from 'graphql-request';
import * as BaseSepolia from './modules/BaseSepolia';

	export class IntuitionFetch implements INodeType {
		description: INodeTypeDescription = {
			displayName: 'Intuition Fetch',
			name: 'intuitionFetch',
			group: ['transform'],
			version: 1,
			description: 'Interact with the Intuition GraphQL API',
			defaults: {
				name: 'Intuition Fetch',
			},
			inputs: ['main'],
			outputs: ['main'],
			properties: [
				{
					displayName: 'Endpoint',
					name: 'endpoint',
					type: 'options',
					options: [
						{ name: 'Intuition Testnet (Base Sepolia)', value: 'baseSepolia' },
					],
					default: 'baseSepolia',
					description: 'API endpoint (testnet only)',
				},
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					options: [
						{ name: 'Fetch Triples', value: 'fetchTriples', description: 'Fetch all available triples' },
						{ name: 'Fetch Atoms', value: 'fetchAtoms', description: 'Retrieve a list of atoms and their metadata' },
						{ name: 'Search Atoms', value: 'searchAtoms', description: 'Search atoms by label, type, wallet, tx hash, id' },
						{ name: 'Search Triples', value: 'searchTriples', description: 'Search triples by triple id or atom label/id across positions' },
					],
					default: 'fetchTriples',
					description: 'Operation to perform against the API',
				},
				{
					displayName: 'Light Output',
					name: 'lightOutput',
					type: 'boolean',
					default: false,
					description: 'Return a lighter payload (older shape). For triples, still includes created_at.',
					displayOptions: { show: { operation: ['fetchTriples','fetchAtoms','searchAtoms','searchTriples'] } },
				},

				{
					displayName: 'Atom Filters',
					name: 'atomFilters',
					type: 'collection',
					placeholder: 'Add a filter',
					default: {},
					displayOptions: {
						show: { operation: ['searchAtoms'] },
					},
					options: [
						{
							displayName: 'Term ID',
							name: 'termId',
							type: 'string',
							default: '',
							description: 'Exact term_id of the atom',
						},
						{
							displayName: 'Label (contains)',
							name: 'label',
							type: 'string',
							default: '',
							description: 'Case-insensitive substring match',
						},
						{
							displayName: 'Type',
							name: 'type',
							type: 'string',
							default: '',
						},
						{
							displayName: 'Wallet ID',
							name: 'walletId',
							type: 'string',
							default: '',
						},
						{
							displayName: 'Transaction Hash',
							name: 'transactionHash',
							type: 'string',
							default: '',
						},
						{
							displayName: 'Emoji',
							name: 'emoji',
							type: 'string',
							default: '',
						},
						{
							displayName: 'Image (contains)',
							name: 'imageContains',
							type: 'string',
							default: '',
							description: 'Case-insensitive substring match in image URL/hash',
						},
						{
							displayName: 'Block Number Min',
							name: 'blockNumberMin',
							type: 'number',
							default: 0,
						},
						{
							displayName: 'Block Number Max',
							name: 'blockNumberMax',
							type: 'number',
							default: 0,
						},
						{
							displayName: 'Created At From',
							name: 'createdAtFrom',
							type: 'dateTime',
							default: '',
						},
						{
							displayName: 'Created At To',
							name: 'createdAtTo',
							type: 'dateTime',
							default: '',
						},
					],
				},
				{
					displayName: 'Use Relative Time Filter',
					name: 'useRelativeTime',
					type: 'boolean',
					default: false,
					description: 'Filter atoms created in the last X time units',
					displayOptions: { show: { operation: ['searchAtoms'] } },
				},
				{
					displayName: 'Relative Amount',
					name: 'relativeAmount',
					type: 'number',
					default: 60,
					description: 'How many units back from now',
					displayOptions: { show: { operation: ['searchAtoms'], useRelativeTime: [true] } },
				},
				{
					displayName: 'Relative Unit',
					name: 'relativeUnit',
					type: 'options',
					options: [
						{ name: 'Seconds', value: 'seconds' },
						{ name: 'Minutes', value: 'minutes' },
						{ name: 'Hours', value: 'hours' },
						{ name: 'Days', value: 'days' },
					],
					default: 'minutes',
					displayOptions: { show: { operation: ['searchAtoms'], useRelativeTime: [true] } },
				},
				{
					displayName: 'Atom Sort By',
					name: 'atomSortBy',
					type: 'options',
					options: [
						{ name: 'Created At', value: 'created_at' },
						{ name: 'Block Number', value: 'block_number' },
					],
					default: 'created_at',
					displayOptions: { show: { operation: ['searchAtoms'] } },
				},
				{
					displayName: 'Atom Sort Direction',
					name: 'atomSortDir',
					type: 'options',
					options: [
						{ name: 'Descending', value: 'desc' },
						{ name: 'Ascending', value: 'asc' },
					],
					default: 'desc',
					displayOptions: { show: { operation: ['searchAtoms'] } },
				},
				{
					displayName: 'Triple Filters',
					name: 'tripleFilters',
					type: 'collection',
					placeholder: 'Add a filter',
					default: {},
					displayOptions: {
						show: { operation: ['searchTriples'] },
					},
					options: [
						{
							displayName: 'Triple Term ID',
							name: 'tripleId',
							type: 'string',
							default: '',
							description: 'Exact term_id of the triple',
						},
						{
							displayName: 'Atom Term ID',
							name: 'atomTermId',
							type: 'string',
							default: '',
							description: 'Match subject_id, predicate_id or object_id',
						},
						{
							displayName: 'Atom Label (contains)',
							name: 'atomLabel',
							type: 'string',
							default: '',
							description: 'Case-insensitive substring match across subject/predicate/object labels',
						},
					],
				},
				{
					displayName: 'Limit',
					name: 'limit',
					type: 'number',
					default: 10,
					description: 'Max items to return',
					displayOptions: {
						show: { operation: ['searchAtoms', 'searchTriples'] },
					},
				},
				{
					displayName: 'Offset',
					name: 'offset',
					type: 'number',
					default: 0,
					description: 'Skip this many items',
					displayOptions: {
						show: { operation: ['searchAtoms', 'searchTriples'] },
					},
				},
			],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const endpoint = this.getNodeParameter('endpoint', i) as 'baseSepolia';
			const operation = this.getNodeParameter('operation', i) as string;

			// Testnet-only module
			const module = BaseSepolia;

			// Création du client GraphQL
			const endpoints = module.ENDPOINTS as Record<string, { url: string }>;
			const client = new GraphQLClient(endpoints[endpoint].url);

			// Exécution de l’opération demandée
			let result;
			switch (operation) {
				case 'fetchTriples':
					result = await module.fetchTriples(
						client,
						(this.getNodeParameter('lightOutput', i, false) as boolean) ? 'light' : 'full',
					);
					break;
				case 'fetchAtoms':
					result = await module.fetchAtoms(
						client,
						10,
						0,
						(this.getNodeParameter('lightOutput', i, false) as boolean) ? 'light' : 'full',
					);
					break;
				case 'searchAtoms': {
					const filters = (this.getNodeParameter('atomFilters', i, {}) as IDataObject) || {};
					const limit = (this.getNodeParameter('limit', i, 10) as number) ?? 10;
					const offset = (this.getNodeParameter('offset', i, 0) as number) ?? 0;
					const sortBy = (this.getNodeParameter('atomSortBy', i, 'created_at') as string) as 'created_at' | 'block_number';
					const sortDir = (this.getNodeParameter('atomSortDir', i, 'desc') as string) as 'asc' | 'desc';
					const useRelative = this.getNodeParameter('useRelativeTime', i, false) as boolean;
					if (useRelative) {
						const amount = (this.getNodeParameter('relativeAmount', i, 60) as number) ?? 60;
						const unit = (this.getNodeParameter('relativeUnit', i, 'minutes') as string) as 'seconds' | 'minutes' | 'hours' | 'days';
						const msPerUnit = {
							seconds: 1000,
							minutes: 60 * 1000,
							hours: 60 * 60 * 1000,
							days: 24 * 60 * 60 * 1000,
						};
						const now = Date.now();
						const fromIso = new Date(now - Math.max(0, amount) * msPerUnit[unit]).toISOString();
						(filters as IDataObject).createdAtFrom = fromIso;
					}
					result = await module.searchAtoms(
						client,
						{
							termId: (filters.termId as string) || undefined,
							label: (filters.label as string) || undefined,
							type: (filters.type as string) || undefined,
							walletId: (filters.walletId as string) || undefined,
							transactionHash: (filters.transactionHash as string) || undefined,
							emoji: (filters.emoji as string) || undefined,
							imageContains: (filters.imageContains as string) || undefined,
							blockNumberMin: (filters.blockNumberMin as number) ?? undefined,
							blockNumberMax: (filters.blockNumberMax as number) ?? undefined,
							createdAtFrom: (filters.createdAtFrom as string) || undefined,
							createdAtTo: (filters.createdAtTo as string) || undefined,
						},
						limit,
						offset,
						sortBy,
						sortDir,
						(this.getNodeParameter('lightOutput', i, false) as boolean) ? 'light' : 'full',
					);
					break;
				}
				case 'searchTriples': {
					const filters = (this.getNodeParameter('tripleFilters', i, {}) as IDataObject) || {};
					const limit = (this.getNodeParameter('limit', i, 10) as number) ?? 10;
					const offset = (this.getNodeParameter('offset', i, 0) as number) ?? 0;
					result = await module.searchTriples(
						client,
						{
							tripleId: (filters.tripleId as string) || undefined,
							atomTermId: (filters.atomTermId as string) || undefined,
							atomLabel: (filters.atomLabel as string) || undefined,
						},
						limit,
						offset,
						(this.getNodeParameter('lightOutput', i, false) as boolean) ? 'light' : 'full',
					);
					break;
				}
				default:
					break;
			}

			returnData.push({ json: result as IDataObject });
		}

		return [returnData];
	}
}
