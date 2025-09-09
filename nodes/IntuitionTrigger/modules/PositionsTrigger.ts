import { INodeExecutionData, IPollFunctions } from 'n8n-workflow';
import { GraphQLClient } from 'graphql-request';
import * as Base from '../../IntuitionFetch/modules/Base';

export async function handlePositionsPoll(
  fn: IPollFunctions,
  client: GraphQLClient,
  light: boolean,
): Promise<INodeExecutionData[] | null> {
  const items: INodeExecutionData[] = [];

  const filters = (fn.getNodeParameter(light ? 'positionFiltersLight' : 'positionFiltersFull', {}) as Record<string, any>) || {};
  const useRel = (fn.getNodeParameter('usePositionRelativeTime', false) as boolean) ?? false;
  if (useRel) {
    const amount = (fn.getNodeParameter('positionRelativeAmount', 60) as number) ?? 60;
    const unit = (fn.getNodeParameter('positionRelativeUnit', 'minutes') as string) as 'seconds' | 'minutes' | 'hours' | 'days';
    const msPerUnit = { seconds: 1000, minutes: 60 * 1000, hours: 60 * 60 * 1000, days: 24 * 60 * 60 * 1000 };
    (filters as any).createdAtFrom = new Date(Date.now() - Math.max(0, amount) * msPerUnit[unit]).toISOString();
  }
  const useSort = (fn.getNodeParameter('usePositionSort', false) as boolean) ?? false;
  const sortBy = useSort ? ((fn.getNodeParameter('positionSortBy', 'created_at') as string) as 'created_at' | 'block_number') : undefined;
  const sortDir = useSort ? ((fn.getNodeParameter('positionSortDir', 'desc') as string) as 'asc' | 'desc') : undefined;
  const pageSize = (fn.getNodeParameter('pageSize', 50) as number) ?? 50;

  const result = (await Base.searchPositions(
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
    pageSize,
    0,
    sortBy,
    sortDir,
    light ? 'light' : 'full',
  )) as any;

  const positions = (result.positions || []) as any[];

  // dedup by position id
  const data = fn.getWorkflowStaticData('node') as any;
  const seen = (data.seenPositionIds as Record<string, number>) || {};
  const startFromNow = (fn.getNodeParameter('startFromNow', true) as boolean) ?? true;
  const inited = !!data.seenPositionsInitialized;

  if (!inited && startFromNow) {
    for (const p of positions) { const id = String(p.id || ''); if (id) seen[id] = Date.now(); }
    data.seenPositionIds = seen;
    data.seenPositionsInitialized = true;
    return null;
  }

  for (const p of positions) {
    const id = String(p.id || '');
    if (!id) continue;
    if (!seen[id]) { seen[id] = Date.now(); items.push({ json: p }); }
  }

  const maxSeen = 10000;
  const keys = Object.keys(seen);
  if (keys.length > maxSeen) {
    const sorted = keys.sort((a, b) => seen[a] - seen[b]);
    for (const k of sorted.slice(0, keys.length - maxSeen)) delete seen[k];
  }
  data.seenPositionIds = seen;
  data.seenPositionsInitialized = true;

  return items.length ? items : null;
}
