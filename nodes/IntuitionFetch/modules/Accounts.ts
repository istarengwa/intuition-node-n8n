import { GraphQLClient } from 'graphql-request';

const accountsLightSelection = `
  id
  label
  image
  atom_id
  type
`;

const accountsFullSelection = `
  id
  label
  image
  atom_id
  type
  positions_aggregate { aggregate { count } }
  atoms_aggregate { aggregate { count } }
  triples_aggregate { aggregate { count } }
`;

export interface AccountSearchFilters {
  id?: string;
  label?: string;
  type?: string;
  atomId?: string;
  imageContains?: string;
  createdAtFrom?: string; // via positions.created_at
  createdAtTo?: string;   // via positions.created_at
}

export async function fetchAccounts(
  client: GraphQLClient,
  limit = 10,
  offset = 0,
  output: 'light' | 'full' = 'light',
) {
  const selection = output === 'light' ? accountsLightSelection : accountsFullSelection;
  const query = `
    query GetAccounts($limit: Int, $offset: Int) {
      accounts(limit: $limit, offset: $offset) {
        ${selection}
      }
    }
  `;
  const variables = { limit, offset };
  return client.request(query, variables);
}

export async function searchAccounts(
  client: GraphQLClient,
  filters: AccountSearchFilters = {},
  limit = 10,
  offset = 0,
  sortBy?: 'id' | 'label',
  sortDir?: 'asc' | 'desc',
  output: 'light' | 'full' = 'light',
) {
  const andConditions: any[] = [];
  if (filters.id) andConditions.push({ id: { _eq: filters.id } });
  if (filters.label) andConditions.push({ label: { _ilike: `%${filters.label}%` } });
  if (filters.type) andConditions.push({ type: { _eq: filters.type } });
  if (filters.atomId) andConditions.push({ atom_id: { _eq: filters.atomId } });
  if (filters.imageContains) andConditions.push({ image: { _ilike: `%${filters.imageContains}%` } });
  if (filters.createdAtFrom) andConditions.push({ positions: { created_at: { _gte: filters.createdAtFrom } } });
  if (filters.createdAtTo) andConditions.push({ positions: { created_at: { _lte: filters.createdAtTo } } });

  const where = andConditions.length ? { _and: andConditions } : {};
  const orderBy = sortBy ? [{ [sortBy]: sortDir ?? 'asc' }] : undefined;
  const selection = output === 'light' ? accountsLightSelection : accountsFullSelection;
  const query = `
    query SearchAccounts($where: accounts_bool_exp, $limit: Int, $offset: Int, $orderBy: [accounts_order_by!]) {
      accounts(where: $where, limit: $limit, offset: $offset, order_by: $orderBy) {
        ${selection}
      }
    }
  `;
  const variables: Record<string, any> = { where, limit, offset };
  if (orderBy) variables.orderBy = orderBy;
  return client.request(query, variables);
}

