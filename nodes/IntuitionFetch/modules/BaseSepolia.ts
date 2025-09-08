// Local, minimal typing to avoid depending on deprecated Base module
export interface IntuitionEndpoint { url: string }

export const ENDPOINTS: Record<'baseSepolia', IntuitionEndpoint> = {
  baseSepolia: {
    // Public testnet indexer
    url: 'https://testnet.intuition.sh/v1/graphql',
  },
};

// Re-export the testnet-specific operations to keep the original usage pattern
export * from './TriplesSepolia';
export * from './AtomsSepolia';
