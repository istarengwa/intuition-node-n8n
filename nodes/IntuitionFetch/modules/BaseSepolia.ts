import {
    IntuitionEndpoint,
    fetchTriples,
    fetchTriplesForSubject,
    fetchTriplesForPredicate,
    fetchTriplesForObject,
    fetchTripleById,
    fetchAtoms,
    fetchAtomDetails,
    searchTriples,
  } from './Base';
  
  export const ENDPOINTS: Record<'baseSepolia', IntuitionEndpoint> = {
    baseSepolia: {
      url: 'https://api.i7n.dev/v1/graphql',
    },
  };
  
  export {
    fetchTriples,
    fetchTriplesForSubject,
    fetchTriplesForPredicate,
    fetchTriplesForObject,
    fetchTripleById,
    fetchAtoms,
    fetchAtomDetails,
    searchTriples,
  };
  