# Quick Start: Tool Calls & References with v2 Schema

Get up and running with the new tool calls and references feature in 5 minutes.

## Prerequisites

- Chat message data conforming to the v2 schema
- TypeScript types generated from JSON schema

## Step 1: Import Components

```typescript
// Option 1: Import from index
import {
  VectorSearchResults,
  MetadataCard,
  QACard,
  DocumentCard,
  ToolCallsDrawer
} from "@/components/agent-chat";

// Option 2: Import directly
import { VectorSearchResults } from "@/components/agent-chat/vector-search-results";
import { MetadataCard } from "@/components/agent-chat/metadata-cards";
```

## Step 2: Import Types and Helpers

```typescript
import {
  ChatMessageV2,
  VectorSearchToolCall,
  VectorSearchWithRerankingToolCall,
} from "@/ts/types/ChatMessage";

import {
  isQaMetadata,
  isTextDocumentMetadata,
  formatScore,
} from "@/ts/utils/chat-message-helpers";
```

## Step 3: Basic Usage - Display Tool Calls

```typescript
function MyChat() {
  const [message, setMessage] = useState<ChatMessageV2 | null>(null);

  return (
    <div>
      {/* Display message content */}
      <div>{message?.content}</div>

      {/* Display tool calls */}
      {message?.toolCalls?.map((toolCall, i) => (
        <VectorSearchResults key={i} toolCall={toolCall} />
      ))}
    </div>
  );
}
```

## Step 4: Display Individual Results

```typescript
function ResultsList({ results }: { results: VectorSearchResult[] }) {
  return (
    <div className="space-y-4">
      {results.map((result, i) => (
        <MetadataCard
          key={i}
          metadata={result.metadata}
          score={result.score}
        />
      ))}
    </div>
  );
}
```

## Step 5: Conditional Rendering Based on Metadata Type

```typescript
function ResultCard({ result }: { result: VectorSearchResult }) {
  if (isQaMetadata(result.metadata)) {
    // Render Q&A card
    return (
      <QACard
        {...result.metadata}
        score={result.score}
      />
    );
  } else if (isTextDocumentMetadata(result.metadata)) {
    // Render document card
    return (
      <DocumentCard
        {...result.metadata}
        score={result.score}
      />
    );
  }
  
  return null;
}
```

## Step 6: Use the Drawer (Existing Implementation)

The drawer is already integrated in your chat messages! It automatically detects the schema version.

```typescript
// Already implemented in chat-message.tsx
<ToolCallsDrawer
  isOpen={isDrawerOpen}
  onClose={() => setIsDrawerOpen(false)}
  toolCalls={message.toolCalls}  // v2 schema
  retrievalCalls={message.retrievalCalls}  // Legacy fallback
/>
```

## Common Patterns

### Pattern 1: Tool Call Type Detection

```typescript
function renderToolCall(toolCall: VectorSearchToolCall | VectorSearchWithRerankingToolCall) {
  if (toolCall.toolType === "vectorSearch") {
    return <div>🔍 Basic Search: {toolCall.input.query}</div>;
  } else {
    return <div>🔄 Reranked Search: {toolCall.input.query}</div>;
  }
}
```

### Pattern 2: Custom Metadata Display

```typescript
function CustomMetadataView({ metadata }: { metadata: TextDocumentMetadata }) {
  const customFields = getCustomFields(metadata);
  
  return (
    <div>
      {Object.entries(customFields).map(([key, value]) => (
        <div key={key}>
          <strong>{formatCustomFieldName(key)}:</strong> {value}
        </div>
      ))}
    </div>
  );
}
```

### Pattern 3: Score Display

```typescript
function ScoreBadge({ score }: { score: number }) {
  return (
    <span className={score > 0.8 ? "text-green-400" : "text-yellow-400"}>
      {formatScore(score)}
    </span>
  );
}
```

## Real-World Example

Here's a complete example showing a chat interface with tool calls:

```typescript
import { useState } from "react";
import { ChatMessageV2 } from "@/ts/types/ChatMessage";
import { VectorSearchResults } from "@/components/agent-chat";

function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessageV2[]>([]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    // Send to backend and receive response
    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: input }),
    });
    
    const data: ChatMessageV2 = await response.json();
    setMessages([...messages, data]);
  };

  return (
    <div className="chat-container">
      {/* Messages */}
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className="message">
            {/* Message content */}
            <div className="content">{msg.content}</div>
            
            {/* Tool calls */}
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <div className="tool-calls">
                <h4>Sources:</h4>
                {msg.toolCalls.map((toolCall, j) => (
                  <VectorSearchResults key={j} toolCall={toolCall} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
```

## Testing Your Implementation

### 1. Create Test Data

```typescript
const testMessage: ChatMessageV2 = {
  role: "ai",
  content: "Based on the documentation, Ollama is...",
  toolCalls: [
    {
      toolType: "vectorSearch",
      toolName: "search_docs",
      input: {
        query: "What is Ollama?",
        topK: 5,
      },
      output: {
        results: [
          {
            id: "abc123",
            score: 0.92,
            metadata: {
              filename: "ollama_guide.md",
              chunkId: 1,
              content: "Ollama is an open-source tool...",
              chunkSizeTokens: 150,
              uploadTimestamp: "1706234567890",
              chunkNumber: 1,
              totalChunks: 5,
            },
          },
        ],
        namespace: "docs",
        index: "kb",
      },
    },
  ],
};
```

### 2. Render Test Component

```typescript
function TestPage() {
  return (
    <div>
      <h1>Tool Calls Test</h1>
      <VectorSearchResults toolCall={testMessage.toolCalls![0]} />
    </div>
  );
}
```

### 3. Verify Features

- ✅ Tool call header displays correctly
- ✅ Query is shown
- ✅ Results are expandable
- ✅ Metadata displays properly
- ✅ Scores are formatted correctly
- ✅ Copy to clipboard works

## Troubleshooting

### Problem: TypeScript errors on metadata access

**Solution:** Use type guards before accessing type-specific properties:

```typescript
// ❌ Wrong
console.log(metadata.q);  // Error: Property 'q' may not exist

// ✅ Correct
if (isQaMetadata(metadata)) {
  console.log(metadata.q);  // TypeScript knows the type
}
```

### Problem: Tool calls not displaying

**Solution:** Check that your data matches the v2 schema:

```typescript
// ✅ Correct v2 format
{
  toolType: "vectorSearch",
  toolName: "search_docs",
  input: { query: "..." },
  output: { results: [...] }
}

// ❌ Old format (use retrievalCalls prop instead)
{
  name: "search",
  query: "...",
  results: [...]
}
```

### Problem: Custom YAML fields not showing

**Solution:** Ensure fields are prefixed with `file_`:

```typescript
// ✅ Correct
metadata: {
  // ... other fields
  file_video_title: "Introduction",
  file_video_url: "https://..."
}

// ❌ Wrong (not prefixed)
metadata: {
  video_title: "Introduction"  // Won't show as custom field
}
```

## Next Steps

1. ✅ Read the [full documentation](./src/schemas/README.md)
2. ✅ Check out the [migration guide](./src/schemas/MIGRATION.md)
3. ✅ Review [type definitions](./src/ts/types/ChatMessage.ts)
4. ✅ Explore [helper utilities](./src/ts/utils/chat-message-helpers.ts)

## Need Help?

- Check the [implementation summary](./TOOL_CALLS_UPDATE_SUMMARY.md)
- Review example usage in existing chat components
- Look at the tool-calls-drawer implementation for advanced patterns

---

**You're ready to go!** Start by importing the components and rendering your first tool call. 🚀
