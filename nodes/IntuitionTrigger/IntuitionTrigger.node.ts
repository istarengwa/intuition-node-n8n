import {
  IDataObject,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IPollFunctions,
} from 'n8n-workflow';

import { GraphQLClient } from 'graphql-request';
import * as BaseSepolia from '../IntuitionFetch/modules/BaseSepolia';

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
          { name: 'Intuition Testnet (Base Sepolia)', value: 'baseSepolia' },
        ],
        default: 'baseSepolia',
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
        ],
        default: 'atoms',
        description: 'Which resource to poll for new items',
      },
      // ATOM FILTERS
      {
        displayName: 'Atom Filters',
        name: 'atomFilters',
        type: 'collection',
        placeholder: 'Add a filter',
        default: {},
        displayOptions: { show: { resource: ['atoms'] } },
        options: [
          { displayName: 'Term ID', name: 'termId', type: 'string', default: '' },
          { displayName: 'Label (contains)', name: 'label', type: 'string', default: '' },
          { displayName: 'Type', name: 'type', type: 'string', default: '' },
          { displayName: 'Wallet ID', name: 'walletId', type: 'string', default: '' },
          { displayName: 'Transaction Hash', name: 'transactionHash', type: 'string', default: '' },
          { displayName: 'Emoji', name: 'emoji', type: 'string', default: '' },
          { displayName: 'Image (contains)', name: 'imageContains', type: 'string', default: '' },
        ],
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
      // TRIPLE FILTERS
      {
        displayName: 'Triple Filters',
        name: 'tripleFilters',
        type: 'collection',
        placeholder: 'Add a filter',
        default: {},
        displayOptions: { show: { resource: ['triples'] } },
        options: [
          { displayName: 'Triple Term ID', name: 'tripleId', type: 'string', default: '' },
          { displayName: 'Atom Term ID', name: 'atomTermId', type: 'string', default: '' },
          { displayName: 'Atom Label (contains)', name: 'atomLabel', type: 'string', default: '' },
        ],
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
    ],
  };

  async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
    const endpoint = this.getNodeParameter('endpoint') as 'baseSepolia';
    const resource = this.getNodeParameter('resource') as 'atoms' | 'triples';
    const pageSize = (this.getNodeParameter('pageSize', 50) as number) ?? 50;

    const module = BaseSepolia;
    const endpoints = module.ENDPOINTS as Record<string, { url: string }>;
    const client = new GraphQLClient(endpoints[endpoint].url);

    const items: INodeExecutionData[] = [];
    const data = this.getWorkflowStaticData('node') as IDataObject;

    const light = (this.getNodeParameter('lightOutput', false) as boolean) ?? false;

    if (resource === 'atoms') {
      const filters = (this.getNodeParameter('atomFilters', {}) as IDataObject) || {};
      const startFromNow = (this.getNodeParameter('startFromNow', true) as boolean) ?? true;
      const lastCursor = (data.lastAtomCreatedAt as string) || '';

      if (!lastCursor && startFromNow) {
        data.lastAtomCreatedAt = new Date().toISOString();
        return null; // initialize cursor without emitting historical data
      }

      if (lastCursor) {
        filters.createdAtFrom = lastCursor;
      }

      const result = (await module.searchAtoms(
        client,
        {
          termId: (filters.termId as string) || undefined,
          label: (filters.label as string) || undefined,
          type: (filters.type as string) || undefined,
          walletId: (filters.walletId as string) || undefined,
          transactionHash: (filters.transactionHash as string) || undefined,
          emoji: (filters.emoji as string) || undefined,
          imageContains: (filters.imageContains as string) || undefined,
          createdAtFrom: (filters.createdAtFrom as string) || undefined,
        },
        pageSize,
        0,
        'created_at',
        'asc',
        light ? 'light' : 'full',
      )) as IDataObject;

      const atoms = ((result as any).atoms || []) as Array<IDataObject & { created_at?: string }>;
      for (const atom of atoms) {
        items.push({ json: atom });
      }

      if (atoms.length > 0) {
        // advance cursor to the latest created_at
        const latest = atoms[atoms.length - 1].created_at;
        if (latest) data.lastAtomCreatedAt = latest;
      }
    } else if (resource === 'triples') {
      const filters = (this.getNodeParameter('tripleFilters', {}) as IDataObject) || {};
      const startFromNow = (this.getNodeParameter('startFromNow', true) as boolean) ?? true;
      const maxSeen = (this.getNodeParameter('maxSeen', 10000) as number) ?? 10000;

      // simple persistent deduplication by term_id
      const seen = (data.seenTripleIds as Record<string, number>) || {};
      const inited = !!data.seenTriplesInitialized;

      const result = (await module.searchTriples(
        client,
        {
          tripleId: (filters.tripleId as string) || undefined,
          atomTermId: (filters.atomTermId as string) || undefined,
          atomLabel: (filters.atomLabel as string) || undefined,
        },
        pageSize,
        0,
        undefined,
        undefined,
        light ? 'light' : 'full',
      )) as IDataObject;

      const triples = ((result as any).triples || []) as Array<IDataObject & { term_id?: string }>;

      if (!inited && startFromNow) {
        // seed seen set with current snapshot, do not emit
        for (const t of triples) {
          const id = String(t.term_id || '');
          if (id) seen[id] = Date.now();
        }
        data.seenTripleIds = seen;
        data.seenTriplesInitialized = true;
        return null;
      }

      // emit only new unseen triples
      for (const t of triples) {
        const id = String(t.term_id || '');
        if (!id) continue;
        if (!seen[id]) {
          seen[id] = Date.now();
          items.push({ json: t });
        }
      }

      // trim seen map if needed
      const keys = Object.keys(seen);
      if (keys.length > maxSeen) {
        // drop oldest entries
        const sorted = keys.sort((a, b) => seen[a] - seen[b]);
        const toDrop = sorted.slice(0, keys.length - maxSeen);
        for (const k of toDrop) delete seen[k];
      }
      data.seenTripleIds = seen;
      data.seenTriplesInitialized = true;
    }

    if (items.length === 0) return null;
    return [items];
  }
}
