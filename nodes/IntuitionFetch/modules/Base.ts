// Local, minimal typing to avoid depending on deprecated Base module
export interface IntuitionEndpoint { url: string }

export const ENDPOINTS: Record<'testnet', IntuitionEndpoint> = {
  testnet: {
    url: 'https://testnet.intuition.sh/v1/graphql',
  },
};

// Re-export resource modules
export * from './Triples';
export * from './Atoms';
export * from './Accounts';
export * from './Positions';
export * from './Vaults';
