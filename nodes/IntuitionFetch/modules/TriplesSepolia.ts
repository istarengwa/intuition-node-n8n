import { GraphQLClient } from 'graphql-request';

export async function fetchTriples(client: GraphQLClient) {
  const query = `
    query {
      triples {
        term_id
        subject { term_id label }
        predicate { term_id label }
        object { term_id label }
      }
    }
  `;
  return client.request(query);
}

export async function fetchTriplesForSubject(client: GraphQLClient, subjectId: string) {
  const query = `
    query GetTriplesForSubject($sid: String!) {
      triples(where: { subject_id: { _eq: $sid } }) {
        term_id
        subject { term_id label }
        predicate { term_id label }
        object { term_id label }
      }
    }
  `;
  const variables = { sid: subjectId };
  return client.request(query, variables);
}

export async function fetchTriplesForPredicate(client: GraphQLClient, predicateId: string) {
  const query = `
    query GetTriplesForPredicate($pid: String!) {
      triples(where: { predicate_id: { _eq: $pid } }) {
        term_id
        subject { term_id label }
        predicate { term_id label }
        object { term_id label }
      }
    }
  `;
  const variables = { pid: predicateId };
  return client.request(query, variables);
}

export async function fetchTriplesForObject(client: GraphQLClient, objectId: string) {
  const query = `
    query GetTriplesForObject($oid: String!) {
      triples(where: { object_id: { _eq: $oid } }) {
        term_id
        subject { term_id label }
        predicate { term_id label }
        object { term_id label }
      }
    }
  `;
  const variables = { oid: objectId };
  return client.request(query, variables);
}

export async function fetchTripleById(client: GraphQLClient, tripleId: string) {
  const query = `
    query GetTripleById($tid: String!) {
      triples(where: { term_id: { _eq: $tid } }) {
        term_id
        subject { term_id label }
        predicate { term_id label }
        object { term_id label }
      }
    }
  `;
  const variables = { tid: tripleId };
  return client.request(query, variables);
}

