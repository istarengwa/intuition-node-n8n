import {
  IDataObject,
  INodeExecutionData,
  IPollFunctions,
} from 'n8n-workflow';

import { GraphQLClient } from 'graphql-request';
import * as Base from '../../IntuitionFetch/modules/Base';

export async function handleTriplesPoll(
  fn: IPollFunctions,
  client: GraphQLClient,
  light: boolean,
): Promise<INodeExecutionData[] | null> {
  const items: INodeExecutionData[] = [];

  const filters = (fn.getNodeParameter(light ? 'tripleFiltersLight' : 'tripleFiltersFull', {}) as IDataObject) || {};
  const pageSize = (fn.getNodeParameter('pageSize', 50) as number) ?? 50;
  const startFromNow = (fn.getNodeParameter('startFromNow', true) as boolean) ?? true;

  // persistent dedup by term_id
  const data = fn.getWorkflowStaticData('node') as IDataObject;
  const seen = (data.seenTripleIds as Record<string, number>) || {};
  const inited = !!data.seenTriplesInitialized;

  const useTripleRel = (fn.getNodeParameter('useTripleRelativeTime', false) as boolean) ?? false;
  if (useTripleRel) {
    const amount = (fn.getNodeParameter('tripleRelativeAmount', 60) as number) ?? 60;
    const unit = (fn.getNodeParameter('tripleRelativeUnit', 'minutes') as string) as 'seconds' | 'minutes' | 'hours' | 'days';
    const msPerUnit = { seconds: 1000, minutes: 60 * 1000, hours: 60 * 60 * 1000, days: 24 * 60 * 60 * 1000 };
    const fromIso = new Date(Date.now() - Math.max(0, amount) * msPerUnit[unit]).toISOString();
    (filters as IDataObject).createdAtFrom = fromIso;
  }

  const useTripleSort = (fn.getNodeParameter('useTripleSort', false) as boolean) ?? false;
  const tripleSortBy = useTripleSort ? ((fn.getNodeParameter('tripleSortBy', 'created_at') as string) as 'created_at' | 'block_number') : undefined;
  const tripleSortDir = useTripleSort ? ((fn.getNodeParameter('tripleSortDir', 'desc') as string) as 'asc' | 'desc') : undefined;

  const result = (await Base.searchTriples(
    client,
    {
      tripleId: (filters.tripleId as string) || undefined,
      atomTermId: (filters.atomTermId as string) || undefined,
      atomLabel: (filters.atomLabel as string) || undefined,
      subjectTermId: (filters.subjectTermId as string) || undefined,
      predicateTermId: (filters.predicateTermId as string) || undefined,
      objectTermId: (filters.objectTermId as string) || undefined,
      subjectLabel: (filters.subjectLabel as string) || undefined,
      predicateLabel: (filters.predicateLabel as string) || undefined,
      objectLabel: (filters.objectLabel as string) || undefined,
      subjectType: (filters.subjectType as string) || undefined,
      predicateType: (filters.predicateType as string) || undefined,
      objectType: (filters.objectType as string) || undefined,
      subjectEmoji: (filters.subjectEmoji as string) || undefined,
      predicateEmoji: (filters.predicateEmoji as string) || undefined,
      objectEmoji: (filters.objectEmoji as string) || undefined,
      subjectCreatorId: (filters.subjectCreatorId as string) || undefined,
      predicateCreatorId: (filters.predicateCreatorId as string) || undefined,
      objectCreatorId: (filters.objectCreatorId as string) || undefined,
      subjectDataContains: (filters.subjectDataContains as string) || undefined,
      predicateDataContains: (filters.predicateDataContains as string) || undefined,
      objectDataContains: (filters.objectDataContains as string) || undefined,
      subjectImageContains: (filters.subjectImageContains as string) || undefined,
      predicateImageContains: (filters.predicateImageContains as string) || undefined,
      objectImageContains: (filters.objectImageContains as string) || undefined,
      transactionHash: (filters.transactionHash as string) || undefined,
      creatorId: (filters.creatorId as string) || undefined,
      blockNumberMin: (filters.blockNumberMin as number) ?? undefined,
      blockNumberMax: (filters.blockNumberMax as number) ?? undefined,
      createdAtFrom: (filters.createdAtFrom as string) || undefined,
      createdAtTo: (filters.createdAtTo as string) || undefined,
    },
    pageSize,
    0,
    tripleSortBy,
    tripleSortDir,
    light ? 'light' : 'full',
  )) as IDataObject;

  const triples = ((result as any).triples || []) as Array<IDataObject & { term_id?: string }>;

  if (!inited && startFromNow) {
    for (const t of triples) {
      const id = String(t.term_id || '');
      if (id) seen[id] = Date.now();
    }
    data.seenTripleIds = seen;
    data.seenTriplesInitialized = true;
    return null;
  }

  for (const t of triples) {
    const id = String(t.term_id || '');
    if (!id) continue;
    if (!seen[id]) {
      seen[id] = Date.now();
      items.push({ json: t });
    }
  }

  const maxSeen = (fn.getNodeParameter('maxSeen', 10000) as number) ?? 10000;
  const keys = Object.keys(seen);
  if (keys.length > maxSeen) {
    const sorted = keys.sort((a, b) => seen[a] - seen[b]);
    const toDrop = sorted.slice(0, keys.length - maxSeen);
    for (const k of toDrop) delete seen[k];
  }
  data.seenTripleIds = seen;
  data.seenTriplesInitialized = true;

  return items.length ? items : null;
}
