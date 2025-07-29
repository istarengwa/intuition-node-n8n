import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';

import { GraphQLClient } from 'graphql-request';
import * as Base from './modules/Base';
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
					{ name: '[OffChain] Playground API', value: 'railsMockApi' },
					{ name: 'Base Testnet', value: 'baseSepolia' },
					{ name: 'Base Mainnet', value: 'base' },
				],
				default: 'base',
				description: 'Select the API endpoint to use',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{ name: 'Fetch Triples', value: 'fetchTriples' },
					{ name: 'Fetch Triples For Subject', value: 'fetchTriplesForSubject' },
					{ name: 'Fetch Triples For Predicate', value: 'fetchTriplesForPredicate' },
					{ name: 'Fetch Triples For Object', value: 'fetchTriplesForObject' },
					{ name: 'Fetch Triple By ID', value: 'fetchTripleById' },
					{ name: 'Fetch Atoms', value: 'fetchAtoms' },
                                        { name: 'Fetch Atom Details', value: 'fetchAtomDetails' },
                                        { name: 'Search Triples', value: 'searchTriples' },
                                ],
                                default: 'fetchTriples',
                                description: 'Select the operation to perform',
                        },
			{
				displayName: 'Subject ID',
				name: 'subjectId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['fetchTriplesForSubject'],
					},
				},
			},
			{
				displayName: 'Predicate ID',
				name: 'predicateId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['fetchTriplesForPredicate'],
					},
				},
			},
			{
				displayName: 'Object ID',
				name: 'objectId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['fetchTriplesForObject'],
					},
				},
			},
			{
				displayName: 'Triple ID',
				name: 'tripleId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['fetchTripleById'],
					},
				},
			},
                        {
                                displayName: 'Atom ID',
                                name: 'atomId',
                                type: 'string',
                                default: '',
                                displayOptions: {
                                        show: {
                                                operation: ['fetchAtomDetails'],
                                        },
                                },
                        },
                        {
                                displayName: 'Limit',
                                name: 'limit',
                                type: 'number',
                                default: 10,
                                displayOptions: {
                                        show: {
                                                operation: ['fetchAtoms'],
                                        },
                                },
                        },
                        {
                                displayName: 'Offset',
                                name: 'offset',
                                type: 'number',
                                default: 0,
                                displayOptions: {
                                        show: {
                                                operation: ['fetchAtoms'],
                                        },
                                },
                        },
                        {
                                displayName: 'Filters',
                                name: 'filters',
                                type: 'json',
                                default: '',
				displayOptions: {
					show: {
						operation: ['searchTriples'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const endpoint = this.getNodeParameter('endpoint', i) as 'railsMockApi' | 'base' | 'baseSepolia';
			const operation = this.getNodeParameter('operation', i) as string;

			// Sélection automatique du module selon l'endpoint
			const module = endpoint === 'baseSepolia' ? BaseSepolia : Base;

			// Création du client GraphQL
			const endpoints = module.ENDPOINTS as Record<string, { url: string }>;
			const client = new GraphQLClient(endpoints[endpoint].url);

			// Exécution de l’opération demandée
			let result;
			switch (operation) {
				case 'fetchTriples':
					result = await module.fetchTriples(client);
					break;
				case 'fetchTriplesForSubject':
					result = await module.fetchTriplesForSubject(client, this.getNodeParameter('subjectId', i) as string);
					break;
				case 'fetchTriplesForPredicate':
					result = await module.fetchTriplesForPredicate(client, this.getNodeParameter('predicateId', i) as string);
					break;
				case 'fetchTriplesForObject':
					result = await module.fetchTriplesForObject(client, this.getNodeParameter('objectId', i) as string);
					break;
				case 'fetchTripleById':
					result = await module.fetchTripleById(client, this.getNodeParameter('tripleId', i) as string);
					break;
                                case 'fetchAtoms':
                                        result = await module.fetchAtoms(
                                                client,
                                                this.getNodeParameter('limit', i) as number,
                                                this.getNodeParameter('offset', i) as number,
                                        );
                                        break;
                                case 'fetchAtomDetails':
                                        result = await module.fetchAtomDetails(client, this.getNodeParameter('atomId', i) as string);
                                        break;
                                case 'searchTriples':
                                        {
                                                const rawFilters = this.getNodeParameter('filters', i) as string | IDataObject;
                                                const filters = typeof rawFilters === 'string' && rawFilters !== '' ? JSON.parse(rawFilters) : rawFilters;
                                                result = await module.searchTriples(client, filters);
                                        }
                                        break;
                                default:
                                        throw new Error(`Unsupported operation: ${operation}`);
                        }

			returnData.push({ json: result as IDataObject });
		}

		return [returnData];
	}
}
