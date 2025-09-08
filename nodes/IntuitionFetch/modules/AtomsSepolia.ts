import { GraphQLClient } from 'graphql-request';

const atomsLightSelection = `
  term_id
  label
  emoji
  image
  type
  data
  block_number
  created_at
  transaction_hash
  wallet_id
  positions_aggregate { aggregate { count } }
  as_subject_triples_aggregate { aggregate { count } }
  as_predicate_triples_aggregate { aggregate { count } }
  as_object_triples_aggregate { aggregate { count } }
`;

const atomsFullSelection = `
  term_id
  label
  emoji
  image
  type
  data
  block_number
  created_at
  transaction_hash
  wallet_id
  creator { id label image atom_id type }
  term { total_market_cap updated_at }
  positions_aggregate { aggregate { count sum { shares } } }
  positions { id shares account { id label } }
  as_subject_triples {
    term_id
    object { term_id label image emoji type creator { id label image atom_id type } }
    predicate { term_id label image emoji type creator { id label image atom_id type } }
  }
  as_predicate_triples {
    term_id
    subject { term_id label image emoji type creator { id label image atom_id type } }
    object { term_id label image emoji type creator { id label image atom_id type } }
  }
  as_object_triples {
    term_id
    subject { term_id label image emoji type creator { id label image atom_id type } }
    predicate { term_id label image emoji type creator { id label image atom_id type } }
  }
  triplesPredicateTotal: as_predicate_triples_aggregate { aggregate { count } }
  triplesObjectTotal: as_object_triples_aggregate { aggregate { count } }
`;

export async function fetchAtoms(
  client: GraphQLClient,
  limit = 10,
  offset = 0,
  output: 'light' | 'full' = 'full',
) {
  const selection = output === 'light' ? atomsLightSelection : atomsFullSelection;
  const query = `
    query GetAtoms($limit: Int, $offset: Int) {
      atoms(limit: $limit, offset: $offset) {
        ${selection}
      }
    }
  `;
  const variables = { limit, offset };
  return client.request(query, variables);
}

export interface AtomSearchFilters {
  termId?: string;
  label?: string;
  type?: string;
  walletId?: string;
  transactionHash?: string;
  emoji?: string;
  imageContains?: string;
  blockNumberMin?: number;
  blockNumberMax?: number;
  createdAtFrom?: string; // ISO timestamp
  createdAtTo?: string;   // ISO timestamp
}

export async function searchAtoms(
  client: GraphQLClient,
  filters: AtomSearchFilters = {},
  limit = 10,
  offset = 0,
  sortBy: 'created_at' | 'block_number' | 'label' | 'term_id' = 'created_at',
  sortDir: 'asc' | 'desc' = 'desc',
  output: 'light' | 'full' = 'full',
) {
  const andConditions: any[] = [];
  const where: Record<string, any> = {};

  if (filters.termId) andConditions.push({ term_id: { _eq: String(filters.termId) } });
  if (filters.type) andConditions.push({ type: { _eq: filters.type } });
  if (filters.walletId) andConditions.push({ wallet_id: { _eq: filters.walletId } });
  if (filters.transactionHash) andConditions.push({ transaction_hash: { _eq: filters.transactionHash } });
  if (filters.label) andConditions.push({ label: { _ilike: `%${filters.label}%` } });
  if (filters.emoji) andConditions.push({ emoji: { _eq: filters.emoji } });
  if (filters.imageContains) andConditions.push({ image: { _ilike: `%${filters.imageContains}%` } });
  if (typeof filters.blockNumberMin === 'number') andConditions.push({ block_number: { _gte: filters.blockNumberMin } });
  if (typeof filters.blockNumberMax === 'number') andConditions.push({ block_number: { _lte: filters.blockNumberMax } });
  if (filters.createdAtFrom) andConditions.push({ created_at: { _gte: filters.createdAtFrom } });
  if (filters.createdAtTo) andConditions.push({ created_at: { _lte: filters.createdAtTo } });

  if (andConditions.length) where._and = andConditions;

  const orderBy = [{ [sortBy]: sortDir }];

  const selection = output === 'light' ? atomsLightSelection : atomsFullSelection;
  const query = `
    query SearchAtoms($where: atoms_bool_exp, $limit: Int, $offset: Int, $orderBy: [atoms_order_by!]) {
      atoms(where: $where, limit: $limit, offset: $offset, order_by: $orderBy) {
        ${selection}
      }
    }
  `;

  const variables = { where, limit, offset, orderBy };
  return client.request(query, variables);
}
