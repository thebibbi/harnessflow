# HarnessFlow Architecture Comparison & Analysis

**Document Version:** 1.0
**Date:** 2025-11-19
**Purpose:** Reconcile competing architectural proposals and identify unified approach

---

## Executive Summary

HarnessFlow has four distinct architectural documents with different approaches:

1. **SystemArchitecture.md** - Full microservices with multiple databases
2. **ECU_Configuration_System_Specification.md** - Detailed spec with database options
3. **AdditionalSpec.md** - Critique emphasizing graph DB + deterministic rules
4. **AlternateConfig.md** - Simplified "AutoGraph" with KBL/VEC focus

**Key Finding:** All documents agree on core principles but differ in implementation details.

**Recommendation:** Unified hybrid architecture combining the best of all approaches.

---

## Comparison Matrix

| Aspect | SystemArch | ECU_Config_Spec | AdditionalSpec | AlternateConfig | Recommendation |
|--------|------------|-----------------|----------------|-----------------|----------------|
| **LLM Role** | Core + Assistant | Parsing + NL Interface | ETL Tool Only | Datasheet Librarian | **ETL + Assistant** (not decision maker) |
| **Primary Database** | Graph DB + Relational | Multiple Options | Neo4j Graph | Neo4j or PostgreSQL | **PostgreSQL with graph extensions** |
| **Architecture Style** | Microservices | Layered | Service-based | Monolith/Simple | **Modular Monolith → Microservices** |
| **Input Formats** | PDF, Excel, Specs | PDF, Excel, CAD | Excel, Visual | KBL/VEC XML | **All: KBL/VEC, WireViz, Excel, PDF** |
| **Constraint Engine** | Rules Engine | Deterministic Rules | Graph Traversal + Rules | Python Logic Engine | **Hybrid: Rules + Graph Algorithms** |
| **Visualization** | Frontend UI | Harness Editor | Graph View | 3D Visualization | **React Flow + 3D (optional)** |
| **Deployment** | Cloud Services | Enterprise | Desktop/Cloud | Desktop Tool | **Cloud-native with local option** |
| **Complexity** | High | Medium-High | Medium | Low | **Medium (phased approach)** |

---

## Detailed Analysis

### 1. SystemArchitecture.md

**Source:** `/SystemArchitecture.md`

#### Strengths
✅ Comprehensive service decomposition
✅ Clear separation of concerns
✅ Scalable to enterprise use
✅ Full RBAC and auth consideration
✅ External integrations (RM/ALM/PLM)

#### Weaknesses
❌ Very complex for MVP
❌ Requires significant infrastructure
❌ Multiple databases increase operational overhead
❌ Doesn't specify data formats clearly

#### Architecture Diagram
```
Frontend (Web UI)
    ├── Model Browser
    ├── Upload & Mapping UI
    ├── Change Request UI
    ├── Impact Visualization
    └── Review & Approval UI
           ↓
Backend API Layer
    ├── API Gateway / BFF
    └── Auth & RBAC
           ↓
Backend Services
    ├── Ingestion Services
    │   ├── ECU Spec Ingestion
    │   ├── Harness Ingestion
    │   └── Requirement/Feature Mapper
    ├── Core Domain Services
    │   ├── Graph Service
    │   ├── Rules & Constraint Engine
    │   └── Query & Reporting Service
    └── LLM Adapter Layer
           ↓
Data Stores
    ├── Graph DB (ECU-Harness-Feature graph)
    ├── Relational DB (projects, users, versions)
    ├── Document Store (raw PDFs, Excels)
    └── Vector DB (semantic search)
```

#### Key Components
- **Ingestion Services:** Handle PDF/Excel/Spec uploads
- **Graph Service:** Thin layer over Graph DB
- **Rules Engine:** Deterministic constraint validation
- **LLM Adapter:** Abstracts LLM provider

---

### 2. ECU_Configuration_System_Specification.md

**Source:** `/ECU_Configuration_System_Specification.md`

#### Strengths
✅ Very detailed implementation guidance
✅ Multiple database options analyzed
✅ Comprehensive validation rules
✅ Safety and traceability focus
✅ Code examples provided

#### Weaknesses
❌ Doesn't pick a specific architecture
❌ Offers too many options (analysis paralysis)
❌ Missing data flow diagrams
❌ Unclear service boundaries

#### Database Options Analysis

**Option 1: Graph Database (Neo4j, ArangoDB)**
- Best for: Relationship traversal, dependency analysis
- Complexity: High learning curve
- Performance: Excellent for graph queries

**Option 2: Relational Database (PostgreSQL, MySQL)**
- Best for: Transactional integrity, team familiarity
- Complexity: Medium
- Performance: Good with recursive CTEs

**Option 3: Hybrid Approach**
- PostgreSQL (transactional) + Neo4j (graph) + MongoDB (docs) + Redis (cache) + Vector DB
- Best for: Enterprise scale
- Complexity: Very high
- Performance: Excellent but expensive

**Option 4: Document Database (MongoDB)**
- Best for: Rapid prototyping, schema flexibility
- Complexity: Low
- Performance: Medium for complex queries

#### Constraint Engine Categories

1. **Electrical Rules**
   - Current validation
   - Voltage compatibility
   - Power budget checking

2. **Protocol Rules** (CAN/LIN/FlexRay)
   - Bus load validation
   - Message timing conflicts
   - Bandwidth utilization

3. **Safety Rules** (ISO 26262)
   - ASIL rating compatibility
   - Redundancy requirements
   - Fault tolerance

4. **Physical Rules**
   - Wire gauge vs current
   - Connector compatibility
   - Routing constraints

---

### 3. AdditionalSpec.md

**Source:** `/AdditionalSpec.md`

#### Strengths
✅ Critical analysis of over-reliance on LLMs
✅ Clear separation: LLM as ETL, not decision maker
✅ Emphasizes deterministic constraint solving
✅ Recommends graph DB for natural relationship modeling
✅ Highlights real-world complexity (variants, modes, safety)

#### Weaknesses
❌ Critique-focused, doesn't propose complete architecture
❌ Assumes Neo4j without comparing alternatives
❌ Limited discussion of implementation

#### Key Insights

**Problem 1: "Just load an ECU spec sheet into an LLM"**
- Issue: Spec sheets inconsistent, LLMs hallucinate
- Fix: LLM as ETL tool → structured DB → human review

**Problem 2: "Upload the wiring harness as Excel or a visual diagram"**
- Issue: Harness is complex (zones, splices, fuses, routing)
- Fix: Support structured formats (KBL/VEC) + Excel as import option

**Problem 3: "Define pin → function and see if the ECU can handle new functionality"**
- Issue: Missing many constraints (current, safety, timing, fusing, EMC)
- Fix: Deterministic rules engine + graph traversal

**Problem 4: Safety, traceability & process issues**
- Issue: Single wrong LLM suggestion is unacceptable
- Fix: LLM behind guardrails, generate reviewable reports, integrate with RM/ALM

#### Recommended Architecture
```
LLM/Multimodal:
├── Ingestion/Parsing (PDF → structured data)
├── Query/Explainer (NL → analysis results)
└── Design Assistant (suggest options)

Core System:
├── Graph Data Model (ECUs, Pins, Wires, Features, Buses)
├── Deterministic Rules Engine
└── Graph Traversal Algorithms
```

---

### 4. AlternateConfig.md ("AutoGraph")

**Source:** `/AlternateConfig.md`

#### Strengths
✅ Simplest, most focused approach
✅ Emphasizes standard formats (KBL/VEC XML)
✅ Clear LLM boundaries
✅ Physical validation focus
✅ Extensible to other domains (hydraulics, supply chain, networking)

#### Weaknesses
❌ Too simple for enterprise requirements
❌ Limited UI/UX consideration
❌ Missing multi-user, auth, versioning
❌ Desktop-tool focused, not cloud-native

#### Architecture Diagram
```
Data Flow:
1. Ingestion (Unstructured): PDF Datasheets
2. Processing (AI): LLM extracts pinouts → JSON
3. Ingestion (Structured): KBL/VEC XML files
4. Storage: Property Graph Database
5. Analysis: Python Logic Engine (graph queries)
6. Interface: Chat + 3D Visualization
```

#### Tech Stack
- **LLM:** Gemini 1.5 Pro or GPT-4o (extraction only)
- **Database Options:**
  - Neo4j/Memgraph (graph native)
  - PostgreSQL (with recursive CTEs)
  - NetworkX (in-memory for prototypes)
- **Logic:** Python 3.10+ (lxml, networkx, pint)

#### Graph Schema
**Nodes:**
- ECU (PartNumber, Supplier)
- Connector (PinCount, IP_Rating)
- Cavity/Pin (PinNumber, MaxCurrent, Type)
- Splice (Type: Ultrasonic/Crimp)
- Component (LoadResistance, Inductive)

**Edges:**
- CONTAINS (ECU → Pin)
- PLUGS_INTO (ECU → Connector)
- WIRED_TO (Pin → Wire → Pin)
  - Properties: wire_gauge_awg, length_mm, color, material_type

#### Key Algorithms
```python
def get_voltage_drop(start_node, end_node, current):
    path = shortest_path(start_node, end_node)
    total_resistance = sum(edge['resistance'] for edge in path)
    return current * total_resistance
```

---

## Unified Recommendations

### 1. Database Strategy

**Recommendation: PostgreSQL with Graph Extensions**

#### Rationale
- **Primary: PostgreSQL**
  - ACID guarantees for critical data
  - Team familiarity (SQL is universal)
  - Excellent JSON support for flexible schemas
  - Recursive CTEs for graph queries
  - Extensions: PostGIS (routing), pg_trgm (fuzzy search)

- **Graph Capabilities:**
  - **Apache AGE** (graph extension for PostgreSQL)
  - Native Cypher queries within PostgreSQL
  - Best of both worlds: relational + graph

- **Optional Additions (as needed):**
  - **Redis:** Caching layer for computed results
  - **S3/MinIO:** Document storage (PDFs, images)
  - **Qdrant/Chroma:** Vector embeddings (semantic search)

#### Migration Path
1. **Phase 1:** Pure PostgreSQL with recursive CTEs
2. **Phase 2:** Add Apache AGE for graph queries
3. **Phase 3:** Add Redis for performance
4. **Phase 4:** Add vector DB if semantic search needed

---

### 2. LLM Integration Strategy

**Recommendation: LLM as "Smart ETL + Assistant" (Never Decision Maker)**

#### LLM Allowed Uses
✅ **Ingestion/Parsing**
- Extract tables from PDF datasheets
- Map Excel columns to schema
- Parse requirements documents

✅ **Natural Language Interface**
- Query translation: "Can I add heated steering?" → structured query
- Results explanation: Technical analysis → plain English

✅ **Design Assistance**
- Suggest candidate pins based on requirements
- Recommend harness routing options
- Generate human-readable reports

#### LLM Prohibited Uses
❌ **Never use LLM for:**
- Electrical calculations (current, voltage drop, resistance)
- Constraint validation (must use deterministic rules)
- Final decisions on ECU/pin selection
- Safety-critical determinations

#### Implementation Pattern
```typescript
// ✅ CORRECT: LLM for extraction, deterministic for validation
async function validateNewFeature(featureDesc: string) {
  // Step 1: LLM extracts requirements
  const requirements = await llm.extractRequirements(featureDesc);

  // Step 2: Deterministic validation
  const validationResults = constraintEngine.validate(requirements);

  // Step 3: LLM explains results
  const explanation = await llm.explainResults(validationResults);

  return { requirements, validationResults, explanation };
}

// ❌ WRONG: LLM making decisions
async function validateNewFeature(featureDesc: string) {
  return await llm.query("Can I add this feature: " + featureDesc);
}
```

---

### 3. Architecture Style

**Recommendation: Modular Monolith with Service Boundaries**

#### Phase 1: Modular Monolith (MVP)
```
Single deployment unit with clear module boundaries:

┌─────────────────────────────────────────────┐
│         HarnessFlow Application             │
├─────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Ingestion│  │  Domain  │  │   API    │  │
│  │  Module  │→│  Module  │→│  Module  │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│       ↓              ↓              ↓       │
│  ┌──────────────────────────────────────┐  │
│  │      Shared Data Access Layer        │  │
│  └──────────────────────────────────────┘  │
│                     ↓                       │
│            PostgreSQL + Apache AGE          │
└─────────────────────────────────────────────┘
```

**Modules:**
- **Ingestion Module:** Parsers (KBL/VEC, WireViz, Excel, PDF)
- **Domain Module:** Constraint engine, graph queries, impact analysis
- **API Module:** REST/GraphQL endpoints, auth, validation

**Benefits:**
- Simpler deployment and debugging
- Easier local development
- Lower operational overhead
- Natural module boundaries for future splitting

#### Phase 2: Microservices (Scale)
Extract modules to separate services when needed:
- Ingestion Service (handles large file uploads)
- Core Domain Service (graph queries + rules)
- LLM Service (isolated, can scale independently)

---

### 4. Input Format Strategy

**Recommendation: Multi-Format Support with Unified Internal Model**

#### Supported Input Formats

| Format | Priority | Use Case | Implementation |
|--------|----------|----------|----------------|
| **KBL/VEC XML** | High | Industry standard, CAD tool exports | XML parser → internal model |
| **WireViz YAML** | High | Open-source community, easy authoring | YAML parser → internal model |
| **Excel/CSV** | Medium | Legacy data, manual entry | Column mapper → internal model |
| **PDF Datasheets** | Medium | ECU specifications | LLM extraction → internal model |
| **ARXML** | Low | AUTOSAR toolchains | XML parser → internal model |

#### Unified Internal Model
All formats convert to:
```typescript
interface HarnessModel {
  metadata: ProjectMetadata;
  ecus: ECU[];
  connectors: Connector[];
  pins: Pin[];
  wires: Wire[];
  splices: Splice[];
  features: Feature[];
  networks: Network[];
}
```

#### Architecture
```
Input Formats
    ├── KBL/VEC Parser
    ├── WireViz Parser
    ├── Excel Parser
    ├── PDF Parser (LLM)
    └── ARXML Parser
           ↓
    Validation Layer
    (schema validation, physics checks)
           ↓
    Internal Model
    (unified representation)
           ↓
    PostgreSQL + Apache AGE
           ↓
    Output Generators
    ├── KBL/VEC Generator
    ├── WireViz Generator
    ├── Excel Generator
    └── PDF Report Generator
```

---

### 5. Constraint Engine Design

**Recommendation: Hybrid Rules + Graph Algorithms**

#### Rule Categories

**1. Electrical Constraints**
```typescript
interface ElectricalRule {
  validateCurrent(pin: Pin, load: Load): ValidationResult;
  validateVoltage(pin: Pin, device: Device): ValidationResult;
  validatePowerBudget(ecu: ECU, loads: Load[]): ValidationResult;
  calculateVoltageDrop(path: Wire[], current: number): number;
}
```

**2. Protocol Constraints**
```typescript
interface ProtocolRule {
  validateBusLoad(network: Network, messages: Message[]): ValidationResult;
  validateMessageTiming(messages: Message[]): ValidationResult;
  validateBaudrate(network: Network, ecus: ECU[]): ValidationResult;
}
```

**3. Safety Constraints (ISO 26262)**
```typescript
interface SafetyRule {
  validateASILCompatibility(components: Component[]): ValidationResult;
  checkRedundancy(feature: Feature, paths: Path[]): ValidationResult;
  validateFaultTolerance(ecu: ECU, feature: Feature): ValidationResult;
}
```

**4. Physical Constraints**
```typescript
interface PhysicalRule {
  validateWireGauge(wire: Wire, current: number): ValidationResult;
  validateConnectorCompatibility(c1: Connector, c2: Connector): ValidationResult;
  validateRoutingFeasibility(path: Path, zones: Zone[]): ValidationResult;
}
```

#### Graph Algorithms
```typescript
interface GraphService {
  // Find all paths between two nodes
  findAllPaths(source: Node, target: Node): Path[];

  // Calculate shortest electrical path
  shortestPath(source: Node, target: Node): Path;

  // Find impact radius of change
  findAffectedComponents(change: Change, radius: number): Component[];

  // Detect circular dependencies
  detectCycles(graph: Graph): Cycle[];

  // Find candidate pins for feature
  findCompatiblePins(requirements: Requirements): Pin[];
}
```

#### Integration Pattern
```typescript
async function validateFeatureAddition(feature: Feature): Promise<ValidationReport> {
  // 1. Graph query: Find candidate pins
  const candidatePins = await graphService.findCompatiblePins(feature.requirements);

  // 2. Rule validation: Check each candidate
  const results = await Promise.all(
    candidatePins.map(async pin => {
      const electricalCheck = await electricalRules.validate(pin, feature);
      const safetyCheck = await safetyRules.validate(pin, feature);
      const protocolCheck = await protocolRules.validate(pin, feature);

      return { pin, electricalCheck, safetyCheck, protocolCheck };
    })
  );

  // 3. Graph traversal: Calculate impact
  const impact = await graphService.findAffectedComponents(
    { type: 'add_feature', feature },
    3 // radius
  );

  // 4. LLM: Generate human-readable report
  const explanation = await llm.explainValidation(results, impact);

  return { results, impact, explanation };
}
```

---

### 6. Frontend Architecture

**Recommendation: React + React Flow + Shadcn/UI**

#### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Visualization:** React Flow (harness diagrams)
- **Components:** Shadcn/UI (modern, accessible)
- **State:** Zustand (lightweight) or Redux Toolkit
- **Forms:** React Hook Form + Zod validation
- **Data Fetching:** TanStack Query (React Query)

#### Key Views

**1. Model Browser**
- Tree view of ECUs, connectors, pins
- Search and filter
- Quick property inspection

**2. Harness Editor**
- React Flow canvas
- Drag-and-drop connectors and wires
- Real-time validation feedback
- Zoom, pan, minimap

**3. Change Request**
- Natural language input (LLM-assisted)
- Structured form for requirements
- Impact preview

**4. Impact Visualization**
- Affected components highlighted
- Side-by-side comparison (before/after)
- Cost and effort estimates

**5. Validation Results**
- Color-coded validation status
- Detailed error messages
- Suggested fixes

---

## Cross-Stack Communication

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  Next.js Frontend (React + React Flow + Shadcn/UI)          │
└─────────────────────────────────────────────────────────────┘
                           │
                    REST/GraphQL API
                           │
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              API Gateway / Router                       │ │
│  └────────────────────────────────────────────────────────┘ │
│           │                  │                  │            │
│  ┌────────▼──────┐  ┌───────▼────────┐  ┌─────▼─────────┐ │
│  │   Ingestion   │  │     Domain     │  │  Query/Report │ │
│  │    Service    │  │    Service     │  │    Service    │ │
│  └────────┬──────┘  └───────┬────────┘  └─────┬─────────┘ │
│           │                  │                  │            │
│  ┌────────▼──────────────────▼──────────────────▼─────────┐ │
│  │           Shared Data Access Layer (Repository)        │ │
│  └────────┬────────────────────────────────────────────────┘ │
└───────────┼──────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────────┐
│                       DATA LAYER                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgreSQL + Apache AGE (Primary Database)          │   │
│  │  - Transactional data (ACID)                         │   │
│  │  - Graph queries (Cypher via AGE)                    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Redis     │  │  S3/MinIO    │  │   Vector DB  │      │
│  │   (Cache)    │  │ (Documents)  │  │  (Optional)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ LLM Provider │  │   RM/ALM     │  │   PLM/CAD    │       │
│  │ (Anthropic)  │  │   (Jira)     │  │   Systems    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└───────────────────────────────────────────────────────────────┘
```

### Communication Protocols

#### 1. Frontend ↔ Backend
```typescript
// GraphQL (preferred for complex queries)
query GetHarnessWithImpact($harnessId: ID!, $changeRequest: ChangeInput!) {
  harness(id: $harnessId) {
    id
    name
    ecus {
      id
      pins {
        id
        assignments {
          feature {
            name
          }
        }
      }
    }
  }

  impactAnalysis(change: $changeRequest) {
    affectedComponents
    validationResults {
      severity
      message
    }
    estimatedCost
  }
}

// REST (for simple operations)
GET  /api/harnesses/:id
POST /api/harnesses
PUT  /api/harnesses/:id
POST /api/harnesses/:id/validate
POST /api/change-requests
```

#### 2. Service ↔ Service (Internal)
```typescript
// Event-driven (within modular monolith)
interface DomainEvent {
  type: 'HarnessUpdated' | 'FeatureAdded' | 'ValidationCompleted';
  payload: unknown;
  timestamp: Date;
  userId: string;
}

// Direct function calls (same process)
const validationResult = await domainService.validateChange(changeRequest);
```

#### 3. Application ↔ Database
```typescript
// Repository Pattern
interface HarnessRepository {
  findById(id: string): Promise<Harness>;
  save(harness: Harness): Promise<void>;
  findByQuery(query: HarnessQuery): Promise<Harness[]>;

  // Graph queries via Apache AGE
  findImpactRadius(nodeId: string, depth: number): Promise<Node[]>;
  shortestPath(from: string, to: string): Promise<Path>;
}

// SQL + Cypher (via Apache AGE)
SELECT * FROM ag_catalog.cypher('harness_graph', $$
  MATCH path = (ecu:ECU)-[:HAS_PIN]->(pin:Pin)-[:WIRED_TO*1..3]->(pin2:Pin)
  WHERE ecu.id = $ecuId
  RETURN path
$$) as (path agtype);
```

#### 4. Application ↔ LLM Provider
```typescript
// Abstraction layer (swap providers easily)
interface LLMProvider {
  extractStructured<T>(
    content: string,
    schema: Schema<T>,
    prompt: string
  ): Promise<T>;

  chat(messages: Message[]): Promise<string>;

  embeddings(text: string): Promise<number[]>;
}

// Implementation
class AnthropicProvider implements LLMProvider {
  async extractStructured<T>(content: string, schema: Schema<T>, prompt: string) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      messages: [{ role: 'user', content: prompt + '\n\n' + content }],
      // Force structured output
    });

    return validateAndParse(response, schema);
  }
}
```

---

## Consensus Points (All Documents Agree)

1. ✅ **LLM as ETL/Assistant, not decision maker**
2. ✅ **Graph representation is natural for this domain**
3. ✅ **Deterministic constraint validation is critical**
4. ✅ **Safety and traceability are non-negotiable**
5. ✅ **Support multiple input formats**
6. ✅ **Interactive visualization is valuable**
7. ✅ **Change impact analysis is core value**

---

## Key Conflicts Resolved

### Conflict 1: Database Choice
- **SystemArch:** Multiple databases (Graph + Relational + Document + Vector)
- **ECU_Spec:** Offers 4 options without choosing
- **AdditionalSpec:** Neo4j strongly recommended
- **AlternateConfig:** Neo4j or PostgreSQL

**Resolution:** PostgreSQL + Apache AGE
- Combines relational and graph capabilities
- Single database reduces operational complexity
- Team familiarity with SQL
- Can add Redis/S3/Vector DB later if needed

### Conflict 2: Architecture Complexity
- **SystemArch:** Full microservices from day one
- **AlternateConfig:** Simple monolith/desktop tool

**Resolution:** Modular Monolith → Microservices
- Start simple, maintain clear boundaries
- Extract services only when needed
- Easier development and debugging

### Conflict 3: Input Formats
- **SystemArch:** PDF, Excel, Specs (vague)
- **AlternateConfig:** KBL/VEC XML only

**Resolution:** Multi-format support
- KBL/VEC (industry standard)
- WireViz (open-source community)
- Excel (legacy/manual)
- PDF (LLM extraction)
- All convert to unified internal model

### Conflict 4: LLM Integration Depth
- **SystemArch:** LLM in multiple layers
- **AdditionalSpec:** Minimal LLM use

**Resolution:** Bounded LLM use
- Ingestion: Extract data from documents
- Interface: NL query and explanation
- Assistant: Suggest options
- NEVER: Calculations or final decisions

---

## Next Steps

Based on this analysis, we will create:

1. **Consolidated Technical Specification** - Single source of truth
2. **Architecture Decision Records** - Key decisions documented
3. **Implementation Roadmap** - Phased development plan
4. **Data Model Specification** - Unified schema
5. **API Specification** - Service contracts

---

**Document Status:** Complete
**Next Document:** `docs/consolidated/TECHNICAL_SPECIFICATION.md`
