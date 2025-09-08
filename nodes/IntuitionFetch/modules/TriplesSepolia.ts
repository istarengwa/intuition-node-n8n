import { GraphQLClient } from 'graphql-request';

const tripleLightSelection = `
  term_id
  created_at
  subject { term_id label }
  predicate { term_id label }
  object { term_id label }
`;

const tripleSelection = `
  term_id
  created_at
  block_number
  transaction_hash
  creator_id
  creator { id label image atom_id type }
  subject {
    term_id
    label
    image
    emoji
    type
    data
    creator { id label image atom_id type }
    term { total_market_cap updated_at }
    positions_aggregate { aggregate { count } }
    as_subject_triples_aggregate { aggregate { count } }
    as_predicate_triples_aggregate { aggregate { count } }
    as_object_triples_aggregate { aggregate { count } }
  }
  predicate {
    term_id
    label
    image
    emoji
    type
    data
    creator { id label image atom_id type }
    term { total_market_cap updated_at }
    positions_aggregate { aggregate { count } }
    as_subject_triples_aggregate { aggregate { count } }
    as_predicate_triples_aggregate { aggregate { count } }
    as_object_triples_aggregate { aggregate { count } }
  }
  object {
    term_id
    label
    image
    emoji
    type
    data
    creator { id label image atom_id type }
    term { total_market_cap updated_at }
    positions_aggregate { aggregate { count } }
    as_subject_triples_aggregate { aggregate { count } }
    as_predicate_triples_aggregate { aggregate { count } }
    as_object_triples_aggregate { aggregate { count } }
  }
`;

export async function fetchTriples(client: GraphQLClient, output: 'light' | 'full' = 'full') {
  const selection = output === 'light' ? tripleLightSelection : tripleSelection;
  const query = `
    query GetTriples {
      triples {
        ${selection}
      }
    }
  `;
  return client.request(query);
}

export interface TripleSearchFilters {
  tripleId?: string;
  atomTermId?: string; // match subject_id OR predicate_id OR object_id
  atomLabel?: string;  // match any of subject/predicate/object label
  createdAtFrom?: string;
  createdAtTo?: string;
}

export async function searchTriples(
  client: GraphQLClient,
  filters: TripleSearchFilters = {},
  limit = 10,
  offset = 0,
  sortBy?: 'created_at' | 'block_number',
  sortDir?: 'asc' | 'desc',
  output: 'light' | 'full' = 'full',
) {
  const andConditions: any[] = [];

  if (filters.tripleId) {
    andConditions.push({ term_id: { _eq: filters.tripleId } });
  }

  if (filters.atomTermId) {
    andConditions.push({
      _or: [
        { subject_id: { _eq: filters.atomTermId } },
        { predicate_id: { _eq: filters.atomTermId } },
        { object_id: { _eq: filters.atomTermId } },
      ],
    });
  }

  if (filters.atomLabel) {
    const like = `%${filters.atomLabel}%`;
    andConditions.push({
      _or: [
        { subject: { label: { _ilike: like } } },
        { predicate: { label: { _ilike: like } } },
        { object: { label: { _ilike: like } } },
      ],
    });
  }

  if (filters.createdAtFrom) {
    andConditions.push({ created_at: { _gte: filters.createdAtFrom } });
  }
  if (filters.createdAtTo) {
    andConditions.push({ created_at: { _lte: filters.createdAtTo } });
  }

  const where = andConditions.length ? { _and: andConditions } : {};

  const selection = output === 'light' ? tripleLightSelection : tripleSelection;
  const orderBy = sortBy ? [{ [sortBy]: sortDir ?? 'desc' }] : undefined;
  const query = `
    query SearchTriples($where: triples_bool_exp, $limit: Int, $offset: Int, $orderBy: [triples_order_by!]) {
      triples(where: $where, limit: $limit, offset: $offset, order_by: $orderBy) {
        ${selection}
      }
    }
  `;

  const variables: Record<string, any> = { where, limit, offset };
  if (orderBy) variables.orderBy = orderBy;
  return client.request(query, variables);
}
