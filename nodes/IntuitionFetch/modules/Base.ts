import { GraphQLClient } from 'graphql-request';

export interface IntuitionEndpoint {
  url: string;
}

export const ENDPOINTS: Record<'railsMockApi' | 'base', IntuitionEndpoint> = {
  railsMockApi: {
    url: 'https://api-i7n.thp-lab.org/api/v1/graph',
  },
  base: {
    url: 'https://prod.base.intuition-api.com/v1/graphql',
  },
};

export async function fetchTriples(client: GraphQLClient) {
  const query = `
    query {
      triples {
        id
        subject {
          id
          label
        }
        predicate {
          id
          label
        }
        object {
          id
          label
        }
      }
    }
  `;
  return client.request(query);
}

export async function fetchTriplesForSubject(client: GraphQLClient, subjectId: string) {
  const query = `
    query {
      triples {
        id
        subject {
          id
          label
        }
        predicate {
          id
          label
        }
        object {
          id
          label
        }
      }
    }
  `;
  const allTriples = await client.request(query);
  return {
    triples: allTriples.triples.filter((t: any) => t.subject.id === subjectId),
  };
}

export async function fetchTriplesForPredicate(client: GraphQLClient, predicateId: string) {
  const query = `
    query {
      triples {
        id
        subject {
          id
          label
        }
        predicate {
          id
          label
        }
        object {
          id
          label
        }
      }
    }
  `;
  const allTriples = await client.request(query);
  return {
    triples: allTriples.triples.filter((t: any) => t.predicate.id === predicateId),
  };
}

export async function fetchTriplesForObject(client: GraphQLClient, objectId: string) {
  const query = `
    query {
      triples {
        id
        subject {
          id
          label
        }
        predicate {
          id
          label
        }
        object {
          id
          label
        }
      }
    }
  `;
  const allTriples = await client.request(query);
  return {
    triples: allTriples.triples.filter((t: any) => t.object.id === objectId),
  };
}

export async function fetchTripleById(client: GraphQLClient, tripleId: string) {
  const query = `
    query {
      triples {
        id
        subject {
          id
          label
        }
        predicate {
          id
          label
        }
        object {
          id
          label
        }
      }
    }
  `;
  const allTriples = await client.request(query);
  return {
    triples: allTriples.triples.filter((t: any) => t.id === tripleId),
  };
}

export async function fetchAtoms(client: GraphQLClient, limit = 10, offset = 0) {
  const query = `
    query GetAtoms($limit: Int, $offset: Int) {
      atoms(limit: $limit, offset: $offset) {
        id
        label
        emoji
        image
        type
        creator {
          id
          label
          image
        }
        value {
          person {
            name
            image
            description
            url
          }
          thing {
            name
            image
            description
            url
          }
          organization {
            name
            image
            description
            url
          }
        }
        block_number
        block_timestamp
        transaction_hash
        creator_id
        vault_id
        wallet_id
        vault {
          position_count
          total_shares
          current_share_price
        }
      }
    }
  `;

  const variables = { limit, offset };
  return client.request(query, variables);
}

export async function fetchAtomDetails(client: GraphQLClient, atomId: string | number) {
  const query = `
    query GetAtom($id: numeric!) {
      atom(id: $id) {
        id
        label
        emoji
        image
        type
        creator {
          id
          label
          image
        }
        value {
          person {
            name
            image
            description
            url
          }
          thing {
            name
            image
            description
            url
          }
          organization {
            name
            image
            description
            url
          }
        }
        block_number
        block_timestamp
        transaction_hash
        creator_id
        vault_id
        wallet_id
        vault {
          position_count
          total_shares
          current_share_price
          positions_aggregate {
            aggregate {
              count
              sum {
                shares
              }
            }
          }
          positions {
            id
            account {
              label
              id
            }
            shares
          }
        }
        as_subject_triples {
          id
          object {
            data
            id
            image
            label
            emoji
            type
            creator {
              label
              image
              id
              atom_id
              type
            }
          }
          predicate {
            data
            id
            image
            label
            emoji
            type
            creator {
              label
              image
              id
              atom_id
              type
            }
          }
        }
        as_predicate_triples {
          id
          subject {
            data
            id
            image
            label
            emoji
            type
            creator {
              label
              image
              id
              atom_id
              type
            }
          }
          object {
            data
            id
            image
            label
            emoji
            type
            creator {
              label
              image
              id
              atom_id
              type
            }
          }
        }
        as_object_triples {
          id
          subject {
            data
            id
            image
            label
            emoji
            type
            creator {
              label
              image
              id
              atom_id
              type
            }
          }
          predicate {
            data
            id
            image
            label
            emoji
            type
            creator {
              label
              image
              id
              atom_id
              type
            }
          }
        }
        triplesPredicateTotal: as_predicate_triples_aggregate {
          aggregate {
            count
          }
        }
        triplesObjectTotal: as_object_triples_aggregate {
          aggregate {
            count
          }
        }
      }
    }
  `;

  const variables = { id: Number(atomId) };
  return client.request(query, variables);
}


export async function searchTriples(client: GraphQLClient, filters: object) {
  const query = `
    query($filters: TripleFilterInput) {
      searchTriples(filters: $filters) {
        id
        subject {
          id
          label
        }
        predicate {
          id
          label
        }
        object {
          id
          label
        }
      }
    }
  `;
  return client.request(query, { filters });
}
