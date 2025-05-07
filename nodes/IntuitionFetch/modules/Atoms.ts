import { GraphQLClient } from 'graphql-request';

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