# Tool Calls & References Feature Update - Summary

## Overview

Updated the tool calls and references feature to fully support the new chat message v2 schema, enabling detailed inspection of vector search results with structured metadata display.

## What Was Implemented

### 1. Schema Support ✅

**Location:** `/src/schemas/chat-message.v2.json`

- ✅ Existing JSON Schema for chat messages with tool calls
- ✅ Support for two tool types:
  - `vectorSearch` - Basic semantic search
  - `vectorSearchWithReranking` - Enhanced search with reranking
- ✅ Two metadata types:
  - `TextDocumentMetadata` - For text/markdown documents with chunking info
  - `QaMetadata` - For CSV Q&A pairs

### 2. TypeScript Types ✅

**Location:** `/src/ts/types/ChatMessage.ts`

- ✅ Generated TypeScript interfaces from JSON schema
- ✅ Fixed type errors in index signatures
- ✅ Strong typing for:
  - `ChatMessageV2`
  - `VectorSearchToolCall`
  - `VectorSearchWithRerankingToolCall`
  - `VectorSearchResult`
  - `TextDocumentMetadata`
  - `QaMetadata`

### 3. Helper Utilities ✅

**Location:** `/src/ts/utils/chat-message-helpers.ts`

Created reusable utilities for working with the schema:

- ✅ `isTextDocumentMetadata()` - Type guard for document metadata
- ✅ `isQaMetadata()` - Type guard for Q&A metadata
- ✅ `isVectorSearchToolCall()` - Type guard for vector search
- ✅ `isVectorSearchWithRerankingToolCall()` - Type guard for reranking
- ✅ `formatTimestamp()` - Format timestamp to date
- ✅ `formatTimestampWithTime()` - Format timestamp to date + time
- ✅ `formatScore()` - Format score as percentage
- ✅ `getToolTypeDisplayName()` - Get friendly tool type name
- ✅ `getFilenameFromMetadata()` - Extract filename from metadata
- ✅ `getCustomFields()` - Extract custom YAML front matter fields
- ✅ `formatCustomFieldName()` - Format custom field names for display

### 4. Metadata Display Components ✅

**Locations:**
- `/src/components/agent-chat/metadata-cards.tsx`
- `/src/components/local-agent-chat/metadata-cards.tsx`
- `/src/components/jwt-agent-chat/metadata-cards.tsx`

Three new components for displaying metadata:

#### `QACard` Component
Displays Q&A pair metadata with:
- ✅ Question and answer display
- ✅ Source filename
- ✅ Row number
- ✅ User information (ID, email)
- ✅ Upload timestamp
- ✅ Relevance score

#### `DocumentCard` Component
Displays text document metadata with:
- ✅ Filename with emoji
- ✅ Chunk information (e.g., "3 of 12")
- ✅ Chunk ID
- ✅ Token count
- ✅ Full content display
- ✅ Custom YAML front matter fields (e.g., video titles, URLs)
- ✅ Upload timestamp
- ✅ Similarity score

#### `MetadataCard` Component
Auto-detecting wrapper that renders:
- ✅ `QACard` for Q&A metadata
- ✅ `DocumentCard` for text document metadata

### 5. Vector Search Results Component ✅

**Locations:**
- `/src/components/agent-chat/vector-search-results.tsx`
- `/src/components/local-agent-chat/vector-search-results.tsx`
- `/src/components/jwt-agent-chat/vector-search-results.tsx`

Full-featured component for displaying vector search tool calls:

- ✅ Tool call header with tool type display
- ✅ Query display
- ✅ Top K parameter display
- ✅ Namespace and index information
- ✅ Expandable results list
- ✅ Score display for each result
- ✅ Automatic metadata card rendering
- ✅ Smooth animations and transitions

### 6. Enhanced Tool Calls Drawer ✅

**Locations:**
- `/src/components/agent-chat/tool-calls-drawer.tsx`
- `/src/components/local-agent-chat/tool-calls-drawer.tsx`
- `/src/components/jwt-agent-chat/tool-calls-drawer.tsx`

Comprehensive updates to support all schemas:

- ✅ **Multi-schema support** - Detects and handles v2, new, and legacy schemas
- ✅ **Tool type display** - Shows "Vector Search" vs "Vector Search with Reranking"
- ✅ **Enhanced metadata display**:
  - Chunk information (number, ID, tokens)
  - Q&A pairs (question/answer separated)
  - Custom YAML fields (video titles, URLs, etc.)
  - Upload timestamps
  - User information
- ✅ **Expand/collapse functionality**:
  - Toggle individual tool calls
  - Toggle individual chunks
  - All chunks expanded by default
- ✅ **Copy to clipboard** - Copy chunk content
- ✅ **Input parameter display**:
  - Query
  - Top K
  - Namespace
  - Index
- ✅ **Contextual information panel** - Shows total tool calls and chunks
- ✅ **Responsive design** - Full-screen drawer with smooth animations
- ✅ **Backward compatibility** - Works with old `retrievalCalls` data

### 7. Documentation ✅

**Location:** `/src/schemas/`

Comprehensive documentation created:

#### `README.md`
- ✅ Schema overview
- ✅ TypeScript type generation instructions
- ✅ Component usage examples
- ✅ Type guard documentation
- ✅ Backend integration examples (Python, Node.js)
- ✅ Runtime validation with Ajv
- ✅ Versioning strategy

#### `MIGRATION.md`
- ✅ Before/after comparisons
- ✅ Step-by-step migration guide
- ✅ Component update examples
- ✅ Testing strategies
- ✅ Common issues and solutions
- ✅ Rollback plan

## Usage Examples

### Example 1: Render Vector Search Results

```typescript
import { VectorSearchResults } from "@/components/agent-chat/vector-search-results";

// In your component
{message.toolCalls?.map((toolCall, i) => {
  if (toolCall.toolType === "vectorSearch") {
    return <VectorSearchResults key={i} toolCall={toolCall} />;
  }
  return null;
})}
```

### Example 2: Render Metadata Cards

```typescript
import { MetadataCard, QACard, DocumentCard } from "@/components/agent-chat/metadata-cards";

// Auto-detect type
<MetadataCard metadata={result.metadata} score={result.score} />

// Explicit type checking
{isQaMetadata(result.metadata) ? (
  <QACard {...result.metadata} score={result.score} />
) : (
  <DocumentCard {...result.metadata} score={result.score} />
)}
```

### Example 3: Use Type Guards

```typescript
import { isQaMetadata, isTextDocumentMetadata } from "@/ts/utils/chat-message-helpers";

if (isQaMetadata(metadata)) {
  // TypeScript knows this is QaMetadata
  console.log(metadata.q, metadata.a);
} else if (isTextDocumentMetadata(metadata)) {
  // TypeScript knows this is TextDocumentMetadata
  console.log(metadata.chunkNumber, metadata.totalChunks);
}
```

### Example 4: Format Data

```typescript
import {
  formatScore,
  formatTimestamp,
  getToolTypeDisplayName,
} from "@/ts/utils/chat-message-helpers";

const scoreText = formatScore(0.92);  // "92.0%"
const date = formatTimestamp("1706234567890");  // "1/26/2024"
const toolName = getToolTypeDisplayName("vectorSearch");  // "Vector Search"
```

## Features Demonstrated

### Chunk Inspection
- ✅ View each chunk individually
- ✅ See chunk position (e.g., "3 of 12")
- ✅ View chunk ID and token count
- ✅ Expand/collapse full content
- ✅ Copy content to clipboard

### Metadata Inspection
- ✅ Filename display
- ✅ Upload timestamps
- ✅ User information (for Q&A)
- ✅ Custom YAML fields (video titles, URLs, etc.)
- ✅ Similarity and relevance scores

### Tool Call Details
- ✅ Tool type (Vector Search vs Reranking)
- ✅ Query used
- ✅ Top K parameter
- ✅ Namespace and index
- ✅ Number of results

### User Experience
- ✅ Smooth animations
- ✅ Responsive design
- ✅ Color-coded information
- ✅ Contextual help text
- ✅ Intuitive expand/collapse
- ✅ Quick copy to clipboard

## Backward Compatibility

All components maintain backward compatibility with:
- ✅ Legacy `Message` type with `retrievalCalls`
- ✅ Old-style `ToolCall` with flat structure
- ✅ Untyped metadata
- ✅ Automatic fallback rendering

## Files Created/Modified

### Created Files (12)
1. `/src/ts/utils/chat-message-helpers.ts` - Helper utilities
2. `/src/components/agent-chat/metadata-cards.tsx` - Metadata display components
3. `/src/components/agent-chat/vector-search-results.tsx` - Vector search results
4. `/src/components/local-agent-chat/metadata-cards.tsx` - (Copy)
5. `/src/components/local-agent-chat/vector-search-results.tsx` - (Copy)
6. `/src/components/jwt-agent-chat/metadata-cards.tsx` - (Copy)
7. `/src/components/jwt-agent-chat/vector-search-results.tsx` - (Copy)
8. `/src/schemas/README.md` - Schema documentation
9. `/src/schemas/MIGRATION.md` - Migration guide
10. `/src/ts/types/ChatMessage.ts` - Generated types (already existed, fixed)

### Modified Files (4)
1. `/src/components/agent-chat/tool-calls-drawer.tsx` - Enhanced with v2 schema support
2. `/src/components/local-agent-chat/tool-calls-drawer.tsx` - (Copy of enhanced version)
3. `/src/components/jwt-agent-chat/tool-calls-drawer.tsx` - (Copy of enhanced version)
4. `/src/ts/types/ChatMessage.ts` - Fixed TypeScript errors

## Testing Checklist

- [ ] Test with vector search tool calls
- [ ] Test with vector search + reranking tool calls
- [ ] Test with Q&A metadata
- [ ] Test with text document metadata
- [ ] Test with custom YAML fields
- [ ] Test expand/collapse functionality
- [ ] Test copy to clipboard
- [ ] Test with legacy `retrievalCalls` data
- [ ] Test responsive design on mobile
- [ ] Test with no tool calls
- [ ] Test with empty results

## Next Steps

1. **Backend Integration**
   - Update backend to emit v2 schema format
   - Ensure metadata includes all required fields
   - Test with real data from your backend

2. **Component Integration**
   - Import and use new components in your chat interfaces
   - Replace old metadata rendering with new cards
   - Add `VectorSearchResults` component where needed

3. **Testing**
   - Run through testing checklist above
   - Add unit tests for type guards
   - Add integration tests for components

4. **Migration**
   - Follow the migration guide in `/src/schemas/MIGRATION.md`
   - Update backend services first
   - Update frontend components
   - Test thoroughly before deploying

## Support

For questions or issues:
- See `/src/schemas/README.md` for usage documentation
- See `/src/schemas/MIGRATION.md` for migration help
- Check type definitions in `/src/ts/types/ChatMessage.ts`
- Review helper utilities in `/src/ts/utils/chat-message-helpers.ts`

---

**Status:** ✅ Complete and ready for testing
**Backward Compatible:** ✅ Yes
**Linter Errors:** ✅ None
