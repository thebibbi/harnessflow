# Claude Assistant Guide for HarnessFlow

**Version:** 1.0
**Last Updated:** 2025-11-19
**Purpose:** Comprehensive guide for AI assistants working on HarnessFlow

---

## Project Overview

**HarnessFlow** is an intelligent electrical change-impact engine for automotive wiring harness design and validation. It combines structured knowledge representation, deterministic validation, AI-assisted interfaces, and interactive visualization.

### Core Value Proposition
Automates the time-consuming process of analyzing electrical changes in automotive wiring harnesses. What used to take engineers **days** now takes **minutes**.

---

## Documentation Hierarchy

### 📚 Essential Reading (Read First)
1. **[Technical Specification](./docs/consolidated/TECHNICAL_SPECIFICATION.md)** - Complete system overview ⭐
2. **[Data Model Specification](./docs/consolidated/DATA_MODEL_SPECIFICATION.md)** - Database schemas and types
3. **[Architecture Decision Records](./docs/consolidated/ARCHITECTURE_DECISION_RECORDS.md)** - Why decisions were made

### 📖 Reference Documentation
- [Implementation Roadmap](./docs/implementation/IMPLEMENTATION_ROADMAP.md) - Phased development plan
- [Architecture Comparison](./docs/architecture-analysis/ARCHITECTURE_COMPARISON.md) - Historical analysis
- [WireViz Integration](./docs/wireviz-integration/README.md) - Format support details
- [Documentation Index](./docs/README.md) - Complete documentation map

---

## Key Architecture Decisions (Must Know)

### 1. Database Strategy (ADR-001)
✅ **PostgreSQL 15+ with Apache AGE graph extension**

**Why:** Single database for relational + graph data
- Use PostgreSQL for transactional data (ACID guarantees)
- Use Apache AGE Cypher queries for graph traversal
- No data synchronization needed between DBs

**Implementation:**
```typescript
// Regular SQL via Prisma
const ecu = await prisma.ecu.findUnique({ where: { id } });

// Graph queries via Apache AGE
const impactRadius = await db.executeGraphQuery(`
  SELECT * FROM ag_catalog.cypher('harness_graph', $$
    MATCH (start:Pin {id: $pinId})-[*1..3]-(affected)
    RETURN DISTINCT affected
  $$) as (result agtype);
`, { pinId });
```

### 2. LLM Integration Boundaries (ADR-002)
✅ **LLM as "Smart ETL + Assistant" (NEVER Decision Maker)**

**Allowed Uses:**
- ✅ Parse PDF datasheets to extract structured data
- ✅ Translate natural language queries to structured queries
- ✅ Generate human-readable explanations of results
- ✅ Assist with column mapping for Excel imports

**Prohibited Uses:**
- ❌ Electrical calculations (current, voltage, resistance)
- ❌ Constraint validation decisions
- ❌ Final pin selection or routing decisions
- ❌ Safety-critical determinations

**Critical Pattern:**
```typescript
// ✅ CORRECT
async function validateNewFeature(featureDesc: string) {
  // 1. LLM extracts requirements (optional helper)
  const requirements = await llm.extractRequirements(featureDesc);

  // 2. Deterministic validation (REQUIRED)
  const validationResults = await constraintEngine.validate(requirements);

  // 3. LLM explains results (optional helper)
  const explanation = await llm.explainResults(validationResults);

  return { requirements, validationResults, explanation };
}

// ❌ WRONG - Never do this
async function validateNewFeature(featureDesc: string) {
  return await llm.query("Can I add this feature: " + featureDesc);
}
```

### 3. Architecture Style (ADR-003)
✅ **Modular Monolith with Service Boundaries**

**Structure:**
```
src/
├── modules/
│   ├── ingestion/    # Parsers (KBL, WireViz, Excel, PDF)
│   ├── domain/       # Core logic, constraints, graph queries
│   ├── api/          # GraphQL + REST endpoints
│   └── llm/          # LLM provider abstraction
├── shared/
│   ├── types/        # Shared TypeScript types
│   ├── db/           # Database access layer
│   └── utils/
```

**Rules:**
- Modules communicate through defined interfaces only
- No direct cross-module function calls
- Each module can be extracted to microservice later
- Use dependency injection for module interfaces

### 4. Multi-Format Support (ADR-004)
✅ **All formats convert to unified internal model**

**Supported Formats (Priority Order):**
1. **P0:** KBL/VEC XML (industry standard)
2. **P0:** WireViz YAML (open-source)
3. **P1:** Excel/CSV (legacy data)
4. **P1:** PDF (LLM-powered extraction)
5. **P2:** ARXML (AUTOSAR)

**Pattern:**
```typescript
// All parsers implement same interface
interface FormatParser {
  parse(input: Buffer | string): Promise<HarnessModel>;
  validate(model: HarnessModel): Promise<ValidationResult>;
}

// Unified internal model (see DATA_MODEL_SPECIFICATION.md)
interface HarnessModel {
  metadata: ProjectMetadata;
  ecus: ECU[];
  connectors: Connector[];
  pins: Pin[];
  wires: Wire[];
  features: Feature[];
  networks: Network[];
}
```

### 5. Constraint Engine Design (ADR-005)
✅ **Hybrid: Deterministic Rules + Graph Algorithms**

**Rule Categories:**
1. **Electrical Rules** - Current, voltage, power (deterministic)
2. **Protocol Rules** - CAN/LIN bus load, timing (deterministic)
3. **Safety Rules** - ISO 26262 ASIL compliance (deterministic)
4. **Physical Rules** - Wire gauge, routing (deterministic)

**Graph Algorithms:**
- Impact radius calculation (graph traversal)
- Shortest path (for voltage drop calculations)
- Compatible pin finding (graph queries)

**Implementation Pattern:**
```typescript
class ElectricalRules {
  validateCurrent(pin: Pin, load: Load): ValidationResult {
    // Deterministic calculation
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
}
```

---

## Coding Standards

### TypeScript

**Strict Mode (Always):**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Type Definitions:**
```typescript
// ✅ GOOD - Explicit types
interface User {
  id: string;
  email: string;
  role: 'admin' | 'engineer' | 'viewer';
}

async function getUser(id: string): Promise<User> {
  // ...
}

// ❌ BAD - Implicit any
async function getUser(id) {
  // ...
}
```

**Naming Conventions:**
```typescript
// Interfaces: PascalCase
interface ECU { }
interface PinCapabilities { }

// Types: PascalCase
type ValidationResult = { };

// Functions: camelCase
function validateHarness() { }
async function parseWireViz() { }

// Constants: SCREAMING_SNAKE_CASE
const MAX_CURRENT_AMPS = 15;
const DEFAULT_WIRE_GAUGE = 0.5;

// Files: kebab-case
// wireviz-parser.ts
// constraint-engine.ts
// electrical-rules.ts
```

### Error Handling

**Always use typed errors:**
```typescript
// Define custom error types
class ValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Use in code
async function validatePin(pin: Pin): Promise<ValidationResult> {
  if (!pin.capabilities) {
    throw new ValidationError(
      'Pin missing capabilities',
      'MISSING_CAPABILITIES',
      { pinId: pin.id }
    );
  }
  // ...
}

// Catch and handle
try {
  await validatePin(pin);
} catch (error) {
  if (error instanceof ValidationError) {
    logger.error('Validation failed', { code: error.code, details: error.details });
  }
  throw error;
}
```

### Testing

**Coverage Requirements:**
- Unit tests: >80%
- Constraint rules: 100% (safety-critical)
- Integration tests: >60%
- E2E tests: Critical paths only

**Test Structure:**
```typescript
describe('ElectricalRules', () => {
  describe('validateCurrent', () => {
    it('should pass when current is within limit', () => {
      const pin: Pin = {
        capabilities: { current_limit: { continuous_a: 10 } }
      };
      const load: Load = { current_a: 5 };

      const result = electricalRules.validateCurrent(pin, load);

      expect(result.valid).toBe(true);
    });

    it('should fail when current exceeds limit', () => {
      const pin: Pin = {
        capabilities: { current_limit: { continuous_a: 5 } }
      };
      const load: Load = { current_a: 10 };

      const result = electricalRules.validateCurrent(pin, load);

      expect(result.valid).toBe(false);
      expect(result.severity).toBe('error');
      expect(result.message).toContain('exceeds');
    });

    it('should warn when current is >90% of limit', () => {
      // ... test warning case
    });
  });
});
```

---

## Common Tasks

### Task 1: Add a New Constraint Rule

**Steps:**
1. Define rule in appropriate rules class (e.g., `ElectricalRules`)
2. Add TypeScript types if needed
3. Write comprehensive unit tests (100% coverage)
4. Update validation engine to call new rule
5. Document rule in TECHNICAL_SPECIFICATION.md

**Example:**
```typescript
// 1. Define rule
class ElectricalRules {
  validateVoltageDrop(path: Wire[], current: number): ValidationResult {
    const totalResistance = path.reduce((sum, wire) => {
      const length_m = wire.physical.length_mm / 1000;
      return sum + (wire.electrical.resistance_per_m * length_m);
    }, 0);

    const voltageDrop = current * totalResistance; // V = IR
    const percentDrop = (voltageDrop / 12.0) * 100; // Assume 12V nominal

    if (percentDrop > 5) {
      return {
        valid: false,
        severity: 'error',
        message: `Voltage drop ${voltageDrop.toFixed(2)}V (${percentDrop.toFixed(1)}%) exceeds 5%`,
        rule: 'electrical.voltage_drop'
      };
    }

    return { valid: true };
  }
}

// 2. Add tests
describe('validateVoltageDrop', () => {
  it('should calculate voltage drop correctly', () => {
    // ... test implementation
  });
});
```

### Task 2: Add a New Input Format Parser

**Steps:**
1. Create parser file in `src/modules/ingestion/parsers/`
2. Implement `FormatParser` interface
3. Map format-specific types to `HarnessModel`
4. Add validation for parsed data
5. Write tests with real sample files
6. Register parser in ingestion module

**Example:**
```typescript
// src/modules/ingestion/parsers/my-format-parser.ts
export class MyFormatParser implements FormatParser {
  async parse(input: Buffer): Promise<HarnessModel> {
    // 1. Parse input
    const raw = await this.parseRawFormat(input);

    // 2. Validate schema
    const validated = MyFormatSchema.parse(raw);

    // 3. Convert to HarnessModel
    return this.convertToHarnessModel(validated);
  }

  private convertToHarnessModel(data: MyFormatData): HarnessModel {
    return {
      metadata: this.extractMetadata(data),
      ecus: this.convertECUs(data.ecus),
      connectors: this.convertConnectors(data.connectors),
      // ... map all entities
    };
  }
}
```

### Task 3: Add a New API Endpoint

**GraphQL:**
```typescript
// 1. Update schema
// schema.graphql
extend type Query {
  findCompatiblePins(requirements: PinRequirementsInput!): [Pin!]!
}

input PinRequirementsInput {
  ioType: PinIOType!
  currentRequired: Float!
  voltageRange: VoltageRangeInput
}

// 2. Implement resolver
// api/resolvers/pin-resolver.ts
@Resolver(() => Pin)
export class PinResolver {
  @Query(() => [Pin])
  async findCompatiblePins(
    @Args('requirements') requirements: PinRequirementsInput
  ): Promise<Pin[]> {
    return this.graphService.findCompatiblePins(requirements);
  }
}

// 3. Add tests
describe('PinResolver', () => {
  it('should find compatible pins', async () => {
    // ... test implementation
  });
});
```

**REST:**
```typescript
// 1. Add controller endpoint
// api/controllers/harness-controller.ts
@Controller('harnesses')
export class HarnessController {
  @Post(':id/validate')
  async validate(@Param('id') id: string): Promise<ValidationReport> {
    return this.domainService.validateHarness(id);
  }
}

// 2. Add tests
describe('HarnessController', () => {
  it('POST /harnesses/:id/validate should return validation results', async () => {
    // ... test implementation
  });
});
```

### Task 4: Add a Database Migration

**Steps:**
1. Modify Prisma schema
2. Generate migration
3. Review SQL
4. Apply migration
5. Update TypeScript types if needed

**Example:**
```bash
# 1. Edit prisma/schema.prisma
model Pin {
  id            String   @id @default(uuid())
  // ... existing fields
  newField      String?  # Add new field
}

# 2. Generate migration
cd backend
npx prisma migrate dev --name add_pin_new_field

# 3. Review generated SQL in prisma/migrations/

# 4. Migration runs automatically in dev

# 5. Update TypeScript types
npx prisma generate
```

---

## Important Patterns

### Pattern 1: Repository Pattern (Data Access)

**Always use repositories, never direct Prisma calls in business logic:**

```typescript
// ✅ GOOD
export class HarnessRepository {
  async findById(id: string): Promise<Harness | null> {
    return this.prisma.harness.findUnique({
      where: { id },
      include: {
        ecus: { include: { connectors: { include: { pins: true } } } },
        wires: true,
        features: true
      }
    });
  }

  async save(harness: Harness): Promise<void> {
    await this.prisma.harness.upsert({
      where: { id: harness.id },
      update: harness,
      create: harness
    });
  }
}

// Use in service
class DomainService {
  constructor(private harnessRepo: HarnessRepository) {}

  async validateHarness(id: string): Promise<ValidationReport> {
    const harness = await this.harnessRepo.findById(id);
    // ... validation logic
  }
}

// ❌ BAD - Direct Prisma in service
class DomainService {
  async validateHarness(id: string): Promise<ValidationReport> {
    const harness = await this.prisma.harness.findUnique(...);
    // ...
  }
}
```

### Pattern 2: Dependency Injection

**Use NestJS dependency injection:**

```typescript
// ✅ GOOD
@Injectable()
export class DomainService {
  constructor(
    private readonly harnessRepo: HarnessRepository,
    private readonly constraintEngine: ConstraintEngine,
    private readonly graphService: GraphService
  ) {}

  async analyzeImpact(change: Change): Promise<ImpactAnalysis> {
    const harness = await this.harnessRepo.findById(change.harnessId);
    const validations = await this.constraintEngine.validate(change);
    const affected = await this.graphService.findImpactRadius(change);

    return { validations, affected };
  }
}

// ❌ BAD - Direct instantiation
export class DomainService {
  async analyzeImpact(change: Change): Promise<ImpactAnalysis> {
    const repo = new HarnessRepository(); // Don't do this
    // ...
  }
}
```

### Pattern 3: Validation Pipeline

**Always validate at boundaries:**

```typescript
// 1. Define Zod schema
const CreateHarnessSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  vehicle: VehicleInfoSchema
});

// 2. Validate in controller/resolver
@Post()
async create(@Body() dto: unknown): Promise<Harness> {
  // Validate input
  const validated = CreateHarnessSchema.parse(dto);

  // Call service with validated data
  return this.domainService.createHarness(validated);
}

// 3. Service receives typed, validated data
async createHarness(data: CreateHarnessDto): Promise<Harness> {
  // data is already validated, types are guaranteed
}
```

---

## Development Workflow

### Daily Development

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create feature branch
git checkout -b feature/add-voltage-drop-rule

# 3. Start development servers
pnpm dev

# 4. Make changes, write tests
# ... coding ...

# 5. Run tests
pnpm test

# 6. Run linter
pnpm lint

# 7. Commit (conventional commits)
git add .
git commit -m "feat(constraints): add voltage drop validation rule"

# 8. Push and create PR
git push origin feature/add-voltage-drop-rule
```

### Commit Message Format

**Conventional Commits:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(parser): add KBL/VEC XML parser

Implements parsing of KBL 2.4 and VEC 1.2 XML formats.
Converts to internal HarnessModel representation.

Closes #123

---

fix(validation): correct voltage drop calculation

Was using wire diameter instead of cross-sectional area.
Now correctly uses resistance per meter.

Fixes #456

---

docs(adr): add decision record for database choice

Documents why we chose PostgreSQL + Apache AGE over
pure graph database.
```

---

## Common Pitfalls to Avoid

### ❌ Pitfall 1: Using LLM for Calculations

```typescript
// ❌ WRONG
async function calculateCurrentDraw(pins: Pin[]): Promise<number> {
  const prompt = `Calculate total current draw for pins: ${JSON.stringify(pins)}`;
  return await llm.query(prompt);
}

// ✅ CORRECT
function calculateCurrentDraw(pins: Pin[]): number {
  return pins.reduce((sum, pin) => sum + (pin.assignment?.current_a || 0), 0);
}
```

### ❌ Pitfall 2: Implicit Any Types

```typescript
// ❌ WRONG
async function processData(data) {
  return data.map(item => item.value);
}

// ✅ CORRECT
async function processData(data: DataItem[]): Promise<number[]> {
  return data.map((item: DataItem) => item.value);
}
```

### ❌ Pitfall 3: Not Handling Errors

```typescript
// ❌ WRONG
async function importHarness(file: File) {
  const data = await parseFile(file);
  await saveToDatabase(data);
  return { success: true };
}

// ✅ CORRECT
async function importHarness(file: File): Promise<ImportResult> {
  try {
    const data = await parseFile(file);
    const validationResult = await validate(data);

    if (!validationResult.valid) {
      return {
        success: false,
        errors: validationResult.errors
      };
    }

    await saveToDatabase(data);
    return { success: true, harnessId: data.id };
  } catch (error) {
    logger.error('Import failed', { error, filename: file.name });
    throw new ImportError('Failed to import harness', error);
  }
}
```

### ❌ Pitfall 4: N+1 Query Problems

```typescript
// ❌ WRONG - N+1 queries
async function getHarnessesWithECUs(): Promise<Harness[]> {
  const harnesses = await prisma.harness.findMany();

  for (const harness of harnesses) {
    harness.ecus = await prisma.ecu.findMany({
      where: { harnessId: harness.id }
    }); // N queries!
  }

  return harnesses;
}

// ✅ CORRECT - Single query with include
async function getHarnessesWithECUs(): Promise<Harness[]> {
  return prisma.harness.findMany({
    include: {
      ecus: {
        include: {
          connectors: { include: { pins: true } }
        }
      }
    }
  });
}
```

---

## File Reference Guide

### Where to Find Things

**Data Models:**
- TypeScript types: `src/shared/types/`
- Prisma schema: `backend/prisma/schema.prisma`
- Specification: `docs/consolidated/DATA_MODEL_SPECIFICATION.md`

**Parsers:**
- KBL/VEC: `src/modules/ingestion/parsers/kbl-parser.ts`
- WireViz: `src/modules/ingestion/parsers/wireviz-parser.ts`
- Excel: `src/modules/ingestion/parsers/excel-parser.ts`
- PDF: `src/modules/ingestion/parsers/pdf-parser.ts`

**Constraint Rules:**
- Electrical: `src/modules/domain/rules/electrical-rules.ts`
- Protocol: `src/modules/domain/rules/protocol-rules.ts`
- Safety: `src/modules/domain/rules/safety-rules.ts`
- Physical: `src/modules/domain/rules/physical-rules.ts`

**API:**
- GraphQL schema: `backend/src/api/schema.graphql`
- Resolvers: `backend/src/api/resolvers/`
- REST controllers: `backend/src/api/controllers/`

**Frontend:**
- Components: `frontend/components/`
- Harness editor: `frontend/components/harness/HarnessEditor.tsx`
- Pages: `frontend/app/`

---

## Quick Reference

### Environment Variables

```bash
# Backend (.env)
DATABASE_URL="postgresql://user:pass@localhost:5432/harnessflow"
ANTHROPIC_API_KEY="sk-ant-..."
NODE_ENV="development"

# Frontend (.env.local)
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_GRAPHQL_URL="http://localhost:4000/graphql"
```

### Useful Commands

```bash
# Development
pnpm dev                    # Start all services
pnpm dev:backend            # Backend only
pnpm dev:frontend           # Frontend only

# Testing
pnpm test                   # Run all tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # Coverage report

# Database
cd backend
npx prisma migrate dev      # Create and apply migration
npx prisma studio           # Database GUI
npx prisma generate         # Regenerate types

# Code Quality
pnpm lint                   # Run ESLint
pnpm format                 # Run Prettier
pnpm type-check             # TypeScript check

# Build
pnpm build                  # Build all
pnpm build:backend          # Backend only
pnpm build:frontend         # Frontend only
```

---

## Getting Help

### Documentation Priority
1. Check [Technical Specification](./docs/consolidated/TECHNICAL_SPECIFICATION.md)
2. Check [ADRs](./docs/consolidated/ARCHITECTURE_DECISION_RECORDS.md) for why
3. Check [Data Model](./docs/consolidated/DATA_MODEL_SPECIFICATION.md) for schema
4. Check code comments and JSDoc
5. Ask team or create discussion

### When Stuck
1. Read the relevant ADR - understand WHY the decision was made
2. Look at existing similar code for patterns
3. Check tests for examples of usage
4. Review documentation for the module
5. Ask for clarification rather than guessing

---

## Remember

1. **LLMs assist, never decide** - All safety-critical logic must be deterministic
2. **Types everywhere** - Strict TypeScript, no implicit any
3. **Test everything** - Especially constraint rules (100% coverage)
4. **Document decisions** - Update ADRs for architectural changes
5. **Validate at boundaries** - Use Zod for runtime validation
6. **Repository pattern** - No direct Prisma in business logic
7. **Conventional commits** - Clear, semantic commit messages

---

**Ready to build amazing harness validation tools!** 🚀

For questions or clarifications, refer to the comprehensive documentation in `/docs`.
