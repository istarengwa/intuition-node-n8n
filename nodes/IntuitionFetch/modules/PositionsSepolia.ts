import { GraphQLClient } from 'graphql-request';

const positionsLightSelection = `
  id
  shares
  block_number
  created_at
  transaction_hash
  account { id label }
  term_id
  curve_id
  vault { term_id current_share_price position_count }
`;

const positionsFullSelection = `
  id
  shares
  block_number
  created_at
  updated_at
  transaction_hash
  transaction_index
  log_index
  account { id label image }
  account_id
  term_id
  curve_id
  total_deposit_assets_after_total_fees
  total_redeem_assets_for_receiver
  term { total_market_cap updated_at }
  vault {
    term_id
    curve_id
    current_share_price
    position_count
    total_shares
    total_assets
    market_cap
    block_number
    transaction_hash
    created_at
    updated_at
  }
`;

export interface PositionSearchFilters {
  id?: string;
  accountId?: string;
  termId?: string;
  curveId?: string;
  transactionHash?: string;
  blockNumberMin?: number;
  blockNumberMax?: number;
  createdAtFrom?: string;
  createdAtTo?: string;
  sharesMin?: string;
  sharesMax?: string;
}

export async function fetchPositions(
  client: GraphQLClient,
  limit = 10,
  offset = 0,
  output: 'light' | 'full' = 'light',
) {
  const selection = output === 'light' ? positionsLightSelection : positionsFullSelection;
  const query = `
    query GetPositions($limit: Int, $offset: Int) {
      positions(limit: $limit, offset: $offset) {
        ${selection}
      }
    }
  `;
  const variables = { limit, offset };
  return client.request(query, variables);
}

export async function searchPositions(
  client: GraphQLClient,
  filters: PositionSearchFilters = {},
  limit = 10,
  offset = 0,
  sortBy?: 'created_at' | 'block_number',
  sortDir?: 'asc' | 'desc',
  output: 'light' | 'full' = 'light',
) {
  const andConditions: any[] = [];
  if (filters.id) andConditions.push({ id: { _eq: filters.id } });
  if (filters.accountId) andConditions.push({ account_id: { _eq: filters.accountId } });
  if (filters.termId) andConditions.push({ term_id: { _eq: filters.termId } });
  if (filters.curveId) andConditions.push({ curve_id: { _eq: filters.curveId } });
  if (filters.transactionHash) andConditions.push({ transaction_hash: { _eq: filters.transactionHash } });
  if (typeof filters.blockNumberMin === 'number') andConditions.push({ block_number: { _gte: filters.blockNumberMin } });
  if (typeof filters.blockNumberMax === 'number') andConditions.push({ block_number: { _lte: filters.blockNumberMax } });
  if (filters.createdAtFrom) andConditions.push({ created_at: { _gte: filters.createdAtFrom } });
  if (filters.createdAtTo) andConditions.push({ created_at: { _lte: filters.createdAtTo } });
  if (typeof filters.sharesMin !== 'undefined') andConditions.push({ shares: { _gte: filters.sharesMin } });
  if (typeof filters.sharesMax !== 'undefined') andConditions.push({ shares: { _lte: filters.sharesMax } });

  const where = andConditions.length ? { _and: andConditions } : {};
  const orderBy = sortBy ? [{ [sortBy]: sortDir ?? 'desc' }] : undefined;
  const selection = output === 'light' ? positionsLightSelection : positionsFullSelection;
  const query = `
    query SearchPositions($where: positions_bool_exp, $limit: Int, $offset: Int, $orderBy: [positions_order_by!]) {
      positions(where: $where, limit: $limit, offset: $offset, order_by: $orderBy) {
        ${selection}
      }
    }
  `;
  const variables: Record<string, any> = { where, limit, offset };
  if (orderBy) variables.orderBy = orderBy;
  return client.request(query, variables);
}

