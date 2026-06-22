# JSON Schema Documentation

This directory contains JSON schemas for validating data structures in the Kalygo application.

## Available Schemas

### `chat-message.v2.json`

Schema for chat messages with structured tool call outputs. This schema defines the structure for AI chat messages that include tool calls for vector search and retrieval operations.

#### Generating TypeScript Types

To generate TypeScript types from the JSON schema:

```bash
npx json-schema-to-typescript src/schemas/chat-message.v2.json > src/ts/types/ChatMessage.ts
```

Or add to `package.json` scripts:

```json
{
  "scripts": {
    "generate:types": "json-schema-to-typescript src/schemas/chat-message.v2.json > src/ts/types/ChatMessage.ts"
  }
}
```

Then run:

```bash
npm run generate:types
```

#### Schema Structure

The schema supports two types of tool calls:

1. **Vector Search** (`vectorSearch`)
   - Basic semantic search using vector embeddings
   - Returns similarity-based results

2. **Vector Search with Reranking** (`vectorSearchWithReranking`)
   - Enhanced search with LLM-based reranking
   - Returns relevance-scored results

#### Metadata Types

The schema supports two types of metadata for search results:

1. **Text Document Metadata** - For text/markdown files
   - Chunking information
   - Token counts
   - Custom YAML front matter fields (prefixed with `file_`)

2. **Q&A Metadata** - For CSV-based Q&A pairs
   - Question and answer text
   - Row numbers
   - User information

## Usage Example

### Creating a Chat Message with Tool Calls

```typescript
import { ChatMessageV2 } from "@/ts/types/ChatMessage";

const message: ChatMessageV2 = {
  role: "ai",
  content: "Based on the documentation...",
  toolCalls: [
    {
      toolType: "vectorSearch",
      toolName: "search_docs",
      input: {
        query: "How to use Ollama?",
        topK: 5
      },
      output: {
        results: [
          {
            id: "abc123...",
            score: 0.92,
            metadata: {
              filename: "ollama_guide.md",
              chunkId: 1,
              content: "Ollama is an open-source tool...",
              chunkSizeTokens: 150,
              uploadTimestamp: "1706234567890",
              chunkNumber: 1,
              totalChunks: 5
            }
          }
        ],
        namespace: "docs",
        index: "knowledge-base"
      }
    }
  ]
};
```

## Components

### `ToolCallsDrawer`

Comprehensive drawer for viewing all tool calls and their details.

**Props:**
- `isOpen: boolean`
- `onClose: () => void`
- `toolCalls?: ToolCall[] | (VectorSearchToolCall | VectorSearchWithRerankingToolCall)[]`
- `retrievalCalls?: RetrievalCall[]` (legacy support)

## Schema Validation

To validate data against the schema at runtime, consider using a JSON schema validator library like Ajv:

```bash
npm install ajv
```

```typescript
import Ajv from "ajv";
import chatMessageSchema from "@/schemas/chat-message.v2.json";

const ajv = new Ajv();
const validate = ajv.compile(chatMessageSchema);

if (validate(data)) {
  // Data is valid
} else {
  console.error(validate.errors);
}
```

## Versioning

Schemas are versioned (e.g., `v2`) to maintain backward compatibility. When making breaking changes:

1. Create a new schema version (e.g., `chat-message.v3.json`)
2. Generate new TypeScript types
3. Update components to support both versions during migration
4. Deprecate old version after migration is complete

## Backend Integration

Ensure your backend services emit data that conforms to these schemas. Use the same JSON schema files for server-side validation to maintain consistency across the stack.

### Python (FastAPI)

```python
from pydantic import BaseModel
from typing import Literal, List, Union

class VectorSearchToolCall(BaseModel):
    toolType: Literal["vectorSearch"]
    toolName: str
    input: dict
    output: dict
```

### Node.js (Express)

```javascript
const Ajv = require("ajv");
const schema = require("./schemas/chat-message.v2.json");

const ajv = new Ajv();
const validate = ajv.compile(schema);

// Validate before sending
if (validate(message)) {
  res.json(message);
} else {
  res.status(400).json({ errors: validate.errors });
}
```
