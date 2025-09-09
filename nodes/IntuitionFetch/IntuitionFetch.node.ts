import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';

import { GraphQLClient } from 'graphql-request';
import * as Base from './modules/Base';

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
						{ name: 'Intuition Testnet', value: 'testnet' },
					],
					default: 'testnet',
					description: 'API endpoint (testnet only)',
				},
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					options: [
						{ name: 'Fetch Triples', value: 'fetchTriples', description: 'Fetch all available triples' },
						{ name: 'Fetch Atoms', value: 'fetchAtoms', description: 'Retrieve a list of atoms and their metadata' },
						{ name: 'Fetch Accounts', value: 'fetchAccounts', description: 'Retrieve accounts' },
						{ name: 'Fetch Positions', value: 'fetchPositions', description: 'Retrieve positions' },
						{ name: 'Fetch Vaults', value: 'fetchVaults', description: 'Retrieve vaults' },
						{ name: 'Search Atoms', value: 'searchAtoms', description: 'Search atoms by label, type, wallet, tx hash, id' },
						{ name: 'Search Triples', value: 'searchTriples', description: 'Search triples by triple id or atom label/id across positions' },
						{ name: 'Search Accounts', value: 'searchAccounts', description: 'Search accounts with optional filters' },
						{ name: 'Search Positions', value: 'searchPositions', description: 'Search positions with optional filters' },
						{ name: 'Search Vaults', value: 'searchVaults', description: 'Search vaults with optional filters' },
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
					displayOptions: { show: { operation: ['fetchTriples','fetchAtoms','searchAtoms','searchTriples','fetchAccounts','searchAccounts','fetchPositions','searchPositions','fetchVaults','searchVaults'] } },
				},
				// Accounts filters
				{
					displayName: 'Account Filters (Light)',
					name: 'accountFiltersLight',
					type: 'collection',
					placeholder: 'Add a filter',
					default: {},
					displayOptions: { show: { operation: ['searchAccounts'], lightOutput: [true] } },
					options: [
						{ displayName: 'ID', name: 'id', type: 'string', default: '' },
						{ displayName: 'Label (contains)', name: 'label', type: 'string', default: '' },
						{ displayName: 'Type', name: 'type', type: 'string', default: '' },
						{ displayName: 'Atom ID', name: 'atomId', type: 'string', default: '' },
						{ displayName: 'Image (contains)', name: 'imageContains', type: 'string', default: '' },
					],
				},
				{
					displayName: 'Account Filters (Full)',
					name: 'accountFiltersFull',
					type: 'collection',
					placeholder: 'Add a filter',
					default: {},
					displayOptions: { show: { operation: ['searchAccounts'], lightOutput: [false] } },
					options: [
						{ displayName: 'ID', name: 'id', type: 'string', default: '' },
						{ displayName: 'Label (contains)', name: 'label', type: 'string', default: '' },
						{ displayName: 'Type', name: 'type', type: 'string', default: '' },
						{ displayName: 'Atom ID', name: 'atomId', type: 'string', default: '' },
						{ displayName: 'Image (contains)', name: 'imageContains', type: 'string', default: '' },
					],
				},
				{
					displayName: 'Use Account Relative Time Filter',
					name: 'useAccountRelativeTime',
					type: 'boolean',
					default: false,
					displayOptions: { show: { operation: ['searchAccounts'] } },
					description: 'Filter accounts with activity in the last X time units (uses positions.created_at).',
				},
				{
					displayName: 'Relative Amount',
					name: 'accountRelativeAmount',
					type: 'number',
					default: 60,
					displayOptions: { show: { operation: ['searchAccounts'], useAccountRelativeTime: [true] } },
				},
				{
					displayName: 'Relative Unit',
					name: 'accountRelativeUnit',
					type: 'options',
					options: [ { name: 'Seconds', value: 'seconds' }, { name: 'Minutes', value: 'minutes' }, { name: 'Hours', value: 'hours' }, { name: 'Days', value: 'days' } ],
					default: 'minutes',
					displayOptions: { show: { operation: ['searchAccounts'], useAccountRelativeTime: [true] } },
				},
				{
					displayName: 'Use Account Sorting',
					name: 'useAccountSort',
					type: 'boolean',
					default: false,
					displayOptions: { show: { operation: ['searchAccounts'] } },
					description: 'If enabled, applies sorting to account search results. Otherwise, no order_by is sent.',
				},
				{
					displayName: 'Account Sort By',
					name: 'accountSortBy',
					type: 'options',
					options: [ { name: 'ID', value: 'id' }, { name: 'Label', value: 'label' } ],
					default: 'label',
					description: 'Field to sort accounts by when sorting is enabled.',
					displayOptions: { show: { operation: ['searchAccounts'], useAccountSort: [true] } },
				},
				{
					displayName: 'Account Sort Direction',
					name: 'accountSortDir',
					type: 'options',
					options: [ { name: 'Ascending', value: 'asc' }, { name: 'Descending', value: 'desc' } ],
					default: 'asc',
					description: 'Sorting direction applied to accounts when sorting is enabled.',
					displayOptions: { show: { operation: ['searchAccounts'], useAccountSort: [true] } },
				},
				// Positions filters
				{
					displayName: 'Position Filters (Light)',
					name: 'positionFiltersLight',
					type: 'collection',
					placeholder: 'Add a filter',
					default: {},
					displayOptions: { show: { operation: ['searchPositions'], lightOutput: [true] } },
					options: [
						{ displayName: 'ID', name: 'id', type: 'string', default: '' },
						{ displayName: 'Account ID', name: 'accountId', type: 'string', default: '' },
						{ displayName: 'Term ID', name: 'termId', type: 'string', default: '' },
						{ displayName: 'Curve ID', name: 'curveId', type: 'string', default: '' },
						{ displayName: 'Transaction Hash', name: 'transactionHash', type: 'string', default: '' },
						{ displayName: 'Block Number Min', name: 'blockNumberMin', type: 'number', default: 0 },
						{ displayName: 'Block Number Max', name: 'blockNumberMax', type: 'number', default: 0 },
						{ displayName: 'Created At From', name: 'createdAtFrom', type: 'dateTime', default: '' },
						{ displayName: 'Created At To', name: 'createdAtTo', type: 'dateTime', default: '' },
					],
				},
				{
					displayName: 'Position Filters (Full)',
					name: 'positionFiltersFull',
					type: 'collection',
					placeholder: 'Add a filter',
					default: {},
					displayOptions: { show: { operation: ['searchPositions'], lightOutput: [false] } },
					options: [
						{ displayName: 'ID', name: 'id', type: 'string', default: '' },
						{ displayName: 'Account ID', name: 'accountId', type: 'string', default: '' },
						{ displayName: 'Term ID', name: 'termId', type: 'string', default: '' },
						{ displayName: 'Curve ID', name: 'curveId', type: 'string', default: '' },
						{ displayName: 'Transaction Hash', name: 'transactionHash', type: 'string', default: '' },
						{ displayName: 'Block Number Min', name: 'blockNumberMin', type: 'number', default: 0 },
						{ displayName: 'Block Number Max', name: 'blockNumberMax', type: 'number', default: 0 },
						{ displayName: 'Created At From', name: 'createdAtFrom', type: 'dateTime', default: '' },
						{ displayName: 'Created At To', name: 'createdAtTo', type: 'dateTime', default: '' },
						{ displayName: 'Shares Min', name: 'sharesMin', type: 'string', default: '' },
						{ displayName: 'Shares Max', name: 'sharesMax', type: 'string', default: '' },
					],
				},
				{
					displayName: 'Use Position Relative Time Filter',
					name: 'usePositionRelativeTime',
					type: 'boolean',
					default: false,
					displayOptions: { show: { operation: ['searchPositions'] } },
					description: 'Filter positions created in the last X time units (uses created_at).',
				},
				{
					displayName: 'Relative Amount',
					name: 'positionRelativeAmount',
					type: 'number',
					default: 60,
					description: 'Number of time units to look back for positions.',
					displayOptions: { show: { operation: ['searchPositions'], usePositionRelativeTime: [true] } },
				},
				{
					displayName: 'Relative Unit',
					name: 'positionRelativeUnit',
					type: 'options',
					options: [ { name: 'Seconds', value: 'seconds' }, { name: 'Minutes', value: 'minutes' }, { name: 'Hours', value: 'hours' }, { name: 'Days', value: 'days' } ],
					default: 'minutes',
					description: 'Time unit for the positions relative time filter.',
					displayOptions: { show: { operation: ['searchPositions'], usePositionRelativeTime: [true] } },
				},
				{
					displayName: 'Use Position Sorting',
					name: 'usePositionSort',
					type: 'boolean',
					default: false,
					displayOptions: { show: { operation: ['searchPositions'] } },
					description: 'If enabled, applies sorting to position search results. Otherwise, no order_by is sent.',
				},
				{
					displayName: 'Position Sort By',
					name: 'positionSortBy',
					type: 'options',
					options: [ { name: 'Created At', value: 'created_at' }, { name: 'Block Number', value: 'block_number' } ],
					default: 'created_at',
					description: 'Field to sort positions by when sorting is enabled.',
					displayOptions: { show: { operation: ['searchPositions'], usePositionSort: [true] } },
				},
				{
					displayName: 'Position Sort Direction',
					name: 'positionSortDir',
					type: 'options',
					options: [ { name: 'Ascending', value: 'asc' }, { name: 'Descending', value: 'desc' } ],
					default: 'desc',
					description: 'Sorting direction applied to positions when sorting is enabled.',
					displayOptions: { show: { operation: ['searchPositions'], usePositionSort: [true] } },
				},
				// Vault filters
				{
					displayName: 'Vault Filters (Light)',
					name: 'vaultFiltersLight',
					type: 'collection',
					placeholder: 'Add a filter',
					default: {},
					displayOptions: { show: { operation: ['searchVaults'], lightOutput: [true] } },
					options: [
						{ displayName: 'Term ID', name: 'termId', type: 'string', default: '' },
						{ displayName: 'Curve ID', name: 'curveId', type: 'string', default: '' },
						{ displayName: 'Block Number Min', name: 'blockNumberMin', type: 'number', default: 0 },
						{ displayName: 'Block Number Max', name: 'blockNumberMax', type: 'number', default: 0 },
						{ displayName: 'Created At From', name: 'createdAtFrom', type: 'dateTime', default: '' },
						{ displayName: 'Created At To', name: 'createdAtTo', type: 'dateTime', default: '' },
					],
				},
				{
					displayName: 'Vault Filters (Full)',
					name: 'vaultFiltersFull',
					type: 'collection',
					placeholder: 'Add a filter',
					default: {},
					displayOptions: { show: { operation: ['searchVaults'], lightOutput: [false] } },
					options: [
						{ displayName: 'Term ID', name: 'termId', type: 'string', default: '' },
						{ displayName: 'Curve ID', name: 'curveId', type: 'string', default: '' },
						{ displayName: 'Block Number Min', name: 'blockNumberMin', type: 'number', default: 0 },
						{ displayName: 'Block Number Max', name: 'blockNumberMax', type: 'number', default: 0 },
						{ displayName: 'Created At From', name: 'createdAtFrom', type: 'dateTime', default: '' },
						{ displayName: 'Created At To', name: 'createdAtTo', type: 'dateTime', default: '' },
						{ displayName: 'Position Count Min', name: 'positionCountMin', type: 'number', default: 0 },
						{ displayName: 'Position Count Max', name: 'positionCountMax', type: 'number', default: 0 },
						{ displayName: 'Market Cap Min', name: 'marketCapMin', type: 'string', default: '' },
						{ displayName: 'Market Cap Max', name: 'marketCapMax', type: 'string', default: '' },
						{ displayName: 'Total Shares Min', name: 'totalSharesMin', type: 'string', default: '' },
						{ displayName: 'Total Shares Max', name: 'totalSharesMax', type: 'string', default: '' },
						{ displayName: 'Current Share Price Min', name: 'currentSharePriceMin', type: 'string', default: '' },
						{ displayName: 'Current Share Price Max', name: 'currentSharePriceMax', type: 'string', default: '' },
					],
				},
				{
					displayName: 'Use Vault Relative Time Filter',
					name: 'useVaultRelativeTime',
					type: 'boolean',
					default: false,
					displayOptions: { show: { operation: ['searchVaults'] } },
					description: 'Filter vaults created in the last X time units (uses created_at).',
				},
				{
					displayName: 'Relative Amount',
					name: 'vaultRelativeAmount',
					type: 'number',
					default: 60,
					description: 'Number of time units to look back for vaults.',
					displayOptions: { show: { operation: ['searchVaults'], useVaultRelativeTime: [true] } },
				},
				{
					displayName: 'Relative Unit',
					name: 'vaultRelativeUnit',
					type: 'options',
					options: [ { name: 'Seconds', value: 'seconds' }, { name: 'Minutes', value: 'minutes' }, { name: 'Hours', value: 'hours' }, { name: 'Days', value: 'days' } ],
					default: 'minutes',
					description: 'Time unit for the vaults relative time filter.',
					displayOptions: { show: { operation: ['searchVaults'], useVaultRelativeTime: [true] } },
				},
				{
					displayName: 'Use Vault Sorting',
					name: 'useVaultSort',
					type: 'boolean',
					default: false,
					displayOptions: { show: { operation: ['searchVaults'] } },
				},
				{
					displayName: 'Vault Sort By',
					name: 'vaultSortBy',
					type: 'options',
					options: [ { name: 'Created At', value: 'created_at' }, { name: 'Block Number', value: 'block_number' }, { name: 'Market Cap', value: 'market_cap' } ],
					default: 'created_at',
					displayOptions: { show: { operation: ['searchVaults'], useVaultSort: [true] } },
				},
				{
					displayName: 'Vault Sort Direction',
					name: 'vaultSortDir',
					type: 'options',
					options: [ { name: 'Ascending', value: 'asc' }, { name: 'Descending', value: 'desc' } ],
					default: 'desc',
					displayOptions: { show: { operation: ['searchVaults'], useVaultSort: [true] } },
				},

				{
					displayName: 'Atom Filters (Light)',
					name: 'atomFiltersLight',
					type: 'collection',
					placeholder: 'Add a filter',
					default: {},
					displayOptions: { show: { operation: ['searchAtoms'], lightOutput: [true] } },
					options: [
						{ displayName: 'Term ID', name: 'termId', type: 'string', default: '' },
						{ displayName: 'Label (contains)', name: 'label', type: 'string', default: '' },
						{ displayName: 'Type', name: 'type', type: 'string', default: '' },
						{ displayName: 'Wallet ID', name: 'walletId', type: 'string', default: '' },
						{ displayName: 'Transaction Hash', name: 'transactionHash', type: 'string', default: '' },
						{ displayName: 'Creator ID', name: 'creatorId', type: 'string', default: '' },
						{ displayName: 'Emoji', name: 'emoji', type: 'string', default: '' },
						{ displayName: 'Image (contains)', name: 'imageContains', type: 'string', default: '' },
						{ displayName: 'Data (contains)', name: 'dataContains', type: 'string', default: '' },
						{ displayName: 'Block Number Min', name: 'blockNumberMin', type: 'number', default: 0 },
						{ displayName: 'Block Number Max', name: 'blockNumberMax', type: 'number', default: 0 },
						{ displayName: 'Created At From', name: 'createdAtFrom', type: 'dateTime', default: '' },
						{ displayName: 'Created At To', name: 'createdAtTo', type: 'dateTime', default: '' },
					],
				},
				{
					displayName: 'Atom Filters (Full)',
					name: 'atomFiltersFull',
					type: 'collection',
					placeholder: 'Add a filter',
					default: {},
					displayOptions: { show: { operation: ['searchAtoms'], lightOutput: [false] } },
					options: [
						{ displayName: 'Term ID', name: 'termId', type: 'string', default: '' },
						{ displayName: 'Label (contains)', name: 'label', type: 'string', default: '' },
						{ displayName: 'Type', name: 'type', type: 'string', default: '' },
						{ displayName: 'Wallet ID', name: 'walletId', type: 'string', default: '' },
						{ displayName: 'Transaction Hash', name: 'transactionHash', type: 'string', default: '' },
						{ displayName: 'Creator ID', name: 'creatorId', type: 'string', default: '' },
						{ displayName: 'Creator Label (contains)', name: 'creatorLabel', type: 'string', default: '' },
						{ displayName: 'Creator Type', name: 'creatorType', type: 'string', default: '' },
						{ displayName: 'Creator Atom ID', name: 'creatorAtomId', type: 'string', default: '' },
						{ displayName: 'Emoji', name: 'emoji', type: 'string', default: '' },
						{ displayName: 'Image (contains)', name: 'imageContains', type: 'string', default: '' },
						{ displayName: 'Data (contains)', name: 'dataContains', type: 'string', default: '' },
						{ displayName: 'Block Number Min', name: 'blockNumberMin', type: 'number', default: 0 },
						{ displayName: 'Block Number Max', name: 'blockNumberMax', type: 'number', default: 0 },
						{ displayName: 'Created At From', name: 'createdAtFrom', type: 'dateTime', default: '' },
						{ displayName: 'Created At To', name: 'createdAtTo', type: 'dateTime', default: '' },
						{ displayName: 'Term Total Market Cap Min', name: 'termTotalMarketCapMin', type: 'string', default: '' },
						{ displayName: 'Term Total Market Cap Max', name: 'termTotalMarketCapMax', type: 'string', default: '' },
						{ displayName: 'Term Updated At From', name: 'termUpdatedAtFrom', type: 'dateTime', default: '' },
						{ displayName: 'Term Updated At To', name: 'termUpdatedAtTo', type: 'dateTime', default: '' },
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
					displayOptions: { show: { operation: ['searchAtoms'], useAtomSort: [true] } },
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
					description: 'Sorting direction applied to atoms when sorting is enabled.',
					displayOptions: { show: { operation: ['searchAtoms'], useAtomSort: [true] } },
				},
				{
					displayName: 'Use Atom Sorting',
					name: 'useAtomSort',
					type: 'boolean',
					default: false,
					displayOptions: { show: { operation: ['searchAtoms'] } },
					description: 'Apply sorting to atom search results',
				},
				{
					displayName: 'Triple Filters (Light)',
					name: 'tripleFiltersLight',
					type: 'collection',
					placeholder: 'Add a filter',
					default: {},
					displayOptions: { show: { operation: ['searchTriples'], lightOutput: [true] } },
					options: [
						{ displayName: 'Triple Term ID', name: 'tripleId', type: 'string', default: '' },
						{ displayName: 'Created At From', name: 'createdAtFrom', type: 'dateTime', default: '' },
						{ displayName: 'Created At To', name: 'createdAtTo', type: 'dateTime', default: '' },
						{ displayName: 'Atom Term ID (any position)', name: 'atomTermId', type: 'string', default: '' },
						{ displayName: 'Atom Label (contains, any position)', name: 'atomLabel', type: 'string', default: '' },
						{ displayName: 'Subject Term ID', name: 'subjectTermId', type: 'string', default: '' },
						{ displayName: 'Predicate Term ID', name: 'predicateTermId', type: 'string', default: '' },
						{ displayName: 'Object Term ID', name: 'objectTermId', type: 'string', default: '' },
						{ displayName: 'Subject Label (contains)', name: 'subjectLabel', type: 'string', default: '' },
						{ displayName: 'Predicate Label (contains)', name: 'predicateLabel', type: 'string', default: '' },
						{ displayName: 'Object Label (contains)', name: 'objectLabel', type: 'string', default: '' },
					],
				},
				{
					displayName: 'Triple Filters (Full)',
					name: 'tripleFiltersFull',
					type: 'collection',
					placeholder: 'Add a filter',
					default: {},
					displayOptions: { show: { operation: ['searchTriples'], lightOutput: [false] } },
					options: [
						{ displayName: 'Triple Term ID', name: 'tripleId', type: 'string', default: '' },
						{ displayName: 'Transaction Hash', name: 'transactionHash', type: 'string', default: '' },
						{ displayName: 'Creator ID', name: 'creatorId', type: 'string', default: '' },
						{ displayName: 'Block Number Min', name: 'blockNumberMin', type: 'number', default: 0 },
						{ displayName: 'Block Number Max', name: 'blockNumberMax', type: 'number', default: 0 },
						{ displayName: 'Created At From', name: 'createdAtFrom', type: 'dateTime', default: '' },
						{ displayName: 'Created At To', name: 'createdAtTo', type: 'dateTime', default: '' },
						{ displayName: 'Atom Term ID (any position)', name: 'atomTermId', type: 'string', default: '' },
						{ displayName: 'Atom Label (contains, any position)', name: 'atomLabel', type: 'string', default: '' },
						{ displayName: 'Subject Term ID', name: 'subjectTermId', type: 'string', default: '' },
						{ displayName: 'Predicate Term ID', name: 'predicateTermId', type: 'string', default: '' },
						{ displayName: 'Object Term ID', name: 'objectTermId', type: 'string', default: '' },
						{ displayName: 'Subject Label (contains)', name: 'subjectLabel', type: 'string', default: '' },
						{ displayName: 'Predicate Label (contains)', name: 'predicateLabel', type: 'string', default: '' },
						{ displayName: 'Object Label (contains)', name: 'objectLabel', type: 'string', default: '' },
						{ displayName: 'Subject Type', name: 'subjectType', type: 'string', default: '' },
						{ displayName: 'Predicate Type', name: 'predicateType', type: 'string', default: '' },
						{ displayName: 'Object Type', name: 'objectType', type: 'string', default: '' },
						{ displayName: 'Subject Emoji', name: 'subjectEmoji', type: 'string', default: '' },
						{ displayName: 'Predicate Emoji', name: 'predicateEmoji', type: 'string', default: '' },
						{ displayName: 'Object Emoji', name: 'objectEmoji', type: 'string', default: '' },
						{ displayName: 'Subject Creator ID', name: 'subjectCreatorId', type: 'string', default: '' },
						{ displayName: 'Predicate Creator ID', name: 'predicateCreatorId', type: 'string', default: '' },
						{ displayName: 'Object Creator ID', name: 'objectCreatorId', type: 'string', default: '' },
						{ displayName: 'Subject Data (contains)', name: 'subjectDataContains', type: 'string', default: '' },
						{ displayName: 'Predicate Data (contains)', name: 'predicateDataContains', type: 'string', default: '' },
						{ displayName: 'Object Data (contains)', name: 'objectDataContains', type: 'string', default: '' },
						{ displayName: 'Subject Image (contains)', name: 'subjectImageContains', type: 'string', default: '' },
						{ displayName: 'Predicate Image (contains)', name: 'predicateImageContains', type: 'string', default: '' },
						{ displayName: 'Object Image (contains)', name: 'objectImageContains', type: 'string', default: '' },
					],
				},
				{
					displayName: 'Use Triple Relative Time Filter',
					name: 'useTripleRelativeTime',
					type: 'boolean',
					default: false,
					displayOptions: { show: { operation: ['searchTriples'] } },
					description: 'Filter triples created in the last X time units',
				},
				{
					displayName: 'Relative Amount',
					name: 'tripleRelativeAmount',
					type: 'number',
					default: 60,
					displayOptions: { show: { operation: ['searchTriples'], useTripleRelativeTime: [true] } },
				},
				{
					displayName: 'Relative Unit',
					name: 'tripleRelativeUnit',
					type: 'options',
					options: [
						{ name: 'Seconds', value: 'seconds' },
						{ name: 'Minutes', value: 'minutes' },
						{ name: 'Hours', value: 'hours' },
						{ name: 'Days', value: 'days' },
					],
					default: 'minutes',
					displayOptions: { show: { operation: ['searchTriples'], useTripleRelativeTime: [true] } },
				},
				{
					displayName: 'Use Triple Sorting',
					name: 'useTripleSort',
					type: 'boolean',
					default: false,
					displayOptions: { show: { operation: ['searchTriples'] } },
					description: 'Apply sorting to triple search results',
				},
				{
					displayName: 'Triple Sort By',
					name: 'tripleSortBy',
					type: 'options',
					options: [
						{ name: 'Created At', value: 'created_at' },
						{ name: 'Block Number', value: 'block_number' },
					],
					default: 'created_at',
					displayOptions: { show: { operation: ['searchTriples'], useTripleSort: [true] } },
				},
				{
					displayName: 'Triple Sort Direction',
					name: 'tripleSortDir',
					type: 'options',
					options: [
						{ name: 'Descending', value: 'desc' },
						{ name: 'Ascending', value: 'asc' },
					],
					default: 'desc',
					displayOptions: { show: { operation: ['searchTriples'], useTripleSort: [true] } },
				},
				{
					displayName: 'Limit',
					name: 'limit',
					type: 'number',
					default: 10,
					description: 'Max items to return',
					displayOptions: {
						show: { operation: ['searchAtoms', 'searchTriples','searchAccounts','searchPositions','searchVaults'] },
					},
				},
				{
					displayName: 'Offset',
					name: 'offset',
					type: 'number',
					default: 0,
					description: 'Skip this many items',
						displayOptions: {
							show: { operation: ['searchAtoms', 'searchTriples','searchAccounts','searchPositions','searchVaults'] },
						},
					},
                {
                    displayName: '💜 Powered by Istarengwa - CEO The Hacking Project',
                    name: 'poweredByIstarengwa',
                    type: 'notice',
                    default: '',
                },
				],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
					const endpoint = this.getNodeParameter('endpoint', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;

			// Testnet-only module
					const module = Base;

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
				case 'fetchAccounts':
					result = await module.fetchAccounts(
						client,
						10,
						0,
						(this.getNodeParameter('lightOutput', i, true) as boolean) ? 'light' : 'full',
					);
					break;
				case 'searchAccounts': {
					const isLight = this.getNodeParameter('lightOutput', i, true) as boolean;
					const filters = (this.getNodeParameter(isLight ? 'accountFiltersLight' : 'accountFiltersFull', i, {}) as IDataObject) || {};
					const useRel = this.getNodeParameter('useAccountRelativeTime', i, false) as boolean;
					if (useRel) {
						const amount = (this.getNodeParameter('accountRelativeAmount', i, 60) as number) ?? 60;
						const unit = (this.getNodeParameter('accountRelativeUnit', i, 'minutes') as string) as 'seconds' | 'minutes' | 'hours' | 'days';
						const msPerUnit = { seconds: 1000, minutes: 60 * 1000, hours: 60 * 60 * 1000, days: 24 * 60 * 60 * 1000 };
						const fromIso = new Date(Date.now() - Math.max(0, amount) * msPerUnit[unit]).toISOString();
						(filters as IDataObject).createdAtFrom = fromIso;
					}
					const useSort = this.getNodeParameter('useAccountSort', i, false) as boolean;
					const sortBy = useSort ? ((this.getNodeParameter('accountSortBy', i, 'label') as string) as 'id' | 'label') : undefined;
					const sortDir = useSort ? ((this.getNodeParameter('accountSortDir', i, 'asc') as string) as 'asc' | 'desc') : undefined;
					result = await module.searchAccounts(
						client,
						{
							id: (filters.id as string) || undefined,
							label: (filters.label as string) || undefined,
							type: (filters.type as string) || undefined,
							atomId: (filters.atomId as string) || undefined,
							imageContains: (filters.imageContains as string) || undefined,
							createdAtFrom: (filters.createdAtFrom as string) || undefined,
							createdAtTo: (filters.createdAtTo as string) || undefined,
						},
						10,
						0,
						sortBy,
						sortDir,
						isLight ? 'light' : 'full',
					);
					break; }
				case 'fetchPositions':
					result = await module.fetchPositions(
						client,
						10,
						0,
						(this.getNodeParameter('lightOutput', i, true) as boolean) ? 'light' : 'full',
					);
					break;
				case 'searchPositions': {
					const isLight = this.getNodeParameter('lightOutput', i, true) as boolean;
					const filters = (this.getNodeParameter(isLight ? 'positionFiltersLight' : 'positionFiltersFull', i, {}) as IDataObject) || {};
					const useRel = this.getNodeParameter('usePositionRelativeTime', i, false) as boolean;
					if (useRel) {
						const amount = (this.getNodeParameter('positionRelativeAmount', i, 60) as number) ?? 60;
						const unit = (this.getNodeParameter('positionRelativeUnit', i, 'minutes') as string) as 'seconds' | 'minutes' | 'hours' | 'days';
						const msPerUnit = { seconds: 1000, minutes: 60 * 1000, hours: 60 * 60 * 1000, days: 24 * 60 * 60 * 1000 };
						const fromIso = new Date(Date.now() - Math.max(0, amount) * msPerUnit[unit]).toISOString();
						(filters as IDataObject).createdAtFrom = fromIso;
					}
					const useSort = this.getNodeParameter('usePositionSort', i, false) as boolean;
					const sortBy = useSort ? ((this.getNodeParameter('positionSortBy', i, 'created_at') as string) as 'created_at' | 'block_number') : undefined;
					const sortDir = useSort ? ((this.getNodeParameter('positionSortDir', i, 'desc') as string) as 'asc' | 'desc') : undefined;
					result = await module.searchPositions(
						client,
						{
							id: (filters.id as string) || undefined,
							accountId: (filters.accountId as string) || undefined,
							termId: (filters.termId as string) || undefined,
							curveId: (filters.curveId as string) || undefined,
							transactionHash: (filters.transactionHash as string) || undefined,
							blockNumberMin: (filters.blockNumberMin as number) ?? undefined,
							blockNumberMax: (filters.blockNumberMax as number) ?? undefined,
							createdAtFrom: (filters.createdAtFrom as string) || undefined,
							createdAtTo: (filters.createdAtTo as string) || undefined,
							sharesMin: (filters.sharesMin as string) || undefined,
							sharesMax: (filters.sharesMax as string) || undefined,
						},
						10,
						0,
						sortBy,
						sortDir,
						isLight ? 'light' : 'full',
					);
					break; }
				case 'fetchVaults':
					result = await module.fetchVaults(
						client,
						10,
						0,
						(this.getNodeParameter('lightOutput', i, true) as boolean) ? 'light' : 'full',
					);
					break;
				case 'searchVaults': {
					const isLight = this.getNodeParameter('lightOutput', i, true) as boolean;
					const filters = (this.getNodeParameter(isLight ? 'vaultFiltersLight' : 'vaultFiltersFull', i, {}) as IDataObject) || {};
					const useRel = this.getNodeParameter('useVaultRelativeTime', i, false) as boolean;
					if (useRel) {
						const amount = (this.getNodeParameter('vaultRelativeAmount', i, 60) as number) ?? 60;
						const unit = (this.getNodeParameter('vaultRelativeUnit', i, 'minutes') as string) as 'seconds' | 'minutes' | 'hours' | 'days';
						const msPerUnit = { seconds: 1000, minutes: 60 * 1000, hours: 60 * 60 * 1000, days: 24 * 60 * 60 * 1000 };
						const fromIso = new Date(Date.now() - Math.max(0, amount) * msPerUnit[unit]).toISOString();
						(filters as IDataObject).createdAtFrom = fromIso;
					}
					const useSort = this.getNodeParameter('useVaultSort', i, false) as boolean;
					const sortBy = useSort ? ((this.getNodeParameter('vaultSortBy', i, 'created_at') as string) as 'created_at' | 'block_number' | 'market_cap') : undefined;
					const sortDir = useSort ? ((this.getNodeParameter('vaultSortDir', i, 'desc') as string) as 'asc' | 'desc') : undefined;
					result = await module.searchVaults(
						client,
						{
							termId: (filters.termId as string) || undefined,
							curveId: (filters.curveId as string) || undefined,
							blockNumberMin: (filters.blockNumberMin as number) ?? undefined,
							blockNumberMax: (filters.blockNumberMax as number) ?? undefined,
							createdAtFrom: (filters.createdAtFrom as string) || undefined,
							createdAtTo: (filters.createdAtTo as string) || undefined,
							positionCountMin: (filters.positionCountMin as number) ?? undefined,
							positionCountMax: (filters.positionCountMax as number) ?? undefined,
							marketCapMin: (filters.marketCapMin as string) || undefined,
							marketCapMax: (filters.marketCapMax as string) || undefined,
							totalSharesMin: (filters.totalSharesMin as string) || undefined,
							totalSharesMax: (filters.totalSharesMax as string) || undefined,
							currentSharePriceMin: (filters.currentSharePriceMin as string) || undefined,
							currentSharePriceMax: (filters.currentSharePriceMax as string) || undefined,
						},
						10,
						0,
						sortBy,
						sortDir,
						isLight ? 'light' : 'full',
					);
					break; }
				case 'searchAtoms': {
					const isLight = this.getNodeParameter('lightOutput', i, false) as boolean;
					const filters = (this.getNodeParameter(isLight ? 'atomFiltersLight' : 'atomFiltersFull', i, {}) as IDataObject) || {};
					const limit = (this.getNodeParameter('limit', i, 10) as number) ?? 10;
					const offset = (this.getNodeParameter('offset', i, 0) as number) ?? 0;
					const useAtomSort = this.getNodeParameter('useAtomSort', i, false) as boolean;
					const sortBy = useAtomSort ? ((this.getNodeParameter('atomSortBy', i, 'created_at') as string) as 'created_at' | 'block_number') : undefined;
					const sortDir = useAtomSort ? ((this.getNodeParameter('atomSortDir', i, 'desc') as string) as 'asc' | 'desc') : undefined;
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
					const isLightT = this.getNodeParameter('lightOutput', i, false) as boolean;
					const filters = (this.getNodeParameter(isLightT ? 'tripleFiltersLight' : 'tripleFiltersFull', i, {}) as IDataObject) || {};
					const limit = (this.getNodeParameter('limit', i, 10) as number) ?? 10;
					const offset = (this.getNodeParameter('offset', i, 0) as number) ?? 0;
					const useTripleRelative = this.getNodeParameter('useTripleRelativeTime', i, false) as boolean;
					if (useTripleRelative) {
						const amount = (this.getNodeParameter('tripleRelativeAmount', i, 60) as number) ?? 60;
						const unit = (this.getNodeParameter('tripleRelativeUnit', i, 'minutes') as string) as 'seconds' | 'minutes' | 'hours' | 'days';
						const msPerUnit = { seconds: 1000, minutes: 60 * 1000, hours: 60 * 60 * 1000, days: 24 * 60 * 60 * 1000 };
						const now = Date.now();
						const fromIso = new Date(now - Math.max(0, amount) * msPerUnit[unit]).toISOString();
						(filters as IDataObject).createdAtFrom = fromIso;
					}
					const useTripleSort = this.getNodeParameter('useTripleSort', i, false) as boolean;
					const tripleSortBy = useTripleSort ? ((this.getNodeParameter('tripleSortBy', i, 'created_at') as string) as 'created_at' | 'block_number') : undefined;
					const tripleSortDir = useTripleSort ? ((this.getNodeParameter('tripleSortDir', i, 'desc') as string) as 'asc' | 'desc') : undefined;
					result = await module.searchTriples(
						client,
						{
							tripleId: (filters.tripleId as string) || undefined,
							atomTermId: (filters.atomTermId as string) || undefined,
							atomLabel: (filters.atomLabel as string) || undefined,
							createdAtFrom: (filters.createdAtFrom as string) || undefined,
							createdAtTo: (filters.createdAtTo as string) || undefined,
						},
						limit,
						offset,
						tripleSortBy,
						tripleSortDir,
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
