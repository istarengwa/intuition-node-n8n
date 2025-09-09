![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-intuition

This repository contains custom nodes for [n8n](https://n8n.io) that integrate with the [Intuition Protocol](https://intuition.systems). These nodes allow you to query the Intuition GraphQL API directly within your automation workflows.

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone git@github.com:istarengwa/intuition-node-n8n.git
cd intuition-node-n8n
```

### 2. Install dependencies

```bash
npm install
```

> Make sure you are using Node.js 20+ and `npm` version 9 or higher.

### 3. Run in development mode

```bash
N8N_ENABLE_CUSTOM_EXTENSIONS=true \
N8N_CUSTOM_EXTENSIONS=./dist \
pnpm dev
```

> Ensure that port `5678` is free or set a different port using the `PORT` environment variable.

---

## 🧱 Available Nodes

### ✅ `Intuition Fetch`

This node allows you to interact with the Intuition GraphQL API on the public testnet (testnet-only for now):

- Intuition Testnet indexer: `https://testnet.intuition.sh/v1/graphql`

| Operation                  | Description                                                                       |
| -------------------------- | --------------------------------------------------------------------------------- |
| `fetchTriples`             | Fetch all available triples                                                       |
| `fetchAtoms`               | Retrieve a full list of atoms and their metadata (label, value, vault info, etc.) |
| `searchAtoms`              | Search atoms by optional filters (term_id, label, type, wallet_id, transaction_hash, emoji, image contains, block_number min/max, created_at from/to) + sorting (created_at, block_number) |
| `searchTriples`            | Search triples by optional filters (triple term_id, atom term_id, atom label across subject/predicate/object) |

---

## 📁 Project Structure

```
/nodes
  /IntuitionFetch
    IntuitionFetch.node.ts       ← Main node logic

/modules
  BaseSepolia.ts                 ← Testnet endpoint + exports
  AtomsSepolia.ts                ← Atom-related fetch functions (testnet)
  TriplesSepolia.ts              ← Triple-related fetch functions (testnet)
  (includes flexible search helpers)

### 🔔 `Intuition Trigger`

Emits new items automatically at a schedule (polling):

- Resource: `Atoms` or `Triples`
- Filters: same spirit as `Search` operations (all optional)
- Start From Now: ignores existing data on first run; only emits new items afterwards
- Page Size: max items checked per poll

Use cases:
- Notify when a new atom with label contains “The Hacking Project” appears
- Notify when a new triple involves a given atom (by label or term_id) in any position

---

## 🔎 Searching & Sorting

- Atoms (`Search Atoms`):
  - Filters (all optional): `term_id`, `label` (contains), `type`, `wallet_id`, `transaction_hash`, `emoji`, `image` (contains), `block_number` min/max, `created_at` from/to.
  - Sorting: optional, by `created_at`, `block_number`, with direction asc/desc.
  - Relative time: enable “Use Relative Time Filter” and set amount + unit.
- Triples (`Search Triples`):
  - Filters (all optional): `triple term_id`, `atom term_id` (matches subject/predicate/object), `atom label` (contains), optional relative-time filter (created within last X seconds/minutes/hours/days).
  - Sorting: optional, by `created_at` or `block_number`, with direction asc/desc.

### Triple Output Fields (v1.5 schema)
- Triple: `term_id`, `created_at`, `block_number`, `transaction_hash`, `creator_id`, `creator { id, label, image, atom_id, type }`
- Subject/Predicate/Object (atoms):
  - Basic: `term_id`, `label`, `image`, `emoji`, `type`, `data`, `creator { id, label, image, atom_id, type }`
  - Term metrics: `term { total_market_cap, updated_at }`
  - Aggregates: `positions_aggregate { aggregate { count } }`, and `as_subject_triples_aggregate / as_predicate_triples_aggregate / as_object_triples_aggregate { aggregate { count } }`

Notes:
- Legacy fields `id`, `block_timestamp`, `vault`, `counter_vault`, `total_shares` are replaced by `term_id`, `created_at`, `term{...}` and `total_market_cap` respectively.

---

## ⚖️ Output Mode (Light vs Full)

- Parameter: `Light Output` (boolean) on Fetch/Search/Trigger nodes.
- Light:
  - Triples: `term_id`, `created_at`, and for each atom: `term_id`, `label`.
  - Atoms: `term_id`, `label`, `emoji`, `image`, `type`, `data`, `block_number`, `created_at`, `transaction_hash`, `wallet_id`, and aggregate counts.
- Full:
  - Triples: adds `block_number`, `transaction_hash`, `creator_id`, `creator{...}` and extended subject/predicate/object fields including aggregates and term metrics.
  - Atoms: adds `creator{...}`, `term{ total_market_cap, updated_at }`, positions and detailed related triples.

Tip: To detect new triples involving a specific atom label (e.g. “The Hacking Project”), set `Operation = Search Triples`, `Atom Label (contains) = The Hacking Project`, choose sort `Term ID` desc, and optionally deduplicate with workflow static data before posting to Discord.
```

---

## 🔐 Authentication

No authentication is required for the public GraphQL endpoint listed above. Rate limits may apply.

Note: The GraphQL schema has been updated in v1.5. Fields like `id` have been replaced by `term_id`, and several nested shapes have changed. This repository has been migrated accordingly.

---

## ⚙️ Dependencies

* [Node.js](https://nodejs.org) 18+
* [pnpm](https://pnpm.io) (v9+ recommended)
* [n8n](https://n8n.io) installed globally:

```bash
pnpm add -g n8n
```

---

## 📖 Related Documentation

* [Intuition Protocol Developer Docs](https://tech.docs.intuition.systems/dev/)
* [n8n - Building Custom Nodes](https://docs.n8n.io/integrations/creating-nodes/)

---

## 📄 License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)
