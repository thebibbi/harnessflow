# HarnessFlow Technical Specification

**Version:** 1.0
**Date:** 2025-11-19
**Status:** **AUTHORITATIVE - Single Source of Truth**

---

## Document Purpose

This is the **authoritative technical specification** for HarnessFlow. All implementation work must conform to this document. It consolidates and supersedes previous architectural proposals.

### Related Documents
- **Data Model:** [DATA_MODEL_SPECIFICATION.md](./DATA_MODEL_SPECIFICATION.md)
- **Architecture Decisions:** [ARCHITECTURE_DECISION_RECORDS.md](./ARCHITECTURE_DECISION_RECORDS.md)
- **Architecture Analysis:** [../architecture-analysis/ARCHITECTURE_COMPARISON.md](../architecture-analysis/ARCHITECTURE_COMPARISON.md)
- **WireViz Integration:** [../wireviz-integration/README.md](../wireviz-integration/README.md)

---

## Executive Summary

### What is HarnessFlow?

HarnessFlow is an **intelligent electrical change-impact engine** for automotive wiring harness design and validation. It combines:

- **Structured knowledge representation** of ECUs, wiring harnesses, and vehicle features
- **Deterministic validation** of electrical, protocol, and safety constraints
- **AI-assisted interfaces** for document parsing and natural language queries
- **Interactive visualization** for harness editing and impact analysis
- **Multi-format support** (KBL/VEC, WireViz, Excel, PDF)

### Core Value Proposition

**Problem:** When adding/changing vehicle features, engineers spend days manually analyzing:
- Whether existing ECUs can handle new loads
- Which pins are available and compatible
- Impact on wiring harness, fuses, bus load
- Safety and compliance implications
- Cost of changes

**Solution:** HarnessFlow automates this analysis:
- Import existing harness data (any format)
- Describe new feature in natural language
- Get instant impact analysis and recommendations
- Visualize changes interactively
- Export to manufacturing formats

**Result:** Days of manual work → Minutes of automated analysis

### Target Users

1. **Electrical Engineers** - Design harnesses, validate changes
2. **Systems Engineers** - Analyze feature impacts, manage requirements
3. **Manufacturing** - Export BOMs, production documentation
4. **Management** - Cost analysis, change tracking, approvals

---

## System Architecture

### High-Level Overview

```
┌───────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                          │
│   Next.js 14 Frontend (React + React Flow + Shadcn/UI)        │
│   - Harness Editor  - ECU Browser  - Change Requests          │
└───────────────────────────────────────────────────────────────┘
                            │
                     GraphQL + REST API
                            │
┌───────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                            │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Modular Monolith Application               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │  │
│  │  │Ingestion │  │  Domain  │  │   API    │  │  LLM   │ │  │
│  │  │  Module  │  │  Module  │  │  Module  │  │ Module │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │  │
│  │       ↓              ↓              ↓           ↓       │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │       Shared Data Access Layer (Repository)      │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────────────────────────────────────────┐
│                        DATA LAYER                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  PostgreSQL 15+ with Apache AGE Graph Extension       │   │
│  │  - Transactional data (ECUs, pins, wires, features)   │   │
│  │  - Graph queries (impact analysis, pathfinding)       │   │
│  └───────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │    Redis     │  │  S3/MinIO    │  │   Vector DB  │       │
│  │   (Cache)    │  │ (Documents)  │  │  (Optional)  │       │
│  │  [Phase 2]   │  │  [Phase 2]   │  │  [Phase 3]   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└───────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ LLM Provider │  │   RM/ALM     │  │   PLM/CAD    │        │
│  │ (Anthropic)  │  │   (Jira)     │  │   Systems    │        │
│  │  [Phase 1]   │  │  [Phase 3]   │  │  [Phase 3]   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└───────────────────────────────────────────────────────────────┘
```

### Module Responsibilities

#### Ingestion Module
**Purpose:** Convert various formats to HarnessFlow's internal model

**Components:**
- **KBL/VEC Parser** - Industry standard XML formats
- **WireViz Parser** - Open-source YAML format
- **Excel Parser** - Legacy/manual data with column mapping UI
- **PDF Parser** - LLM-based datasheet extraction
- **Validators** - Schema and physics validation

**Key Functions:**
```typescript
interface IngestionModule {
  parseKBL(xml: string): Promise<HarnessModel>;
  parseWireViz(yaml: string): Promise<HarnessModel>;
  parseExcel(file: Buffer, mapping: ColumnMapping): Promise<HarnessModel>;
  parseDatasheet(pdf: Buffer): Promise<ECU>;
  validateImport(model: HarnessModel): Promise<ValidationResult>;
}
```

#### Domain Module
**Purpose:** Core business logic, validation, and analysis

**Components:**
- **Constraint Engine** - Electrical, protocol, safety, physical rules
- **Graph Service** - Impact analysis, pathfinding, compatibility queries
- **Impact Analyzer** - Change impact calculation
- **Cost Calculator** - BOM and cost analysis

**Key Functions:**
```typescript
interface DomainModule {
  // Validation
  validateChange(change: Change): Promise<ValidationReport>;

  // Graph queries
  findCompatiblePins(requirements: Requirements): Promise<Pin[]>;
  findImpactRadius(nodeId: string, depth: number): Promise<Node[]>;
  shortestPath(from: string, to: string): Promise<Path>;

  // Analysis
  analyzeImpact(change: Change): Promise<ImpactAnalysis>;
  calculateCost(changes: Change[]): Promise<CostAnalysis>;
}
```

#### API Module
**Purpose:** Expose functionality via GraphQL and REST

**Components:**
- **GraphQL Schema** - Complex queries with nested data
- **REST Endpoints** - Simple CRUD and mutations
- **Auth/RBAC** - User authentication and permissions
- **Rate Limiting** - Protect against abuse

**Endpoints:**
```typescript
// GraphQL
query GetHarness($id: ID!) {
  harness(id: $id) { /* nested data */ }
}

// REST
POST /api/harnesses
POST /api/harnesses/:id/validate
POST /api/change-requests
GET  /api/ecus/:id
```

#### LLM Module
**Purpose:** AI assistance for parsing and explanation (not decisions)

**Components:**
- **LLM Provider Abstraction** - Swap providers easily
- **Prompt Templates** - Consistent, tested prompts
- **Extraction Pipeline** - PDF → Structured data
- **Explanation Generator** - Technical → Plain English

**Key Functions:**
```typescript
interface LLMModule {
  extractStructured<T>(content: string, schema: Schema<T>): Promise<T>;
  translateQuery(nlQuery: string): Promise<StructuredQuery>;
  explainResults(results: any): Promise<string>;
}
```

---

## Data Model

**See:** [DATA_MODEL_SPECIFICATION.md](./DATA_MODEL_SPECIFICATION.md) for complete schema.

### Core Entities

```
Project
  ├── ECU[]
  │   ├── Connector[]
  │   │   └── Pin[]
  │   └── NetworkConnection[]
  ├── Wire[]
  ├── Splice[]
  ├── Feature[]
  ├── Component[]
  └── Network[]
```

### Key Relationships

- **ECU HAS_PIN** → Pin (1:N)
- **Pin WIRED_TO** → Pin (N:N via Wire)
- **Feature REQUIRES** → Pin (N:N)
- **ECU COMMUNICATES_ON** → Network (N:N)
- **Feature SENDS_MESSAGE** → Network (N:N)

### Database Schema

**Primary:** PostgreSQL 15+ with Apache AGE extension

**Tables:**
- `projects` - Project metadata
- `ecus` - Electronic Control Units
- `connectors` - Connector definitions
- `pins` - Pin/cavity definitions
- `wires` - Wire/cable connections
- `features` - Vehicle features/functions
- `networks` - Communication buses (CAN, LIN, etc.)
- `change_requests` - Change proposals and approvals

**Graph Layer (Apache AGE):**
```sql
-- Create graph
SELECT create_graph('harness_graph');

-- Query example: Impact radius
SELECT * FROM ag_catalog.cypher('harness_graph', $$
  MATCH (start:Pin {id: $pinId})-[*1..3]-(affected)
  RETURN DISTINCT affected
$$) as (result agtype);
```

---

## Key Workflows

### Workflow 1: Import Existing Harness

```
User uploads file (KBL/VEC/WireViz/Excel/PDF)
    ↓
Ingestion Module selects appropriate parser
    ↓
Parser converts to HarnessModel
    ↓
Validation layer checks schema & physics
    ↓
If validation passes → Store in database
If validation fails → Present errors to user
If confidence < 85% → Flag for human review
    ↓
User reviews and approves (if needed)
    ↓
Data committed to database
    ↓
Graph representation created via Apache AGE
```

**Implementation:**
```typescript
async function importHarness(file: File): Promise<ImportResult> {
  // Step 1: Detect format
  const format = detectFormat(file);

  // Step 2: Parse
  const parser = getParser(format);
  const harnessModel = await parser.parse(file);

  // Step 3: Validate
  const validationResults = await validate(harnessModel);

  // Step 4: Check confidence
  if (validationResults.confidence < 0.85) {
    return {
      success: false,
      requiresReview: true,
      data: harnessModel,
      validationResults
    };
  }

  // Step 5: Store
  await database.saveHarness(harnessModel);
  await graphService.buildGraph(harnessModel);

  return { success: true, harnessId: harnessModel.id };
}
```

### Workflow 2: Add New Feature

```
User describes feature (NL or structured form)
    ↓
LLM Module extracts requirements (optional)
    ↓
Domain Module finds compatible pins via graph query
    ↓
Constraint Engine validates each candidate
    ├── Electrical rules (current, voltage, power)
    ├── Protocol rules (bus load, timing)
    ├── Safety rules (ASIL, redundancy)
    └── Physical rules (wire gauge, routing)
    ↓
Graph Service calculates impact radius
    ↓
Impact Analyzer compiles affected components
    ↓
Cost Calculator estimates implementation cost
    ↓
LLM Module generates human-readable explanation
    ↓
User reviews options and selects implementation
    ↓
Change Request created for approval workflow
```

**Implementation:**
```typescript
async function addFeature(featureDesc: string): Promise<FeatureProposal> {
  // Step 1: Extract requirements (LLM-assisted)
  const requirements = await llm.extractRequirements(featureDesc);

  // Step 2: Find candidates (graph query)
  const candidatePins = await graphService.findCompatiblePins(requirements);

  // Step 3: Validate (deterministic rules)
  const validatedCandidates = await Promise.all(
    candidatePins.map(pin => constraintEngine.validate(pin, requirements))
  );

  // Step 4: Calculate impact (graph traversal)
  const impact = await impactAnalyzer.analyze({
    type: 'add_feature',
    feature: requirements,
    selectedPin: validatedCandidates[0].pin
  });

  // Step 5: Estimate cost
  const cost = await costCalculator.calculate(impact);

  // Step 6: Generate explanation (LLM)
  const explanation = await llm.explain({
    requirements,
    candidates: validatedCandidates,
    impact,
    cost
  });

  return {
    requirements,
    options: validatedCandidates,
    impact,
    cost,
    explanation
  };
}
```

### Workflow 3: Validate Harness

```
User requests validation
    ↓
System loads harness from database
    ↓
For each entity (ECU, Pin, Wire, Feature, Network):
    ├── Run electrical rules
    ├── Run protocol rules
    ├── Run safety rules
    └── Run physical rules
    ↓
Collect all validation results
    ↓
Group by severity (error, warning, info)
    ↓
Highlight affected entities in UI
    ↓
Provide suggested fixes
```

**Implementation:**
```typescript
async function validateHarness(harnessId: string): Promise<ValidationReport> {
  const harness = await database.getHarness(harnessId);
  const results: ValidationResult[] = [];

  // Validate ECUs
  for (const ecu of harness.ecus) {
    results.push(...await electricalRules.validateECU(ecu));
    results.push(...await safetyRules.validateECU(ecu));
  }

  // Validate pins
  for (const pin of harness.pins) {
    results.push(...await electricalRules.validatePin(pin));
  }

  // Validate wires
  for (const wire of harness.wires) {
    results.push(...await electricalRules.validateWire(wire));
    results.push(...await physicalRules.validateWire(wire));
  }

  // Validate networks
  for (const network of harness.networks) {
    results.push(...await protocolRules.validateNetwork(network));
  }

  return {
    valid: results.every(r => r.valid || r.severity !== 'error'),
    results,
    summary: {
      errors: results.filter(r => r.severity === 'error').length,
      warnings: results.filter(r => r.severity === 'warning').length,
      infos: results.filter(r => r.severity === 'info').length
    }
  };
}
```

---

## Constraint Rules

**See:** [ARCHITECTURE_DECISION_RECORDS.md - ADR-005](./ARCHITECTURE_DECISION_RECORDS.md#adr-005-constraint-engine-design)

### Rule Categories

#### 1. Electrical Rules

| Rule | Description | Severity |
|------|-------------|----------|
| `electrical.current_limit` | Pin current must not exceed max rating | Error |
| `electrical.voltage_compatibility` | Voltage levels must match (±10%) | Error |
| `electrical.power_budget` | Total ECU power < max rating | Error |
| `electrical.voltage_drop` | Voltage drop < 5% of nominal | Warning |
| `electrical.fuse_protection` | High-current circuits must be fused | Error |

#### 2. Protocol Rules

| Rule | Description | Severity |
|------|-------------|----------|
| `protocol.bus_load` | Bus utilization < 80% | Error |
| `protocol.message_id_unique` | CAN message IDs must be unique | Error |
| `protocol.timing_conflict` | No message timing conflicts | Error |
| `protocol.termination` | CAN bus must have 2 terminators | Error |
| `protocol.baudrate_match` | All nodes on bus must match baudrate | Error |

#### 3. Safety Rules (ISO 26262)

| Rule | Description | Severity |
|------|-------------|----------|
| `safety.asil_compatibility` | ASIL ratings must be compatible | Error |
| `safety.redundancy` | ASIL B+ requires dual path | Error |
| `safety.fault_tolerance` | Safety functions need degraded mode | Warning |
| `safety.separation` | ASIL C+ signals must be separated | Error |

#### 4. Physical Rules

| Rule | Description | Severity |
|------|-------------|----------|
| `physical.wire_gauge` | Wire gauge must support current | Error |
| `physical.connector_compatibility` | Connector genders must match | Error |
| `physical.environmental` | IP rating must match location | Warning |
| `physical.routing_feasibility` | Wire length must be achievable | Warning |

---

## Technology Stack

### Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | 20 LTS | JavaScript runtime |
| **Language** | TypeScript | 5.3+ | Type-safe development |
| **Framework** | NestJS | 10+ | Application framework |
| **Database** | PostgreSQL | 15+ | Primary data store |
| **Graph Extension** | Apache AGE | 1.5+ | Graph queries |
| **ORM** | Prisma | 5+ | Database access |
| **API** | GraphQL (Apollo) + REST | - | API layer |
| **Validation** | Zod | 3+ | Schema validation |
| **LLM** | Anthropic Claude | Sonnet 4.5 | AI assistance |

### Frontend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Next.js | 14+ | React framework |
| **UI Library** | React | 18+ | UI components |
| **Visualization** | React Flow | 11+ | Harness diagrams |
| **UI Components** | Shadcn/UI | Latest | Component library |
| **State** | Zustand | 4+ | State management |
| **Forms** | React Hook Form | 7+ | Form handling |
| **Data Fetching** | TanStack Query | 5+ | Server state |
| **Styling** | Tailwind CSS | 3+ | Utility-first CSS |

### Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Hosting** | Vercel/Railway/AWS | Application hosting |
| **Database** | Railway/Supabase/RDS | PostgreSQL hosting |
| **Cache** | Redis (Phase 2) | Performance |
| **Storage** | S3/MinIO (Phase 2) | Document storage |
| **CI/CD** | GitHub Actions | Automation |
| **Monitoring** | Sentry/LogRocket | Error tracking |

---

## Security & Compliance

### Authentication & Authorization

```typescript
interface User {
  id: string;
  email: string;
  role: 'admin' | 'engineer' | 'viewer';
  permissions: Permission[];
}

type Permission =
  | 'projects.read'
  | 'projects.write'
  | 'ecus.read'
  | 'ecus.write'
  | 'change_requests.create'
  | 'change_requests.approve';

// RBAC implementation
function canPerformAction(user: User, action: Permission): boolean {
  return user.permissions.includes(action)
    || (user.role === 'admin'); // Admins have all permissions
}
```

### ISO 26262 Compliance

**Requirements:**
- ✅ Complete audit trail (who, when, why)
- ✅ Deterministic validation (traceable decisions)
- ✅ Version control for all data
- ✅ Approval workflows for changes
- ✅ Exportable reports for certification

**Implementation:**
```typescript
interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: 'create' | 'update' | 'delete';
  user_id: string;
  timestamp: Date;
  changes: Record<string, { old: any; new: any }>;
  reason?: string;
}

// Every mutation must create audit log
async function updatePin(pinId: string, changes: Partial<Pin>, userId: string, reason: string) {
  const old = await database.getPin(pinId);
  const updated = await database.updatePin(pinId, changes);

  await auditLog.create({
    entity_type: 'pin',
    entity_id: pinId,
    action: 'update',
    user_id: userId,
    timestamp: new Date(),
    changes: diff(old, updated),
    reason
  });

  return updated;
}
```

### Data Privacy

- No PII stored (project data only)
- LLM requests are anonymized
- Optional on-premise deployment for sensitive data
- SOC 2 compliance (if cloud-hosted)

---

## Performance Requirements

### Response Times

| Operation | Target | Acceptable |
|-----------|--------|------------|
| Page load | < 1s | < 2s |
| Validation (100 components) | < 500ms | < 1s |
| Graph query (3 hops) | < 200ms | < 500ms |
| Impact analysis | < 1s | < 3s |
| PDF parsing | < 10s | < 30s |

### Scalability

| Metric | Target |
|--------|--------|
| Concurrent users | 100+ |
| Projects per account | 1000+ |
| ECUs per project | 100+ |
| Pins per ECU | 200+ |
| Wires per harness | 10,000+ |

### Optimization Strategies

1. **Caching** (Phase 2)
   - Redis for validation results
   - Query result caching
   - Static asset CDN

2. **Database**
   - Indexed foreign keys
   - Partitioned large tables
   - Materialized views for reports

3. **Frontend**
   - React Flow virtualization
   - Progressive loading
   - Code splitting

4. **API**
   - GraphQL query complexity limits
   - Rate limiting
   - Batch operations

---

## Testing Strategy

### Unit Tests

```typescript
describe('ElectricalRules', () => {
  it('should reject current exceeding pin limit', () => {
    const pin: Pin = { capabilities: { current_limit: { continuous_a: 5 } } };
    const load: Load = { current_a: 10 };

    const result = electricalRules.validateCurrent(pin, load);

    expect(result.valid).toBe(false);
    expect(result.severity).toBe('error');
  });

  it('should calculate voltage drop correctly', () => {
    const wire: Wire = {
      physical: { length_mm: 1000 },
      electrical: { resistance_per_m: 0.02 }
    };
    const current = 5;

    const voltageDrop = electricalRules.calculateVoltageDrop([wire], current);

    expect(voltageDrop).toBeCloseTo(0.1); // 5A * 0.02Ω/m * 1m = 0.1V
  });
});
```

### Integration Tests

```typescript
describe('Import Workflow', () => {
  it('should import WireViz file successfully', async () => {
    const yamlFile = readTestFile('simple-harness.yml');

    const result = await importHarness(yamlFile);

    expect(result.success).toBe(true);
    expect(result.harnessId).toBeDefined();

    const harness = await database.getHarness(result.harnessId);
    expect(harness.connectors).toHaveLength(2);
    expect(harness.wires).toHaveLength(3);
  });
});
```

### E2E Tests

```typescript
describe('Add Feature Flow', () => {
  it('should add heated steering wheel feature', async () => {
    await loginAs('engineer');
    await navigateTo('/projects/test-project/harness');

    await clickButton('Add Feature');
    await fillForm({
      name: 'Heated Steering Wheel',
      description: 'Two-level heating element'
    });
    await submitForm();

    const results = await waitForImpactAnalysis();
    expect(results.options).toHaveLength(2);
    expect(results.cost.total_delta_usd).toBeLessThan(100);

    await selectOption(0);
    await submitChangeRequest();

    const cr = await database.getLatestChangeRequest();
    expect(cr.status).toBe('review');
  });
});
```

### Coverage Targets

- Unit tests: >80%
- Integration tests: >60%
- E2E tests: Critical paths only
- Constraint rules: 100% (safety-critical)

---

## Deployment

### Development Environment

```bash
# Prerequisites
- Node.js 20+
- PostgreSQL 15+
- pnpm 8+

# Setup
git clone https://github.com/yourorg/harnessflow.git
cd harnessflow
pnpm install

# Database
createdb harnessflow_dev
cd backend && npx prisma migrate dev

# Run
pnpm dev  # Starts frontend + backend
```

### Production Deployment

**Option 1: Vercel + Railway (Recommended for MVP)**
- Frontend: Vercel (zero-config Next.js)
- Backend: Railway (PostgreSQL + Node.js)
- Cost: ~$50/month

**Option 2: AWS**
- Frontend: S3 + CloudFront
- Backend: ECS Fargate
- Database: RDS PostgreSQL
- Cost: ~$200/month

**Option 3: On-Premise (For sensitive data)**
- Docker Compose setup
- Self-hosted PostgreSQL
- Reverse proxy (nginx)

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/harnessflow"

# LLM
ANTHROPIC_API_KEY="sk-..."
LLM_PROVIDER="anthropic" # or "openai"

# Auth
JWT_SECRET="random-secret-key"
SESSION_DURATION="7d"

# External Services (Phase 3)
JIRA_API_KEY="..."
PLM_API_ENDPOINT="..."
```

---

## Migration from Existing Systems

### From CAD Tools (KBL/VEC)

```typescript
// Export from CAD tool (e.g., CATIA, Zuken E3)
// 1. File > Export > KBL 2.4
// 2. Upload to HarnessFlow

const result = await importKBL(file);
// All ECUs, wires, connectors imported
// Continue editing in HarnessFlow
```

### From WireViz

```typescript
// Existing WireViz projects
// 1. Keep .yml files in Git
// 2. Import to HarnessFlow for visual editing

const result = await importWireViz(yamlFile);
// Edit visually in HarnessFlow
// Export back to .yml for PDF generation
```

### From Excel/CSV

```typescript
// Legacy harness data in spreadsheets
// 1. Upload Excel file
// 2. Map columns to HarnessFlow schema
// 3. Review and approve

const mapping = {
  from: 'ColumnA',
  to: 'ColumnB',
  gauge: 'ColumnC',
  color: 'ColumnD'
};

const result = await importExcel(file, mapping);
```

---

## Future Enhancements

### Phase 2 (Months 6-12)
- [ ] Redis caching layer
- [ ] S3 document storage
- [ ] Real-time collaboration (WebSocket)
- [ ] Advanced routing algorithms
- [ ] Cost optimization AI

### Phase 3 (Months 12-18)
- [ ] Vector DB for semantic search
- [ ] Integration with RM/ALM tools (Jira, Polarion)
- [ ] PLM/CAD tool integrations
- [ ] 3D harness visualization
- [ ] Mobile app for field validation

### Phase 4 (Months 18-24)
- [ ] Machine learning for design suggestions
- [ ] Automated test case generation
- [ ] Predictive failure analysis
- [ ] Multi-tenant SaaS platform

---

## Support & Maintenance

### Documentation
- **User Guide:** End-user documentation
- **API Reference:** GraphQL schema + REST endpoints
- **Developer Guide:** Contribution guidelines
- **Admin Guide:** Deployment and operations

### Community
- GitHub Discussions for Q&A
- Discord server for real-time chat
- Monthly community calls
- Bug bounty program (Phase 3)

### Commercial Support
- Email support: support@harnessflow.com
- Response time: 24-48 hours
- Premium support: 4-hour response

---

## Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| **ECU** | Electronic Control Unit - embedded computer in vehicle |
| **ASIL** | Automotive Safety Integrity Level (ISO 26262) |
| **KBL** | Kabelbaum Liste - German automotive wiring standard |
| **VEC** | Vehicle Electric Container - newer automotive wiring standard |
| **CAN** | Controller Area Network - vehicle communication protocol |
| **LIN** | Local Interconnect Network - low-speed vehicle bus |
| **BOM** | Bill of Materials - list of parts and quantities |

### Appendix B: References

- ISO 26262: Road vehicles - Functional safety
- KBL Standard: VDA 4964
- VEC Standard: VDA 4968
- WireViz: https://github.com/wireviz/WireViz
- React Flow: https://reactflow.dev

### Appendix C: Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-19 | Initial specification | HarnessFlow Team |

---

**Document Status:** AUTHORITATIVE
**Approval:** Pending
**Next Review:** 2025-12-19

---

## Quick Start for Developers

```bash
# 1. Clone and install
git clone https://github.com/yourorg/harnessflow.git
cd harnessflow
pnpm install

# 2. Set up database
createdb harnessflow_dev
cd backend
npx prisma migrate dev
npx prisma db seed

# 3. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 4. Start development servers
pnpm dev

# 5. Open browser
open http://localhost:3000
```

**You're ready to build!** 🚀

Refer to:
- [DATA_MODEL_SPECIFICATION.md](./DATA_MODEL_SPECIFICATION.md) for database schema
- [ARCHITECTURE_DECISION_RECORDS.md](./ARCHITECTURE_DECISION_RECORDS.md) for design decisions
- `/examples` directory for code samples
