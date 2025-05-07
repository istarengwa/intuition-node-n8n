![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-intuition

This repository contains custom nodes for [n8n](https://n8n.io) that integrate with the [Intuition Protocol](https://intuition.systems). These nodes allow you to query the Intuition GraphQL API directly within your automation workflows.

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone git@github.com:istarengwa/intuition.git
cd intuition
```

### 2. Install dependencies

```bash
pnpm install
```

> Make sure you are using Node.js 18+ and `pnpm` version 9 or higher.

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

This node allows you to interact with the Intuition GraphQL API using different endpoints (`railsMockApi`, `base`, `baseSepolia`) and execute various operations:

| Operation                  | Description                                                                       |
| -------------------------- | --------------------------------------------------------------------------------- |
| `fetchTriples`             | Fetch all available triples                                                       |
| `fetchTriplesForSubject`   | Fetch triples where a specific `subject.id` is involved                           |
| `fetchTriplesForPredicate` | Fetch triples with a given predicate ID                                           |
| `fetchTriplesForObject`    | Fetch triples linked to a specific object                                         |
| `fetchTripleById`          | Fetch a single triple using its unique ID                                         |
| `fetchAtoms`               | Retrieve a full list of atoms and their metadata (label, value, vault info, etc.) |
| `fetchAtomDetails`         | Fetch detailed data about a specific atom                                         |
| `searchTriples`            | Perform advanced filtering to search for specific triples                         |

---

## 📁 Project Structure

```
/nodes
  /IntuitionFetch
    IntuitionFetch.node.ts       ← Main node logic

/modules
  Base.ts                        ← Endpoint definition (Mainnet + Mock)
  BaseSepolia.ts                 ← Testnet endpoint + exports
  Atoms.ts                       ← Atom-related fetch functions
  Triples.ts                     ← Triple-related fetch functions
```

---

## 🔐 Authentication

No authentication is required at the moment for the public Intuition GraphQL endpoints (`base` and `baseSepolia`).

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