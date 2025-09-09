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
  atomTermId?: string;
  atomLabel?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  transactionHash?: string;
  creatorId?: string;
  blockNumberMin?: number;
  blockNumberMax?: number;
  subjectTermId?: string;
  predicateTermId?: string;
  objectTermId?: string;
  subjectLabel?: string;
  predicateLabel?: string;
  objectLabel?: string;
  subjectType?: string;
  predicateType?: string;
  objectType?: string;
  subjectEmoji?: string;
  predicateEmoji?: string;
  objectEmoji?: string;
  subjectCreatorId?: string;
  predicateCreatorId?: string;
  objectCreatorId?: string;
  subjectDataContains?: string;
  predicateDataContains?: string;
  objectDataContains?: string;
  subjectImageContains?: string;
  predicateImageContains?: string;
  objectImageContains?: string;
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

  if (filters.tripleId) andConditions.push({ term_id: { _eq: filters.tripleId } });

  if (filters.atomTermId) {
    andConditions.push({ _or: [
      { subject_id: { _eq: filters.atomTermId } },
      { predicate_id: { _eq: filters.atomTermId } },
      { object_id: { _eq: filters.atomTermId } },
    ]});
  }

  if (filters.atomLabel) {
    const like = `%${filters.atomLabel}%`;
    andConditions.push({ _or: [
      { subject: { label: { _ilike: like } } },
      { predicate: { label: { _ilike: like } } },
      { object: { label: { _ilike: like } } },
    ]});
  }

  if (filters.createdAtFrom) andConditions.push({ created_at: { _gte: filters.createdAtFrom } });
  if (filters.createdAtTo) andConditions.push({ created_at: { _lte: filters.createdAtTo } });
  if (filters.transactionHash) andConditions.push({ transaction_hash: { _eq: filters.transactionHash } });
  if (filters.creatorId) andConditions.push({ creator_id: { _eq: filters.creatorId } });
  if (typeof filters.blockNumberMin === 'number') andConditions.push({ block_number: { _gte: filters.blockNumberMin } });
  if (typeof filters.blockNumberMax === 'number') andConditions.push({ block_number: { _lte: filters.blockNumberMax } });

  if (filters.subjectTermId) andConditions.push({ subject_id: { _eq: filters.subjectTermId } });
  if (filters.predicateTermId) andConditions.push({ predicate_id: { _eq: filters.predicateTermId } });
  if (filters.objectTermId) andConditions.push({ object_id: { _eq: filters.objectTermId } });

  if (filters.subjectLabel) andConditions.push({ subject: { label: { _ilike: `%${filters.subjectLabel}%` } } });
  if (filters.predicateLabel) andConditions.push({ predicate: { label: { _ilike: `%${filters.predicateLabel}%` } } });
  if (filters.objectLabel) andConditions.push({ object: { label: { _ilike: `%${filters.objectLabel}%` } } });

  if (filters.subjectType) andConditions.push({ subject: { type: { _eq: filters.subjectType } } });
  if (filters.predicateType) andConditions.push({ predicate: { type: { _eq: filters.predicateType } } });
  if (filters.objectType) andConditions.push({ object: { type: { _eq: filters.objectType } } });

  if (filters.subjectEmoji) andConditions.push({ subject: { emoji: { _eq: filters.subjectEmoji } } });
  if (filters.predicateEmoji) andConditions.push({ predicate: { emoji: { _eq: filters.predicateEmoji } } });
  if (filters.objectEmoji) andConditions.push({ object: { emoji: { _eq: filters.objectEmoji } } });

  if (filters.subjectCreatorId) andConditions.push({ subject: { creator: { id: { _eq: filters.subjectCreatorId } } } });
  if (filters.predicateCreatorId) andConditions.push({ predicate: { creator: { id: { _eq: filters.predicateCreatorId } } } });
  if (filters.objectCreatorId) andConditions.push({ object: { creator: { id: { _eq: filters.objectCreatorId } } } });

  if (filters.subjectDataContains) andConditions.push({ subject: { data: { _ilike: `%${filters.subjectDataContains}%` } } });
  if (filters.predicateDataContains) andConditions.push({ predicate: { data: { _ilike: `%${filters.predicateDataContains}%` } } });
  if (filters.objectDataContains) andConditions.push({ object: { data: { _ilike: `%${filters.objectDataContains}%` } } });

  if (filters.subjectImageContains) andConditions.push({ subject: { image: { _ilike: `%${filters.subjectImageContains}%` } } });
  if (filters.predicateImageContains) andConditions.push({ predicate: { image: { _ilike: `%${filters.predicateImageContains}%` } } });
  if (filters.objectImageContains) andConditions.push({ object: { image: { _ilike: `%${filters.objectImageContains}%` } } });

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

