# WireViz Integration Guide for HarnessFlow

## Overview

This guide documents the integration of WireViz into HarnessFlow, a modern web-based wiring harness design and documentation platform. WireViz is a powerful open-source tool for producing high-quality wiring harness documentation from simple YAML files.

## Integration Strategy: Hybrid Multi-Format Approach

After analyzing WireViz's capabilities and HarnessFlow's architecture, we recommend a **Hybrid Multi-Format** integration strategy:

### 1. As Input Parser (High Priority)
- **Accept WireViz YAML** as one of many supported input formats
- Parse existing WireViz `.yml` files and convert to HarnessFlow's internal data model
- Enable teams already using WireViz to migrate seamlessly to HarnessFlow
- Support alongside other formats: KBL/VEC XML, Excel templates, ARXML

### 2. As Output Generator (Medium Priority)
- **Export HarnessFlow data to WireViz YAML** format
- Enable generation of static documentation and PDF diagrams
- Leverage WireViz's mature GraphViz-based diagram generation
- Provide offline documentation capabilities

### 3. Not for Core Visualization (Architectural Decision)
- **Use React Flow for interactive web UI** instead of WireViz diagrams
- WireViz is CLI-focused and generates static images
- React Flow provides superior interactive, web-native visualization
- Keep WireViz for export/documentation, not primary UI

## Why This Approach?

### Advantages
✅ **Minimizes coupling** - WireViz is used as a translation layer, not core dependency
✅ **Leverages existing tools** - Teams can use WireViz CLI for PDF generation
✅ **Format flexibility** - One of many supported import/export formats
✅ **Migration path** - Easy onboarding for existing WireViz users
✅ **Best of both worlds** - Interactive web UI + static documentation

### Avoids Pitfalls
❌ **No tight coupling** - System doesn't depend on WireViz's rendering pipeline
❌ **No CLI dependency** - Web app works without GraphViz/WireViz installation
❌ **No static limitations** - Interactive features not constrained by static diagrams

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     HarnessFlow Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Input Parsers   │         │ Output Generators │          │
│  ├──────────────────┤         ├──────────────────┤          │
│  │ • WireViz YAML   │         │ • WireViz YAML   │          │
│  │ • KBL/VEC XML    │────────▶│ • KBL/VEC XML    │          │
│  │ • Excel          │         │ • PDF (via CLI)  │          │
│  │ • ARXML          │         │ • Excel          │          │
│  └──────────────────┘         └──────────────────┘          │
│           │                            ▲                      │
│           ▼                            │                      │
│  ┌───────────────────────────────────────────────┐          │
│  │     HarnessFlow Internal Data Model           │          │
│  │  (Connectors, Cables, Nodes, Connections)     │          │
│  └───────────────────────────────────────────────┘          │
│                       │                                       │
│                       ▼                                       │
│  ┌───────────────────────────────────────────────┐          │
│  │      React Flow Interactive Visualization      │          │
│  │    (Primary UI for editing and viewing)        │          │
│  └───────────────────────────────────────────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Components

### 1. WireViz Parser (`wireviz-parser.ts`)
Converts WireViz YAML → HarnessFlow internal model

**Key responsibilities:**
- Parse YAML structure (connectors, cables, connections)
- Map WireViz types to HarnessFlow node types
- Handle color codes, pin assignments, wire gauges
- Generate unique IDs for React Flow nodes
- Position nodes for initial layout

### 2. WireViz Generator (`wireviz-generator.ts`)
Converts HarnessFlow internal model → WireViz YAML

**Key responsibilities:**
- Serialize HarnessFlow data to WireViz YAML schema
- Map internal types back to WireViz format
- Generate valid `.yml` files for WireViz CLI
- Preserve metadata and styling information

### 3. Integration with React Flow
WireViz data flows into React Flow for interactive editing:

```typescript
// Example flow
const wireVizData = parseWireVizYAML(yamlString);
const reactFlowElements = convertToReactFlow(wireVizData);
// User edits in React Flow UI
const updatedData = getDataFromReactFlow();
const outputYAML = generateWireVizYAML(updatedData);
```

## Data Model Mapping

### WireViz → HarnessFlow

| WireViz Concept | HarnessFlow Equivalent | Notes |
|----------------|------------------------|-------|
| `connectors:` | `Connector` nodes | Map to React Flow nodes with type='connector' |
| `cables:` | `Cable` nodes | Can represent as nodes or metadata on edges |
| `connections:` | React Flow `Edge` | With wire/pin metadata |
| `pinlabels` | `PinLabel[]` | Stored in connector node data |
| `color` | `wireColor` | CSS color codes |
| `gauge` | `wireGauge` | AWG values |

### Example Mapping

**WireViz YAML:**
```yaml
connectors:
  X1:
    type: Molex-22-01-3057
    pinlabels: [GND, VCC, SDA, SCL]

cables:
  W1:
    gauge: 0.25 mm2
    length: 0.3
    color_code: IEC
    colors: [BK, RD, BU, YE]

connections:
  - [X1, 1, W1, 1]  # X1 pin 1 to W1 wire 1
```

**HarnessFlow Internal:**
```typescript
{
  nodes: [
    {
      id: 'connector-X1',
      type: 'connector',
      data: {
        label: 'X1',
        partNumber: 'Molex-22-01-3057',
        pins: [
          { id: 1, label: 'GND' },
          { id: 2, label: 'VCC' },
          { id: 3, label: 'SDA' },
          { id: 4, label: 'SCL' }
        ]
      }
    }
  ],
  edges: [
    {
      id: 'edge-1',
      source: 'connector-X1',
      target: 'connector-X2',
      data: {
        sourcePin: 1,
        targetPin: 1,
        wire: {
          gauge: '0.25 mm2',
          color: 'BK',
          cableId: 'W1'
        }
      }
    }
  ]
}
```

## File Structure

```
src/
├── parsers/
│   ├── wireviz/
│   │   ├── wireviz-parser.ts       # YAML → Internal model
│   │   ├── wireviz-schema.ts       # TypeScript types for WireViz
│   │   └── __tests__/
│   │       └── wireviz-parser.test.ts
│   └── index.ts
│
├── generators/
│   ├── wireviz/
│   │   ├── wireviz-generator.ts    # Internal model → YAML
│   │   └── __tests__/
│   │       └── wireviz-generator.test.ts
│   └── index.ts
│
├── services/
│   └── wireviz-cli-service.ts      # Optional: Invoke WireViz CLI for PDF
│
└── types/
    └── harness-model.ts            # Shared internal data model
```

## Example Use Cases

### Use Case 1: Import Existing WireViz Project
```typescript
import { parseWireVizYAML } from '@/parsers/wireviz';
import { loadIntoReactFlow } from '@/services/flow-service';

// User uploads .yml file
const yamlContent = await readFile('harness.yml');
const harnessData = parseWireVizYAML(yamlContent);
loadIntoReactFlow(harnessData);
// User can now edit interactively in web UI
```

### Use Case 2: Export to WireViz for Documentation
```typescript
import { generateWireVizYAML } from '@/generators/wireviz';
import { getCurrentHarnessData } from '@/services/flow-service';

// User clicks "Export to WireViz"
const harnessData = getCurrentHarnessData();
const yamlOutput = generateWireVizYAML(harnessData);

// User can then run WireViz CLI locally:
// $ wireviz harness.yml
// Generates: harness.png, harness.svg, harness.bom.tsv
```

### Use Case 3: Automated PDF Generation
```typescript
import { invokeWireVizCLI } from '@/services/wireviz-cli-service';

// Server-side service (optional)
const yamlPath = '/tmp/harness.yml';
await writeFile(yamlPath, yamlOutput);
const pdfPath = await invokeWireVizCLI(yamlPath);
// Return PDF to user for download
```

## Implementation Phases

### Phase 1: Parser (Input)
1. Implement WireViz YAML parser
2. Create TypeScript types for WireViz schema
3. Map to HarnessFlow internal model
4. Add unit tests with sample WireViz files
5. Integrate file upload UI

**Deliverable:** Users can import `.yml` files

### Phase 2: Generator (Output)
1. Implement reverse mapping (internal → WireViz)
2. Generate valid WireViz YAML
3. Add export button to UI
4. Test round-trip conversion (import → edit → export)

**Deliverable:** Users can export to `.yml` files

### Phase 3: CLI Integration (Optional)
1. Add WireViz CLI service (server-side)
2. Generate PDFs on-demand
3. Cache generated diagrams
4. Add "Download PDF" button to UI

**Deliverable:** Users can download PDF documentation

## Dependencies

### Required NPM Packages
```json
{
  "dependencies": {
    "js-yaml": "^4.1.0",          // YAML parsing
    "zod": "^3.22.0"               // Schema validation
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.5"
  }
}
```

### Optional System Dependencies (for CLI integration)
- WireViz (`pip install wireviz`)
- GraphViz (`apt-get install graphviz` or `brew install graphviz`)

**Note:** CLI integration is optional. Core parser/generator work without system dependencies.

## Testing Strategy

### Unit Tests
- Parse valid WireViz YAML samples
- Handle edge cases (missing fields, invalid types)
- Generate valid YAML output
- Round-trip testing (parse → generate → parse)

### Integration Tests
- Import WireViz file → display in React Flow
- Edit in React Flow → export to WireViz
- Verify generated YAML works with WireViz CLI

### Test Data
Use official WireViz examples from:
https://github.com/wireviz/WireViz/tree/main/examples

## Performance Considerations

### Parser Performance
- **Small files (<100 connectors):** Parse in <50ms
- **Large files (>1000 connectors):** Use streaming parser or Web Worker
- Cache parsed results in IndexedDB for repeat loads

### Generator Performance
- **Export optimization:** Generate YAML incrementally for large harnesses
- **Background generation:** Use Web Worker for large exports

## Security Considerations

### YAML Parsing
- Use safe YAML parser (no code execution)
- Validate schema with Zod before processing
- Sanitize user input in labels and descriptions

### File Upload
- Limit file size (e.g., 10MB max)
- Validate file extension (`.yml`, `.yaml`)
- Scan for malicious content

## Migration Guide for Existing WireViz Users

### Step 1: Export Your Current Project
If you have existing WireViz files, keep them! HarnessFlow can import them directly.

### Step 2: Import to HarnessFlow
1. Open HarnessFlow web app
2. Click "Import" → "WireViz YAML"
3. Upload your `.yml` file
4. Review imported harness in interactive editor

### Step 3: Edit Interactively
- Drag and drop to rearrange components
- Add/remove connectors and wires visually
- Real-time validation and error checking

### Step 4: Export Back to WireViz (Optional)
- Click "Export" → "WireViz YAML"
- Download `.yml` file
- Run `wireviz yourfile.yml` to generate PDFs as before

### Step 5: Leverage HarnessFlow Features
- Multi-format support (KBL, Excel, ARXML)
- Collaboration and version control
- Advanced validation rules
- BOM generation and cable calculations

## Comparison: WireViz vs HarnessFlow

| Feature | WireViz | HarnessFlow |
|---------|---------|-------------|
| **Input Method** | YAML files | Visual editor + multiple formats |
| **Visualization** | Static PNG/SVG | Interactive React Flow |
| **Editing** | Text editor | Drag-and-drop UI |
| **Collaboration** | Git + text files | Real-time web collaboration |
| **Output** | PNG, SVG, PDF, BOM | Same + KBL/VEC, Excel, ARXML |
| **Deployment** | CLI tool | Web application |
| **Learning Curve** | YAML syntax | Graphical interface |
| **Automation** | Scriptable | API + CLI |

**Recommendation:** Use both! WireViz for automation/scripting, HarnessFlow for design and collaboration.

## Common Issues and Solutions

### Issue 1: Color Code Mismatch
**Problem:** WireViz uses color codes like `IEC`, `DIN`, but HarnessFlow uses CSS colors.

**Solution:** Implement color mapping table:
```typescript
const IEC_COLORS = {
  'BK': '#000000',  // Black
  'RD': '#FF0000',  // Red
  'BU': '#0000FF',  // Blue
  // ... full mapping
};
```

### Issue 2: Missing Metadata
**Problem:** HarnessFlow has fields not present in WireViz (e.g., ECU assignments).

**Solution:** Store extended metadata in YAML comments or custom fields:
```yaml
connectors:
  X1:
    type: Molex-22-01-3057
    # harnessflow:ecu: Engine_ECU
    # harnessflow:zone: Engine_Bay
```

### Issue 3: Complex Cable Routing
**Problem:** WireViz doesn't explicitly model cable routing paths.

**Solution:** Use WireViz for logical connections, HarnessFlow's layout engine for physical routing.

## Best Practices

### 1. Keep WireViz Files Simple
- Use WireViz for **logical** harness definition
- Use HarnessFlow for **physical** layout and advanced features

### 2. Version Control Integration
- Store WireViz YAML in Git alongside HarnessFlow projects
- Use as "source of truth" for automated builds
- Enable CI/CD pipelines to generate PDFs

### 3. Naming Conventions
- Use consistent connector IDs (e.g., `X1`, `J1`, `P1`)
- Follow WireViz naming for compatibility
- Document custom extensions clearly

### 4. Documentation
- Generate PDFs from WireViz for manufacturing
- Use HarnessFlow's interactive viewer for design reviews
- Export to KBL/VEC for tool integration

## Future Enhancements

### Short-term (3-6 months)
- [ ] Implement bidirectional sync (live WireViz YAML editing)
- [ ] Add WireViz template library
- [ ] Batch import/export multiple files

### Medium-term (6-12 months)
- [ ] Real-time collaborative editing of WireViz projects
- [ ] WireViz CLI integration in cloud (serverless PDF generation)
- [ ] Advanced color code support (DIN, IEC, custom)

### Long-term (12+ months)
- [ ] WireViz extension format for HarnessFlow-specific metadata
- [ ] Contribute enhancements back to WireViz project
- [ ] Unified schema for harness interchange formats

## Resources

### WireViz Documentation
- Official Docs: https://github.com/wireviz/WireViz
- Tutorial: https://github.com/wireviz/WireViz/blob/main/tutorial/tutorial.md
- Examples: https://github.com/wireviz/WireViz/tree/main/examples

### HarnessFlow Resources
- Architecture: `/SystemArchitecture.md`
- ECU Config Spec: `/ECU_Configuration_System_Specification.md`
- Additional Spec: `/AdditionalSpec.md`

### Related Standards
- KBL (Kabelbaumliste): https://ecad-wiki.prostep.org/specifications/kbl/
- VEC (Vehicle Electric Container): https://ecad-wiki.prostep.org/specifications/vec/

## Support and Contribution

### Getting Help
- GitHub Issues: [harnessflow/issues](https://github.com/yourusername/harnessflow/issues)
- Documentation: `/docs/wireviz-integration/`
- Examples: `/examples/wireviz/`

### Contributing
We welcome contributions! Please see:
- WireViz parser improvements
- Additional format mappings
- Test cases with real-world examples
- Documentation enhancements

## License
This integration guide is part of HarnessFlow and follows the same license terms.
WireViz is licensed under GPL-3.0 - see https://github.com/wireviz/WireViz/blob/main/LICENSE

---

**Document Version:** 1.0
**Last Updated:** 2025-11-19
**Author:** HarnessFlow Team
**Status:** Ready for Implementation
