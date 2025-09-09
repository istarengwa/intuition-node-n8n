import { INodeExecutionData, INodeType, INodeTypeDescription, IPollFunctions } from 'n8n-workflow';

import { GraphQLClient } from 'graphql-request';
import * as Base from '../IntuitionFetch/modules/Base';
import { handleAtomsPoll } from './modules/AtomsTrigger';
import { handleTriplesPoll } from './modules/TriplesTrigger';
import { handleAccountsPoll } from './modules/AccountsTrigger';
import { handlePositionsPoll } from './modules/PositionsTrigger';
import { handleVaultsPoll } from './modules/VaultsTrigger';

export class IntuitionTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Intuition Trigger',
    name: 'intuitionTrigger',
    group: ['trigger'],
    version: 1,
    description: 'Emit new atoms or triples from Intuition',
    defaults: {
      name: 'Intuition Trigger',
    },
    inputs: [],
    outputs: ['main'],
    polling: true,
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
        displayName: 'Light Output',
        name: 'lightOutput',
        type: 'boolean',
        default: false,
        description: 'Return a lighter payload (older shape). For triples, still includes created_at.',
      },
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        options: [
          { name: 'Atoms', value: 'atoms' },
          { name: 'Triples', value: 'triples' },
          { name: 'Accounts', value: 'accounts' },
          { name: 'Positions', value: 'positions' },
          { name: 'Vaults', value: 'vaults' },
        ],
        default: 'atoms',
        description: 'Which resource to poll for new items',
      },
      // ATOM FILTERS (Light)
      {
        displayName: 'Atom Filters (Light)',
        name: 'atomFiltersLight',
        type: 'collection',
        placeholder: 'Add a filter',
        default: {},
        displayOptions: { show: { resource: ['atoms'], lightOutput: [true] } },
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
      // ATOM FILTERS (Full)
      {
        displayName: 'Atom Filters (Full)',
        name: 'atomFiltersFull',
        type: 'collection',
        placeholder: 'Add a filter',
        default: {},
        displayOptions: { show: { resource: ['atoms'], lightOutput: [false] } },
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
      // Atom relative time + sorting
      {
        displayName: 'Use Atom Relative Time Filter',
        name: 'useAtomRelativeTime',
        type: 'boolean',
        default: false,
        displayOptions: { show: { resource: ['atoms'] } },
        description: 'Filter atoms created in the last X time units (uses created_at).',
      },
      {
        displayName: 'Relative Amount',
        name: 'atomRelativeAmount',
        type: 'number',
        default: 60,
        displayOptions: { show: { resource: ['atoms'], useAtomRelativeTime: [true] } },
      },
      {
        displayName: 'Relative Unit',
        name: 'atomRelativeUnit',
        type: 'options',
        options: [
          { name: 'Seconds', value: 'seconds' },
          { name: 'Minutes', value: 'minutes' },
          { name: 'Hours', value: 'hours' },
          { name: 'Days', value: 'days' },
        ],
        default: 'minutes',
        displayOptions: { show: { resource: ['atoms'], useAtomRelativeTime: [true] } },
      },
      {
        displayName: 'Use Atom Sorting',
        name: 'useAtomSort',
        type: 'boolean',
        default: false,
        displayOptions: { show: { resource: ['atoms'] } },
        description: 'Apply sorting to atom results',
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
        displayOptions: { show: { resource: ['atoms'], useAtomSort: [true] } },
      },
      {
        displayName: 'Atom Sort Direction',
        name: 'atomSortDir',
        type: 'options',
        options: [
          { name: 'Descending', value: 'desc' },
          { name: 'Ascending', value: 'asc' },
        ],
        default: 'asc',
        displayOptions: { show: { resource: ['atoms'], useAtomSort: [true] } },
      },
      // ACCOUNTS
      {
        displayName: 'Account Filters (Light)',
        name: 'accountFiltersLight',
        type: 'collection',
        placeholder: 'Add a filter',
        default: {},
        displayOptions: { show: { resource: ['accounts'], lightOutput: [true] } },
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
        displayOptions: { show: { resource: ['accounts'], lightOutput: [false] } },
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
        displayOptions: { show: { resource: ['accounts'] } },
        description: 'Filter accounts with activity in the last X time units (uses positions.created_at).',
      },
      {
        displayName: 'Relative Amount',
        name: 'accountRelativeAmount',
        type: 'number',
        default: 60,
        displayOptions: { show: { resource: ['accounts'], useAccountRelativeTime: [true] } },
      },
      {
        displayName: 'Relative Unit',
        name: 'accountRelativeUnit',
        type: 'options',
        options: [ { name: 'Seconds', value: 'seconds' }, { name: 'Minutes', value: 'minutes' }, { name: 'Hours', value: 'hours' }, { name: 'Days', value: 'days' } ],
        default: 'minutes',
        displayOptions: { show: { resource: ['accounts'], useAccountRelativeTime: [true] } },
      },
      {
        displayName: 'Use Account Sorting',
        name: 'useAccountSort',
        type: 'boolean',
        default: false,
        displayOptions: { show: { resource: ['accounts'] } },
      },
      {
        displayName: 'Account Sort By',
        name: 'accountSortBy',
        type: 'options',
        options: [ { name: 'ID', value: 'id' }, { name: 'Label', value: 'label' } ],
        default: 'label',
        displayOptions: { show: { resource: ['accounts'], useAccountSort: [true] } },
      },
      {
        displayName: 'Account Sort Direction',
        name: 'accountSortDir',
        type: 'options',
        options: [ { name: 'Ascending', value: 'asc' }, { name: 'Descending', value: 'desc' } ],
        default: 'asc',
        displayOptions: { show: { resource: ['accounts'], useAccountSort: [true] } },
      },
      {
        displayName: 'Start From Now',
        name: 'startFromNow',
        type: 'boolean',
        default: true,
        description: 'On first run, ignore existing data and emit only new items thereafter',
      },
      {
        displayName: 'Page Size',
        name: 'pageSize',
        type: 'number',
        typeOptions: { minValue: 1, maxValue: 200 },
        default: 50,
        description: 'Max items to check per poll',
      },
      // TRIPLE FILTERS (Light)
      {
        displayName: 'Triple Filters (Light)',
        name: 'tripleFiltersLight',
        type: 'collection',
        placeholder: 'Add a filter',
        default: {},
        displayOptions: { show: { resource: ['triples'], lightOutput: [true] } },
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
      // TRIPLE FILTERS (Full)
      {
        displayName: 'Triple Filters (Full)',
        name: 'tripleFiltersFull',
        type: 'collection',
        placeholder: 'Add a filter',
        default: {},
        displayOptions: { show: { resource: ['triples'], lightOutput: [false] } },
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
      // Triple relative time + sorting
      {
        displayName: 'Use Triple Relative Time Filter',
        name: 'useTripleRelativeTime',
        type: 'boolean',
        default: false,
        displayOptions: { show: { resource: ['triples'] } },
        description: 'Filter triples created in the last X time units (uses created_at).',
      },
      {
        displayName: 'Relative Amount',
        name: 'tripleRelativeAmount',
        type: 'number',
        default: 60,
        displayOptions: { show: { resource: ['triples'], useTripleRelativeTime: [true] } },
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
        displayOptions: { show: { resource: ['triples'], useTripleRelativeTime: [true] } },
      },
      {
        displayName: 'Use Triple Sorting',
        name: 'useTripleSort',
        type: 'boolean',
        default: false,
        displayOptions: { show: { resource: ['triples'] } },
        description: 'Apply sorting to triple results',
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
        displayOptions: { show: { resource: ['triples'], useTripleSort: [true] } },
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
        displayOptions: { show: { resource: ['triples'], useTripleSort: [true] } },
      },
      {
        displayName: 'Max Seen Triples',
        name: 'maxSeen',
        type: 'number',
        typeOptions: { minValue: 100 },
        default: 10000,
        description: 'Maximum number of seen triple IDs to remember for deduplication',
        displayOptions: { show: { resource: ['triples'] } },
      },
      // Footer notice
      {
        displayName: '💜 Powered by Istarengwa - CEO The Hacking Project',
        name: 'poweredByIstarengwa',
        type: 'notice',
        default: '',
      },
    ],
  };

  async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
    const endpoint = this.getNodeParameter('endpoint') as string;
    const resource = this.getNodeParameter('resource') as 'atoms' | 'triples';
    const module = Base;
    const endpoints = module.ENDPOINTS as Record<string, { url: string }>;
    const client = new GraphQLClient(endpoints[endpoint].url);

    const light = (this.getNodeParameter('lightOutput', false) as boolean) ?? false;

    if (resource === 'atoms') {
      const res = await handleAtomsPoll(this, client, light);
      if (!res) return null;
      return [res];
    }

    if (resource === 'triples') {
      const res = await handleTriplesPoll(this, client, light);
      if (!res) return null;
      return [res];
    }
    if (resource === 'accounts') {
      const res = await handleAccountsPoll(this, client, light);
      if (!res) return null;
      return [res];
    }
    if (resource === 'positions') {
      const res = await handlePositionsPoll(this, client, light);
      if (!res) return null;
      return [res];
    }
    if (resource === 'vaults') {
      const res = await handleVaultsPoll(this, client, light);
      if (!res) return null;
      return [res];
    }
    return null;
  }
}
