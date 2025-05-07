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

export * from './Triples';
export * from './Atoms';