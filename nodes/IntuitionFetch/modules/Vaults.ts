import { GraphQLClient } from 'graphql-request';

const vaultsLightSelection = `
  term_id
  curve_id
  current_share_price
  position_count
  total_shares
  total_assets
  market_cap
  block_number
  created_at
  updated_at
  transaction_hash
`;

const vaultsFullSelection = `
  term_id
  curve_id
  current_share_price
  position_count
  total_shares
  total_assets
  market_cap
  block_number
  created_at
  updated_at
  transaction_hash
  term { total_market_cap updated_at }
  positions_aggregate { aggregate { count } }
  signals_aggregate { aggregate { count } }
  deposits_aggregate { aggregate { count } }
  redemptions_aggregate { aggregate { count } }
`;

export interface VaultSearchFilters {
  termId?: string;
  curveId?: string;
  blockNumberMin?: number;
  blockNumberMax?: number;
  createdAtFrom?: string;
  createdAtTo?: string;
  positionCountMin?: number;
  positionCountMax?: number;
  marketCapMin?: string;
  marketCapMax?: string;
  totalSharesMin?: string;
  totalSharesMax?: string;
  currentSharePriceMin?: string;
  currentSharePriceMax?: string;
}

export async function fetchVaults(
  client: GraphQLClient,
  limit = 10,
  offset = 0,
  output: 'light' | 'full' = 'light',
) {
  const selection = output === 'light' ? vaultsLightSelection : vaultsFullSelection;
  const query = `
    query GetVaults($limit: Int, $offset: Int) {
      vaults(limit: $limit, offset: $offset) {
        ${selection}
      }
    }
  `;
  const variables = { limit, offset };
  return client.request(query, variables);
}

export async function searchVaults(
  client: GraphQLClient,
  filters: VaultSearchFilters = {},
  limit = 10,
  offset = 0,
  sortBy?: 'created_at' | 'block_number' | 'market_cap',
  sortDir?: 'asc' | 'desc',
  output: 'light' | 'full' = 'light',
) {
  const andConditions: any[] = [];
  if (filters.termId) andConditions.push({ term_id: { _eq: filters.termId } });
  if (filters.curveId) andConditions.push({ curve_id: { _eq: filters.curveId } });
  if (typeof filters.blockNumberMin === 'number') andConditions.push({ block_number: { _gte: filters.blockNumberMin } });
  if (typeof filters.blockNumberMax === 'number') andConditions.push({ block_number: { _lte: filters.blockNumberMax } });
  if (filters.createdAtFrom) andConditions.push({ created_at: { _gte: filters.createdAtFrom } });
  if (filters.createdAtTo) andConditions.push({ created_at: { _lte: filters.createdAtTo } });
  if (typeof filters.positionCountMin === 'number') andConditions.push({ position_count: { _gte: filters.positionCountMin } });
  if (typeof filters.positionCountMax === 'number') andConditions.push({ position_count: { _lte: filters.positionCountMax } });
  if (typeof filters.marketCapMin !== 'undefined') andConditions.push({ market_cap: { _gte: filters.marketCapMin } });
  if (typeof filters.marketCapMax !== 'undefined') andConditions.push({ market_cap: { _lte: filters.marketCapMax } });
  if (typeof filters.totalSharesMin !== 'undefined') andConditions.push({ total_shares: { _gte: filters.totalSharesMin } });
  if (typeof filters.totalSharesMax !== 'undefined') andConditions.push({ total_shares: { _lte: filters.totalSharesMax } });
  if (typeof filters.currentSharePriceMin !== 'undefined') andConditions.push({ current_share_price: { _gte: filters.currentSharePriceMin } });
  if (typeof filters.currentSharePriceMax !== 'undefined') andConditions.push({ current_share_price: { _lte: filters.currentSharePriceMax } });

  const where = andConditions.length ? { _and: andConditions } : {};
  const orderBy = sortBy ? [{ [sortBy]: sortDir ?? 'desc' }] : undefined;
  const selection = output === 'light' ? vaultsLightSelection : vaultsFullSelection;
  const query = `
    query SearchVaults($where: vaults_bool_exp, $limit: Int, $offset: Int, $orderBy: [vaults_order_by!]) {
      vaults(where: $where, limit: $limit, offset: $offset, order_by: $orderBy) {
        ${selection}
      }
    }
  `;
  const variables: Record<string, any> = { where, limit, offset };
  if (orderBy) variables.orderBy = orderBy;
  return client.request(query, variables);
}

