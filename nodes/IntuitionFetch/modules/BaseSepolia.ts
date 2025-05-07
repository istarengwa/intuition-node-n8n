import { IntuitionEndpoint } from './Base';
  
export const ENDPOINTS: Record<'baseSepolia', IntuitionEndpoint> = {
  baseSepolia: {
    url: 'https://api.i7n.dev/v1/graphql',
  },
};

export * from './Triples';
export * from './Atoms';
  