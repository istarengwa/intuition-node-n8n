![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-intuition

Custom n8n nodes for the [Intuition Protocol](https://intuition.systems) to read from the public GraphQL indexer and automate alerts, digests, and data flows. Includes a Fetch node (pull on-demand) and a Trigger node (poll and emit new items).

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
npm run dev
```

> Ensure that port `5678` is free or set a different port using the `PORT` environment variable.

---

## 🧱 Available Nodes

### ✅ `Intuition Fetch`

This node interacts with the Intuition GraphQL API on the public testnet:

- Intuition Testnet indexer: `https://testnet.intuition.sh/v1/graphql`

Operations (Fetch first, then Search):
- Fetch Triples
- Fetch Atoms
- Fetch Accounts
- Fetch Positions
- Fetch Vaults
- Search Atoms
- Search Triples
- Search Accounts
- Search Positions
- Search Vaults

---

## 📁 Project Structure

```
/nodes
  /IntuitionFetch
    IntuitionFetch.node.ts       ← Main node logic (Fetch)
    /modules
      BaseSepolia.ts             ← Endpoint + re-exports
      AtomsSepolia.ts            ← Atom queries + flexible search
      TriplesSepolia.ts          ← Triple queries + flexible search
      AccountsSepolia.ts         ← Account queries + flexible search
      PositionsSepolia.ts        ← Position queries + flexible search
      VaultsSepolia.ts           ← Vault queries + flexible search
```

### 🔔 `Intuition Trigger`

Emits new items automatically at a schedule (polling):

- Resources: `Atoms`, `Triples`, `Accounts`, `Positions`, `Vaults`
- Filters: same as the corresponding Search operations (Light vs Full controls which filters are visible)
- Relative Time filters: optional (see section below)
- Sorting: optional (when enabled, an `order_by` is sent)
- Start From Now: ignore historical data on first run; emit only new items afterwards
- Page Size: max items checked per poll
- De-dup: persistent per resource to avoid re-emitting

Use cases:
- Notify when a new atom with label contains “The Hacking Project” appears
- Notify when a new triple involves a given atom (by label or term_id) in any position
- Detect new positions created by a specific account
- Track new/updated vaults (by curve, block, market cap)

---

## 🔎 Searching, Sorting, Relative Time

General rules:
- Filters are optional; combine as needed.
- Sorting is optional; when disabled, no `order_by` is sent.
- Light Output reduces payload; Full Output includes richer nested data.
- Relative Time (when available) sets a moving window from “now − amount × unit” (e.g., last 10 minutes) and applies `createdAtFrom` automatically.

Atoms
- Filters: `term_id`, `label` (ilike), `type`, `wallet_id`, `transaction_hash`, `emoji`, `image` (ilike), `data` (ilike), block_number min/max, `created_at` from/to, creator (id/label/type/atom_id), term.total_market_cap min/max, term.updated_at from/to.
- Sorting (optional): `created_at` | `block_number` (asc/desc)
- Relative Time: yes (created_at)

Triples
- Filters: triple `term_id`, `atomTermId`/`atomLabel` (any position), created_at from/to, transaction_hash, creator_id, block_number min/max, position-specific: subject/predicate/object (term_id, label ilike, type, emoji, creator_id, data ilike, image ilike).
- Sorting (optional): `created_at` | `block_number` (asc/desc)
- Relative Time: yes (created_at)

Accounts
- Filters: id, label (ilike), type, atom_id, image (ilike), activity window via positions.created_at from/to.
- Sorting (optional): `id` | `label` (asc/desc)
- Relative Time: yes (positions.created_at) → filters accounts with recent position activity

Positions
- Filters: id, account_id, term_id, curve_id, transaction_hash, block_number min/max, created_at from/to, shares min/max.
- Sorting (optional): `created_at` | `block_number` (asc/desc)
- Relative Time: yes (created_at)

Vaults
- Filters: term_id, curve_id, block_number min/max, created_at from/to, position_count min/max, market_cap min/max, total_shares min/max, current_share_price min/max.
- Sorting (optional): `created_at` | `block_number` | `market_cap` (asc/desc)
- Relative Time: yes (created_at)

## 📦 Output Fields (v1.5 schema)
- Triple: `term_id`, `created_at`, `block_number`, `transaction_hash`, `creator_id`, `creator { id, label, image, atom_id, type }`
- Subject/Predicate/Object (atoms):
  - Basic: `term_id`, `label`, `image`, `emoji`, `type`, `data`, `creator { id, label, image, atom_id, type }`
  - Term metrics: `term { total_market_cap, updated_at }`
  - Aggregates: `positions_aggregate { aggregate { count } }`, and `as_subject_triples_aggregate / as_predicate_triples_aggregate / as_object_triples_aggregate { aggregate { count } }`

Notes:
- Legacy fields `id`, `block_timestamp`, `vault`, `counter_vault`, `total_shares` are replaced by `term_id`, `created_at`, `term{...}` and `total_market_cap` respectively.
- Compare across vaults using `market_cap` or `term.total_market_cap` (do not compare `total_shares` across different curves).

---

## ⚖️ Output Mode (Light vs Full)

- Parameter: `Light Output` (boolean) on Fetch/Search/Trigger nodes.
- Light:
  - Triples: `term_id`, `created_at`, and for each atom: `term_id`, `label`.
  - Atoms: `term_id`, `label`, `emoji`, `image`, `type`, `data`, `block_number`, `created_at`, `transaction_hash`, `wallet_id`, and aggregate counts.
- Full:
  - Triples: adds `block_number`, `transaction_hash`, `creator_id`, `creator{...}` and extended subject/predicate/object fields including aggregates and term metrics.
  - Atoms: adds `creator{...}`, `term{ total_market_cap, updated_at }`, positions and detailed related triples.
  - Accounts/Positions/Vaults: see Output Fields above.

Tip: To detect new triples involving a specific atom label (e.g., “The Hacking Project”), set `Operation = Search Triples`, add filter `Atom Label (contains)`, optionally enable “Use Triple Relative Time Filter”, and post to Discord. For notifications without duplicates, prefer the Trigger node.

## 🔔 Trigger Node — Behavior & Best Practices

- Polling & Emission:
  - Emits new items for the selected resource, applying filters, optional relative time, and optional sorting.
  - “Start From Now” ignores historical data at first run.
  - De-dup is persistent per resource:
    - Atoms: cursor on `created_at`
    - Triples: seen set by `term_id`
    - Accounts: seen set by `id`
    - Positions: seen set by `id`
    - Vaults: seen set by `transaction_hash` (fallback to `term_id`)

- Choosing windows:
  - Use Relative Time ≥ polling interval for resilience to delays.
  - For strict “exactly-once” alerts, rely on the Trigger node and de-dup, not on Fetch with relative windows.

## 🧪 Examples

- New Triple with a specific atom label:
  - Trigger → Resource: Triples
  - Triple Filters: Atom Label (contains): “The Hacking Project”
  - Start From Now: ON
  - Optional: Use Triple Relative Time Filter (e.g., last 5 minutes)
  - Send to Discord/Slack

- New Atoms recently created:
  - Trigger → Resource: Atoms
  - Use Atom Relative Time Filter: 2 minutes
  - Start From Now: ON
  - Optional: Atom Sorting by `created_at` asc

- Daily report of Positions:
  - Cron → Fetch → Search Positions
  - Relative Time: 24 hours
  - Aggregate in a Function node; export to CSV/Notion/Google Sheets

---

## 🔐 Authentication

No authentication is required for the public GraphQL endpoint listed above. Rate limits may apply.

Note: The GraphQL schema has been updated in v1.5. Fields like `id` have been replaced by `term_id`, and several nested shapes have changed. This repository has been migrated accordingly.

---

## ⚙️ Dependencies

* [Node.js](https://nodejs.org) 20+
* [n8n](https://n8n.io) installed globally:

```bash
npm i n8n
```

---

## 📖 Related Documentation

* [Intuition Protocol Developer Docs](https://tech.docs.intuition.systems/dev/)
* [n8n - Building Custom Nodes](https://docs.n8n.io/integrations/creating-nodes/)

---

## 📄 License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)
