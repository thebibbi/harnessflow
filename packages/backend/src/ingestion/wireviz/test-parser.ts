/**
 * Quick test script for WireViz parser
 *
 * Run with: npx ts-node src/ingestion/wireviz/test-parser.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseWireVizYAML } from './parsers/wireviz.parser';
import { convertConnectors } from './converters/connector.converter';
import { convertWires } from './converters/wire.converter';

async function testWireVizParser() {
  console.log('🧪 Testing WireViz Parser\n');

  // Load example YAML
  const examplePath = path.join(__dirname, 'examples', 'simple-harness.yaml');
  const yamlContent = fs.readFileSync(examplePath, 'utf-8');

  console.log('📄 Loading YAML from:', examplePath);
  console.log('─'.repeat(50));

  // Step 1: Parse YAML
  console.log('\n1️⃣  Parsing YAML...');
  const parseResult = parseWireVizYAML(yamlContent);

  if (!parseResult.success || !parseResult.document) {
    console.error('❌ Parse failed:', parseResult.errors);
    process.exit(1);
  }

  console.log('✅ YAML parsed successfully');
  console.log('   - Connectors:', Object.keys(parseResult.document.connectors).length);
  console.log('   - Cables:', Object.keys(parseResult.document.cables).length);
  console.log('   - Connections:', parseResult.document.connections.length);

  // Step 2: Convert Connectors
  console.log('\n2️⃣  Converting connectors...');
  const connectors = convertConnectors(parseResult.document.connectors);

  console.log('✅ Converted connectors:');
  connectors.forEach((connector, name) => {
    console.log(`   - ${name}:`);
    console.log(`     Type: ${connector.type}`);
    console.log(`     Pins: ${connector.pinCount}`);
    console.log(`     Pin Labels: ${connector.pins.map((p) => p.label).join(', ')}`);
  });

  // Step 3: Convert Wires
  console.log('\n3️⃣  Converting wires...');
  const wires = convertWires(
    parseResult.document.cables,
    parseResult.document.connections,
    connectors
  );

  console.log('✅ Converted wires:');
  wires.forEach((wire) => {
    const physical = wire.physical as any;
    const color = physical.color;
    console.log(`   - ${wire.name}:`);
    console.log(`     From: ${wire.fromConnector}:${wire.fromPinNumber}`);
    console.log(`     To: ${wire.toConnector}:${wire.toPinNumber}`);
    console.log(`     Gauge: ${physical.gauge} ${physical.gauge_unit}`);
    console.log(`     Color: ${color.primary} (${color.primaryHex})`);
    if (wire.electrical && typeof wire.electrical === 'object' && 'resistance' in wire.electrical) {
      console.log(`     Resistance: ${(wire.electrical as any).resistance.toFixed(4)} Ω`);
    }
  });

  console.log('\n' + '─'.repeat(50));
  console.log('🎉 All tests passed!\n');
}

// Run the test
testWireVizParser().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
