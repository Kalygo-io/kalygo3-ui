# Migration Guide: Chat Message Schema v2

This guide helps you migrate from the legacy chat message format to the new v2 schema.

## Overview of Changes

### Before (Legacy Schema)

```typescript
interface Message {
  id: string;
  content: string;
  role: "human" | "ai";
  error: any;
  retrievalCalls?: RetrievalCall[];
  toolCalls?: ToolCall[]; // Old-style tool calls
}
```

### After (v2 Schema)

```typescript
interface ChatMessageV2 {
  role: "human" | "ai";
  content: string;
  toolCalls?: (VectorSearchToolCall | VectorSearchWithRerankingToolCall)[];
}
```

## Key Differences

### 1. Tool Call Structure

**Legacy:**
```typescript
{
  name: "retrieval with re-ranking",
  query: "search query",
  namespace: "docs",
  index: "knowledge-base",
  results: [...]
}
```

**v2:**
```typescript
{
  toolType: "vectorSearchWithReranking",
  toolName: "search_rerank_kb",
  input: {
    query: "search query",
    topK: 5
  },
  output: {
    results: [...],
    namespace: "docs",
    index: "knowledge-base"
  }
}
```

### 2. Result Structure

**Legacy:**
```typescript
{
  chunk_id: "123",
  score: 0.95,
  content: "...",
  metadata?: Record<string, any>
}
```

**v2:**
```typescript
{
  id: "abc123...",  // SHA256 hash
  score: 0.95,
  metadata: TextDocumentMetadata | QaMetadata  // Strongly typed
}
```

### 3. Metadata Structure

**Legacy (untyped):**
```typescript
metadata?: {
  filename?: string;
  [key: string]: any;
}
```

**v2 (strongly typed):**
```typescript
// Text documents
metadata: {
  filename: string;
  chunkId: number;
  content: string;
  chunkSizeTokens: number;
  uploadTimestamp: string;
  chunkNumber: number;
  totalChunks: number;
  [key: string]: string | number | unknown;  // Custom fields
}

// Q&A pairs
metadata: {
  row_number: number;
  q: string;
  a: string;
  content: string;
  filename: string;
  user_id: string;
  user_email: string;
  upload_timestamp: string;
}
```

## Migration Steps

### Step 1: Update Backend to Emit v2 Schema

Update your backend services to emit messages in the v2 format:

```python
# Before
{
    "role": "ai",
    "content": "...",
    "toolCalls": [
        {
            "name": "retrieval",
            "query": "...",
            "results": [...]
        }
    ]
}

# After
{
    "role": "ai",
    "content": "...",
    "toolCalls": [
        {
            "toolType": "vectorSearch",
            "toolName": "search_docs",
            "input": {
                "query": "...",
                "topK": 5
            },
            "output": {
                "results": [...],
                "namespace": "docs",
                "index": "kb"
            }
        }
    ]
}
```

### Step 2: Update Component Props

Update your components to accept the new types:

```typescript
// Before
import { Message, ToolCall } from "@/ts/types/Message";

interface Props {
  message: Message;
}

// After
import { ChatMessageV2 } from "@/ts/types/ChatMessage";

interface Props {
  message: ChatMessageV2;
}
```

### Step 3: Update Tool Call Rendering

Replace legacy rendering logic with the new components:

```typescript
// Before
{message.retrievalCalls?.map((call, i) => (
  <div key={i}>
    <div>Query: {call.query}</div>
    <div>Namespace: {call.namespace}</div>
    {call.reranked_results.map((result, j) => (
      <div key={j}>{result.content}</div>
    ))}
  </div>
))}

// After
import { VectorSearchResults } from "@/components/agent-chat/vector-search-results";

{message.toolCalls?.map((toolCall, i) => {
  if (toolCall.toolType === "vectorSearch" || 
      toolCall.toolType === "vectorSearchWithReranking") {
    return <VectorSearchResults key={i} toolCall={toolCall} />;
  }
  return null;
})}
```

### Step 4: Update Metadata Rendering

Replace custom metadata rendering with typed cards:

```typescript
// Before
{result.metadata && (
  <div>
    {result.metadata.filename && <div>{result.metadata.filename}</div>}
    {result.metadata.content && <div>{result.metadata.content}</div>}
  </div>
)}

// After
import { MetadataCard, QACard, DocumentCard } from "@/components/agent-chat/metadata-cards";

// Option 1: Auto-detect type
<MetadataCard metadata={result.metadata} score={result.score} />

// Option 2: Explicit type checking
{isQaMetadata(result.metadata) ? (
  <QACard {...result.metadata} score={result.score} />
) : (
  <DocumentCard {...result.metadata} score={result.score} />
)}
```

### Step 5: Update Type Guards

Replace custom type checking with provided utilities:

```typescript
// Before
if (result.metadata && 'q' in result.metadata) {
  // Handle Q&A
}

// After
import { isQaMetadata, isTextDocumentMetadata } from "@/ts/utils/chat-message-helpers";

if (isQaMetadata(result.metadata)) {
  // Handle Q&A - TypeScript knows the exact type
  console.log(result.metadata.q, result.metadata.a);
}
```

## Backward Compatibility

The `ToolCallsDrawer` component supports both old and new schemas during the migration period:

```typescript
<ToolCallsDrawer
  isOpen={isOpen}
  onClose={handleClose}
  toolCalls={message.toolCalls}        // v2 schema
  retrievalCalls={message.retrievalCalls}  // Legacy schema (fallback)
/>
```

The drawer automatically detects which schema is being used and renders accordingly.

## Testing Your Migration

### 1. Unit Tests

```typescript
import { isQaMetadata, isTextDocumentMetadata } from "@/ts/utils/chat-message-helpers";

describe("Metadata type guards", () => {
  it("should identify Q&A metadata", () => {
    const qaMetadata: QaMetadata = {
      row_number: 1,
      q: "What is AI?",
      a: "Artificial Intelligence...",
      content: "Q: What is AI?\nA: Artificial Intelligence...",
      filename: "faq.csv",
      user_id: "123",
      user_email: "user@example.com",
      upload_timestamp: "1706234567890"
    };
    expect(isQaMetadata(qaMetadata)).toBe(true);
  });

  it("should identify document metadata", () => {
    const docMetadata: TextDocumentMetadata = {
      filename: "guide.md",
      chunkId: 1,
      content: "...",
      chunkSizeTokens: 150,
      uploadTimestamp: "1706234567890",
      chunkNumber: 1,
      totalChunks: 5
    };
    expect(isTextDocumentMetadata(docMetadata)).toBe(true);
  });
});
```

### 2. Integration Tests

```typescript
describe("VectorSearchResults component", () => {
  it("should render vector search tool call", () => {
    const toolCall: VectorSearchToolCall = {
      toolType: "vectorSearch",
      toolName: "search_docs",
      input: { query: "test", topK: 5 },
      output: {
        results: [],
        namespace: "docs",
        index: "kb"
      }
    };
    
    const { getByText } = render(<VectorSearchResults toolCall={toolCall} />);
    expect(getByText("Vector Search")).toBeInTheDocument();
  });
});
```

### 3. Visual Testing

1. Test with Q&A results - verify question/answer display
2. Test with document chunks - verify chunking information
3. Test with custom YAML fields - verify they display correctly
4. Test expand/collapse functionality
5. Test copy-to-clipboard functionality

## Common Issues and Solutions

### Issue 1: TypeScript Errors on Metadata

**Error:**
```
Property 'q' does not exist on type 'TextDocumentMetadata | QaMetadata'
```

**Solution:**
Use type guards before accessing type-specific properties:

```typescript
if (isQaMetadata(metadata)) {
  console.log(metadata.q);  // ✅ TypeScript knows it's QaMetadata
}
```

### Issue 2: Missing toolType Field

**Error:**
```
Cannot read property 'toolType' of undefined
```

**Solution:**
Your backend is still sending the old schema. Update backend first, or use the backward-compatible drawer:

```typescript
<ToolCallsDrawer
  toolCalls={message.toolCalls}
  retrievalCalls={message.retrievalCalls}  // Fallback for old data
/>
```

### Issue 3: Custom YAML Fields Not Displaying

**Cause:**
Custom fields must be prefixed with `file_` in the metadata.

**Solution:**
```python
# Backend should send:
metadata = {
    "filename": "doc.md",
    "chunkId": 1,
    # ...
    "file_video_title": "Introduction",  # ✅ Prefixed with file_
    "file_video_url": "https://..."      # ✅ Prefixed with file_
}
```

## Rollback Plan

If you need to rollback:

1. Update backend to emit old schema
2. Use legacy `Message` type instead of `ChatMessageV2`
3. Use `retrievalCalls` prop instead of `toolCalls`

The components will automatically fallback to legacy rendering.

## Questions?

For questions or issues during migration, refer to:
- [Schema README](./README.md)
- [Type definitions](../ts/types/ChatMessage.ts)
- [Helper utilities](../ts/utils/chat-message-helpers.ts)
