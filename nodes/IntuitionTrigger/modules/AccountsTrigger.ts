import { INodeExecutionData, IPollFunctions } from 'n8n-workflow';
import { GraphQLClient } from 'graphql-request';
import * as Base from '../../IntuitionFetch/modules/Base';

export async function handleAccountsPoll(
  fn: IPollFunctions,
  client: GraphQLClient,
  light: boolean,
): Promise<INodeExecutionData[] | null> {
  const items: INodeExecutionData[] = [];

  const filters = (fn.getNodeParameter(light ? 'accountFiltersLight' : 'accountFiltersFull', {}) as Record<string, any>) || {};
  const useRel = (fn.getNodeParameter('useAccountRelativeTime', false) as boolean) ?? false;
  if (useRel) {
    const amount = (fn.getNodeParameter('accountRelativeAmount', 60) as number) ?? 60;
    const unit = (fn.getNodeParameter('accountRelativeUnit', 'minutes') as string) as 'seconds' | 'minutes' | 'hours' | 'days';
    const msPerUnit = { seconds: 1000, minutes: 60 * 1000, hours: 60 * 60 * 1000, days: 24 * 60 * 60 * 1000 };
    (filters as any).createdAtFrom = new Date(Date.now() - Math.max(0, amount) * msPerUnit[unit]).toISOString();
  }

  const useSort = (fn.getNodeParameter('useAccountSort', false) as boolean) ?? false;
  const sortBy = useSort ? ((fn.getNodeParameter('accountSortBy', 'label') as string) as 'id' | 'label') : undefined;
  const sortDir = useSort ? ((fn.getNodeParameter('accountSortDir', 'asc') as string) as 'asc' | 'desc') : undefined;

  const pageSize = (fn.getNodeParameter('pageSize', 50) as number) ?? 50;

  const result = (await Base.searchAccounts(
    client,
    {
      id: (filters.id as string) || undefined,
      label: (filters.label as string) || undefined,
      type: (filters.type as string) || undefined,
      atomId: (filters.atomId as string) || undefined,
      imageContains: (filters.imageContains as string) || undefined,
    },
    pageSize,
    0,
    sortBy,
    sortDir,
    light ? 'light' : 'full',
  )) as any;

  const accounts = (result.accounts || []) as any[];

  // simple dedup by ID using static data
  const data = fn.getWorkflowStaticData('node') as Record<string, any>;
  const seen = (data.seenAccountIds as Record<string, number>) || {};
  const startFromNow = (fn.getNodeParameter('startFromNow', true) as boolean) ?? true;
  const inited = !!data.seenAccountsInitialized;

  if (!inited && startFromNow) {
    for (const a of accounts) { const id = String(a.id || ''); if (id) seen[id] = Date.now(); }
    data.seenAccountIds = seen;
    data.seenAccountsInitialized = true;
    return null;
  }

  for (const a of accounts) {
    const id = String(a.id || '');
    if (!id) continue;
    if (!seen[id]) {
      seen[id] = Date.now();
      items.push({ json: a });
    }
  }

  // cap map size
  const maxSeen = 10000;
  const keys = Object.keys(seen);
  if (keys.length > maxSeen) {
    const sorted = keys.sort((a, b) => seen[a] - seen[b]);
    for (const k of sorted.slice(0, keys.length - maxSeen)) delete seen[k];
  }
  data.seenAccountIds = seen;
  data.seenAccountsInitialized = true;

  return items.length ? items : null;
}
