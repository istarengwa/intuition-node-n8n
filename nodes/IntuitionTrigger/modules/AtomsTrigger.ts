import {
  IDataObject,
  INodeExecutionData,
  IPollFunctions,
} from 'n8n-workflow';

import { GraphQLClient } from 'graphql-request';
import * as Base from '../../IntuitionFetch/modules/Base';

export async function handleAtomsPoll(
  fn: IPollFunctions,
  client: GraphQLClient,
  light: boolean,
): Promise<INodeExecutionData[] | null> {
  const items: INodeExecutionData[] = [];

  const filters = (fn.getNodeParameter(light ? 'atomFiltersLight' : 'atomFiltersFull', {}) as IDataObject) || {};
  const startFromNow = (fn.getNodeParameter('startFromNow', true) as boolean) ?? true;
  const pageSize = (fn.getNodeParameter('pageSize', 50) as number) ?? 50;

  const data = fn.getWorkflowStaticData('node') as IDataObject;
  const lastCursor = (data.lastAtomCreatedAt as string) || '';

  if (!lastCursor && startFromNow) {
    data.lastAtomCreatedAt = new Date().toISOString();
    return null;
  }

  const useRel = (fn.getNodeParameter('useAtomRelativeTime', false) as boolean) ?? false;
  if (useRel) {
    const amount = (fn.getNodeParameter('atomRelativeAmount', 60) as number) ?? 60;
    const unit = (fn.getNodeParameter('atomRelativeUnit', 'minutes') as string) as 'seconds' | 'minutes' | 'hours' | 'days';
    const msPerUnit = { seconds: 1000, minutes: 60 * 1000, hours: 60 * 60 * 1000, days: 24 * 60 * 60 * 1000 };
    const fromIso = new Date(Date.now() - Math.max(0, amount) * msPerUnit[unit]).toISOString();
    if (lastCursor) {
      filters.createdAtFrom = new Date(fromIso) > new Date(lastCursor) ? fromIso : lastCursor;
    } else {
      filters.createdAtFrom = fromIso;
    }
  } else if (lastCursor) {
    filters.createdAtFrom = lastCursor;
  }

  const useSort = (fn.getNodeParameter('useAtomSort', false) as boolean) ?? false;
  const sortBy = useSort ? ((fn.getNodeParameter('atomSortBy', 'created_at') as string) as 'created_at' | 'block_number') : 'created_at';
  const sortDir = useSort ? ((fn.getNodeParameter('atomSortDir', 'asc') as string) as 'asc' | 'desc') : 'asc';

  const result = (await Base.searchAtoms(
    client,
    {
      termId: (filters.termId as string) || undefined,
      label: (filters.label as string) || undefined,
      type: (filters.type as string) || undefined,
      walletId: (filters.walletId as string) || undefined,
      transactionHash: (filters.transactionHash as string) || undefined,
      emoji: (filters.emoji as string) || undefined,
      imageContains: (filters.imageContains as string) || undefined,
      dataContains: (filters.dataContains as string) || undefined,
      createdAtFrom: (filters.createdAtFrom as string) || undefined,
      createdAtTo: (filters.createdAtTo as string) || undefined,
      blockNumberMin: (filters.blockNumberMin as number) ?? undefined,
      blockNumberMax: (filters.blockNumberMax as number) ?? undefined,
      creatorId: (filters.creatorId as string) || undefined,
      creatorLabel: (filters.creatorLabel as string) || undefined,
      creatorType: (filters.creatorType as string) || undefined,
      creatorAtomId: (filters.creatorAtomId as string) || undefined,
      termTotalMarketCapMin: (filters.termTotalMarketCapMin as string) || undefined,
      termTotalMarketCapMax: (filters.termTotalMarketCapMax as string) || undefined,
      termUpdatedAtFrom: (filters.termUpdatedAtFrom as string) || undefined,
      termUpdatedAtTo: (filters.termUpdatedAtTo as string) || undefined,
    },
    pageSize,
    0,
    sortBy,
    sortDir,
    light ? 'light' : 'full',
  )) as IDataObject;

  const atoms = ((result as any).atoms || []) as Array<IDataObject & { created_at?: string }>;
  for (const atom of atoms) {
    items.push({ json: atom });
  }

  if (atoms.length > 0) {
    const latest = atoms[atoms.length - 1].created_at;
    if (latest) data.lastAtomCreatedAt = latest;
  }

  return items.length ? items : null;
}
