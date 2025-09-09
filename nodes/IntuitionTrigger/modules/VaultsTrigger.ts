import { INodeExecutionData, IPollFunctions } from 'n8n-workflow';
import { GraphQLClient } from 'graphql-request';
import * as Base from '../../IntuitionFetch/modules/Base';

export async function handleVaultsPoll(
  fn: IPollFunctions,
  client: GraphQLClient,
  light: boolean,
): Promise<INodeExecutionData[] | null> {
  const items: INodeExecutionData[] = [];

  const filters = (fn.getNodeParameter(light ? 'vaultFiltersLight' : 'vaultFiltersFull', {}) as Record<string, any>) || {};
  const useRel = (fn.getNodeParameter('useVaultRelativeTime', false) as boolean) ?? false;
  if (useRel) {
    const amount = (fn.getNodeParameter('vaultRelativeAmount', 60) as number) ?? 60;
    const unit = (fn.getNodeParameter('vaultRelativeUnit', 'minutes') as string) as 'seconds' | 'minutes' | 'hours' | 'days';
    const msPerUnit = { seconds: 1000, minutes: 60 * 1000, hours: 60 * 60 * 1000, days: 24 * 60 * 60 * 1000 };
    (filters as any).createdAtFrom = new Date(Date.now() - Math.max(0, amount) * msPerUnit[unit]).toISOString();
  }

  const useSort = (fn.getNodeParameter('useVaultSort', false) as boolean) ?? false;
  const sortBy = useSort ? ((fn.getNodeParameter('vaultSortBy', 'created_at') as string) as 'created_at' | 'block_number' | 'market_cap') : undefined;
  const sortDir = useSort ? ((fn.getNodeParameter('vaultSortDir', 'desc') as string) as 'asc' | 'desc') : undefined;
  const pageSize = (fn.getNodeParameter('pageSize', 50) as number) ?? 50;

  const result = (await Base.searchVaults(
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
    pageSize,
    0,
    sortBy,
    sortDir,
    light ? 'light' : 'full',
  )) as any;

  const vaults = (result.vaults || []) as any[];

  // dedup by transaction_hash (unique per update) or term_id+updated_at
  const data = fn.getWorkflowStaticData('node') as any;
  const seen = (data.seenVaultTx as Record<string, number>) || {};
  const startFromNow = (fn.getNodeParameter('startFromNow', true) as boolean) ?? true;
  const inited = !!data.seenVaultsInitialized;

  if (!inited && startFromNow) {
    for (const v of vaults) { const key = String(v.transaction_hash || v.term_id || ''); if (key) seen[key] = Date.now(); }
    data.seenVaultTx = seen;
    data.seenVaultsInitialized = true;
    return null;
  }

  for (const v of vaults) {
    const key = String(v.transaction_hash || v.term_id || '');
    if (!key) continue;
    if (!seen[key]) { seen[key] = Date.now(); items.push({ json: v }); }
  }

  const maxSeen = 10000;
  const keys = Object.keys(seen);
  if (keys.length > maxSeen) {
    const sorted = keys.sort((a, b) => seen[a] - seen[b]);
    for (const k of sorted.slice(0, keys.length - maxSeen)) delete seen[k];
  }
  data.seenVaultTx = seen;
  data.seenVaultsInitialized = true;

  return items.length ? items : null;
}
