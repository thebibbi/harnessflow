# WireViz Integration - Examples and Use Cases

## Overview

This document provides practical examples and real-world use cases for WireViz integration in HarnessFlow. Each example includes sample YAML files, expected behavior, and implementation details.

---

## Table of Contents

1. [Basic Examples](#basic-examples)
2. [Real-World Use Cases](#real-world-use-cases)
3. [Data Mapping Examples](#data-mapping-examples)
4. [Advanced Scenarios](#advanced-scenarios)
5. [Troubleshooting Examples](#troubleshooting-examples)

---

## Basic Examples

### Example 1: Simple Two-Connector Harness

**Scenario:** Connect two automotive connectors with a simple cable

#### WireViz YAML Input
```yaml
# simple-harness.yml
connectors:
  X1:
    type: Molex-22-01-3042
    subtype: female
    pinlabels: [GND, +12V, Signal]

  X2:
    type: Molex-22-01-3042
    subtype: male
    pinlabels: [GND, +12V, Signal]

cables:
  W1:
    gauge: 0.5 mm2
    length: 1.5
    colors: [BK, RD, BU]

connections:
  - [X1, 1, W1, 1, X2, 1]  # GND (Black)
  - [X1, 2, W1, 2, X2, 2]  # +12V (Red)
  - [X1, 3, W1, 3, X2, 3]  # Signal (Blue)
```

#### Expected HarnessFlow Model
```typescript
{
  nodes: [
    {
      id: 'connector-X1',
      type: 'connector',
      position: { x: 100, y: 100 },
      data: {
        label: 'X1',
        partNumber: 'Molex-22-01-3042',
        subtype: 'female',
        pins: [
          { id: 1, label: 'GND' },
          { id: 2, label: '+12V' },
          { id: 3, label: 'Signal' }
        ]
      }
    },
    {
      id: 'connector-X2',
      type: 'connector',
      position: { x: 500, y: 100 },
      data: {
        label: 'X2',
        partNumber: 'Molex-22-01-3042',
        subtype: 'male',
        pins: [
          { id: 1, label: 'GND' },
          { id: 2, label: '+12V' },
          { id: 3, label: 'Signal' }
        ]
      }
    }
  ],
  edges: [
    {
      id: 'edge-X1-1-X2-1',
      source: 'connector-X1',
      target: 'connector-X2',
      sourceHandle: 'pin-1',
      targetHandle: 'pin-1',
      data: {
        wireColor: '#000000', // Black
        wireGauge: '0.5 mm2',
        cableId: 'W1',
        wireIndex: 1
      }
    },
    {
      id: 'edge-X1-2-X2-2',
      source: 'connector-X1',
      target: 'connector-X2',
      sourceHandle: 'pin-2',
      targetHandle: 'pin-2',
      data: {
        wireColor: '#FF0000', // Red
        wireGauge: '0.5 mm2',
        cableId: 'W1',
        wireIndex: 2
      }
    },
    {
      id: 'edge-X1-3-X2-3',
      source: 'connector-X1',
      target: 'connector-X2',
      sourceHandle: 'pin-3',
      targetHandle: 'pin-3',
      data: {
        wireColor: '#0000FF', // Blue
        wireGauge: '0.5 mm2',
        cableId: 'W1',
        wireIndex: 3
      }
    }
  ]
}
```

#### Parser Implementation
```typescript
export function parseSimpleHarness(yaml: string): HarnessFlowModel {
  const wireViz = parseWireVizYAML(yaml);

  // Convert connectors to nodes
  const nodes = Object.entries(wireViz.connectors || {}).map(
    ([id, connector], index) => ({
      id: `connector-${id}`,
      type: 'connector',
      position: { x: index * 400 + 100, y: 100 },
      data: {
        label: id,
        partNumber: connector.type,
        subtype: connector.subtype,
        pins: connector.pinlabels.map((label, i) => ({
          id: i + 1,
          label
        }))
      }
    })
  );

  // Convert connections to edges
  const edges = wireViz.connections.map((conn, index) => {
    const [sourceId, sourcePin, cableId, wireIdx, targetId, targetPin] = conn;
    const cable = wireViz.cables[cableId];

    return {
      id: `edge-${sourceId}-${sourcePin}-${targetId}-${targetPin}`,
      source: `connector-${sourceId}`,
      target: `connector-${targetId}`,
      sourceHandle: `pin-${sourcePin}`,
      targetHandle: `pin-${targetPin}`,
      data: {
        wireColor: convertColor(cable.colors[wireIdx - 1]),
        wireGauge: cable.gauge,
        cableId,
        wireIndex: wireIdx
      }
    };
  });

  return { nodes, edges };
}
```

---

### Example 2: Multi-Cable Harness

**Scenario:** Harness with multiple cables connecting different components

#### WireViz YAML
```yaml
# multi-cable-harness.yml
connectors:
  ECU:
    type: TE-Connectivity-1-1718806-1
    pinlabels: [GND, +12V, CAN_H, CAN_L, Sensor_In]

  Sensor:
    type: Molex-43650-0200
    pinlabels: [GND, Sensor_Out]

  CAN_Bus:
    type: TE-1-967616-1
    pinlabels: [CAN_H, CAN_L]

cables:
  Power_Cable:
    gauge: 1.0 mm2
    length: 2.0
    colors: [BK, RD]

  Sensor_Cable:
    gauge: 0.35 mm2
    length: 1.5
    colors: [BK, YE]
    shield: true

  CAN_Cable:
    gauge: 0.5 mm2
    length: 3.0
    colors: [WH, GN]
    shield: true

connections:
  # Power connections
  - [ECU, 1, Power_Cable, 1, Sensor, 1]      # GND
  - [ECU, 2, Power_Cable, 2]                  # +12V (not connected to sensor)

  # Sensor signal
  - [Sensor, 2, Sensor_Cable, 2, ECU, 5]     # Sensor output
  - [Sensor, 1, Sensor_Cable, 1, ECU, 1]     # Sensor GND (shared)

  # CAN bus
  - [ECU, 3, CAN_Cable, 1, CAN_Bus, 1]       # CAN_H
  - [ECU, 4, CAN_Cable, 2, CAN_Bus, 2]       # CAN_L
```

#### Key Features
- Multiple cables with different specifications
- Shielded cables for CAN and sensor
- Shared ground connections
- Some pins not fully connected (e.g., +12V)

---

### Example 3: Color Code Mapping

**Scenario:** Convert between WireViz color codes and CSS colors

#### Color Code Tables

**IEC (International) Colors:**
```typescript
const IEC_COLOR_MAP: Record<string, string> = {
  'BK': '#000000',  // Black
  'BN': '#8B4513',  // Brown
  'RD': '#FF0000',  // Red
  'OG': '#FFA500',  // Orange
  'YE': '#FFFF00',  // Yellow
  'GN': '#00FF00',  // Green
  'BU': '#0000FF',  // Blue
  'VT': '#EE82EE',  // Violet
  'GY': '#808080',  // Grey
  'WH': '#FFFFFF',  // White
  'PK': '#FFC0CB',  // Pink
  'TQ': '#40E0D0',  // Turquoise
};
```

**DIN (German) Colors:**
```typescript
const DIN_COLOR_MAP: Record<string, string> = {
  'WS': '#FFFFFF',  // Weiss (White)
  'BR': '#8B4513',  // Braun (Brown)
  'GN': '#00FF00',  // Grün (Green)
  'GE': '#FFFF00',  // Gelb (Yellow)
  'GR': '#808080',  // Grau (Grey)
  'RS': '#FFC0CB',  // Rosa (Pink)
  'BL': '#0000FF',  // Blau (Blue)
  'RT': '#FF0000',  // Rot (Red)
  'SW': '#000000',  // Schwarz (Black)
  'VI': '#EE82EE',  // Violett (Violet)
};
```

#### Implementation
```typescript
export function convertWireVizColor(
  color: string,
  colorCode: 'IEC' | 'DIN' = 'IEC'
): string {
  const colorMap = colorCode === 'IEC' ? IEC_COLOR_MAP : DIN_COLOR_MAP;
  return colorMap[color.toUpperCase()] || '#808080'; // Default to grey
}
```

---

## Real-World Use Cases

### Use Case 1: Automotive Engine Harness Migration

**Context:** Team has 50+ existing WireViz harnesses for engine management systems

#### Workflow

**Step 1: Bulk Import**
```typescript
import { glob } from 'glob';
import { parseWireVizYAML } from '@/parsers/wireviz';

async function migrateAllHarnesses() {
  const yamlFiles = await glob('legacy-harnesses/**/*.yml');

  for (const file of yamlFiles) {
    try {
      const content = await readFile(file, 'utf-8');
      const harnessModel = parseWireVizYAML(content);

      // Save to HarnessFlow database
      await saveHarness({
        name: path.basename(file, '.yml'),
        source: 'wireviz_migration',
        data: harnessModel,
        originalYaml: content // Keep for reference
      });

      console.log(`✓ Migrated: ${file}`);
    } catch (error) {
      console.error(`✗ Failed: ${file}`, error);
    }
  }
}
```

**Step 2: Interactive Editing**
- Engineers open harnesses in HarnessFlow web UI
- Drag-and-drop to reorganize components
- Add ECU assignments and zone information
- Validate against design rules

**Step 3: Export for Manufacturing**
```typescript
async function exportForManufacturing(harnessId: string) {
  const harness = await loadHarness(harnessId);

  // Export to multiple formats
  const wireVizYaml = generateWireVizYAML(harness);
  const kblXml = generateKBL(harness);
  const bomExcel = generateBOM(harness);

  // Generate PDF using WireViz CLI
  const pdfPath = await invokeWireVizCLI(wireVizYaml);

  // Package all outputs
  return {
    yaml: wireVizYaml,
    kbl: kblXml,
    bom: bomExcel,
    pdf: pdfPath
  };
}
```

**Benefits:**
- ✅ Preserved existing work (50+ harnesses)
- ✅ Improved with interactive editing
- ✅ Still outputs to WireViz for PDFs
- ✅ Added KBL export for CAD integration

---

### Use Case 2: Collaborative Harness Design

**Context:** Distributed team designing new vehicle harnesses

#### Workflow

**Designer 1: Initial Design in WireViz**
```yaml
# preliminary-design.yml
connectors:
  Main_ECU:
    type: Bosch-1234567
    pinlabels: [GND, +12V, CAN_H, CAN_L]

cables:
  Main_Power:
    gauge: 2.5 mm2
    length: 5.0
    colors: [BK, RD]
```

**Designer 2: Import and Enhance in HarnessFlow**
- Import YAML into HarnessFlow
- Add detailed ECU mappings
- Assign wires to zones (engine bay, cabin, etc.)
- Add splice locations
- Validate against company design rules

**Designer 3: Review and Approve**
- Open in web browser (no software install needed)
- Review changes highlighted by version control
- Add comments on specific connections
- Approve for manufacturing

**Manufacturing Team: Export Final Docs**
- Export to WireViz YAML for PDF generation
- Export to KBL for CAD integration
- Export to Excel for BOM
- All formats generated from single source of truth

**Benefits:**
- ✅ No single tool lock-in
- ✅ Web-based collaboration
- ✅ Version control friendly (YAML files)
- ✅ Multiple output formats

---

### Use Case 3: Harness Variant Management

**Context:** Automotive OEM with multiple vehicle configurations

#### Base Harness (WireViz)
```yaml
# base-harness.yml
connectors:
  ECU:
    type: Main-ECU
    pinlabels: [GND, +12V, Option_1, Option_2]

  Base_Sensor:
    type: Standard-Sensor
    pinlabels: [GND, Signal]

cables:
  Base_Cable:
    gauge: 0.5 mm2
    colors: [BK, RD, BU]

connections:
  - [ECU, 1, Base_Cable, 1, Base_Sensor, 1]  # GND
  - [ECU, 2, Base_Cable, 2]                   # +12V
```

#### Variant: Premium Package
Import base harness, then in HarnessFlow:
- Add premium sensor connector
- Add connection to `Option_1` pin
- Assign to "Premium_Variant" configuration
- Export as `premium-harness.yml`

#### Variant: Sport Package
Import base harness, then in HarnessFlow:
- Add sport sensor connector
- Add connection to `Option_2` pin
- Assign to "Sport_Variant" configuration
- Export as `sport-harness.yml`

**Benefits:**
- ✅ Manage variants visually
- ✅ See differences side-by-side
- ✅ Export each variant to WireViz
- ✅ Generate variant-specific BOMs

---

## Data Mapping Examples

### Example 4: Complex Pin Mappings

**Scenario:** Connector with non-sequential pin numbering

#### WireViz YAML
```yaml
connectors:
  Complex_Connector:
    type: Deutsch-DT04-12P
    pincount: 12
    pins: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    pinlabels:
      1: GND
      2: +12V
      3: CAN_H
      4: CAN_L
      5: NC  # Not connected
      6: Signal_A
      7: Signal_B
      8: NC
      9: Shield
      10: Sensor_1
      11: Sensor_2
      12: NC
```

#### HarnessFlow Mapping
```typescript
{
  id: 'connector-Complex_Connector',
  type: 'connector',
  data: {
    label: 'Complex_Connector',
    partNumber: 'Deutsch-DT04-12P',
    pins: [
      { id: 1, label: 'GND', status: 'connected' },
      { id: 2, label: '+12V', status: 'connected' },
      { id: 3, label: 'CAN_H', status: 'connected' },
      { id: 4, label: 'CAN_L', status: 'connected' },
      { id: 5, label: 'NC', status: 'not_connected' },
      { id: 6, label: 'Signal_A', status: 'connected' },
      { id: 7, label: 'Signal_B', status: 'connected' },
      { id: 8, label: 'NC', status: 'not_connected' },
      { id: 9, label: 'Shield', status: 'connected' },
      { id: 10, label: 'Sensor_1', status: 'connected' },
      { id: 11, label: 'Sensor_2', status: 'connected' },
      { id: 12, label: 'NC', status: 'not_connected' }
    ]
  }
}
```

---

### Example 5: Shielded Cable Representation

**Scenario:** Twisted-pair shielded cable for CAN bus

#### WireViz YAML
```yaml
cables:
  CAN_Cable:
    type: Twisted-Pair-Shielded
    gauge: 0.34 mm2
    length: 3.0
    colors: [WH, GN]
    shield: true
    wirecount: 2
```

#### HarnessFlow Representation

**Option A: Edge Metadata**
```typescript
{
  id: 'edge-can-connection',
  source: 'connector-ECU',
  target: 'connector-CAN_Bus',
  data: {
    cable: {
      id: 'CAN_Cable',
      type: 'Twisted-Pair-Shielded',
      gauge: '0.34 mm2',
      shield: true,
      shieldConnection: 'connector-ECU-pin-9' // Shield drain
    },
    wires: [
      { index: 1, color: '#FFFFFF', signal: 'CAN_H' },
      { index: 2, color: '#00FF00', signal: 'CAN_L' }
    ]
  }
}
```

**Option B: Cable as Node**
```typescript
{
  nodes: [
    // ... connectors ...
    {
      id: 'cable-CAN_Cable',
      type: 'cable',
      position: { x: 300, y: 100 },
      data: {
        label: 'CAN_Cable',
        type: 'Twisted-Pair-Shielded',
        gauge: '0.34 mm2',
        length: 3.0,
        shield: true,
        wires: [
          { id: 1, color: '#FFFFFF', label: 'CAN_H' },
          { id: 2, color: '#00FF00', label: 'CAN_L' }
        ]
      }
    }
  ],
  edges: [
    // ECU to Cable
    { source: 'connector-ECU', target: 'cable-CAN_Cable', ... },
    // Cable to Bus
    { source: 'cable-CAN_Cable', target: 'connector-CAN_Bus', ... }
  ]
}
```

**Decision:** Use Option A for simple cases, Option B for complex multi-drop cables

---

## Advanced Scenarios

### Example 6: Splice Representation

**Scenario:** Multiple wires joining at a splice point

#### WireViz YAML
```yaml
connectors:
  ECU:
    pinlabels: [GND]
  Sensor_1:
    pinlabels: [GND]
  Sensor_2:
    pinlabels: [GND]
  Splice_S1:
    type: Splice
    pincount: 3

cables:
  W1:
    colors: [BK]
  W2:
    colors: [BK]
  W3:
    colors: [BK]

connections:
  - [ECU, 1, W1, 1, Splice_S1, 1]
  - [Splice_S1, 2, W2, 1, Sensor_1, 1]
  - [Splice_S1, 3, W3, 1, Sensor_2, 1]
```

#### HarnessFlow Representation
```typescript
{
  nodes: [
    { id: 'connector-ECU', type: 'connector', ... },
    { id: 'connector-Sensor_1', type: 'connector', ... },
    { id: 'connector-Sensor_2', type: 'connector', ... },
    {
      id: 'splice-S1',
      type: 'splice',
      position: { x: 300, y: 200 },
      data: {
        label: 'S1',
        wireGauge: '0.5 mm2',
        spliceType: 'crimp'
      }
    }
  ],
  edges: [
    { source: 'connector-ECU', target: 'splice-S1', ... },
    { source: 'splice-S1', target: 'connector-Sensor_1', ... },
    { source: 'splice-S1', target: 'connector-Sensor_2', ... }
  ]
}
```

---

### Example 7: Multi-Sheet Harness

**Scenario:** Large harness split across multiple YAML files

#### Main Harness
```yaml
# main-harness.yml
templates:
  - !include sub-harnesses/engine-sensors.yml
  - !include sub-harnesses/body-control.yml

connectors:
  Main_ECU:
    type: Central-ECU
    pinlabels: [GND, +12V, CAN_H, CAN_L, ...]
```

#### Sub-Harness
```yaml
# sub-harnesses/engine-sensors.yml
connectors:
  Coolant_Sensor:
    type: Temp-Sensor
    pinlabels: [GND, Signal]

  Oil_Pressure:
    type: Pressure-Sensor
    pinlabels: [GND, Signal]
```

#### HarnessFlow Import Strategy
```typescript
async function importMultiSheetHarness(mainFile: string) {
  // Parse main file
  const mainYaml = await readFile(mainFile, 'utf-8');
  const mainData = parseWireVizYAML(mainYaml);

  // Find included files
  const includes = extractIncludes(mainYaml);

  // Parse sub-files
  const subHarnesses = await Promise.all(
    includes.map(async (file) => {
      const yaml = await readFile(file, 'utf-8');
      return parseWireVizYAML(yaml);
    })
  );

  // Merge all data
  const merged = mergeWireVizDocuments([mainData, ...subHarnesses]);

  return convertToHarnessModel(merged);
}
```

---

## Troubleshooting Examples

### Issue 1: Color Code Not Recognized

**Problem:**
```yaml
cables:
  W1:
    colors: [CUSTOM_BLUE]  # Not in standard color map
```

**Solution 1: Custom Color Mapping**
```typescript
const CUSTOM_COLORS: Record<string, string> = {
  'CUSTOM_BLUE': '#1E90FF',
  'CUSTOM_RED': '#DC143C',
  // ... company-specific colors
};

export function convertColor(wireVizColor: string): string {
  return CUSTOM_COLORS[wireVizColor]
    || IEC_COLOR_MAP[wireVizColor]
    || '#808080'; // Default grey
}
```

**Solution 2: RGB in Comments**
```yaml
cables:
  W1:
    colors: [CUSTOM_BLUE]  # rgb(30, 144, 255)
```

---

### Issue 2: Missing Connector Type

**Problem:**
```yaml
connectors:
  X1:
    # No 'type' specified
    pinlabels: [A, B, C]
```

**Solution: Fallback to Generic**
```typescript
export function parseConnector(id: string, connector: WireVizConnector): Node {
  return {
    id: `connector-${id}`,
    type: 'connector',
    data: {
      label: id,
      partNumber: connector.type || 'GENERIC_CONNECTOR',
      pins: (connector.pinlabels || []).map((label, i) => ({
        id: i + 1,
        label
      }))
    }
  };
}
```

---

### Issue 3: Invalid Connection Reference

**Problem:**
```yaml
connections:
  - [X1, 1, W1, 1, X999, 1]  # X999 doesn't exist!
```

**Solution: Validation**
```typescript
export function validateConnections(doc: WireVizDocument): ValidationError[] {
  const errors: ValidationError[] = [];
  const connectorIds = new Set(Object.keys(doc.connectors || {}));

  for (const conn of doc.connections || []) {
    const [sourceId, , , , targetId] = conn;

    if (!connectorIds.has(sourceId)) {
      errors.push({
        type: 'invalid_connector_reference',
        message: `Connector '${sourceId}' referenced but not defined`,
        connection: conn
      });
    }

    if (!connectorIds.has(targetId)) {
      errors.push({
        type: 'invalid_connector_reference',
        message: `Connector '${targetId}' referenced but not defined`,
        connection: conn
      });
    }
  }

  return errors;
}
```

---

## Testing Examples

### Unit Test: Parser
```typescript
import { parseWireVizYAML } from '@/parsers/wireviz';

describe('WireViz Parser', () => {
  it('parses simple two-connector harness', () => {
    const yaml = `
      connectors:
        X1:
          pinlabels: [A, B]
        X2:
          pinlabels: [A, B]
      cables:
        W1:
          colors: [RD, BK]
      connections:
        - [X1, 1, W1, 1, X2, 1]
        - [X1, 2, W1, 2, X2, 2]
    `;

    const result = parseWireVizYAML(yaml);

    expect(result.connectors).toHaveProperty('X1');
    expect(result.connectors).toHaveProperty('X2');
    expect(result.connections).toHaveLength(2);
  });

  it('handles missing optional fields gracefully', () => {
    const yaml = `
      connectors:
        X1:
          pincount: 4
    `;

    const result = parseWireVizYAML(yaml);
    expect(result.connectors.X1.pinlabels).toBeUndefined();
  });
});
```

### Integration Test: Round-Trip
```typescript
describe('Round-trip conversion', () => {
  it('preserves data through parse-generate cycle', async () => {
    // Load official WireViz example
    const originalYaml = await readFile(
      'node_modules/wireviz/examples/demo01.yml',
      'utf-8'
    );

    // Parse
    const wireVizData = parseWireVizYAML(originalYaml);
    const harnessModel = convertToHarnessModel(wireVizData);

    // Generate
    const exportedYaml = generateWireVizYAML(harnessModel);

    // Re-parse
    const reimported = parseWireVizYAML(exportedYaml);

    // Compare
    expect(reimported).toEqual(wireVizData);
  });
});
```

---

## Performance Examples

### Benchmark: Large Harness Import
```typescript
import { performance } from 'perf_hooks';

async function benchmarkImport() {
  const sizes = [10, 50, 100, 500, 1000];

  for (const size of sizes) {
    const yaml = generateTestHarness(size); // Helper to generate test data

    const start = performance.now();
    parseWireVizYAML(yaml);
    const end = performance.now();

    console.log(`${size} connectors: ${(end - start).toFixed(2)}ms`);
  }
}

// Expected results:
// 10 connectors: ~5ms
// 50 connectors: ~20ms
// 100 connectors: ~40ms
// 500 connectors: ~180ms
// 1000 connectors: ~350ms
```

---

## Summary

This document provides:
- ✅ **Basic Examples:** Simple harnesses to get started
- ✅ **Real-World Use Cases:** Practical scenarios from industry
- ✅ **Data Mapping:** How WireViz concepts map to HarnessFlow
- ✅ **Advanced Scenarios:** Complex features like splices and multi-sheet
- ✅ **Troubleshooting:** Common issues and solutions

**Next Steps:**
1. Review examples relevant to your use case
2. Try importing sample WireViz files
3. Experiment with export and round-trip conversion
4. Report any issues or edge cases not covered here

---

**Document Version:** 1.0
**Last Updated:** 2025-11-19
**Author:** HarnessFlow Team
**Status:** Ready for Use
