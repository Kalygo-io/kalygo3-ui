# Component Architecture Guide

Visual guide to understanding the tool calls and references component structure.

## Component Hierarchy

```
ChatMessage
    └── ToolCallsDrawer
            └── Tool Call List
                    ├── VectorSearchToolCall
                    │       ├── Tool Header (type, name, query)
                    │       └── Results List
                    │               └── VectorSearchResult[]
                    │                       └── MetadataCard
                    │                               ├── QACard (if Q&A metadata)
                    │                               └── DocumentCard (if document metadata)
                    │
                    └── VectorSearchWithRerankingToolCall
                            ├── Tool Header (type, name, query, topK)
                            └── Results List
                                    └── VectorSearchResult[]
                                            └── MetadataCard
                                                    ├── QACard (if Q&A metadata)
                                                    └── DocumentCard (if document metadata)
```

## Component Details

### 1. ChatMessage Component
**Location:** `src/components/agent-chat/chat-message.tsx`

**Purpose:** Main chat message container

**Features:**
- Displays message content
- Shows user/AI avatar
- Renders "Tool Calls & References" button
- Opens ToolCallsDrawer on click

**Props:**
```typescript
{
  index: number;
  message: Message;
}
```

---

### 2. ToolCallsDrawer Component
**Location:** `src/components/agent-chat/tool-calls-drawer.tsx`

**Purpose:** Full-screen drawer showing all tool calls

**Features:**
- Multi-schema support (v2, legacy, new)
- Contextual information panel
- Expandable tool call sections
- Smooth animations
- Close button

**Props:**
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  toolCalls?: ToolCall[] | (VectorSearchToolCall | VectorSearchWithRerankingToolCall)[];
  retrievalCalls?: RetrievalCall[];  // Legacy support
}
```

**Usage:**
```typescript
<ToolCallsDrawer
  isOpen={isDrawerOpen}
  onClose={() => setIsDrawerOpen(false)}
  toolCalls={message.toolCalls}
/>
```

---

### 3. VectorSearchResults Component
**Location:** `src/components/agent-chat/vector-search-results.tsx`

**Purpose:** Displays a complete tool call with all results

**Features:**
- Tool type badge (🔍 or 🔄)
- Query display
- Input parameters (query, topK)
- Output information (namespace, index)
- Expandable results list

**Props:**
```typescript
{
  toolCall: VectorSearchToolCall | VectorSearchWithRerankingToolCall;
}
```

**Usage:**
```typescript
<VectorSearchResults toolCall={toolCall} />
```

---

### 4. MetadataCard Component
**Location:** `src/components/agent-chat/metadata-cards.tsx`

**Purpose:** Auto-detecting wrapper that renders the correct card type

**Features:**
- Type detection (Q&A vs Document)
- Automatic component selection

**Props:**
```typescript
{
  metadata: TextDocumentMetadata | QaMetadata;
  score?: number;
}
```

**Usage:**
```typescript
<MetadataCard metadata={result.metadata} score={result.score} />
```

---

### 5. QACard Component
**Location:** `src/components/agent-chat/metadata-cards.tsx`

**Purpose:** Displays Q&A pair metadata

**Features:**
- Question display (blue header)
- Answer display (green header)
- Source filename
- Row number
- User information
- Upload timestamp
- Score badge

**Props:**
```typescript
{
  ...QaMetadata;
  score?: number;
}
```

**Visual Structure:**
```
┌─────────────────────────────────┐
│ Relevance Score: 95.0%          │
├─────────────────────────────────┤
│ Question:                       │
│ ┌─────────────────────────────┐ │
│ │ What is Ollama?             │ │
│ └─────────────────────────────┘ │
│                                 │
│ Answer:                         │
│ ┌─────────────────────────────┐ │
│ │ Ollama is an open-source... │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Source: faq.csv    Row: 15      │
│ User: admin@example.com         │
│ Uploaded: 1/26/2024             │
└─────────────────────────────────┘
```

---

### 6. DocumentCard Component
**Location:** `src/components/agent-chat/metadata-cards.tsx`

**Purpose:** Displays document chunk metadata

**Features:**
- Filename with emoji (📄)
- Chunk position (e.g., "3 of 12")
- Chunk ID
- Token count
- Full content display
- Custom YAML fields
- Upload timestamp
- Score badge

**Props:**
```typescript
{
  ...TextDocumentMetadata;
  score?: number;
}
```

**Visual Structure:**
```
┌─────────────────────────────────┐
│ 📄 ollama_guide.md     92.0%    │
├─────────────────────────────────┤
│ Chunk: 1 of 5  Tokens: 150      │
│ ID: 1                            │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Ollama is an open-source... │ │
│ │ [Full content here]         │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Video Title: Introduction       │
│ Video Url: https://...          │
├─────────────────────────────────┤
│ Uploaded: 1/26/2024 10:30 AM    │
└─────────────────────────────────┘
```

---

## Data Flow

```
Backend API
    │
    ├─── Emits ChatMessageV2
    │       └── toolCalls: VectorSearchToolCall[]
    │               └── output.results: VectorSearchResult[]
    │                       └── metadata: TextDocumentMetadata | QaMetadata
    │
    ↓
Frontend State
    │
    ├─── message.toolCalls
    │
    ↓
ChatMessage Component
    │
    ├─── Displays message.content
    │
    └─── Button opens drawer
            │
            ↓
        ToolCallsDrawer
            │
            ├─── Detects schema version
            │
            └─── Renders tool calls
                    │
                    ↓
                Per Tool Call:
                    │
                    ├─── Tool header (type, query, params)
                    │
                    └─── Results list
                            │
                            ↓
                        Per Result:
                            │
                            ├─── Header (filename, score)
                            │
                            ├─── Metadata display
                            │       │
                            │       ├─── If QA: Show Q&A
                            │       └─── If Doc: Show chunks
                            │
                            └─── Expandable content
```

## State Management

### Drawer State
```typescript
const [isDrawerOpen, setIsDrawerOpen] = useState(false);
```

### Expanded Tool Calls State
```typescript
const [expandedToolCalls, setExpandedToolCalls] = useState<Set<number>>(new Set());
```

### Expanded Chunks State
```typescript
const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());
```

### Expanded Results State (VectorSearchResults)
```typescript
const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set());
```

## Styling Conventions

### Color Scheme
- **Blue** (`text-blue-400`): Tool-related info, queries, questions
- **Green** (`text-green-400`): Answers, success states
- **Purple** (`text-purple-400`): AI avatar, AI-related elements
- **Gray** (`text-gray-400`): Labels, secondary info
- **White** (`text-white`): Primary content
- **Red** (`text-red-400`): Errors

### Layout
- **Cards**: `rounded-lg`, `p-4`, `border border-gray-600/30`
- **Backgrounds**: `bg-gray-800/50` for containers, `bg-gray-900/50` for content
- **Spacing**: `space-y-3` for vertical, `space-x-3` for horizontal

### Animations
- **Transitions**: `transition-colors`, `transition-transform`
- **Hover**: `hover:bg-gray-700/50`, `hover:scale-105`
- **Active**: `active:scale-95`

## Accessibility

### Keyboard Navigation
- ✅ All buttons are keyboard accessible
- ✅ Drawer can be closed with Escape key (recommended)
- ✅ Tab navigation works throughout

### Screen Readers
- ✅ Semantic HTML structure
- ✅ ARIA labels on interactive elements
- ✅ Clear button text ("Show Details", "Hide Details")

### Visual Indicators
- ✅ Hover states on interactive elements
- ✅ Focus rings on keyboard navigation
- ✅ Color contrast meets WCAG AA standards

## Performance Considerations

### Memoization
- ChatMessage uses `memo()` to prevent unnecessary re-renders
- Only re-renders when message data changes

### Lazy Loading
- Chunk content only rendered when expanded
- Metadata cards only rendered when result is expanded

### Virtual Scrolling
- Consider implementing virtual scrolling for >50 results
- Use `react-window` or similar library

## Testing Strategy

### Unit Tests
```typescript
describe("MetadataCard", () => {
  it("renders QACard for Q&A metadata", () => {
    const metadata = { q: "...", a: "...", ... };
    render(<MetadataCard metadata={metadata} />);
    expect(screen.getByText("Question:")).toBeInTheDocument();
  });
});
```

### Integration Tests
```typescript
describe("VectorSearchResults", () => {
  it("displays all results", () => {
    const toolCall = { ... };
    render(<VectorSearchResults toolCall={toolCall} />);
    expect(screen.getAllByRole("button")).toHaveLength(results.length);
  });
});
```

### E2E Tests
```typescript
test("User can view tool call details", async () => {
  await page.click('[data-testid="tool-calls-button"]');
  await page.waitForSelector('[data-testid="tool-calls-drawer"]');
  await page.click('[data-testid="expand-tool-call-0"]');
  expect(await page.textContent('.chunk-content')).toContain('expected text');
});
```

## Extending the Components

### Adding New Metadata Types

1. **Update JSON Schema** (`src/schemas/chat-message.v2.json`)
2. **Regenerate TypeScript types**
3. **Create new card component**
4. **Add type guard**
5. **Update MetadataCard to handle new type**

Example:
```typescript
// 1. Add to schema
"imageMetadata": {
  "type": "object",
  "properties": {
    "url": { "type": "string" },
    "width": { "type": "number" },
    "height": { "type": "number" }
  }
}

// 2. Regenerate types
npm run generate:types

// 3. Create ImageCard component
export function ImageCard(props: ImageMetadata & { score?: number }) {
  return <div>...</div>;
}

// 4. Add type guard
export function isImageMetadata(metadata: any): metadata is ImageMetadata {
  return 'url' in metadata && 'width' in metadata;
}

// 5. Update MetadataCard
if (isImageMetadata(metadata)) {
  return <ImageCard {...metadata} score={score} />;
}
```

### Adding New Tool Types

1. **Update JSON Schema** with new tool type
2. **Regenerate TypeScript types**
3. **Create new tool result component**
4. **Add type guard**
5. **Update ToolCallsDrawer logic**

## Common Patterns

### Pattern: Conditional Rendering by Type
```typescript
{toolCall.toolType === "vectorSearch" && (
  <VectorSearchResults toolCall={toolCall} />
)}

{toolCall.toolType === "vectorSearchWithReranking" && (
  <VectorSearchResults toolCall={toolCall} />
)}
```

### Pattern: Type-Safe Metadata Access
```typescript
if (isQaMetadata(metadata)) {
  // TypeScript knows: metadata.q, metadata.a exist
  console.log(metadata.q);
}
```

### Pattern: Format and Display
```typescript
<span>{formatScore(result.score)}</span>
<span>{formatTimestamp(metadata.uploadTimestamp)}</span>
<span>{getToolTypeDisplayName(toolCall.toolType)}</span>
```

---

**For more information:**
- See [Quick Start Guide](./QUICK_START.md)
- See [Implementation Summary](./TOOL_CALLS_UPDATE_SUMMARY.md)
- See [Schema Documentation](./src/schemas/README.md)
