# WireViz Integration - Implementation Roadmap

## Executive Summary

This roadmap outlines the implementation of WireViz integration into HarnessFlow over three phases. Each phase delivers incremental value while building toward a comprehensive multi-format harness design platform.

**Total Estimated Timeline:** 8-12 weeks
**Team Size:** 2-3 developers
**Priority:** Medium-High (enables migration from existing WireViz workflows)

## Phase Overview

```
Phase 1: Parser (Input)          │ Phase 2: Generator (Output)  │ Phase 3: CLI Integration
Weeks 1-4                        │ Weeks 5-8                     │ Weeks 9-12 (Optional)
─────────────────────────────────┼───────────────────────────────┼──────────────────────────
✓ Import WireViz YAML files      │ ✓ Export to WireViz YAML     │ ✓ Generate PDFs via CLI
✓ Convert to internal model      │ ✓ Round-trip conversion      │ ✓ Automated documentation
✓ Display in React Flow          │ ✓ Preserve metadata          │ ✓ Cloud-based rendering
```

---

## Phase 1: WireViz Parser (Input) - Weeks 1-4

**Goal:** Enable users to import existing WireViz YAML files into HarnessFlow

### Week 1: Setup & Type Definitions

#### Task 1.1: Project Setup (2 days)
- [ ] Install dependencies (`js-yaml`, `zod`)
- [ ] Create directory structure
- [ ] Set up testing framework
- [ ] Configure TypeScript for new modules

**Files to create:**
```
src/parsers/wireviz/
├── index.ts
├── wireviz-schema.ts
└── __tests__/
    └── fixtures/
        └── sample-harness.yml
```

#### Task 1.2: WireViz Schema Types (3 days)
Define TypeScript types matching WireViz YAML schema:

```typescript
// wireviz-schema.ts
export interface WireVizConnector {
  type?: string;
  subtype?: string;
  pincount?: number;
  pinlabels?: string[];
  color?: string;
  notes?: string;
}

export interface WireVizCable {
  type?: string;
  gauge?: string | number;
  gauge_unit?: 'awg' | 'mm2';
  length?: number;
  length_unit?: 'm' | 'mm' | 'in';
  color?: string;
  colors?: string[];
  color_code?: string;
  wirecount?: number;
  shield?: boolean;
}

export interface WireVizConnection {
  from: [string, number | string];
  to: [string, number | string];
  via?: string[];
}

export interface WireVizDocument {
  connectors?: Record<string, WireVizConnector>;
  cables?: Record<string, WireVizCable>;
  connections?: Array<[string, number | string, string, number | string]>;
}
```

**Deliverable:** Complete TypeScript type definitions with Zod validators

---

### Week 2: Core Parser Implementation

#### Task 2.1: YAML Parser (3 days)
Implement YAML loading and validation:

```typescript
// wireviz-parser.ts
import yaml from 'js-yaml';
import { WireVizDocumentSchema } from './wireviz-schema';

export function parseWireVizYAML(yamlContent: string): WireVizDocument {
  const parsed = yaml.load(yamlContent);
  const validated = WireVizDocumentSchema.parse(parsed);
  return validated;
}
```

**Test cases:**
- Valid WireViz files (from official examples)
- Invalid YAML (syntax errors)
- Missing required fields
- Type mismatches

#### Task 2.2: Data Model Mapping (2 days)
Convert WireViz types to HarnessFlow internal model:

```typescript
export function convertToHarnessModel(
  wireVizDoc: WireVizDocument
): HarnessFlowModel {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Convert connectors
  for (const [id, connector] of Object.entries(wireVizDoc.connectors || {})) {
    nodes.push({
      id: `connector-${id}`,
      type: 'connector',
      position: { x: 0, y: 0 }, // Initial position
      data: {
        label: id,
        partNumber: connector.type,
        pins: generatePins(connector),
        metadata: { source: 'wireviz' }
      }
    });
  }

  // Convert cables (as metadata for edges)
  // Convert connections to edges

  return { nodes, edges };
}
```

**Deliverable:** Working parser with unit tests

---

### Week 3: Integration with React Flow

#### Task 3.1: Layout Algorithm (3 days)
Implement automatic positioning for imported nodes:

```typescript
export function calculateLayout(nodes: Node[]): Node[] {
  // Simple hierarchical layout:
  // - Connectors on left/right
  // - Cables in middle
  // - Space evenly

  const connectors = nodes.filter(n => n.type === 'connector');
  const ySpacing = 100;

  connectors.forEach((node, index) => {
    node.position = {
      x: index % 2 === 0 ? 100 : 600,
      y: index * ySpacing
    };
  });

  return nodes;
}
```

#### Task 3.2: UI Integration (2 days)
Add file upload UI:

```tsx
// ImportWireVizButton.tsx
export function ImportWireVizButton() {
  const handleFileUpload = async (file: File) => {
    const content = await file.text();
    const wireVizData = parseWireVizYAML(content);
    const harnessModel = convertToHarnessModel(wireVizData);
    loadIntoReactFlow(harnessModel);
  };

  return (
    <input
      type="file"
      accept=".yml,.yaml"
      onChange={(e) => handleFileUpload(e.target.files[0])}
    />
  );
}
```

**Deliverable:** Users can import WireViz files via UI

---

### Week 4: Testing & Polish

#### Task 4.1: Integration Tests (2 days)
Test with real WireViz examples:
- Simple harness (2-3 connectors)
- Complex harness (10+ connectors, multiple cables)
- Edge cases (custom colors, shields, notes)

Download test files from:
https://github.com/wireviz/WireViz/tree/main/examples

#### Task 4.2: Error Handling (2 days)
- User-friendly error messages
- Validation errors display
- Partial import support (skip invalid sections)

#### Task 4.3: Documentation (1 day)
- JSDoc comments
- README with usage examples
- Migration guide for WireViz users

**Phase 1 Deliverable:** ✅ Users can import WireViz YAML files and view in HarnessFlow

---

## Phase 2: WireViz Generator (Output) - Weeks 5-8

**Goal:** Enable users to export HarnessFlow designs to WireViz YAML format

### Week 5: Generator Architecture

#### Task 5.1: Reverse Mapping (3 days)
Implement HarnessFlow → WireViz conversion:

```typescript
// wireviz-generator.ts
export function generateWireVizYAML(
  harnessModel: HarnessFlowModel
): string {
  const wireVizDoc: WireVizDocument = {
    connectors: {},
    cables: {},
    connections: []
  };

  // Convert HarnessFlow nodes to WireViz connectors
  harnessModel.nodes
    .filter(n => n.type === 'connector')
    .forEach(node => {
      wireVizDoc.connectors[node.data.label] = {
        type: node.data.partNumber,
        pinlabels: node.data.pins.map(p => p.label),
        pincount: node.data.pins.length
      };
    });

  // Convert edges to connections
  harnessModel.edges.forEach(edge => {
    wireVizDoc.connections.push([
      edge.source,
      edge.data.sourcePin,
      edge.target,
      edge.data.targetPin
    ]);
  });

  return yaml.dump(wireVizDoc);
}
```

#### Task 5.2: Metadata Preservation (2 days)
Ensure round-trip preserves all data:
- Colors, gauges, lengths
- Custom notes and labels
- Extended HarnessFlow metadata (in comments)

**Test:** Import → Edit → Export → Import should be lossless

---

### Week 6: Export Features

#### Task 6.1: Export UI (2 days)
Add export button and options:

```tsx
export function ExportWireVizButton() {
  const handleExport = () => {
    const harnessModel = getCurrentHarnessData();
    const yamlContent = generateWireVizYAML(harnessModel);

    downloadFile(yamlContent, 'harness.yml', 'text/yaml');
  };

  return <button onClick={handleExport}>Export to WireViz</button>;
}
```

#### Task 6.2: Validation (3 days)
Validate generated YAML:
- Schema compliance (Zod validator)
- WireViz CLI acceptance test (if CLI available)
- Reference resolution (all cables/connectors referenced exist)

---

### Week 7: Round-Trip Testing

#### Task 7.1: Round-Trip Tests (3 days)
Comprehensive round-trip testing:

```typescript
test('round-trip: import → export → import', () => {
  const original = readFile('examples/demo01.yml');
  const imported = parseWireVizYAML(original);
  const harnessModel = convertToHarnessModel(imported);
  const exported = generateWireVizYAML(harnessModel);
  const reimported = parseWireVizYAML(exported);

  expect(reimported).toEqual(imported);
});
```

#### Task 7.2: Data Fidelity (2 days)
Ensure all WireViz features are preserved:
- All connector types
- Cable specifications (gauge, color, shield)
- Connection metadata
- Notes and custom fields

---

### Week 8: Polish & Documentation

#### Task 8.1: Export Options (2 days)
Add advanced export options:
- Include/exclude metadata
- Simplify output (minimal vs. verbose)
- Custom formatting (indentation, comments)

#### Task 8.2: User Guide (2 days)
Document export workflow:
- When to export to WireViz
- How to use exported files with WireViz CLI
- Troubleshooting common issues

#### Task 8.3: Examples (1 day)
Create example projects:
- Simple harness (beginner)
- Complex harness (advanced)
- Migration example (WireViz → HarnessFlow → WireViz)

**Phase 2 Deliverable:** ✅ Users can export HarnessFlow designs to WireViz YAML

---

## Phase 3: CLI Integration (Optional) - Weeks 9-12

**Goal:** Generate PDF documentation automatically via WireViz CLI

### Week 9: CLI Service Architecture

#### Task 9.1: WireViz CLI Wrapper (3 days)
Create Node.js service to invoke WireViz:

```typescript
// wireviz-cli-service.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function generatePDF(
  yamlPath: string
): Promise<string> {
  // Check if WireViz is installed
  try {
    await execAsync('wireviz --version');
  } catch {
    throw new Error('WireViz not installed');
  }

  // Run WireViz
  await execAsync(`wireviz ${yamlPath}`);

  // Return path to generated PDF
  return yamlPath.replace('.yml', '.pdf');
}
```

#### Task 9.2: Docker Container (2 days)
Create Docker image with WireViz pre-installed:

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    graphviz \
    && rm -rf /var/lib/apt/lists/*

RUN pip install wireviz

WORKDIR /app
```

---

### Week 10: Server-Side Integration

#### Task 10.1: API Endpoint (3 days)
Create backend API for PDF generation:

```typescript
// api/generate-pdf.ts
export async function POST(req: Request) {
  const { harnessModel } = await req.json();

  // Generate YAML
  const yaml = generateWireVizYAML(harnessModel);
  const tempPath = `/tmp/${uuid()}.yml`;
  await writeFile(tempPath, yaml);

  // Invoke WireViz
  const pdfPath = await generatePDF(tempPath);

  // Return PDF
  const pdfBuffer = await readFile(pdfPath);
  return new Response(pdfBuffer, {
    headers: { 'Content-Type': 'application/pdf' }
  });
}
```

#### Task 10.2: Caching (2 days)
Cache generated PDFs:
- Hash harness data
- Store PDFs in S3/local storage
- Serve cached version if unchanged

---

### Week 11: Cloud Deployment

#### Task 11.1: Serverless Function (3 days)
Deploy as AWS Lambda or similar:
- Package WireViz in Lambda layer
- Set up S3 for temp files
- Configure API Gateway

#### Task 11.2: Rate Limiting (2 days)
Prevent abuse:
- Limit requests per user
- Queue large jobs
- Timeout handling (max 30s execution)

---

### Week 12: UI & Testing

#### Task 12.1: Download PDF Button (2 days)
Add UI for PDF generation:

```tsx
export function DownloadPDFButton() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    const harnessModel = getCurrentHarnessData();
    const pdfBlob = await fetch('/api/generate-pdf', {
      method: 'POST',
      body: JSON.stringify({ harnessModel })
    }).then(r => r.blob());

    downloadFile(pdfBlob, 'harness.pdf', 'application/pdf');
    setLoading(false);
  };

  return (
    <button disabled={loading} onClick={handleDownload}>
      {loading ? 'Generating...' : 'Download PDF'}
    </button>
  );
}
```

#### Task 12.2: E2E Tests (2 days)
Test full flow:
- User creates harness in UI
- Clicks "Download PDF"
- PDF is generated and downloaded
- PDF contains correct diagram

#### Task 12.3: Monitoring (1 day)
- Log CLI errors
- Track generation times
- Alert on failures

**Phase 3 Deliverable:** ✅ Users can generate PDF documentation with one click

---

## Milestones & Checkpoints

### Milestone 1: Import Working (End of Week 4)
**Success Criteria:**
- [ ] Can import all official WireViz examples
- [ ] Diagrams display correctly in React Flow
- [ ] No data loss on import
- [ ] Unit test coverage >80%

**Demo:** Import `examples/demo01.yml` and show in UI

---

### Milestone 2: Export Working (End of Week 8)
**Success Criteria:**
- [ ] Can export HarnessFlow designs to valid YAML
- [ ] Round-trip conversion is lossless
- [ ] Exported files work with WireViz CLI
- [ ] Integration test coverage >70%

**Demo:** Create harness in UI → Export → Run WireViz CLI → Show PDF

---

### Milestone 3: PDF Generation (End of Week 12)
**Success Criteria:**
- [ ] PDF generation works in production
- [ ] Average generation time <5 seconds
- [ ] 99% uptime for CLI service
- [ ] E2E tests passing

**Demo:** Click "Download PDF" → Receive professional documentation

---

## Resource Requirements

### Development Team
- **1 Senior Developer** (Weeks 1-12)
  - Architecture and core parser/generator
  - Code review and quality assurance

- **1 Mid-Level Developer** (Weeks 1-8)
  - Implementation and testing
  - UI integration

- **1 DevOps Engineer** (Weeks 9-12, part-time)
  - Docker and cloud deployment
  - CI/CD pipeline

### Infrastructure
- **Phase 1-2:** None (client-side only)
- **Phase 3:**
  - Cloud function (AWS Lambda / Vercel Functions)
  - Storage (S3 for temp files and PDFs)
  - Estimated cost: ~$50/month for moderate usage

### External Dependencies
- **WireViz:** GPL-3.0 license (compatible with open-source project)
- **GraphViz:** EPL license (free to use)
- **js-yaml:** MIT license

---

## Risk Assessment

### High-Risk Items

#### Risk 1: WireViz Schema Changes
**Impact:** High
**Probability:** Low
**Mitigation:**
- Pin WireViz version in Docker
- Monitor WireViz releases
- Comprehensive schema tests

#### Risk 2: Complex Layout Edge Cases
**Impact:** Medium
**Probability:** Medium
**Mitigation:**
- Start with simple layouts
- Iteratively improve algorithm
- Allow manual adjustment

#### Risk 3: CLI Performance in Production
**Impact:** High
**Probability:** Medium
**Mitigation:**
- Implement caching aggressively
- Set up monitoring and alerts
- Provide fallback (user downloads YAML + runs locally)

### Medium-Risk Items

#### Risk 4: Data Loss on Round-Trip
**Impact:** High
**Probability:** Low
**Mitigation:**
- Extensive round-trip testing
- Store original YAML as backup
- Validation warnings before export

---

## Success Metrics

### User Adoption
- **Target:** 30% of users import at least one WireViz file in first month
- **Measurement:** Analytics on import button clicks

### Data Quality
- **Target:** <5% of imports result in errors
- **Measurement:** Error rate tracking

### Performance
- **Target:** Import <1 second for typical file (<100 connectors)
- **Measurement:** Performance monitoring

### Satisfaction
- **Target:** 4+ star rating on WireViz integration feature
- **Measurement:** User surveys

---

## Post-Launch Activities

### Month 1: Stabilization
- Monitor error rates
- Fix critical bugs
- User feedback collection

### Month 2: Optimization
- Performance improvements
- UI/UX refinements based on feedback
- Additional WireViz features

### Month 3: Advanced Features
- Batch import/export
- WireViz template library
- Custom color scheme mappings

---

## Alternative Approaches Considered

### Alternative 1: Direct WireViz Rendering
**Approach:** Embed WireViz diagrams directly in web UI

**Pros:**
- Consistent visualization with CLI
- No need to implement custom renderer

**Cons:**
- Static images, no interactivity
- Requires server-side rendering
- Can't edit visually

**Decision:** ❌ Rejected - Conflicts with interactive editing goal

---

### Alternative 2: WireViz as Core Format
**Approach:** Use WireViz YAML as HarnessFlow's native format

**Pros:**
- No conversion needed
- Direct compatibility

**Cons:**
- Limited to WireViz features
- Can't support KBL, ARXML, etc.
- Tight coupling to external project

**Decision:** ❌ Rejected - Too limiting for multi-format platform

---

### Alternative 3: Fork WireViz
**Approach:** Fork WireViz and modify for web use

**Pros:**
- Full control over features
- Can add web-specific enhancements

**Cons:**
- Maintenance burden
- Diverges from upstream
- GPL license complications

**Decision:** ❌ Rejected - Maintenance burden too high

---

## Conclusion

This roadmap provides a clear path to WireViz integration while maintaining HarnessFlow's flexibility and modern web architecture. By treating WireViz as one of many import/export formats, we:

1. ✅ Enable migration from existing WireViz workflows
2. ✅ Leverage WireViz's mature documentation capabilities
3. ✅ Avoid tight coupling to external dependencies
4. ✅ Maintain interactive web-based editing as core strength

**Recommended Next Steps:**
1. Review and approve this roadmap
2. Allocate development team
3. Set up project tracking (Jira/GitHub Issues)
4. Begin Phase 1: Week 1 tasks

---

**Document Version:** 1.0
**Last Updated:** 2025-11-19
**Author:** HarnessFlow Team
**Status:** Ready for Review
