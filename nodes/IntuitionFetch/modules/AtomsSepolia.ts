import { GraphQLClient } from 'graphql-request';

export async function fetchAtoms(client: GraphQLClient, limit = 10, offset = 0) {
  const query = `
    query GetAtoms($limit: Int, $offset: Int) {
      atoms(limit: $limit, offset: $offset) {
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
      }
    }
  `;
  const variables = { limit, offset };
  return client.request(query, variables);
}

export async function fetchAtomDetails(client: GraphQLClient, atomId: string | number) {
  const query = `
    query GetAtom($term_id: String!) {
      atom(term_id: $term_id) {
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
        positions_aggregate { aggregate { count sum { shares } } }
        positions { id shares account { id label } }
        as_subject_triples {
          term_id
          object { term_id label image emoji type }
          predicate { term_id label image emoji type }
        }
        as_predicate_triples {
          term_id
          subject { term_id label image emoji type }
          object { term_id label image emoji type }
        }
        as_object_triples {
          term_id
          subject { term_id label image emoji type }
          predicate { term_id label image emoji type }
        }
        triplesPredicateTotal: as_predicate_triples_aggregate { aggregate { count } }
        triplesObjectTotal: as_object_triples_aggregate { aggregate { count } }
      }
    }
  `;
  const variables = { term_id: String(atomId) };
  return client.request(query, variables);
}

