# HarnessFlow Architecture Decision Records (ADR)

**Version:** 1.0
**Date:** 2025-11-19
**Status:** Approved

---

## Table of Contents

1. [ADR-001: Database Strategy - PostgreSQL + Apache AGE](#adr-001-database-strategy)
2. [ADR-002: LLM Integration Boundaries](#adr-002-llm-integration-boundaries)
3. [ADR-003: Architecture Style - Modular Monolith](#adr-003-architecture-style)
4. [ADR-004: Multi-Format Input Support](#adr-004-multi-format-input-support)
5. [ADR-005: Constraint Engine Design](#adr-005-constraint-engine-design)
6. [ADR-006: Frontend Technology Stack](#adr-006-frontend-technology-stack)
7. [ADR-007: API Design - GraphQL + REST Hybrid](#adr-007-api-design)

---

## ADR-001: Database Strategy

### Status
**Approved** - 2025-11-19

### Context

HarnessFlow requires storing complex relationships (ECUs ↔ Pins ↔ Wires ↔ Features) with:
- Transactional integrity for critical data
- Efficient graph traversal for impact analysis
- Flexibility for evolving schemas
- Team familiarity for maintenance

Four main approaches were considered:
1. Pure Graph DB (Neo4j)
2. Pure Relational DB (PostgreSQL)
3. Hybrid Multi-DB (PostgreSQL + Neo4j + MongoDB + Redis + Vector DB)
4. Relational with Graph Extensions (PostgreSQL + Apache AGE)

### Decision

**We will use PostgreSQL with Apache AGE graph extension**

#### Primary Database: PostgreSQL 15+
- ACID guarantees for critical operations
- Industry-standard SQL for team familiarity
- Excellent JSONB support for flexible schemas
- Mature ecosystem (ORMs, tooling, hosting)
- Recursive CTEs for tree/graph queries
- PostGIS extension available for physical routing

#### Graph Layer: Apache AGE (Apache Age Graph Extension)
- Native graph database built on PostgreSQL
- Cypher query language (same as Neo4j)
- Graph and relational data in same database
- No data synchronization needed
- Single deployment and backup strategy

#### Optional Additions (Phase 2+):
- **Redis**: Caching layer for validation results
- **S3/MinIO**: Document storage for PDFs, images
- **Qdrant/Chroma**: Vector embeddings for semantic search

### Consequences

#### Positive
✅ Single database reduces operational complexity
✅ Team can use familiar SQL for most operations
✅ Graph queries available when needed (via Cypher)
✅ Lower infrastructure costs than multi-DB hybrid
✅ Easier local development (single PostgreSQL instance)
✅ Unified backup and disaster recovery

#### Negative
❌ Apache AGE is less mature than Neo4j
❌ Graph query performance may not match pure graph DB
❌ Team needs to learn Cypher for graph queries
❌ Limited graph-specific tooling compared to Neo4j

#### Mitigations
- Start with SQL + recursive CTEs, add AGE when graph features needed
- Provide clear examples and templates for common Cypher queries
- Monitor performance and can migrate to Neo4j if bottlenecks appear
- Use PostgreSQL's partitioning for large tables

### Alternatives Considered

#### Alternative 1: Neo4j (Pure Graph)
**Pros:** Best graph query performance, mature tooling
**Cons:** Requires learning Cypher, limited transactional support, harder to hire for
**Rejected:** Overhead of running separate databases outweighs benefits

#### Alternative 2: Hybrid (PostgreSQL + Neo4j + others)
**Pros:** Best tool for each job
**Cons:** Extreme operational complexity, data synchronization challenges, high cost
**Rejected:** Too complex for initial implementation

#### Alternative 3: MongoDB (Document DB)
**Pros:** Flexible schema, easy prototyping
**Cons:** Poor referential integrity, weak graph queries, team unfamiliarity
**Rejected:** Not suited for highly relational data

### Implementation Notes

```sql
-- Install Apache AGE extension
CREATE EXTENSION IF NOT EXISTS age;

-- Create graph
SELECT create_graph('harness_graph');

-- Query example: Find all paths between ECU and component
SELECT * FROM ag_catalog.cypher('harness_graph', $$
    MATCH path = (ecu:ECU {id: 'BCM-001'})-[*1..5]-(component:Component)
    RETURN path
$$) as (path agtype);
```

---

## ADR-002: LLM Integration Boundaries

### Status
**Approved** - 2025-11-19

### Context

LLMs (Large Language Models) can assist with extracting data from unstructured documents and providing natural language interfaces. However, using LLMs for safety-critical calculations or final decisions is risky due to:
- Hallucinations and inconsistent outputs
- Lack of traceability required by ISO 26262
- Non-deterministic behavior

The team debated four approaches:
1. LLM-first: Use LLM for everything including calculations
2. LLM-minimal: Only for document parsing
3. LLM-assistant: Parsing + NL interface, but no decisions
4. No-LLM: Avoid LLMs entirely

### Decision

**LLMs as "Smart ETL + Assistant" (Never Decision Maker)**

#### Allowed LLM Uses

**1. Ingestion/Parsing (High Value)**
```typescript
// ✅ ALLOWED: Extract structured data from PDFs
async function parseECUDatasheet(pdf: Buffer): Promise<ECU> {
  const extraction = await llm.extractStructured(pdf, ECUSchema);
  const validated = deterministicValidation(extraction); // Required!
  if (validated.confidence < 0.85) {
    return { ...extraction, requiresHumanReview: true };
  }
  return extraction;
}
```

**2. Natural Language Interface (Medium Value)**
```typescript
// ✅ ALLOWED: Translate NL query to structured query
async function queryHarness(nlQuery: string): Promise<QueryResult> {
  const structuredQuery = await llm.translateQuery(nlQuery);
  const results = await database.execute(structuredQuery); // Deterministic!
  const explanation = await llm.explain(results); // Optional
  return { results, explanation };
}
```

**3. Report Generation (Medium Value)**
```typescript
// ✅ ALLOWED: Generate human-readable reports
async function generateImpactReport(impact: ImpactAnalysis): Promise<string> {
  // Impact calculated deterministically
  const report = await llm.generateReport(impact, template);
  return report; // Used for human consumption only
}
```

#### Prohibited LLM Uses

```typescript
// ❌ PROHIBITED: Electrical calculations
async function validateCurrentDraw(pin: Pin, load: Load) {
  // WRONG - LLM cannot be trusted for physics
  return await llm.query(`Can pin ${pin.id} handle ${load.current}A?`);

  // CORRECT - Use deterministic rules
  return load.current <= pin.capabilities.current_limit.continuous_a;
}

// ❌ PROHIBITED: Final decisions
async function selectPinForFeature(feature: Feature) {
  // WRONG - LLM chooses pin
  return await llm.query(`Which pin should I use for ${feature.name}?`);

  // CORRECT - Rules engine finds candidates, human or deterministic scoring chooses
  const candidates = await findCompatiblePins(feature.requirements);
  const scored = scoreCandidates(candidates, scoringRules);
  return { candidates, recommended: scored[0], requiresApproval: true };
}
```

### Decision Workflow

```
User Request
     ↓
[LLM: Parse/Translate] ← Optional, for unstructured input
     ↓
[Deterministic Rules Engine] ← Required, makes actual decisions
     ↓
[LLM: Explain Results] ← Optional, for human consumption
     ↓
Human Review & Approval ← Required for safety-critical
```

### Consequences

#### Positive
✅ Leverages LLM strengths (parsing, NL) while avoiding weaknesses (hallucination)
✅ Maintains ISO 26262 traceability (all decisions are deterministic)
✅ User-friendly NL interface without sacrificing accuracy
✅ Can swap LLM providers without changing core logic
✅ Reduced risk of costly errors from LLM mistakes

#### Negative
❌ Cannot rely on LLM for "magic" solutions
❌ Still need to implement deterministic rules engine
❌ LLM API costs for parsing large documents
❌ Requires human review of LLM-parsed data

#### Mitigations
- Build comprehensive validation layer after LLM extraction
- Cache LLM results to reduce API costs
- Provide clear UI for human review of low-confidence extractions
- Use smaller/local models for simple tasks (cost reduction)

### Implementation Guidelines

**LLM Provider Abstraction:**
```typescript
interface LLMProvider {
  extractStructured<T>(content: string, schema: Schema<T>): Promise<T>;
  chat(messages: Message[]): Promise<string>;
  embeddings(text: string): Promise<number[]>;
}

// Easy to swap providers
const llm: LLMProvider = process.env.LLM_PROVIDER === 'anthropic'
  ? new AnthropicProvider()
  : new OpenAIProvider();
```

**Validation Pipeline:**
```typescript
async function ingestDocument(file: Buffer): Promise<IngestedData> {
  // Step 1: LLM extraction
  const extracted = await llm.extractStructured(file, schema);

  // Step 2: Deterministic validation
  const validationResults = await validateExtraction(extracted);

  // Step 3: Confidence scoring
  const confidence = calculateConfidence(extracted, validationResults);

  // Step 4: Flag for review if needed
  if (confidence < 0.85 || validationResults.hasErrors) {
    return { ...extracted, requiresHumanReview: true, validationResults };
  }

  return { ...extracted, requiresHumanReview: false };
}
```

---

## ADR-003: Architecture Style

### Status
**Approved** - 2025-11-19

### Context

Three architectural approaches were considered:
1. **Full Microservices**: Separate deployments for Ingestion, Domain, Query services
2. **Modular Monolith**: Single deployment with clear module boundaries
3. **Simple Monolith**: Traditional layered architecture

Trade-offs involve development speed, operational complexity, and future scalability.

### Decision

**Modular Monolith with Service Boundaries (Phase 1) → Microservices (Phase 2+)**

#### Phase 1: Modular Monolith (MVP)

```
┌─────────────────────────────────────────────┐
│         HarnessFlow Application             │
├─────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Ingestion │  │  Domain  │  │   API    │  │
│  │ Module   │  │  Module  │  │  Module  │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│       ↓              ↓              ↓       │
│  ┌──────────────────────────────────────┐  │
│  │   Shared Data Access Layer           │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
            ↓
   PostgreSQL + Apache AGE
```

**Module Structure:**
```
src/
├── modules/
│   ├── ingestion/
│   │   ├── parsers/
│   │   │   ├── kbl-parser.ts
│   │   │   ├── wireviz-parser.ts
│   │   │   ├── excel-parser.ts
│   │   │   └── pdf-parser.ts
│   │   ├── validators/
│   │   └── index.ts
│   ├── domain/
│   │   ├── services/
│   │   │   ├── constraint-engine.ts
│   │   │   ├── graph-service.ts
│   │   │   └── impact-analyzer.ts
│   │   ├── rules/
│   │   └── index.ts
│   ├── api/
│   │   ├── rest/
│   │   ├── graphql/
│   │   └── index.ts
│   └── llm/
│       ├── providers/
│       ├── prompts/
│       └── index.ts
├── shared/
│   ├── types/           # Shared TypeScript types
│   ├── db/              # Database access layer
│   └── utils/
└── main.ts
```

**Benefits:**
- ✅ Simple deployment (single process)
- ✅ Easy local development
- ✅ Shared types and utilities
- ✅ Clear module boundaries prevent tangling
- ✅ Can extract modules to services later

#### Phase 2: Extract to Microservices (As Needed)

When certain modules need independent scaling:

```
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│   Ingestion    │    │     Domain     │    │      API       │
│    Service     │    │    Service     │    │    Gateway     │
│                │    │                │    │                │
│ - PDF parsing  │    │ - Rules engine │    │ - REST/GraphQL │
│ - LLM calls    │    │ - Graph        │    │ - Auth         │
│ - Large files  │    │ - Impact calc  │    │ - Rate limit   │
└────────────────┘    └────────────────┘    └────────────────┘
        ↓                      ↓                      ↓
    ┌────────────────────────────────────────────────────┐
    │         PostgreSQL + Apache AGE                    │
    └────────────────────────────────────────────────────┘
```

Extract when:
- Ingestion Service: Large file uploads cause memory issues
- LLM Service: Need to scale LLM calls independently
- Domain Service: Complex calculations need dedicated resources

### Consequences

#### Positive
✅ Faster initial development (no distributed systems complexity)
✅ Easier debugging (single process, single log stream)
✅ Lower hosting costs (single deployment)
✅ Natural module boundaries make future extraction easy
✅ Shared transaction boundaries (easier data consistency)

#### Negative
❌ Cannot scale modules independently (initially)
❌ Single point of failure
❌ All code shares same runtime (one bug can crash everything)
❌ Deployment is all-or-nothing

#### Mitigations
- Use module boundaries strictly (no cross-module imports except via defined interfaces)
- Implement feature flags for gradual rollout
- Monitor module performance to identify extraction candidates
- Design APIs as if modules were separate services

### Migration Path

**Step 1: Modular Monolith (Months 0-6)**
- Build with strict module boundaries
- Use dependency injection for module interfaces
- No direct cross-module function calls

**Step 2: Internal Service Contracts (Months 6-12)**
- Define API contracts between modules
- Add monitoring for module-to-module calls
- Identify performance bottlenecks

**Step 3: Extract First Service (Month 12+)**
- Usually Ingestion Service (handles large files, LLM calls)
- Set up message queue (RabbitMQ/SQS) for async tasks
- Extract module to separate deployment

**Step 4: Extract Additional Services (As Needed)**
- Domain Service if complex calculations are bottleneck
- LLM Service if needed to scale LLM calls
- Keep API Gateway as entry point

---

## ADR-004: Multi-Format Input Support

### Status
**Approved** - 2025-11-19

### Context

Automotive electrical data exists in multiple formats:
- **KBL/VEC XML**: Industry standard from CAD tools
- **WireViz YAML**: Open-source community format
- **Excel/CSV**: Legacy data and manual entry
- **PDF Datasheets**: ECU specifications
- **ARXML**: AUTOSAR toolchains

Supporting multiple formats enables:
- Migration from existing tools
- Flexibility for different workflows
- Broader user base

### Decision

**Support Multiple Input Formats with Unified Internal Model**

#### Supported Formats (Priority Order)

| Priority | Format | Use Case | Implementation |
|----------|--------|----------|----------------|
| **P0** | KBL/VEC XML | Industry standard, CAD exports | XML parser → internal model |
| **P0** | WireViz YAML | Open-source community | YAML parser → internal model |
| **P1** | Excel/CSV | Legacy data, manual entry | Column mapper UI → internal model |
| **P1** | PDF Datasheets | ECU specifications | LLM extraction → internal model |
| **P2** | ARXML | AUTOSAR toolchains | XML parser → internal model |

#### Architecture

```
Input Formats
    ├── KBL/VEC Parser    (P0)
    ├── WireViz Parser    (P0)
    ├── Excel Parser      (P1)
    ├── PDF Parser (LLM)  (P1)
    └── ARXML Parser      (P2)
           ↓
    Format-Specific Validation
    (schema validation, physics checks)
           ↓
    Unified Internal Model
    (HarnessFlowModel - see DATA_MODEL_SPECIFICATION.md)
           ↓
    Database Storage
    (PostgreSQL + Apache AGE)
           ↓
    Output Generators
    ├── KBL/VEC Generator
    ├── WireViz Generator
    ├── Excel Generator
    └── PDF Report Generator
```

#### Conversion Quality Tracking

```typescript
interface ConversionResult {
  success: boolean;
  warnings: ConversionWarning[];
  dataLoss: string[];           // Fields that couldn't be mapped
  confidence: number;            // 0-1
  requiresReview: boolean;
}

interface ConversionWarning {
  severity: 'error' | 'warning' | 'info';
  message: string;
  sourceField?: string;
  suggestedFix?: string;
}
```

### Consequences

#### Positive
✅ Users can import existing data regardless of source
✅ No vendor lock-in (can export to multiple formats)
✅ Broader user adoption (supports various workflows)
✅ Internal model is format-agnostic (cleaner architecture)

#### Negative
❌ Must maintain multiple parsers/generators
❌ Data loss possible when converting between formats
❌ Different formats have different levels of detail
❌ Testing complexity (need test data for all formats)

#### Mitigations
- Clearly document which features are supported in each format
- Provide conversion quality reports
- Allow manual correction after import
- Store original file as backup

### Implementation Examples

**KBL Parser:**
```typescript
export async function parseKBL(xml: string): Promise<HarnessModel> {
  const doc = parseXML(xml);

  const ecus = extractECUs(doc);
  const connectors = extractConnectors(doc);
  const wires = extractWires(doc);

  return {
    metadata: extractMetadata(doc),
    ecus,
    connectors,
    pins: connectors.flatMap(c => c.pins),
    wires,
    // ... other entities
  };
}
```

**WireViz Parser (see wireviz-integration docs):**
```typescript
export async function parseWireViz(yaml: string): Promise<HarnessModel> {
  const wireViz = parseYAML(yaml);

  return {
    metadata: { source: 'wireviz', version: wireViz.version },
    connectors: convertConnectors(wireViz.connectors),
    wires: convertWires(wireViz.cables, wireViz.connections),
    // ... other entities
  };
}
```

**Excel Parser with Column Mapping UI:**
```typescript
export async function parseExcel(
  file: Buffer,
  columnMapping: ColumnMapping
): Promise<HarnessModel> {
  const workbook = readExcel(file);
  const sheet = workbook.worksheets[0];

  const wires = sheet.rows.map(row => ({
    from: row[columnMapping.from],
    to: row[columnMapping.to],
    gauge: row[columnMapping.gauge],
    color: row[columnMapping.color],
    // ... map other columns
  }));

  return { wires, /* ... */ };
}
```

---

## ADR-005: Constraint Engine Design

### Status
**Approved** - 2025-11-19

### Context

Validating electrical harness changes requires checking:
- Electrical constraints (current, voltage, power)
- Protocol constraints (CAN bus load, timing)
- Safety constraints (ISO 26262, redundancy)
- Physical constraints (wire gauge, connector compatibility)

The team considered:
1. Rule-based engine only
2. Graph algorithms only
3. LLM-based validation
4. Hybrid (rules + graph)

### Decision

**Hybrid Constraint Engine: Deterministic Rules + Graph Algorithms**

#### Architecture

```typescript
interface ConstraintEngine {
  // Validation entry point
  validate(change: Change): Promise<ValidationReport>;

  // Rule-based validation
  validateElectrical(entity: Entity): Promise<ValidationResult[]>;
  validateProtocol(entity: Entity): Promise<ValidationResult[]>;
  validateSafety(entity: Entity): Promise<ValidationResult[]>;
  validatePhysical(entity: Entity): Promise<ValidationResult[]>;

  // Graph-based analysis
  findImpactRadius(change: Change): Promise<AffectedEntity[]>;
  findAlternatives(requirements: Requirements): Promise<Alternative[]>;
  detectConflicts(changes: Change[]): Promise<Conflict[]>;
}
```

#### Rule Categories

**1. Electrical Rules (Deterministic)**
```typescript
class ElectricalRules {
  validateCurrent(pin: Pin, load: Load): ValidationResult {
    if (load.current_a > pin.capabilities.current_limit.continuous_a) {
      return {
        valid: false,
        severity: 'error',
        message: `Current ${load.current_a}A exceeds pin limit ${pin.capabilities.current_limit.continuous_a}A`,
        rule: 'electrical.current_limit'
      };
    }
    return { valid: true };
  }

  calculateVoltageDrop(path: Wire[], current: number): number {
    const totalResistance = path.reduce((sum, wire) => {
      const length_m = wire.physical.length_mm / 1000;
      return sum + (wire.electrical.resistance_per_m * length_m);
    }, 0);
    return current * totalResistance; // Ohm's law
  }
}
```

**2. Protocol Rules (Deterministic)**
```typescript
class ProtocolRules {
  validateBusLoad(network: Network, messages: Message[]): ValidationResult {
    const totalLoad = messages.reduce((load, msg) => {
      const bitsPerSecond = (msg.dlc * 8 * 1000) / msg.cycle_time_ms;
      return load + bitsPerSecond;
    }, 0);

    const utilization = (totalLoad / network.configuration.baudrate) * 100;

    if (utilization > network.load.max_utilization_percent) {
      return {
        valid: false,
        severity: 'error',
        message: `Bus load ${utilization.toFixed(1)}% exceeds max ${network.load.max_utilization_percent}%`,
        rule: 'protocol.bus_load'
      };
    }

    if (utilization > 80) {
      return {
        valid: true,
        severity: 'warning',
        message: `Bus load ${utilization.toFixed(1)}% is high (recommended <80%)`,
        rule: 'protocol.bus_load'
      };
    }

    return { valid: true };
  }
}
```

**3. Graph Algorithms (Impact Analysis)**
```typescript
class GraphService {
  async findImpactRadius(nodeId: string, radius: number): Promise<Node[]> {
    // Use Apache AGE Cypher query
    const query = `
      MATCH (start {id: $nodeId})-[*1..${radius}]-(affected)
      RETURN DISTINCT affected
    `;
    return await this.executeGraphQuery(query, { nodeId });
  }

  async shortestPath(fromId: string, toId: string): Promise<Path> {
    const query = `
      MATCH path = shortestPath((from {id: $fromId})-[*]-(to {id: $toId}))
      RETURN path
    `;
    return await this.executeGraphQuery(query, { fromId, toId });
  }

  async findCompatiblePins(requirements: Requirements): Promise<Pin[]> {
    const query = `
      MATCH (pin:Pin)
      WHERE pin.io_type = $ioType
        AND pin.current_limit >= $currentRequired
        AND NOT EXISTS((pin)-[:ASSIGNED_TO]->(:Feature))
      RETURN pin
    `;
    return await this.executeGraphQuery(query, {
      ioType: requirements.io_type,
      currentRequired: requirements.current_a
    });
  }
}
```

#### Validation Workflow

```typescript
async function validateFeatureAddition(feature: Feature): Promise<ValidationReport> {
  const results: ValidationResult[] = [];

  // Step 1: Graph query - find candidate pins
  const candidatePins = await graphService.findCompatiblePins(feature.requirements);

  if (candidatePins.length === 0) {
    return {
      valid: false,
      results: [{
        valid: false,
        severity: 'error',
        message: 'No compatible pins available',
        rule: 'pin.availability'
      }]
    };
  }

  // Step 2: Rule validation - check each candidate
  for (const pin of candidatePins) {
    // Electrical validation
    const electricalCheck = await electricalRules.validate(pin, feature);
    results.push(...electricalCheck);

    // Safety validation
    const safetyCheck = await safetyRules.validate(pin, feature);
    results.push(...safetyCheck);

    // Protocol validation (if network required)
    if (feature.requirements.network) {
      const protocolCheck = await protocolRules.validate(pin, feature);
      results.push(...protocolCheck);
    }
  }

  // Step 3: Graph traversal - calculate impact
  const bestPin = candidatePins[0]; // Simplified - use scoring in real impl
  const affectedComponents = await graphService.findImpactRadius(bestPin.id, 3);

  // Step 4: LLM - generate human-readable explanation (optional)
  const explanation = await llm.explainValidation(results, affectedComponents);

  return {
    valid: results.every(r => r.valid),
    results,
    affectedComponents,
    explanation
  };
}
```

### Consequences

#### Positive
✅ Deterministic validation ensures safety and traceability
✅ Graph algorithms provide powerful impact analysis
✅ Clear separation of concerns (rules vs graph vs LLM)
✅ Easily extensible (add new rules or graph queries)
✅ Fast performance for most validations

#### Negative
❌ Complex rule engine requires careful maintenance
❌ Graph queries can be slow for very large graphs
❌ Need to keep rules updated as new ECUs/features added
❌ Testing requires comprehensive rule coverage

#### Mitigations
- Implement rule versioning and audit trail
- Cache graph query results
- Provide rule configuration UI for domain experts
- Build comprehensive test suite with edge cases

---

## ADR-006: Frontend Technology Stack

### Status
**Approved** - 2025-11-19

### Context

Frontend must support:
- Interactive harness editing (drag-and-drop)
- Complex data visualization (graphs, diagrams)
- Real-time validation feedback
- Natural language queries
- Responsive performance with large datasets

### Decision

**Next.js 14 + React 18 + React Flow + Shadcn/UI**

#### Tech Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Framework** | Next.js 14 (App Router) | Server components, file-based routing, built-in API routes |
| **UI Library** | React 18 | Industry standard, large ecosystem, concurrent features |
| **Visualization** | React Flow | Best React library for interactive node graphs |
| **UI Components** | Shadcn/UI | Modern, accessible, customizable, no runtime overhead |
| **State Management** | Zustand | Lightweight, TypeScript-first, no boilerplate |
| **Forms** | React Hook Form + Zod | Type-safe validation, great DX |
| **Data Fetching** | TanStack Query (React Query) | Caching, optimistic updates, automatic refetching |
| **Styling** | Tailwind CSS | Utility-first, fast prototyping, consistent design |

#### Directory Structure

```
frontend/
├── app/                        # Next.js 14 App Router
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── projects/
│   │   │   ├── [id]/
│   │   │   │   ├── harness/   # Harness editor
│   │   │   │   ├── ecus/      # ECU browser
│   │   │   │   └── changes/   # Change requests
│   │   │   └── new/
│   │   └── layout.tsx
│   ├── api/                    # API routes (if needed)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                     # Shadcn/UI components
│   ├── harness/
│   │   ├── HarnessEditor.tsx
│   │   ├── ConnectorNode.tsx
│   │   ├── WireEdge.tsx
│   │   └── ValidationOverlay.tsx
│   ├── ecus/
│   │   ├── ECUBrowser.tsx
│   │   └── PinTable.tsx
│   └── shared/
├── hooks/
│   ├── useHarness.ts
│   ├── useValidation.ts
│   └── useGraphQuery.ts
├── lib/
│   ├── api/                    # API client
│   ├── store/                  # Zustand stores
│   └── utils/
└── types/
    └── index.ts                # TypeScript types
```

#### Key Components

**Harness Editor (React Flow):**
```typescript
'use client';

import ReactFlow, { Node, Edge } from 'reactflow';
import { useHarnessStore } from '@/lib/store/harness';

export function HarnessEditor({ harnessId }: { harnessId: string }) {
  const { nodes, edges, onNodesChange, onEdgesChange } = useHarnessStore();
  const { data: validationResults } = useValidation(harnessId);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={{
        connector: ConnectorNode,
        splice: SpliceNode,
      }}
      edgeTypes={{
        wire: WireEdge,
      }}
    >
      <ValidationOverlay results={validationResults} />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}
```

**Real-time Validation:**
```typescript
import { useQuery } from '@tanstack/react-query';

export function useValidation(harnessId: string) {
  return useQuery({
    queryKey: ['validation', harnessId],
    queryFn: () => api.validate(harnessId),
    refetchInterval: 5000, // Re-validate every 5 seconds
  });
}
```

### Consequences

#### Positive
✅ Modern, performant stack with great DX
✅ React Flow perfect for interactive harness editing
✅ Shadcn/UI provides beautiful, accessible components
✅ Next.js enables server-side rendering for performance
✅ TypeScript ensures type safety across frontend

#### Negative
❌ React Flow has learning curve for custom nodes
❌ Large harnesses (1000+ nodes) may have performance issues
❌ Next.js 14 App Router is still evolving (some rough edges)

#### Mitigations
- Use React Flow's virtualization for large graphs
- Implement progressive loading for huge datasets
- Provide fallback to list view for very large harnesses

---

## ADR-007: API Design

### Status
**Approved** - 2025-11-19

### Context

Frontend needs to:
- Fetch complex nested data (ECU with all pins, connectors, etc.)
- Perform simple CRUD operations
- Execute graph queries
- Handle real-time updates

Two main API styles:
1. **REST**: Simple, cacheable, well-understood
2. **GraphQL**: Flexible queries, type-safe, reduces over/under-fetching

### Decision

**Hybrid Approach: GraphQL for Queries, REST for Mutations**

#### GraphQL for Data Fetching
```graphql
query GetHarnessDetails($id: ID!) {
  harness(id: $id) {
    id
    name
    ecus {
      id
      partNumber
      connectors {
        id
        name
        pins {
          id
          pinNumber
          assignment {
            feature {
              name
            }
          }
        }
      }
    }
    wires {
      id
      from {
        id
        label
      }
      to {
        id
        label
      }
      physical {
        gauge
        color
      }
    }
  }
}
```

#### REST for Mutations
```typescript
// POST /api/harnesses
POST /api/harnesses/:id/validate
PUT /api/harnesses/:id/assign-pin
POST /api/change-requests
```

#### Rationale

**Why GraphQL for Queries:**
- Frontend can request exactly what it needs
- Single request for complex nested data
- Type-safe with generated TypeScript types
- Excellent developer experience

**Why REST for Mutations:**
- Simpler for operations that don't return complex data
- Easier caching invalidation
- Better for file uploads
- More familiar to most developers

### Implementation

**GraphQL Schema:**
```typescript
// schema.graphql
type Query {
  project(id: ID!): Project
  harness(id: ID!): Harness
  findCompatiblePins(requirements: PinRequirementsInput!): [Pin!]!
  impactAnalysis(change: ChangeInput!): ImpactAnalysis!
}

type Harness {
  id: ID!
  name: String!
  ecus: [ECU!]!
  wires: [Wire!]!
  features: [Feature!]!
  validationStatus: ValidationStatus!
}

# ... rest of schema (see DATA_MODEL_SPECIFICATION.md)
```

**Frontend Usage:**
```typescript
import { useQuery } from '@apollo/client';

function HarnessView({ id }: { id: string }) {
  const { data, loading } = useQuery(GET_HARNESS_DETAILS, {
    variables: { id },
  });

  if (loading) return <Spinner />;

  return <HarnessEditor harness={data.harness} />;
}
```

### Consequences

#### Positive
✅ Best of both worlds (flexible queries + simple mutations)
✅ Reduced API requests (GraphQL prevents over/under-fetching)
✅ Type-safe with code generation
✅ Easy to add new fields without backend changes

#### Negative
❌ More complex than pure REST
❌ GraphQL has learning curve
❌ Need to maintain both GraphQL and REST endpoints

#### Mitigations
- Use GraphQL codegen for TypeScript types
- Provide clear examples for common queries
- Document when to use GraphQL vs REST

---

## Summary

These ADRs establish HarnessFlow's technical foundation:

1. ✅ **PostgreSQL + Apache AGE** for unified relational + graph storage
2. ✅ **LLM as ETL/Assistant** with deterministic validation
3. ✅ **Modular Monolith** for fast initial development
4. ✅ **Multi-Format Support** (KBL/VEC, WireViz, Excel, PDF)
5. ✅ **Hybrid Constraint Engine** (rules + graph algorithms)
6. ✅ **Next.js + React Flow** for modern, interactive UI
7. ✅ **GraphQL + REST** for flexible, performant API

---

**Document Status:** Approved
**Next Document:** `docs/consolidated/TECHNICAL_SPECIFICATION.md`
