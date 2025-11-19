# HarnessFlow Unified Data Model Specification

**Version:** 1.0
**Date:** 2025-11-19
**Status:** Authoritative

---

## Executive Summary

This document defines the **single source of truth** for HarnessFlow's data model. All input formats (KBL/VEC, WireViz, Excel, PDF) must convert to this internal representation. All database schemas, API contracts, and UI components must conform to these types.

---

## Design Principles

1. **Format-Agnostic:** Internal model is independent of input/output formats
2. **Type-Safe:** Strongly typed with validation at boundaries
3. **Audit-Ready:** All entities track creation/modification for ISO 26262 compliance
4. **Graph-Friendly:** Designed for both relational and graph representations
5. **Extensible:** Can accommodate new fields without breaking existing data

---

## Core Entity Model

### Project & Metadata

```typescript
interface Project {
  id: string;                    // UUID
  name: string;                  // "2025 Sedan Body Harness"
  description?: string;
  vehicle: VehicleInfo;
  variants: Variant[];           // Different vehicle configurations
  metadata: ProjectMetadata;
  created: AuditInfo;
  modified: AuditInfo;
}

interface VehicleInfo {
  manufacturer: string;          // "Toyota", "GM", etc.
  model: string;                 // "Camry", "Silverado"
  year: number;
  platform: string;              // "TNGA-K", "T1XX"
  region: string[];              // ["North America", "Europe"]
}

interface Variant {
  id: string;
  code: string;                  // "US-LX-AWD"
  name: string;                  // "US Luxury AWD"
  features: string[];            // Feature IDs included in this variant
}

interface ProjectMetadata {
  version: string;               // "1.2.3"
  status: 'draft' | 'review' | 'approved' | 'production';
  asil_rating: 'QM' | 'ASIL-A' | 'ASIL-B' | 'ASIL-C' | 'ASIL-D';
  compliance_standards: string[]; // ["ISO 26262", "CISPR 25"]
  tags: string[];
}

interface AuditInfo {
  at: Date;
  by: string;                    // User ID
  reason?: string;               // For modification tracking
}
```

---

### ECU (Electronic Control Unit)

```typescript
interface ECU {
  id: string;                    // UUID
  part_number: string;           // "BCM-2024-V3"
  name: string;                  // "Body Control Module"
  manufacturer: string;          // "Bosch", "Continental"
  supplier_code?: string;

  // Physical properties
  physical: PhysicalProperties;

  // Electrical properties
  electrical: ElectricalProperties;

  // Communication capabilities
  networks: NetworkConnection[];

  // Pins/connectors
  connectors: Connector[];

  // Software/firmware
  software?: SoftwareInfo;

  // Cost and procurement
  procurement: ProcurementInfo;

  // Safety classification
  safety: SafetyInfo;

  // Metadata
  metadata: ECUMetadata;
  created: AuditInfo;
  modified: AuditInfo;
}

interface PhysicalProperties {
  dimensions: {
    length_mm: number;
    width_mm: number;
    height_mm: number;
  };
  weight_g: number;
  mounting_type: string;         // "bracket", "panel", "din_rail"
  operating_temp: {
    min_celsius: number;
    max_celsius: number;
  };
  ip_rating?: string;            // "IP67", "IP6K9K"
}

interface ElectricalProperties {
  voltage_range: {
    nominal_v: number;           // 12.0 or 24.0
    min_v: number;               // 9.0
    max_v: number;               // 16.0
  };
  power_consumption: {
    typical_w: number;
    max_w: number;
    sleep_ma: number;
  };
  ground_type: 'chassis' | 'signal' | 'both';
}

interface NetworkConnection {
  network_id: string;            // References Network
  protocol: 'CAN' | 'LIN' | 'FlexRay' | 'Ethernet' | 'MOST';
  role: 'master' | 'slave' | 'peer';
  connector_pin?: string;        // Which pin(s) used for this network
  capabilities: NetworkCapabilities;
}

interface NetworkCapabilities {
  baudrate_options: number[];    // [125000, 250000, 500000]
  can_fd?: boolean;
  can_wakeup?: boolean;
  termination_required?: boolean;
}

interface SoftwareInfo {
  version: string;
  bootloader_updatable: boolean;
  diagnostic_protocols: string[]; // ["UDS", "KWP2000"]
  features: string[];            // Software feature codes
}

interface ProcurementInfo {
  unit_cost_usd: number;
  lead_time_weeks: number;
  minimum_order_quantity: number;
  lifecycle_status: 'active' | 'nrnd' | 'obsolete';
  alternative_parts?: string[];  // Alternative ECU part numbers
}

interface SafetyInfo {
  asil_rating: 'QM' | 'ASIL-A' | 'ASIL-B' | 'ASIL-C' | 'ASIL-D';
  safety_relevant: boolean;
  redundancy_required: boolean;
  certification: {
    iso26262?: string;           // Certificate number
    aec_q100?: boolean;
  };
}

interface ECUMetadata {
  datasheet_url?: string;
  datasheet_version?: string;
  notes?: string;
  custom_fields?: Record<string, unknown>;
}
```

---

### Connector

```typescript
interface Connector {
  id: string;                    // UUID
  ecu_id?: string;               // Parent ECU (if attached to ECU)
  name: string;                  // "X1", "J1", "C3"
  manufacturer: string;          // "TE Connectivity", "Molex"
  part_number: string;           // "1-1718806-1"

  // Type and configuration
  type: ConnectorType;
  gender: 'male' | 'female' | 'hermaphrodite';
  pin_count: number;

  // Physical properties
  physical: ConnectorPhysical;

  // Pins
  pins: Pin[];

  // Metadata
  metadata: ConnectorMetadata;
  created: AuditInfo;
  modified: AuditInfo;
}

type ConnectorType =
  | 'automotive_sealed'
  | 'deutsch'
  | 'molex'
  | 'te_amp'
  | 'jst'
  | 'din'
  | 'terminal_block'
  | 'custom';

interface ConnectorPhysical {
  ip_rating?: string;            // "IP67", "IP6K9K"
  color?: string;
  orientation?: string;          // "vertical", "horizontal", "right_angle"
  locking_type?: string;         // "CPA", "TPA", "secondary_lock"
  keying?: string;               // Mechanical keying code
}

interface ConnectorMetadata {
  datasheet_url?: string;
  mounting_location?: string;    // "engine_bay", "cabin", "trunk"
  zone?: string;                 // Harness zone
  notes?: string;
}
```

---

### Pin (Cavity)

```typescript
interface Pin {
  id: string;                    // UUID
  connector_id: string;          // Parent connector
  pin_number: string;            // "1", "A", "P47"
  label?: string;                // "GND", "VCC", "CAN_H"

  // Electrical capabilities
  capabilities: PinCapabilities;

  // Current assignment
  assignment?: PinAssignment;

  // Physical properties
  physical: PinPhysical;

  // Metadata
  metadata: PinMetadata;
  created: AuditInfo;
  modified: AuditInfo;
}

interface PinCapabilities {
  // I/O type
  io_type: PinIOType;

  // Electrical limits
  voltage_range?: {
    min_v: number;
    max_v: number;
  };
  current_limit: {
    continuous_a: number;
    peak_a?: number;
  };

  // Signal types supported
  signal_types: SignalType[];

  // Special features
  features: PinFeatures;
}

type PinIOType =
  | 'power_supply'               // +12V, +5V, etc.
  | 'ground'                     // GND
  | 'digital_input'              // High/Low sensing
  | 'digital_output'             // High/Low driving
  | 'analog_input'               // ADC input
  | 'analog_output'              // DAC output
  | 'pwm_output'                 // Pulse-width modulation
  | 'high_side_driver'           // Switched +12V
  | 'low_side_driver'            // Switched GND
  | 'push_pull'                  // Bidirectional
  | 'open_drain'                 // Open collector/drain
  | 'differential_pair'          // CAN+/-, etc.
  | 'communication';             // CAN, LIN, FlexRay, etc.

type SignalType =
  | 'digital'
  | 'analog'
  | 'pwm'
  | 'can'
  | 'lin'
  | 'flexray'
  | 'ethernet'
  | 'sent'
  | 'i2c'
  | 'spi';

interface PinFeatures {
  pull_up?: boolean;
  pull_down?: boolean;
  pull_resistance?: number;      // ohms
  esd_protection?: string;       // "8kV contact, 15kV air"
  overvoltage_protection?: boolean;
  short_circuit_protection?: boolean;
  diagnostic_capable?: boolean;
  wake_capable?: boolean;
}

interface PinAssignment {
  feature_id?: string;           // Which feature uses this pin
  signal_name?: string;          // Logical signal name
  function: string;              // "Rear_Fog_Lamp_Control"
  assigned_at: Date;
  assigned_by: string;           // User ID
  variant_specific?: string[];   // Only used in certain variants
}

interface PinPhysical {
  terminal_type?: string;        // "crimp", "solder", "screw"
  wire_gauge_range?: {
    min_awg: number;
    max_awg: number;
  };
  contact_material?: string;     // "tin_plated_copper", "gold"
}

interface PinMetadata {
  notes?: string;
  test_points?: string[];        // Associated test point IDs
  service_manual_ref?: string;
}
```

---

### Wire

```typescript
interface Wire {
  id: string;                    // UUID
  name?: string;                 // "W1", "Rear_Fog_Power"

  // Endpoints
  from: WireEndpoint;
  to: WireEndpoint;

  // Intermediate points (splices, inline connectors)
  via: WireViaPoint[];

  // Physical properties
  physical: WirePhysical;

  // Electrical properties
  electrical: WireElectrical;

  // Routing
  routing: WireRouting;

  // Metadata
  metadata: WireMetadata;
  created: AuditInfo;
  modified: AuditInfo;
}

interface WireEndpoint {
  type: 'pin' | 'splice' | 'component' | 'termination';
  id: string;                    // Pin ID, Splice ID, etc.
  pin_number?: string;           // For connector pins
}

interface WireViaPoint {
  type: 'splice' | 'inline_connector' | 'grommet' | 'clip';
  id: string;
  sequence: number;              // Order along wire path
}

interface WirePhysical {
  gauge: WireGauge;
  length_mm: number;
  color: WireColor;
  material: 'copper' | 'aluminum' | 'tinned_copper';
  insulation: {
    type: string;                // "PVC", "XLPE", "Teflon"
    thickness_mm: number;
    temperature_rating_c: number;
  };
  shielding?: {
    type: 'braided' | 'foil' | 'spiral';
    coverage_percent: number;
    drain_wire: boolean;
  };
}

type WireGauge =
  | { type: 'awg'; value: number }           // American Wire Gauge
  | { type: 'mm2'; value: number }           // Cross-sectional area
  | { type: 'swg'; value: number };          // Standard Wire Gauge

interface WireColor {
  primary: string;               // CSS color or code: "#FF0000" or "RD"
  stripe?: string;               // Secondary color for striped wires
  color_code_standard?: 'IEC' | 'DIN' | 'JIS' | 'SAE';
}

interface WireElectrical {
  resistance_per_m: number;      // Ohms/meter
  current_rating: {
    continuous_a: number;
    fuse_protected: boolean;
    fuse_rating_a?: number;
  };
  voltage_rating_v: number;
}

interface WireRouting {
  path: RoutingPoint[];
  zones: string[];               // ["engine_bay", "cabin"]
  bundle_id?: string;            // Part of which harness bundle
  protection: {
    conduit?: boolean;
    loom?: boolean;
    heat_shield?: boolean;
    abrasion_protection?: boolean;
  };
}

interface RoutingPoint {
  x: number;                     // Physical coordinates (mm)
  y: number;
  z: number;
  description?: string;          // "Above fuel tank", "Left door hinge"
}

interface WireMetadata {
  part_number?: string;          // If wire is cataloged part
  cost_per_meter?: number;
  notes?: string;
}
```

---

### Splice

```typescript
interface Splice {
  id: string;                    // UUID
  name?: string;                 // "S1", "GND_Splice_Rear"
  type: SpliceType;

  // Connected wires
  wires: string[];               // Wire IDs (usually 2-4 wires)

  // Physical properties
  physical: SplicePhysical;

  // Location
  location: SpliceLocation;

  // Metadata
  metadata: SpliceMetadata;
  created: AuditInfo;
  modified: AuditInfo;
}

type SpliceType =
  | 'crimp'                      // Crimped splice connector
  | 'ultrasonic'                 // Ultrasonically welded
  | 'solder'                     // Soldered joint
  | 'terminal_block'             // Screw terminal
  | 'junction_box';              // Smart junction box

interface SplicePhysical {
  part_number?: string;          // Splice connector part number
  max_wire_gauge?: WireGauge;
  min_wire_gauge?: WireGauge;
  max_wires: number;             // How many wires can be joined
  current_rating_a?: number;
  insulated: boolean;
}

interface SpliceLocation {
  zone?: string;
  x?: number;                    // Physical coordinates
  y?: number;
  z?: number;
  description?: string;          // "Under rear seat, left side"
}

interface SpliceMetadata {
  installation_notes?: string;
  test_point?: string;
  service_accessible: boolean;
  notes?: string;
}
```

---

### Feature (Vehicle Function)

```typescript
interface Feature {
  id: string;                    // UUID
  name: string;                  // "Heated Steering Wheel"
  description?: string;
  category: FeatureCategory;

  // Requirements
  requirements: FeatureRequirements;

  // Implementation
  implementation?: FeatureImplementation;

  // Variants
  available_in: string[];        // Variant IDs where this feature is available

  // Dependencies
  dependencies: FeatureDependency[];

  // Safety
  safety: FeatureSafety;

  // Metadata
  metadata: FeatureMetadata;
  created: AuditInfo;
  modified: AuditInfo;
}

type FeatureCategory =
  | 'powertrain'
  | 'chassis'
  | 'body'
  | 'comfort'
  | 'safety'
  | 'infotainment'
  | 'lighting'
  | 'hvac'
  | 'driver_assistance';

interface FeatureRequirements {
  // Pin requirements
  pins: PinRequirement[];

  // Power requirements
  power: {
    voltage_v: number;
    current_a: number;
    power_mode: 'ignition_on' | 'always' | 'accessory';
  };

  // Network requirements
  network?: {
    protocol: 'CAN' | 'LIN' | 'FlexRay' | 'Ethernet';
    messages: NetworkMessage[];
  };

  // Physical requirements
  physical?: {
    location: string;            // "steering_column", "rear_bumper"
    environment: 'interior' | 'engine_bay' | 'undercarriage' | 'exterior';
  };
}

interface PinRequirement {
  quantity: number;
  io_type: PinIOType;
  signal_type: SignalType;
  voltage_v?: number;
  current_a?: number;
  description: string;           // "Heater element control"
}

interface NetworkMessage {
  id: string | number;           // CAN ID, etc.
  dlc: number;                   // Data length
  cycle_time_ms: number;
  direction: 'tx' | 'rx';
  description?: string;
}

interface FeatureImplementation {
  ecu_id: string;                // Which ECU implements this
  pins: PinAssignmentDetail[];
  wires: string[];               // Wire IDs
  components: Component[];       // Physical components (switches, sensors, actuators)
  software_module?: string;      // Software module/function
}

interface PinAssignmentDetail {
  pin_id: string;
  function: string;
  signal_name: string;
}

interface FeatureDependency {
  type: 'requires' | 'conflicts_with' | 'optional_with';
  feature_id: string;
  description?: string;
}

interface FeatureSafety {
  safety_relevant: boolean;
  asil_rating?: 'QM' | 'ASIL-A' | 'ASIL-B' | 'ASIL-C' | 'ASIL-D';
  fault_tolerance?: {
    redundancy_required: boolean;
    degraded_mode_available: boolean;
  };
  diagnostic_required: boolean;
}

interface FeatureMetadata {
  requirement_ids?: string[];    // Links to requirements management system
  test_case_ids?: string[];
  cost_usd?: number;            // Feature cost (ECU + components + labor)
  notes?: string;
}
```

---

### Component (Physical Device)

```typescript
interface Component {
  id: string;                    // UUID
  type: ComponentType;
  name: string;                  // "Rear Fog Lamp", "Coolant Temp Sensor"
  manufacturer?: string;
  part_number?: string;

  // Electrical properties
  electrical: ComponentElectrical;

  // Physical properties
  physical: ComponentPhysical;

  // Connection
  connection: ComponentConnection;

  // Metadata
  metadata: ComponentMetadata;
  created: AuditInfo;
  modified: AuditInfo;
}

type ComponentType =
  | 'switch'
  | 'sensor'
  | 'actuator'
  | 'lamp'
  | 'relay'
  | 'fuse'
  | 'diode'
  | 'resistor'
  | 'capacitor'
  | 'motor'
  | 'solenoid'
  | 'speaker'
  | 'antenna';

interface ComponentElectrical {
  voltage_v: number;
  resistance_ohm?: number;
  inductance_h?: number;
  capacitance_f?: number;
  current_draw: {
    nominal_a: number;
    peak_a?: number;
    inrush_a?: number;
  };
  power_w?: number;
}

interface ComponentPhysical {
  location: string;
  environment: 'interior' | 'engine_bay' | 'undercarriage' | 'exterior';
  operating_temp: {
    min_celsius: number;
    max_celsius: number;
  };
  ip_rating?: string;
}

interface ComponentConnection {
  connector_id?: string;         // If connected via connector
  direct_wire_ids?: string[];    // If directly wired
  pin_mapping?: Record<string, string>; // Pin to function mapping
}

interface ComponentMetadata {
  datasheet_url?: string;
  service_interval_km?: number;
  notes?: string;
}
```

---

### Network (Communication Bus)

```typescript
interface Network {
  id: string;                    // UUID
  name: string;                  // "CAN-HS", "LIN-Body"
  protocol: 'CAN' | 'LIN' | 'FlexRay' | 'Ethernet' | 'MOST';

  // Configuration
  configuration: NetworkConfiguration;

  // Members
  members: NetworkMember[];

  // Messages (for CAN/LIN)
  messages?: NetworkMessage[];

  // Physical layer
  physical: NetworkPhysical;

  // Load analysis
  load: NetworkLoad;

  // Metadata
  metadata: NetworkMetadata;
  created: AuditInfo;
  modified: AuditInfo;
}

interface NetworkConfiguration {
  baudrate: number;              // 500000 for CAN, etc.
  can_fd?: boolean;
  termination: {
    required: boolean;
    location?: string[];         // Which ECUs provide termination
    resistance_ohm?: number;     // 120 for CAN
  };
}

interface NetworkMember {
  ecu_id: string;
  role: 'master' | 'slave' | 'peer';
  wakeup_capable?: boolean;
}

interface NetworkPhysical {
  topology: 'bus' | 'star' | 'ring' | 'daisy_chain';
  backbone_wire_ids?: string[];
  stub_max_length_mm?: number;
  total_length_m?: number;
}

interface NetworkLoad {
  utilization_percent: number;   // Calculated bus load
  max_utilization_percent: number; // Design limit (usually 80%)
  message_count: number;
  bandwidth_used_bps: number;
}

interface NetworkMetadata {
  notes?: string;
  diagnostic_address?: string;
}
```

---

## Validation & Constraint Types

```typescript
interface ValidationResult {
  valid: boolean;
  severity: 'error' | 'warning' | 'info';
  rule: string;                  // "electrical.current_limit"
  message: string;
  affected_entities: EntityReference[];
  suggested_fix?: string;
}

interface EntityReference {
  type: 'ecu' | 'pin' | 'wire' | 'feature' | 'connector' | 'network';
  id: string;
  name?: string;
}

interface ConstraintRule {
  id: string;
  name: string;
  category: 'electrical' | 'protocol' | 'safety' | 'physical';
  severity: 'error' | 'warning';
  enabled: boolean;
  parameters?: Record<string, unknown>;
}
```

---

## Change Management Types

```typescript
interface ChangeRequest {
  id: string;                    // UUID
  title: string;
  description: string;
  type: ChangeType;

  // Proposed changes
  changes: Change[];

  // Impact analysis
  impact?: ImpactAnalysis;

  // Approval workflow
  status: ChangeStatus;
  approvals: Approval[];

  // Metadata
  created: AuditInfo;
  modified: AuditInfo;
}

type ChangeType =
  | 'add_feature'
  | 'remove_feature'
  | 'modify_harness'
  | 'replace_ecu'
  | 'cost_reduction'
  | 'safety_improvement';

interface Change {
  type: 'add' | 'remove' | 'modify';
  entity_type: string;
  entity_id?: string;            // For modify/remove
  data?: unknown;                // For add/modify
}

type ChangeStatus =
  | 'draft'
  | 'review'
  | 'impact_analysis'
  | 'approved'
  | 'rejected'
  | 'implemented';

interface Approval {
  approver: string;              // User ID
  decision: 'approve' | 'reject' | 'request_changes';
  comment?: string;
  timestamp: Date;
}

interface ImpactAnalysis {
  affected_components: EntityReference[];
  electrical_impact: ElectricalImpact;
  cost_impact: CostImpact;
  safety_impact: SafetyImpact;
  summary: string;               // LLM-generated human-readable summary
}

interface ElectricalImpact {
  power_delta_w: number;
  current_delta_a: number;
  bus_load_delta_percent: number;
  wire_changes_required: string[]; // Wire IDs
}

interface CostImpact {
  parts_delta_usd: number;
  labor_hours_delta: number;
  total_delta_usd: number;
  roi_months?: number;
}

interface SafetyImpact {
  asil_rating_changed: boolean;
  new_hazards: string[];
  mitigation_required: string[];
}
```

---

## Database Schema Mapping

### PostgreSQL Schema

```sql
-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    vehicle_manufacturer VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INTEGER,
    status VARCHAR(20),
    asil_rating VARCHAR(10),
    created_at TIMESTAMP,
    created_by VARCHAR(255),
    modified_at TIMESTAMP,
    modified_by VARCHAR(255),
    metadata JSONB
);

-- ECUs
CREATE TABLE ecus (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    part_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255),
    manufacturer VARCHAR(100),
    physical JSONB,              -- PhysicalProperties
    electrical JSONB,            -- ElectricalProperties
    software JSONB,              -- SoftwareInfo
    procurement JSONB,           -- ProcurementInfo
    safety JSONB,                -- SafetyInfo
    metadata JSONB,
    created_at TIMESTAMP,
    created_by VARCHAR(255),
    modified_at TIMESTAMP,
    modified_by VARCHAR(255)
);

-- Connectors
CREATE TABLE connectors (
    id UUID PRIMARY KEY,
    ecu_id UUID REFERENCES ecus(id),
    name VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100),
    part_number VARCHAR(100),
    type VARCHAR(50),
    gender VARCHAR(20),
    pin_count INTEGER,
    physical JSONB,
    metadata JSONB,
    created_at TIMESTAMP,
    created_by VARCHAR(255),
    modified_at TIMESTAMP,
    modified_by VARCHAR(255)
);

-- Pins
CREATE TABLE pins (
    id UUID PRIMARY KEY,
    connector_id UUID REFERENCES connectors(id),
    pin_number VARCHAR(20) NOT NULL,
    label VARCHAR(100),
    capabilities JSONB,          -- PinCapabilities
    assignment JSONB,            -- PinAssignment
    physical JSONB,
    metadata JSONB,
    created_at TIMESTAMP,
    created_by VARCHAR(255),
    modified_at TIMESTAMP,
    modified_by VARCHAR(255),
    UNIQUE(connector_id, pin_number)
);

-- Wires
CREATE TABLE wires (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    name VARCHAR(100),
    from_pin_id UUID REFERENCES pins(id),
    to_pin_id UUID REFERENCES pins(id),
    physical JSONB,              -- WirePhysical
    electrical JSONB,            -- WireElectrical
    routing JSONB,               -- WireRouting
    metadata JSONB,
    created_at TIMESTAMP,
    created_by VARCHAR(255),
    modified_at TIMESTAMP,
    modified_by VARCHAR(255)
);

-- Features
CREATE TABLE features (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    requirements JSONB,          -- FeatureRequirements
    implementation JSONB,        -- FeatureImplementation
    safety JSONB,                -- FeatureSafety
    metadata JSONB,
    created_at TIMESTAMP,
    created_by VARCHAR(255),
    modified_at TIMESTAMP,
    modified_by VARCHAR(255)
);

-- Networks
CREATE TABLE networks (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    name VARCHAR(100) NOT NULL,
    protocol VARCHAR(50),
    configuration JSONB,
    physical JSONB,
    load JSONB,
    metadata JSONB,
    created_at TIMESTAMP,
    created_by VARCHAR(255),
    modified_at TIMESTAMP,
    modified_by VARCHAR(255)
);

-- Change Requests
CREATE TABLE change_requests (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    changes JSONB,               -- Array of Change objects
    impact JSONB,                -- ImpactAnalysis
    status VARCHAR(50),
    created_at TIMESTAMP,
    created_by VARCHAR(255),
    modified_at TIMESTAMP,
    modified_by VARCHAR(255)
);
```

### Apache AGE Graph Schema

```sql
-- Create graph
SELECT create_graph('harness_graph');

-- Create vertices (run via ag_catalog.cypher)
SELECT * FROM ag_catalog.cypher('harness_graph', $$
  CREATE (:ECU {
    id: '...',
    part_number: 'BCM-2024-V3',
    name: 'Body Control Module'
  })
$$) as (result agtype);

SELECT * FROM ag_catalog.cypher('harness_graph', $$
  CREATE (:Pin {
    id: '...',
    pin_number: 'P47',
    io_type: 'high_side_driver'
  })
$$) as (result agtype);

-- Create edges
SELECT * FROM ag_catalog.cypher('harness_graph', $$
  MATCH (ecu:ECU {id: '...'}), (pin:Pin {id: '...'})
  CREATE (ecu)-[:HAS_PIN {connector: 'X1'}]->(pin)
$$) as (result agtype);

SELECT * FROM ag_catalog.cypher('harness_graph', $$
  MATCH (pin1:Pin {id: '...'}), (pin2:Pin {id: '...'})
  CREATE (pin1)-[:WIRED_TO {
    wire_id: '...',
    gauge: '0.5 mm2',
    length_mm: 1500,
    color: 'RD'
  }]->(pin2)
$$) as (result agtype);
```

---

## API Contract Types

### REST API

```typescript
// GET /api/projects/:id
interface GetProjectResponse {
  project: Project;
  statistics: {
    ecu_count: number;
    connector_count: number;
    wire_count: number;
    feature_count: number;
  };
}

// POST /api/change-requests
interface CreateChangeRequestBody {
  project_id: string;
  title: string;
  description: string;
  type: ChangeType;
  changes: Change[];
}

interface CreateChangeRequestResponse {
  change_request: ChangeRequest;
  impact_analysis: ImpactAnalysis;
}

// POST /api/validate
interface ValidateHarnessBody {
  project_id: string;
  rules?: string[];              // Specific rules to check
}

interface ValidateHarnessResponse {
  valid: boolean;
  results: ValidationResult[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
}
```

### GraphQL Schema

```graphql
type Query {
  project(id: ID!): Project
  ecu(id: ID!): ECU
  findCompatiblePins(requirements: PinRequirementsInput!): [Pin!]!
  impactAnalysis(change: ChangeInput!): ImpactAnalysis!
}

type Mutation {
  createProject(input: CreateProjectInput!): Project!
  addFeature(projectId: ID!, feature: FeatureInput!): Feature!
  assignPin(pinId: ID!, assignment: PinAssignmentInput!): Pin!
  submitChangeRequest(input: ChangeRequestInput!): ChangeRequest!
}

type Project {
  id: ID!
  name: String!
  ecus: [ECU!]!
  features: [Feature!]!
  changeRequests: [ChangeRequest!]!
}

type ECU {
  id: ID!
  partNumber: String!
  connectors: [Connector!]!
  pins: [Pin!]!
  networks: [Network!]!
}

type Pin {
  id: ID!
  pinNumber: String!
  capabilities: PinCapabilities!
  assignment: PinAssignment
  connectedWires: [Wire!]!
}
```

---

## File Exchange Formats

### Import/Export

```typescript
// Unified export format (JSON)
interface HarnessFlowExport {
  version: '1.0';
  format: 'harnessflow';
  exported_at: string;
  exported_by: string;

  project: Project;
  ecus: ECU[];
  connectors: Connector[];
  pins: Pin[];
  wires: Wire[];
  features: Feature[];
  networks: Network[];
  components: Component[];
}

// Format conversion manifest
interface ConversionManifest {
  source_format: 'kbl' | 'vec' | 'wireviz' | 'excel' | 'pdf';
  target_format: 'harnessflow';
  conversion_date: string;
  warnings: string[];
  data_loss: string[];          // Fields that couldn't be mapped
  confidence_score: number;      // 0-1
}
```

---

## Validation

All entities must validate against these schemas using Zod or similar:

```typescript
import { z } from 'zod';

const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  vehicle: VehicleInfoSchema,
  // ... rest of schema
});

// Runtime validation
function validateProject(data: unknown): Project {
  return ProjectSchema.parse(data); // Throws if invalid
}
```

---

## Document Status

**Status:** Authoritative - Single Source of Truth
**Next Document:** `docs/consolidated/TECHNICAL_SPECIFICATION.md`
**Related:** `docs/architecture-analysis/ARCHITECTURE_COMPARISON.md`
