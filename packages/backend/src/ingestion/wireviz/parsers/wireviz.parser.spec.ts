/**
 * Unit tests for WireViz Parser
 */

import { parseWireVizYAML } from './wireviz.parser';

describe('WireViz Parser', () => {
  describe('parseWireVizYAML', () => {
    it('should parse a valid WireViz YAML with connectors and connections', () => {
      const yaml = `
connectors:
  X1:
    type: Molex-0430200400
    pincount: 4
    pinlabels: [GND, VCC, RX, TX]
  X2:
    type: TE-282080-1
    pincount: 2
    pinlabels: [SIG, GND]

connections:
  - [X1, 1, X2, 2, 0.5, black]
  - [X1, 3, X2, 1, 0.5, red]
      `.trim();

      const result = parseWireVizYAML(yaml);

      expect(result.success).toBe(true);
      expect(result.document).toBeDefined();
      expect(result.document?.connectors).toBeDefined();
      expect(result.document?.connections).toBeDefined();
      expect(Object.keys(result.document?.connectors || {})).toHaveLength(2);
      expect(result.document?.connections).toHaveLength(2);

      // Check connector X1
      expect(result.document?.connectors?.['X1']).toBeDefined();
      expect(result.document?.connectors?.['X1'].type).toBe('Molex-0430200400');
      expect(result.document?.connectors?.['X1'].pincount).toBe(4);
      expect(result.document?.connectors?.['X1'].pinlabels).toEqual(['GND', 'VCC', 'RX', 'TX']);

      // Check connection
      const conn1 = result.document?.connections?.[0];
      expect(conn1?.[0]).toBe('X1');
      expect(conn1?.[1]).toBe(1);
      expect(conn1?.[2]).toBe('X2');
      expect(conn1?.[3]).toBe(2);
    });

    it('should handle empty YAML gracefully', () => {
      const result = parseWireVizYAML('');
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject invalid YAML syntax', () => {
      const invalidYaml = 'connectors:\n  X1:\n    type: "unclosed string';
      const result = parseWireVizYAML(invalidYaml);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
