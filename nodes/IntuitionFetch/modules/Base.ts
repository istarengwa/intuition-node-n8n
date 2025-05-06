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

export async function fetchAtomDetails(client: GraphQLClient, atomId: string) {
  const query = `
    query($atomId: ID!) {
      atom(id: $atomId) {
        id
        content
        metadata
      }
    }
  `;
  return client.request(query, { atomId });
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
