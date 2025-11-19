# Architecture Decision Record: WireViz Integration Strategy

**Status:** Proposed
**Date:** 2025-11-19
**Deciders:** HarnessFlow Architecture Team
**Context:** Integration of WireViz into HarnessFlow platform

---

## Context and Problem Statement

HarnessFlow is building a modern web-based platform for wiring harness design and documentation. [WireViz](https://github.com/wireviz/WireViz) is an established open-source CLI tool that generates high-quality harness diagrams from YAML files.

**Key Question:** How should HarnessFlow integrate with WireViz?

### Requirements
1. Support teams migrating from existing WireViz workflows
2. Enable export to WireViz for PDF documentation generation
3. Maintain HarnessFlow's interactive web-based editing capabilities
4. Support multiple input/output formats (not just WireViz)
5. Minimize coupling to external dependencies
6. Preserve data fidelity in round-trip conversions

### Constraints
- WireViz is a Python CLI tool, not a JavaScript library
- WireViz generates static images (PNG/SVG), not interactive web UIs
- WireViz uses GPL-3.0 license
- HarnessFlow requires real-time collaborative editing
- Must support additional formats: KBL/VEC XML, Excel, ARXML

---

## Decision Drivers

### Technical Drivers
- **Interactivity:** Web UI must support drag-and-drop editing
- **Performance:** Client-side rendering preferred over server-side
- **Maintainability:** Minimize external dependencies
- **Extensibility:** Support multiple formats, not just WireViz

### Business Drivers
- **Migration Path:** Lower barrier for WireViz users to adopt HarnessFlow
- **Documentation Quality:** Leverage WireViz's proven PDF generation
- **Differentiation:** Offer capabilities beyond static diagrams
- **Ecosystem:** Integrate with existing automotive toolchains

---

## Considered Options

### Option 1: WireViz as Input/Output Format (Recommended)
**Approach:** Treat WireViz YAML as one of many supported import/export formats

**Implementation:**
```
┌─────────────────────────────────────────┐
│         HarnessFlow Platform            │
├─────────────────────────────────────────┤
│  Parsers:                               │
│  • WireViz YAML Parser                  │
│  • KBL/VEC XML Parser                   │
│  • Excel Parser                         │
│          ↓                               │
│  Internal Data Model                    │
│  (Connectors, Cables, Edges)           │
│          ↓                               │
│  React Flow Visualization               │
│          ↓                               │
│  Generators:                            │
│  • WireViz YAML Generator               │
│  • KBL/VEC XML Generator                │
│  • Excel Generator                      │
└─────────────────────────────────────────┘
```

**Pros:**
- ✅ Clean separation of concerns
- ✅ No coupling to WireViz's rendering engine
- ✅ Can import existing WireViz projects
- ✅ Can export for offline PDF generation
- ✅ Supports multiple formats equally
- ✅ Client-side only (no server dependency)
- ✅ Easier to test and maintain

**Cons:**
- ❌ Requires implementing parser and generator
- ❌ Potential data loss if formats differ
- ❌ Need to maintain mapping as WireViz evolves

**Estimated Effort:** 6-8 weeks (2 developers)

---

### Option 2: Embed WireViz Diagrams in Web UI
**Approach:** Generate WireViz diagrams server-side and display in web UI

**Implementation:**
```
User edits YAML → Server runs WireViz CLI → Returns PNG/SVG → Display in browser
```

**Pros:**
- ✅ Visually consistent with WireViz CLI output
- ✅ No need to reimplement rendering

**Cons:**
- ❌ Static images - no interactivity
- ❌ Requires server infrastructure
- ❌ Round-trip latency for every edit
- ❌ Can't leverage React Flow features
- ❌ Doesn't support other formats
- ❌ Tight coupling to WireViz CLI availability

**Decision:** ❌ **Rejected** - Conflicts with interactive editing requirement

---

### Option 3: Use WireViz YAML as Native Format
**Approach:** Store all harness data as WireViz YAML internally

**Implementation:**
```
User edits → Update WireViz YAML → Re-render diagram → Display
```

**Pros:**
- ✅ No conversion needed
- ✅ Perfect WireViz compatibility

**Cons:**
- ❌ Limited to WireViz's schema
- ❌ Can't represent HarnessFlow-specific features (ECU mapping, zones, etc.)
- ❌ Can't support other formats (KBL, ARXML)
- ❌ YAML editing for every UI change (inefficient)
- ❌ Tight coupling to WireViz schema

**Decision:** ❌ **Rejected** - Too limiting for multi-format platform

---

### Option 4: Fork WireViz for Web
**Approach:** Fork WireViz and modify for web use (rewrite in JavaScript)

**Implementation:**
```
Fork WireViz → Port to JavaScript → Integrate into React
```

**Pros:**
- ✅ Full control over features
- ✅ Can optimize for web

**Cons:**
- ❌ High maintenance burden (keep in sync with upstream)
- ❌ Large upfront effort (months of work)
- ❌ GPL license complications
- ❌ Diverges from community
- ❌ Must reimplement GraphViz layout

**Decision:** ❌ **Rejected** - Maintenance burden too high

---

### Option 5: Hybrid Approach (Selected)
**Approach:** Combine Option 1 with optional CLI integration

**Implementation:**
```
Phase 1: Parser (import WireViz YAML)
Phase 2: Generator (export WireViz YAML)
Phase 3: Optional CLI integration (server-side PDF generation)
```

**Detailed Architecture:**
```typescript
// Parser: WireViz YAML → HarnessFlow Model
interface WireVizParser {
  parse(yaml: string): HarnessFlowModel;
}

// Generator: HarnessFlow Model → WireViz YAML
interface WireVizGenerator {
  generate(model: HarnessFlowModel): string;
}

// Optional: CLI Service (server-side)
interface WireVizCLIService {
  generatePDF(yaml: string): Promise<Buffer>;
}
```

**Pros:**
- ✅ Best of both worlds: import/export + optional PDF generation
- ✅ Incremental implementation (can stop after Phase 1 or 2)
- ✅ Clean architecture
- ✅ No client-side dependencies
- ✅ Server-side CLI is optional (can run locally)

**Cons:**
- ❌ More complex than single approach
- ❌ Optional server component adds infrastructure

**Decision:** ✅ **Selected** - Provides maximum flexibility

---

## Decision

**We will implement Option 5: Hybrid Approach**

### Implementation Strategy

#### Phase 1: Parser (Input) - 4 weeks
- Implement WireViz YAML parser
- Convert to HarnessFlow internal data model
- Display in React Flow
- Enable file upload in UI

**Deliverable:** Users can import existing WireViz projects

#### Phase 2: Generator (Output) - 4 weeks
- Implement reverse conversion
- Export HarnessFlow data to WireViz YAML
- Validate round-trip conversion
- Add export button to UI

**Deliverable:** Users can export to WireViz format

#### Phase 3: CLI Integration (Optional) - 4 weeks
- Wrap WireViz CLI in Node.js service
- Deploy as serverless function
- Add "Download PDF" button
- Cache generated PDFs

**Deliverable:** One-click PDF generation

### Data Model Mapping

**Core Mappings:**
| WireViz | HarnessFlow | Notes |
|---------|-------------|-------|
| `connectors:` | `Node[]` with type='connector' | React Flow nodes |
| `cables:` | Edge metadata or separate nodes | Depends on complexity |
| `connections:` | `Edge[]` | React Flow edges |
| `pinlabels` | `node.data.pins[]` | Array of pin objects |
| `color` | `edge.data.wireColor` | CSS color codes |
| `gauge` | `edge.data.wireGauge` | AWG or mm² |

**Extended HarnessFlow Data:**
Store in YAML comments or custom fields:
```yaml
connectors:
  X1:
    type: Molex-22-01-3057
    # harnessflow:ecu: Engine_ECU
    # harnessflow:zone: Engine_Bay
    # harnessflow:position: {"x": 100, "y": 200}
```

---

## Consequences

### Positive Consequences

#### For Users
- ✅ **Easy migration** - Import existing WireViz projects
- ✅ **Best of both worlds** - Interactive editing + PDF docs
- ✅ **No lock-in** - Export back to WireViz anytime
- ✅ **Familiar format** - YAML files are version-control friendly

#### For Developers
- ✅ **Clean architecture** - Clear separation of concerns
- ✅ **Testable** - Parser and generator are pure functions
- ✅ **Extensible** - Easy to add more formats
- ✅ **Maintainable** - Minimal external dependencies

#### For Business
- ✅ **Lower adoption barrier** - WireViz users can try HarnessFlow
- ✅ **Ecosystem integration** - Play nice with existing tools
- ✅ **Differentiation** - Offer more than static diagrams

### Negative Consequences

#### Maintenance
- ❌ **Schema tracking** - Must monitor WireViz releases for changes
- ❌ **Data mapping** - Complex mappings may lose some nuance
- ❌ **Testing burden** - Need comprehensive round-trip tests

**Mitigation:**
- Pin WireViz version in Docker
- Extensive test suite with real-world examples
- Store original YAML as backup

#### Compatibility
- ❌ **Potential data loss** - HarnessFlow may have features WireViz doesn't support
- ❌ **Format limitations** - Some WireViz features may not map cleanly

**Mitigation:**
- Use YAML comments for extended metadata
- Provide validation warnings on export
- Document unsupported features clearly

#### Complexity
- ❌ **More code** - Parser + generator + CLI service
- ❌ **Infrastructure** - Optional server component

**Mitigation:**
- Make CLI service truly optional
- Comprehensive documentation
- Modular design for easier maintenance

---

## Validation

### Success Criteria

#### Functional
- [ ] Import all official WireViz examples without errors
- [ ] Round-trip conversion is lossless for core features
- [ ] Generated YAML files work with WireViz CLI
- [ ] PDF generation (if implemented) produces quality output

#### Non-Functional
- [ ] Import performance: <1s for typical file (<100 connectors)
- [ ] Export performance: <500ms for typical harness
- [ ] Test coverage: >80% for parser/generator
- [ ] Documentation: Complete user and developer guides

#### User Acceptance
- [ ] WireViz users can migrate projects successfully
- [ ] Users find export valuable for documentation
- [ ] No major data loss reported in round-trips

### Testing Strategy

#### Unit Tests
```typescript
describe('WireViz Parser', () => {
  it('parses valid connector definitions', () => {
    const yaml = `
      connectors:
        X1:
          type: Molex-22-01-3057
          pinlabels: [GND, VCC, SDA, SCL]
    `;
    const result = parseWireVizYAML(yaml);
    expect(result.connectors.X1.pinlabels).toHaveLength(4);
  });

  it('handles missing optional fields', () => {
    const yaml = `connectors:\n  X1:\n    pincount: 4`;
    expect(() => parseWireVizYAML(yaml)).not.toThrow();
  });
});
```

#### Integration Tests
```typescript
describe('Round-trip conversion', () => {
  it('preserves data through import-export cycle', () => {
    const originalYAML = readFile('examples/demo01.yml');
    const imported = parseWireVizYAML(originalYAML);
    const model = convertToHarnessModel(imported);
    const exported = generateWireVizYAML(model);
    const reimported = parseWireVizYAML(exported);

    expect(reimported).toEqual(imported);
  });
});
```

#### Acceptance Tests
- Import all WireViz examples from GitHub
- Run exported YAML through WireViz CLI
- Compare generated diagrams visually

---

## Alternatives for Specific Components

### Alternative Parser Libraries

#### Option A: js-yaml (Selected)
```typescript
import yaml from 'js-yaml';
const data = yaml.load(yamlString);
```
**Pros:** Industry standard, well-maintained
**Cons:** No built-in validation

#### Option B: yaml + Zod
```typescript
import { parse } from 'yaml';
import { z } from 'zod';

const WireVizSchema = z.object({...});
const data = WireVizSchema.parse(parse(yamlString));
```
**Pros:** Type-safe validation
**Cons:** More dependencies

**Decision:** ✅ Use js-yaml + Zod for validation

---

### Alternative Layout Algorithms

#### Option A: Simple Grid (Phase 1)
Position nodes in a grid layout

**Pros:** Simple, fast
**Cons:** Not optimal for complex harnesses

#### Option B: Dagre (Phase 2)
Use Dagre hierarchical layout

**Pros:** Better for complex graphs
**Cons:** Additional dependency

#### Option C: Manual (Always Available)
Let users position nodes manually

**Decision:** ✅ Start with simple grid, enhance later

---

## Related Decisions

### ADR-002: React Flow as Visualization Engine
This decision builds on the choice of React Flow for interactive visualization.

**Implication:** WireViz is used for import/export, not primary rendering.

### ADR-003: Multi-Format Support
HarnessFlow will support multiple formats beyond WireViz.

**Implication:** WireViz is one of many supported formats, not the core format.

---

## References

### WireViz Documentation
- GitHub: https://github.com/wireviz/WireViz
- Tutorial: https://github.com/wireviz/WireViz/blob/main/tutorial/tutorial.md
- Syntax: https://github.com/wireviz/WireViz/blob/main/docs/syntax.md
- Examples: https://github.com/wireviz/WireViz/tree/main/examples

### HarnessFlow Documentation
- System Architecture: `/SystemArchitecture.md`
- ECU Configuration: `/ECU_Configuration_System_Specification.md`
- Additional Spec: `/AdditionalSpec.md`

### Related Standards
- KBL: https://ecad-wiki.prostep.org/specifications/kbl/
- VEC: https://ecad-wiki.prostep.org/specifications/vec/

### Similar Projects
- **Fritzing:** Uses XML format for circuit diagrams
- **draw.io:** Supports multiple import/export formats
- **PlantUML:** Text-to-diagram with multiple backends

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-19 | 1.0 | Initial ADR | HarnessFlow Team |

---

## Approval

**Status:** Proposed → Awaiting Review

**Reviewers:**
- [ ] Technical Lead
- [ ] Product Manager
- [ ] Senior Engineer

**Next Steps:**
1. Review and approve this ADR
2. Create GitHub issues for implementation tasks
3. Begin Phase 1: Parser implementation

---

**Document Version:** 1.0
**Last Updated:** 2025-11-19
**Author:** HarnessFlow Architecture Team
**Status:** Proposed
