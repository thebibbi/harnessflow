# ECU Configuration Management System - Technical Specification

**Version:** 1.0  
**Date:** November 18, 2025  
**Target Domain:** Automotive Electrical Systems (Extensible to Other Domains)

---

## Executive Summary

### Problem Statement

Automotive electrical engineers face a recurring, time-consuming challenge: when design changes require modifications to vehicle features, the wiring harness must be updated, necessitating extensive impact analysis to determine:
- Which features are affected
- Whether existing ECUs can accommodate the changes
- What cascading effects occur across the electrical architecture
- Cost implications of ECU replacements or harness modifications

This manual process is error-prone, time-intensive, and delays product development cycles.

### Solution Overview

An intelligent configuration management system that combines:
- **Structured knowledge representation** of ECUs, wiring harnesses, and features
- **Deterministic validation** of electrical and logical compatibility
- **AI-assisted interfaces** for natural language queries and document parsing
- **Visual design tools** for harness modification and real-time feedback
- **Impact analysis** across physical, network, software, and cost dimensions

### Key Differentiators

1. **Hybrid AI Approach**: AI augments but does not replace deterministic safety-critical validation
2. **Multi-dimensional Analysis**: Considers electrical, protocol, timing, safety, and cost constraints
3. **Extensible Architecture**: Generalizes to manufacturing, industrial automation, robotics, and other domains
4. **Traceability**: Maintains ISO 26262 compliance with provable decision chains

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACES                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Web UI     │  │   API/CLI    │  │  CAD Plugin  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  LLM Interface Layer                                      │  │
│  │  - Spec Sheet Parser  - NL Query Engine  - Report Gen    │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Business Logic Layer                                     │  │
│  │  - Rule Engine  - Impact Analyzer  - Cost Optimizer      │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Visual Design Layer                                      │  │
│  │  - Harness Editor  - Diff Viewer  - Validation Overlay   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Primary    │  │    Cache     │  │   Vector     │         │
│  │   Database   │  │    (Redis)   │  │   Database   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │   Document   │  │  Time Series │                            │
│  │    Store     │  │   (Metrics)  │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Architecture Options

### Option 1: Graph Database (Recommended for Complex Relationships)

**Candidates:** Neo4j, ArangoDB, Amazon Neptune

**Strengths:**
- Natural representation of ECU↔Pin↔Feature↔Network relationships
- Efficient traversal of dependency chains (e.g., "what breaks if I change this?")
- Pattern matching for similar historical designs
- Built-in graph algorithms (shortest path, community detection)

**Weaknesses:**
- Learning curve for SQL-familiar teams
- Requires different indexing strategies
- May need supplementary relational DB for transactional data

**Use When:**
- Relationship traversal is core to functionality
- Deep dependency analysis is required
- Historical pattern matching is important

**Schema Example (Neo4j Cypher):**
```cypher
// Node types
CREATE (e:ECU {id: 'BCM-2024-V3', manufacturer: 'Bosch', cost: 45.20})
CREATE (p:Pin {id: 'BCM-2024-V3-P47', type: 'digital_input', max_current: 0.5})
CREATE (f:Feature {id: 'heated-steering', name: 'Heated Steering Wheel'})
CREATE (n:Network {id: 'can-hs', type: 'CAN', baudrate: 500000})

// Relationships
CREATE (e)-[:HAS_PIN {connector: 'X1'}]->(p)
CREATE (f)-[:REQUIRES_PIN {signal_type: 'digital'}]->(p)
CREATE (e)-[:COMMUNICATES_ON]->(n)
CREATE (f)-[:SENDS_MESSAGE {msg_id: '0x245'}]->(n)
```

---

### Option 2: Relational Database with Foreign Keys (Recommended for Mature Teams)

**Candidates:** PostgreSQL, MySQL, SQL Server

**Strengths:**
- Team familiarity (SQL is ubiquitous)
- ACID guarantees for transactional integrity
- Mature tooling and ORMs
- Recursive CTEs can handle hierarchies

**Weaknesses:**
- Complex JOIN queries for deep relationship traversal
- Schema changes more rigid
- Graph-like queries are verbose

**Use When:**
- Team expertise is primarily in SQL
- Transactional consistency is critical
- Budget constraints favor open-source solutions

**Schema Example (PostgreSQL):**
```sql
CREATE TABLE ecus (
    id SERIAL PRIMARY KEY,
    part_number VARCHAR(50) UNIQUE NOT NULL,
    manufacturer VARCHAR(100),
    cost DECIMAL(10,2),
    asil_rating VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pins (
    id SERIAL PRIMARY KEY,
    ecu_id INTEGER REFERENCES ecus(id) ON DELETE CASCADE,
    pin_number VARCHAR(10) NOT NULL,
    connector VARCHAR(20),
    pin_type VARCHAR(50), -- 'digital_input', 'analog_output', etc.
    voltage_level DECIMAL(5,2),
    max_current DECIMAL(6,3),
    signal_types TEXT[], -- Array: ['PWM', 'digital']
    UNIQUE(ecu_id, pin_number)
);

CREATE TABLE features (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    asil_rating VARCHAR(10)
);

CREATE TABLE feature_requirements (
    id SERIAL PRIMARY KEY,
    feature_id INTEGER REFERENCES features(id),
    requirement_type VARCHAR(50), -- 'pin', 'network', 'power'
    signal_type VARCHAR(50),
    current_draw DECIMAL(6,3),
    quantity INTEGER DEFAULT 1
);

CREATE TABLE pin_assignments (
    id SERIAL PRIMARY KEY,
    pin_id INTEGER REFERENCES pins(id),
    feature_id INTEGER REFERENCES features(id),
    harness_version VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pin_id, harness_version)
);

CREATE TABLE networks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    protocol VARCHAR(50), -- 'CAN', 'LIN', 'FlexRay', 'Ethernet'
    baudrate INTEGER,
    max_load_percent INTEGER DEFAULT 80
);

CREATE TABLE ecu_network_connections (
    ecu_id INTEGER REFERENCES ecus(id),
    network_id INTEGER REFERENCES networks(id),
    PRIMARY KEY (ecu_id, network_id)
);

CREATE TABLE can_messages (
    id SERIAL PRIMARY KEY,
    message_id INTEGER UNIQUE NOT NULL, -- CAN ID
    network_id INTEGER REFERENCES networks(id),
    sender_ecu_id INTEGER REFERENCES ecus(id),
    dlc INTEGER, -- Data Length Code
    cycle_time_ms INTEGER,
    feature_id INTEGER REFERENCES features(id)
);

-- Recursive query example: Find all features affected by ECU change
WITH RECURSIVE affected_features AS (
    SELECT f.id, f.name, 1 as depth
    FROM features f
    JOIN pin_assignments pa ON pa.feature_id = f.id
    JOIN pins p ON p.id = pa.pin_id
    WHERE p.ecu_id = ?
    
    UNION
    
    SELECT f.id, f.name, af.depth + 1
    FROM features f
    JOIN can_messages cm ON cm.feature_id = f.id
    JOIN affected_features af ON cm.sender_ecu_id IN (
        SELECT ecu_id FROM pin_assignments pa2
        JOIN pins p2 ON p2.id = pa2.pin_id
        WHERE pa2.feature_id = af.id
    )
    WHERE af.depth < 5
)
SELECT DISTINCT * FROM affected_features;
```

---

### Option 3: Hybrid Approach (Recommended for Enterprise Scale)

**Architecture:**
- **PostgreSQL**: Core transactional data (ECUs, pins, assignments, audit trails)
- **Neo4j/ArangoDB**: Dependency graph and impact analysis
- **MongoDB**: Unstructured data (datasheets, CAD files, notes)
- **Redis**: Caching layer for frequent queries
- **Qdrant/Pinecone**: Vector embeddings for semantic search

**Data Flow:**
1. Write operations go to PostgreSQL (source of truth)
2. Change Data Capture (CDC) syncs to Neo4j for graph representation
3. Background jobs extract entities from documents to MongoDB
4. LLM embeddings stored in vector DB for semantic search
5. Redis caches computed compatibility results

**Use When:**
- System must scale to thousands of ECUs and projects
- Different query patterns benefit from different data models
- Budget allows for multiple database licenses

---

### Option 4: Document Database (Alternative for Rapid Prototyping)

**Candidates:** MongoDB, CouchDB

**Strengths:**
- Flexible schema for evolving requirements
- Easy to store nested/hierarchical data
- Fast prototyping without migrations

**Weaknesses:**
- Referential integrity must be enforced in application code
- Complex queries less performant than relational
- Graph traversal requires application-level logic

**Use When:**
- Requirements are still evolving
- Need rapid MVP development
- Schema flexibility is paramount

**Schema Example (MongoDB):**
```javascript
// ECU Document
{
  "_id": "BCM-2024-V3",
  "manufacturer": "Bosch",
  "cost": 45.20,
  "asil_rating": "ASIL-B",
  "pins": [
    {
      "pin_number": "P47",
      "connector": "X1",
      "type": "digital_input",
      "voltage": 5.0,
      "max_current": 0.5,
      "signal_types": ["digital", "PWM"],
      "assigned_to": {
        "feature_id": "heated-steering",
        "harness_version": "H-2024-12"
      }
    }
  ],
  "networks": ["can-hs", "lin-1"],
  "capabilities": {
    "can_fd": true,
    "bootloader_updatable": true,
    "diagnostic_protocols": ["UDS", "KWP2000"]
  }
}

// Feature Document
{
  "_id": "heated-steering",
  "name": "Heated Steering Wheel",
  "requirements": {
    "pins": [
      {
        "type": "digital_input",
        "quantity": 1,
        "voltage": 5.0
      },
      {
        "type": "pwm_output",
        "quantity": 1,
        "current": 3.5
      }
    ],
    "can_messages": [
      {
        "id": "0x245",
        "cycle_time_ms": 100
      }
    ]
  }
}
```

---

## Detailed Component Specifications

### 1. Spec Sheet Parser (LLM-Powered)

**Purpose:** Extract structured data from PDF datasheets and documents

**Input Formats:**
- PDF datasheets
- Excel specifications
- CAD metadata (DXF, DWG annotations)
- Requirements documents (Word, Markdown)

**Output Schema:**
```json
{
  "document_type": "ecu_datasheet",
  "extracted_data": {
    "ecu": {
      "part_number": "BCM-2024-V3",
      "manufacturer": "Bosch",
      "cost": 45.20,
      "voltage_range": [9.0, 16.0],
      "operating_temp": [-40, 85],
      "asil_rating": "ASIL-B"
    },
    "pins": [
      {
        "pin_number": "P47",
        "connector": "X1",
        "type": "digital_input",
        "voltage_level": 5.0,
        "max_current": 0.5,
        "pull_up": true,
        "esd_protection": "8kV"
      }
    ],
    "communication": [
      {
        "protocol": "CAN",
        "version": "2.0B",
        "can_fd_support": true,
        "baudrate_options": [125000, 250000, 500000]
      }
    ],
    "confidence_scores": {
      "ecu": 0.95,
      "pins": 0.88
    },
    "requires_human_review": ["pin_47_current_rating", "asil_certification"]
  }
}
```

**Implementation Guidelines:**
```python
class SpecSheetParser:
    """
    Uses multimodal LLM (GPT-4V, Claude 3.5 Sonnet with vision, Gemini) 
    to extract structured data from datasheets.
    """
    
    def __init__(self, llm_provider="anthropic", model="claude-sonnet-4-5"):
        self.llm = LLMClient(provider=llm_provider, model=model)
        self.validation_rules = load_validation_rules()
    
    def parse_datasheet(self, file_path: str) -> Dict:
        """
        Extract structured data from datasheet with confidence scoring.
        """
        # Convert PDF to images for vision models or extract text
        document_content = self._preprocess_document(file_path)
        
        # Prompt LLM with structured output format
        prompt = self._create_extraction_prompt()
        
        # Get structured response
        raw_extraction = self.llm.extract_structured(
            content=document_content,
            schema=ECUSpecSchema,
            prompt=prompt
        )
        
        # Validate extracted data against physics/engineering rules
        validation_results = self._validate_extraction(raw_extraction)
        
        # Flag low-confidence or invalid extractions for human review
        if validation_results.has_errors or raw_extraction.confidence < 0.85:
            raw_extraction.requires_human_review = True
        
        return raw_extraction
    
    def _validate_extraction(self, data: Dict) -> ValidationResult:
        """
        Apply deterministic validation rules to catch LLM hallucinations.
        """
        errors = []
        
        # Example: Digital pins can't have voltage > 5V in typical automotive
        for pin in data.get('pins', []):
            if pin['type'] == 'digital_input' and pin['voltage_level'] > 5.5:
                errors.append(f"Pin {pin['pin_number']}: Voltage {pin['voltage_level']}V exceeds typical digital range")
        
        # Example: CAN baudrates must be standard values
        valid_can_baudrates = [125000, 250000, 500000, 1000000]
        for comm in data.get('communication', []):
            if comm['protocol'] == 'CAN':
                for baudrate in comm.get('baudrate_options', []):
                    if baudrate not in valid_can_baudrates:
                        errors.append(f"Invalid CAN baudrate: {baudrate}")
        
        return ValidationResult(errors=errors, is_valid=len(errors) == 0)
```

**Human-in-the-Loop Workflow:**
1. LLM extracts data
2. System runs validation rules
3. If confidence < 85% OR validation fails → flag for review
4. Engineer reviews in side-by-side view (original PDF vs. extracted data)
5. Engineer approves or corrects
6. Corrections are logged to fine-tune future extractions

---

### 2. Constraint Rule Engine

**Purpose:** Deterministic validation of ECU-feature-harness compatibility

**Rule Categories:**

#### Electrical Rules
```python
class ElectricalRules:
    
    @staticmethod
    def validate_current(pin: Pin, feature: Feature) -> ValidationResult:
        """
        Check if pin can handle feature's current draw.
        """
        if feature.current_draw > pin.max_current:
            return ValidationResult(
                valid=False,
                severity="ERROR",
                message=f"Current draw {feature.current_draw}A exceeds pin limit {pin.max_current}A"
            )
        
        # Warning if within 90% of max
        if feature.current_draw > pin.max_current * 0.9:
            return ValidationResult(
                valid=True,
                severity="WARNING",
                message=f"Current draw is {(feature.current_draw/pin.max_current)*100:.1f}% of max rating"
            )
        
        return ValidationResult(valid=True)
    
    @staticmethod
    def validate_voltage_compatibility(pin: Pin, feature: Feature) -> ValidationResult:
        """
        Check voltage level matching.
        """
        # Allow 10% tolerance
        voltage_tolerance = 0.1
        
        if abs(pin.voltage_level - feature.voltage_requirement) > (feature.voltage_requirement * voltage_tolerance):
            return ValidationResult(
                valid=False,
                severity="ERROR",
                message=f"Voltage mismatch: Pin={pin.voltage_level}V, Feature={feature.voltage_requirement}V"
            )
        
        return ValidationResult(valid=True)
    
    @staticmethod
    def validate_power_budget(ecu: ECU, features: List[Feature]) -> ValidationResult:
        """
        Check total power consumption across all features.
        """
        total_power = sum(f.power_consumption for f in features)
        
        if total_power > ecu.max_power:
            return ValidationResult(
                valid=False,
                severity="ERROR",
                message=f"Total power {total_power}W exceeds ECU limit {ecu.max_power}W"
            )
        
        return ValidationResult(valid=True)
```

#### Signal Type Rules
```python
class SignalTypeRules:
    
    SIGNAL_COMPATIBILITY = {
        'digital_input': ['digital', 'PWM'],
        'digital_output': ['digital', 'PWM'],
        'analog_input': ['analog', '0-5V', '0-10V', '4-20mA'],
        'analog_output': ['analog', '0-5V', 'PWM'],
        'can_transceiver': ['CAN_2.0B', 'CAN_FD'],
        'lin_transceiver': ['LIN_2.0', 'LIN_2.1', 'LIN_2.2']
    }
    
    @staticmethod
    def validate_signal_type(pin: Pin, feature: Feature) -> ValidationResult:
        """
        Check if pin supports required signal type.
        """
        compatible_signals = SignalTypeRules.SIGNAL_COMPATIBILITY.get(pin.type, [])
        
        if feature.signal_type not in compatible_signals:
            return ValidationResult(
                valid=False,
                severity="ERROR",
                message=f"Pin type '{pin.type}' incompatible with signal '{feature.signal_type}'"
            )
        
        return ValidationResult(valid=True)
    
    @staticmethod
    def validate_pwm_frequency(pin: Pin, feature: Feature) -> ValidationResult:
        """
        Check if pin's PWM capabilities match feature requirements.
        """
        if feature.signal_type != 'PWM':
            return ValidationResult(valid=True)
        
        if not hasattr(pin, 'pwm_frequency_range'):
            return ValidationResult(
                valid=False,
                severity="ERROR",
                message="Pin does not support PWM"
            )
        
        min_freq, max_freq = pin.pwm_frequency_range
        
        if not (min_freq <= feature.pwm_frequency <= max_freq):
            return ValidationResult(
                valid=False,
                severity="ERROR",
                message=f"PWM frequency {feature.pwm_frequency}Hz outside pin range [{min_freq}, {max_freq}]Hz"
            )
        
        return ValidationResult(valid=True)
```

#### Protocol Rules
```python
class ProtocolRules:
    
    @staticmethod
    def validate_can_message_compatibility(ecu: ECU, message: CANMessage) -> ValidationResult:
        """
        Check if ECU can handle CAN message requirements.
        """
        # Check if ECU supports CAN FD if required
        if message.is_can_fd and not ecu.can_fd_support:
            return ValidationResult(
                valid=False,
                severity="ERROR",
                message="Message requires CAN FD but ECU only supports CAN 2.0B"
            )
        
        # Check message buffer capacity
        if ecu.can_message_buffer_count < len(ecu.assigned_messages) + 1:
            return ValidationResult(
                valid=False,
                severity="ERROR",
                message=f"ECU CAN message buffer full ({ecu.can_message_buffer_count} max)"
            )
        
        return ValidationResult(valid=True)
    
    @staticmethod
    def validate_network_load(network: Network, new_message: CANMessage) -> ValidationResult:
        """
        Check if adding message exceeds network bandwidth.
        """
        current_load = calculate_network_load(network)
        message_load = calculate_message_load(new_message)
        
        new_total_load = current_load + message_load
        
        if new_total_load > network.max_load_percent:
            return ValidationResult(
                valid=False,
                severity="ERROR",
                message=f"Network load would be {new_total_load:.1f}% (max {network.max_load_percent}%)"
            )
        
        if new_total_load > network.max_load_percent * 0.85:
            return ValidationResult(
                valid=True,
                severity="WARNING",
                message=f"Network load would be {new_total_load:.1f}% (approaching limit)"
            )
        
        return ValidationResult(valid=True)


def calculate_network_load(network: Network) -> float:
    """
    Calculate CAN bus load percentage.
    
    Formula: Load = Σ(MessageSize_bits / CycleTime_ms) / (Baudrate / 1000) * 100
    """
    total_load = 0
    for message in network.messages:
        # CAN frame overhead: Start, ID, Control, CRC, ACK, EOF, IFS ≈ 47 bits for standard, 67 for extended
        overhead_bits = 67 if message.is_extended_id else 47
        message_size_bits = (message.dlc * 8) + overhead_bits
        
        # Messages per second = 1000 / cycle_time_ms
        messages_per_second = 1000.0 / message.cycle_time_ms
        
        # Bits per second for this message
        bits_per_second = message_size_bits * messages_per_second
        
        total_load += bits_per_second
    
    # Convert to percentage of baudrate
    load_percent = (total_load / network.baudrate) * 100
    
    return load_percent
```

#### Safety Rules (ISO 26262)
```python
class SafetyRules:
    
    ASIL_HIERARCHY = ['QM', 'ASIL-A', 'ASIL-B', 'ASIL-C', 'ASIL-D']
    
    @staticmethod
    def validate_asil_compatibility(component, feature) -> ValidationResult:
        """
        Check if component's ASIL rating meets feature requirement.
        """
        component_level = SafetyRules.ASIL_HIERARCHY.index(component.asil_rating)
        feature_level = SafetyRules.ASIL_HIERARCHY.index(feature.asil_rating)
        
        if component_level < feature_level:
            return ValidationResult(
                valid=False,
                severity="ERROR",
                message=f"Component ASIL {component.asil_rating} insufficient for feature requiring {feature.asil_rating}"
            )
        
        return ValidationResult(valid=True)
    
    @staticmethod
    def validate_redundancy(feature: Feature, ecu_assignment: List[ECU]) -> ValidationResult:
        """
        Check if safety-critical features have required redundancy.
        """
        if feature.asil_rating in ['ASIL-C', 'ASIL-D']:
            if len(ecu_assignment) < 2:
                return ValidationResult(
                    valid=False,
                    severity="ERROR",
                    message=f"{feature.asil_rating} features require redundant ECU paths"
                )
        
        return ValidationResult(valid=True)
```

#### Temporal Rules
```python
class TemporalRules:
    
    @staticmethod
    def validate_timing_constraints(feature: Feature, ecu: ECU) -> ValidationResult:
        """
        Check if ECU can meet feature's real-time requirements.
        """
        if hasattr(feature, 'max_response_time_ms'):
            if ecu.cycle_time_ms > feature.max_response_time_ms:
                return ValidationResult(
                    valid=False,
                    severity="ERROR",
                    message=f"ECU cycle time {ecu.cycle_time_ms}ms exceeds feature requirement {feature.max_response_time_ms}ms"
                )
        
        return ValidationResult(valid=True)
    
    @staticmethod
    def validate_message_scheduling(network: Network, new_message: CANMessage) -> ValidationResult:
        """
        Check for scheduling conflicts on CAN bus.
        """
        # Check for message ID conflicts
        for existing_msg in network.messages:
            if existing_msg.message_id == new_message.message_id:
                return ValidationResult(
                    valid=False,
                    severity="ERROR",
                    message=f"CAN ID 0x{new_message.message_id:X} already in use"
                )
        
        # Check for timing conflicts (priority inversion issues)
        if new_message.priority == 'high':
            lower_priority_count = sum(1 for m in network.messages if m.priority in ['medium', 'low'])
            if lower_priority_count > 20:
                return ValidationResult(
                    valid=True,
                    severity="WARNING",
                    message="High-priority message may experience delays due to bus contention"
                )
        
        return ValidationResult(valid=True)
```

---

### 3. Impact Analysis Engine

**Purpose:** Analyze cascading effects of configuration changes

**Analysis Dimensions:**

```python
class ImpactAnalyzer:
    """
    Multi-dimensional impact analysis for configuration changes.
    """
    
    def analyze_feature_addition(self, feature: Feature, current_harness: Harness) -> ImpactReport:
        """
        Analyze impact of adding a new feature.
        """
        report = ImpactReport(feature=feature)
        
        # Physical layer analysis
        report.physical = self._analyze_physical_impact(feature, current_harness)
        
        # ECU compatibility analysis
        report.ecu = self._analyze_ecu_impact(feature, current_harness)
        
        # Network layer analysis
        report.network = self._analyze_network_impact(feature, current_harness)
        
        # Software layer analysis
        report.software = self._analyze_software_impact(feature, current_harness)
        
        # Cost analysis
        report.cost = self._analyze_cost_impact(feature, current_harness)
        
        # Validation impact
        report.validation = self._analyze_validation_impact(feature)
        
        # Risk assessment
        report.risk = self._assess_risk(report)
        
        return report
    
    def _analyze_physical_impact(self, feature: Feature, harness: Harness) -> PhysicalImpact:
        """
        Determine physical changes required.
        """
        impact = PhysicalImpact()
        
        # Check if new connectors needed
        required_pins = feature.get_pin_requirements()
        available_pins = harness.get_available_pins()
        
        if len(required_pins) > len(available_pins):
            impact.requires_new_connector = True
            impact.connector_recommendation = self._suggest_connector(required_pins)
        
        # Check wire gauge requirements
        for pin_req in required_pins:
            if pin_req.current_draw > 5.0:  # High current
                impact.requires_heavy_gauge_wire = True
                impact.wire_gauge_recommendation = self._calculate_wire_gauge(
                    pin_req.current_draw, 
                    harness.wire_length
                )
        
        # Check if routing changes needed
        if feature.has_shielding_requirement:
            impact.requires_shielded_wire = True
        
        # Estimate harness weight change
        impact.weight_delta_kg = self._estimate_weight_change(required_pins, harness)
        
        return impact
    
    def _analyze_ecu_impact(self, feature: Feature, harness: Harness) -> ECUImpact:
        """
        Determine if current ECU can handle the feature.
        """
        impact = ECUImpact()
        current_ecu = harness.get_ecu_for_feature(feature)
        
        # Run all validation rules
        validation_results = RuleEngine.validate_feature_on_ecu(feature, current_ecu)
        
        if not validation_results.is_valid():
            impact.requires_ecu_change = True
            
            # Find alternative ECUs
            impact.alternative_ecus = self._find_compatible_ecus(
                feature, 
                constraints={
                    'max_cost_increase': 50.0,  # $50 max increase per unit
                    'same_manufacturer': True,  # Prefer same vendor
                    'same_connector': True  # Minimize harness changes
                }
            )
            
            # Rank by cost and compatibility
            impact.alternative_ecus.sort(
                key=lambda ecu: (ecu.cost, -ecu.compatibility_score)
            )
            
            # Calculate replacement cost
            impact.per_unit_cost_delta = (
                impact.alternative_ecus[0].cost - current_ecu.cost 
                if impact.alternative_ecus else float('inf')
            )
            
            # Check if firmware update could enable feature
            if current_ecu.supports_firmware_updates:
                impact.firmware_update_possible = self._check_firmware_viability(
                    current_ecu, feature
                )
        
        return impact
    
    def _analyze_network_impact(self, feature: Feature, harness: Harness) -> NetworkImpact:
        """
        Analyze effects on communication networks.
        """
        impact = NetworkImpact()
        
        # Check if feature needs network communication
        if feature.requires_can_messages:
            for network in harness.networks:
                # Check network load
                for message in feature.can_messages:
                    load_result = ProtocolRules.validate_network_load(network, message)
                    
                    if not load_result.valid:
                        impact.network_overload = True
                        impact.affected_networks.append(network.name)
                        
                        # Suggest mitigation
                        impact.mitigation_options.append({
                            'type': 'increase_cycle_time',
                            'description': f'Increase message {message.name} cycle time to {message.cycle_time_ms * 2}ms',
                            'impact': 'Slower update rate'
                        })
                        
                        impact.mitigation_options.append({
                            'type': 'add_gateway',
                            'description': 'Add CAN gateway to segment network',
                            'cost': 35.0
                        })
                
                # Check for message ID conflicts
                conflict_check = self._check_message_id_conflicts(
                    feature.can_messages, network.messages
                )
                
                if conflict_check.has_conflicts:
                    impact.message_id_conflicts = conflict_check.conflicts
                    impact.requires_can_db_update = True
        
        # Check downstream effects (what other ECUs need this data?)
        impact.affected_ecus = self._find_dependent_ecus(feature, harness)
        
        return impact
    
    def _analyze_software_impact(self, feature: Feature, harness: Harness) -> SoftwareImpact:
        """
        Determine software changes required.
        """
        impact = SoftwareImpact()
        
        # Check if AUTOSAR configuration needs update
        if feature.requires_autosar_config:
            impact.requires_autosar_update = True
            impact.affected_software_components = feature.autosar_components
        
        # Check if diagnostic database needs update
        if feature.has_diagnostic_trouble_codes:
            impact.requires_diagnostic_db_update = True
            impact.new_dtcs = feature.diagnostic_codes
        
        # Check if calibration data needs update
        if hasattr(feature, 'calibration_parameters'):
            impact.requires_calibration = True
            impact.calibration_parameters = feature.calibration_parameters
        
        # Estimate firmware development effort
        impact.estimated_dev_hours = self._estimate_firmware_effort(feature)
        
        return impact
    
    def _analyze_cost_impact(self, feature: Feature, harness: Harness) -> CostImpact:
        """
        Calculate total cost impact.
        """
        impact = CostImpact()
        
        # Hardware costs
        impact.ecu_cost_delta = 0  # From ECU analysis
        impact.connector_cost_delta = 0  # If new connectors needed
        impact.wire_cost_delta = self._calculate_wire_cost_delta(feature, harness)
        impact.assembly_cost_delta = 5.0  # Assume $5 for assembly changes
        
        # Engineering costs
        impact.design_hours = 40  # Typical design effort
        impact.validation_hours = 80  # Validation effort
        impact.documentation_hours = 20
        
        impact.engineering_cost = (
            (impact.design_hours + impact.validation_hours + impact.documentation_hours) 
            * 150  # $150/hr blended rate
        )
        
        # Tooling costs
        if harness.requires_new_tooling:
            impact.tooling_cost = 50000  # Typical harness tooling
        
        # Per-unit production cost
        impact.per_unit_cost = (
            impact.ecu_cost_delta + 
            impact.connector_cost_delta + 
            impact.wire_cost_delta + 
            impact.assembly_cost_delta
        )
        
        # Total program cost (assuming 100k units/year over 5 years)
        annual_volume = 100000
        program_years = 5
        
        impact.total_program_cost = (
            impact.engineering_cost +
            impact.tooling_cost +
            (impact.per_unit_cost * annual_volume * program_years)
        )
        
        return impact
    
    def _analyze_validation_impact(self, feature: Feature) -> ValidationImpact:
        """
        Determine validation requirements.
        """
        impact = ValidationImpact()
        
        # Determine required tests
        if feature.asil_rating != 'QM':
            impact.required_tests.append({
                'type': 'functional_safety',
                'standard': 'ISO 26262',
                'estimated_hours': 200
            })
        
        impact.required_tests.append({
            'type': 'emc_testing',
            'standard': 'CISPR 25',
            'estimated_hours': 40,
            'lab_cost': 15000
        })
        
        if feature.affects_vehicle_dynamics:
            impact.required_tests.append({
                'type': 'vehicle_testing',
                'description': 'Track testing with instrumentation',
                'estimated_hours': 80,
                'cost': 50000
            })
        
        # Regression testing
        impact.regression_test_count = len(self._find_affected_test_cases(feature))
        
        return impact
    
    def _assess_risk(self, report: ImpactReport) -> RiskAssessment:
        """
        Overall risk scoring.
        """
        risk = RiskAssessment()
        
        # Score from 0-10 based on various factors
        risk_score = 0
        
        if report.ecu.requires_ecu_change:
            risk_score += 3  # Major change
        
        if report.network.network_overload:
            risk_score += 4  # High risk
        
        if report.physical.requires_new_connector:
            risk_score += 2
        
        if report.cost.per_unit_cost > 10.0:
            risk_score += 2
        
        if report.validation.required_tests:
            risk_score += 1
        
        risk.score = min(risk_score, 10)
        
        if risk.score <= 3:
            risk.level = 'LOW'
            risk.recommendation = 'Proceed with normal approval process'
        elif risk.score <= 6:
            risk.level = 'MEDIUM'
            risk.recommendation = 'Requires engineering review and sign-off'
        else:
            risk.level = 'HIGH'
            risk.recommendation = 'Requires executive approval and thorough risk mitigation plan'
        
        return risk
```

**Impact Report Output Format:**

```json
{
  "feature": "heated-steering-wheel",
  "analysis_date": "2025-11-18T14:30:00Z",
  "physical": {
    "requires_new_connector": false,
    "requires_heavy_gauge_wire": true,
    "wire_gauge_recommendation": "16 AWG",
    "requires_shielded_wire": false,
    "weight_delta_kg": 0.15
  },
  "ecu": {
    "requires_ecu_change": true,
    "current_ecu": "BCM-2024-V2",
    "reason": "Insufficient PWM outputs",
    "alternative_ecus": [
      {
        "part_number": "BCM-2024-V3",
        "manufacturer": "Bosch",
        "cost_delta": 12.50,
        "compatibility_score": 0.95,
        "pros": ["Same connector", "Firmware compatible"],
        "cons": ["Higher power consumption"]
      }
    ],
    "firmware_update_possible": false
  },
  "network": {
    "network_overload": false,
    "requires_can_db_update": true,
    "new_messages": [
      {
        "id": "0x245",
        "name": "HeatedSteeringControl",
        "cycle_time_ms": 100
      }
    ],
    "affected_ecus": ["BCM", "IPC"],
    "message_id_conflicts": []
  },
  "software": {
    "requires_autosar_update": true,
    "affected_components": ["SwcHeatingControl", "SwcDiagnostics"],
    "requires_diagnostic_db_update": true,
    "new_dtcs": ["P1A2F"],
    "estimated_dev_hours": 120
  },
  "cost": {
    "per_unit_cost": 14.75,
    "breakdown": {
      "ecu": 12.50,
      "wire": 1.50,
      "assembly": 0.75
    },
    "engineering_cost": 21000,
    "tooling_cost": 0,
    "total_program_cost": 7375000
  },
  "validation": {
    "required_tests": [
      {
        "type": "emc_testing",
        "standard": "CISPR 25",
        "estimated_hours": 40,
        "lab_cost": 15000
      }
    ],
    "regression_test_count": 47
  },
  "risk": {
    "score": 5,
    "level": "MEDIUM",
    "recommendation": "Requires engineering review and sign-off",
    "mitigation_actions": [
      "Verify BCM-2024-V3 thermal performance in high-temp testing",
      "Update CAN database and notify all dependent teams",
      "Schedule EMC testing before production release"
    ]
  }
}
```

---

### 4. Visual Harness Designer

**Purpose:** Interactive web-based harness design with real-time validation

**Technology Stack Options:**

| Component | Option 1 | Option 2 | Option 3 |
|-----------|----------|----------|----------|
| Frontend Framework | React + TypeScript | Vue.js 3 | Svelte |
| Canvas Rendering | Fabric.js | Konva.js | PixiJS |
| State Management | Redux Toolkit | Zustand | Jotai |
| 3D Visualization | Three.js | Babylon.js | - |
| Diagramming | React Flow | JointJS | Cytoscape.js |

**Recommended:** React + TypeScript + React Flow + Fabric.js

**UI Components:**

1. **ECU Block Diagram View**
```typescript
interface ECUBlockProps {
  ecu: ECU;
  position: { x: number; y: number };
  pins: Pin[];
  onPinClick: (pin: Pin) => void;
}

const ECUBlock: React.FC<ECUBlockProps> = ({ ecu, position, pins, onPinClick }) => {
  return (
    <div 
      className="ecu-block" 
      style={{ left: position.x, top: position.y }}
    >
      <div className="ecu-header">
        <h3>{ecu.part_number}</h3>
        <span className="ecu-status">{ecu.status}</span>
      </div>
      
      <div className="ecu-pins">
        {pins.map(pin => (
          <PinConnector
            key={pin.id}
            pin={pin}
            status={getPinStatus(pin)}
            onClick={() => onPinClick(pin)}
          />
        ))}
      </div>
      
      <div className="ecu-footer">
        <span>Load: {calculateECULoad(ecu)}%</span>
      </div>
    </div>
  );
};
```

2. **Real-Time Validation Overlay**
```typescript
interface ValidationOverlayProps {
  validationResults: ValidationResult[];
}

const ValidationOverlay: React.FC<ValidationOverlayProps> = ({ validationResults }) => {
  const errors = validationResults.filter(r => r.severity === 'ERROR');
  const warnings = validationResults.filter(r => r.severity === 'WARNING');
  
  return (
    <div className="validation-overlay">
      {errors.length > 0 && (
        <div className="validation-section errors">
          <h4>Errors ({errors.length})</h4>
          <ul>
            {errors.map((error, idx) => (
              <li key={idx} onClick={() => highlightError(error)}>
                <Icon name="error" />
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {warnings.length > 0 && (
        <div className="validation-section warnings">
          <h4>Warnings ({warnings.length})</h4>
          <ul>
            {warnings.map((warning, idx) => (
              <li key={idx}>
                <Icon name="warning" />
                {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {errors.length === 0 && warnings.length === 0 && (
        <div className="validation-section success">
          <Icon name="check-circle" />
          <span>All validations passed</span>
        </div>
      )}
    </div>
  );
};
```

3. **Harness Diff Viewer**
```typescript
interface HarnessDiffProps {
  oldVersion: Harness;
  newVersion: Harness;
}

const HarnessDiffViewer: React.FC<HarnessDiffProps> = ({ oldVersion, newVersion }) => {
  const diff = computeHarnessDiff(oldVersion, newVersion);
  
  return (
    <div className="harness-diff">
      <div className="diff-column old-version">
        <h3>Current Version ({oldVersion.version})</h3>
        <HarnessRenderer 
          harness={oldVersion}
          highlightChanges={diff.removed}
          highlightColor="red"
        />
      </div>
      
      <div className="diff-column changes">
        <h3>Changes</h3>
        <ul className="change-list">
          {diff.added.map(item => (
            <li className="added">+ {item.description}</li>
          ))}
          {diff.removed.map(item => (
            <li className="removed">- {item.description}</li>
          ))}
          {diff.modified.map(item => (
            <li className="modified">≠ {item.description}</li>
          ))}
        </ul>
      </div>
      
      <div className="diff-column new-version">
        <h3>New Version ({newVersion.version})</h3>
        <HarnessRenderer 
          harness={newVersion}
          highlightChanges={diff.added}
          highlightColor="green"
        />
      </div>
    </div>
  );
};
```

**Interactive Features:**

```typescript
class HarnessEditor {
  private canvas: fabric.Canvas;
  private validationEngine: ValidationEngine;
  private autoSaveTimer: number;
  
  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = new fabric.Canvas(canvasElement);
    this.validationEngine = new ValidationEngine();
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    // Real-time validation on pin assignment
    this.canvas.on('object:modified', (event) => {
      const modifiedObject = event.target;
      
      if (modifiedObject.type === 'pin-assignment') {
        this.validatePinAssignment(modifiedObject);
      }
    });
    
    // Drag-and-drop feature onto harness
    this.canvas.on('drop', (event) => {
      const feature = event.dataTransfer.getData('feature');
      const dropPosition = { x: event.offsetX, y: event.offsetY };
      
      this.attemptFeatureAssignment(feature, dropPosition);
    });
    
    // Auto-save every 30 seconds
    this.autoSaveTimer = setInterval(() => {
      this.saveHarnessState();
    }, 30000);
  }
  
  attemptFeatureAssignment(feature: Feature, position: Point) {
    // Find nearest ECU
    const nearestECU = this.findNearestECU(position);
    
    // Check compatibility
    const validationResult = this.validationEngine.validate(feature, nearestECU);
    
    if (validationResult.isValid) {
      this.assignFeature(feature, nearestECU);
      this.showSuccessAnimation(position);
    } else {
      this.showValidationErrors(validationResult.errors, position);
      
      // Suggest alternative ECUs
      const alternatives = this.findCompatibleECUs(feature);
      this.showAlternativeSuggestions(alternatives, position);
    }
  }
  
  validatePinAssignment(assignment: PinAssignment) {
    const results = this.validationEngine.validateAll(assignment);
    
    // Color-code the pin based on validation
    if (results.hasErrors()) {
      assignment.setColor('red');
      this.showTooltip(assignment, results.getErrors());
    } else if (results.hasWarnings()) {
      assignment.setColor('yellow');
      this.showTooltip(assignment, results.getWarnings());
    } else {
      assignment.setColor('green');
    }
    
    // Update validation panel
    this.updateValidationPanel(results);
  }
  
  generateImpactReport() {
    const currentHarness = this.getCurrentHarness();
    const originalHarness = this.getOriginalHarness();
    
    const analyzer = new ImpactAnalyzer();
    const report = analyzer.compareHarnesses(originalHarness, currentHarness);
    
    // Display report in side panel
    this.displayImpactReport(report);
    
    // Generate exportable PDF
    this.generatePDFReport(report);
  }
}
```

---

### 5. Natural Language Query Interface

**Purpose:** Allow engineers to query the system using natural language

**Implementation:**

```python
class NaturalLanguageQueryEngine:
    """
    Converts natural language queries to database queries using LLM.
    """
    
    def __init__(self, llm_client, database):
        self.llm = llm_client
        self.db = database
        self.query_history = []
    
    def process_query(self, natural_language_query: str) -> QueryResult:
        """
        Convert NL query to structured database query and execute.
        """
        # Use LLM to understand intent and generate query
        structured_query = self._parse_query_intent(natural_language_query)
        
        # Validate generated query (prevent SQL injection, etc.)
        if not self._validate_query(structured_query):
            return QueryResult(error="Invalid query generated")
        
        # Execute query
        results = self.db.execute(structured_query)
        
        # Format results in natural language
        formatted_response = self._format_results(results, natural_language_query)
        
        # Log for learning
        self.query_history.append({
            'nl_query': natural_language_query,
            'structured_query': structured_query,
            'timestamp': datetime.now()
        })
        
        return QueryResult(
            answer=formatted_response,
            raw_data=results,
            query=structured_query
        )
    
    def _parse_query_intent(self, nl_query: str) -> Dict:
        """
        Use LLM to convert natural language to structured query.
        """
        prompt = f"""
        Convert the following natural language query into a structured database query.
        
        Available entities:
        - ECU (fields: part_number, manufacturer, cost, asil_rating, pins)
        - Pin (fields: pin_number, type, voltage, max_current, signal_types)
        - Feature (fields: name, requirements, asil_rating)
        - Network (fields: name, protocol, baudrate)
        
        Natural language query: "{nl_query}"
        
        Respond with a JSON object in this format:
        {{
          "intent": "find" | "compare" | "analyze" | "list",
          "entity": "ECU" | "Pin" | "Feature" | "Network",
          "filters": [
            {{"field": "cost", "operator": "<", "value": 50}}
          ],
          "sort": {{"field": "cost", "direction": "asc"}},
          "limit": 10
        }}
        """
        
        response = self.llm.generate(prompt, response_format="json")
        return json.loads(response)
    
    def _format_results(self, results: List[Dict], original_query: str) -> str:
        """
        Use LLM to format results as natural language.
        """
        prompt = f"""
        The user asked: "{original_query}"
        
        Here are the results:
        {json.dumps(results, indent=2)}
        
        Provide a clear, concise natural language response that directly answers 
        the user's question. Include specific data points and be precise.
        """
        
        return self.llm.generate(prompt)


# Example usage
query_engine = NaturalLanguageQueryEngine(llm_client, database)

# Example queries:
# "Show me all ECUs from Bosch that cost less than $50"
# "Which pins on BCM-2024-V3 can handle 5A or more?"
# "What features require ASIL-B or higher?"
# "Find ECUs compatible with heated steering wheel feature"
# "Compare power consumption of BCM-2024-V2 vs BCM-2024-V3"
```

**Example Query Interactions:**

```
User: "Show me all ECUs from Bosch under $50"

System: I found 12 Bosch ECUs under $50:

1. BCM-2024-V2 - $42.50
   - 32 pins, ASIL-B rated
   - CAN 2.0B, LIN 2.2
   
2. BCM-2024-V3 - $47.80
   - 48 pins, ASIL-B rated
   - CAN FD, LIN 2.2
   
[View all 12 results]

---

User: "Can the BCM-2024-V2 handle the heated steering wheel feature?"

System: No, BCM-2024-V2 is incompatible with the heated steering wheel feature:

❌ Insufficient PWM outputs (needs 1, has 0 available)
✓ Has required digital input
✓ Has required analog input

Recommendation: Upgrade to BCM-2024-V3 (+$5.30) which has 2 available PWM outputs.

[View detailed compatibility report]

---

User: "What would break if I replace BCM-2024-V2 with Continental's BCM-C100?"

System: Replacing BCM-2024-V2 with Continental BCM-C100 would affect:

⚠️  Connector mismatch (requires harness modification)
⚠️  7 features need pin reassignment
⚠️  CAN database update required (different message mapping)
✓  All features functionally compatible
✓  Lower cost (-$8.50 per unit)

Estimated change cost: $45,000 engineering + $75,000 tooling

[Generate full impact report]
```

---

## Data Models

### Core Entity Schemas

#### ECU Schema (SQL)
```sql
CREATE TABLE ecus (
    id SERIAL PRIMARY KEY,
    part_number VARCHAR(50) UNIQUE NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    family VARCHAR(50), -- e.g., 'BCM', 'PCM', 'ADAS'
    
    -- Physical characteristics
    form_factor VARCHAR(50),
    weight_kg DECIMAL(6,3),
    dimensions_mm VARCHAR(50), -- 'LxWxH'
    
    -- Electrical
    voltage_range_min DECIMAL(4,1) DEFAULT 9.0,
    voltage_range_max DECIMAL(4,1) DEFAULT 16.0,
    max_power_consumption_w DECIMAL(6,2),
    quiescent_current_ma DECIMAL(6,2),
    
    -- Environmental
    operating_temp_min INTEGER DEFAULT -40,
    operating_temp_max INTEGER DEFAULT 85,
    ip_rating VARCHAR(10), -- e.g., 'IP6K9K'
    
    -- Safety
    asil_rating VARCHAR(10) CHECK (asil_rating IN ('QM', 'ASIL-A', 'ASIL-B', 'ASIL-C', 'ASIL-D')),
    
    -- Capabilities
    can_support BOOLEAN DEFAULT FALSE,
    can_fd_support BOOLEAN DEFAULT FALSE,
    lin_support BOOLEAN DEFAULT FALSE,
    flexray_support BOOLEAN DEFAULT FALSE,
    ethernet_support BOOLEAN DEFAULT FALSE,
    
    can_message_buffer_count INTEGER,
    lin_message_buffer_count INTEGER,
    
    -- Software
    supports_firmware_updates BOOLEAN DEFAULT TRUE,
    bootloader_type VARCHAR(50),
    autosar_version VARCHAR(20),
    
    -- Processor
    processor_type VARCHAR(50),
    clock_speed_mhz INTEGER,
    flash_memory_kb INTEGER,
    ram_kb INTEGER,
    eeprom_kb INTEGER,
    
    -- Timing
    cycle_time_ms INTEGER,
    
    -- Commercial
    cost DECIMAL(10,2),
    lead_time_weeks INTEGER,
    supplier VARCHAR(100),
    datasheet_url TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'obsolete', 'prototype'))
);

CREATE INDEX idx_ecus_manufacturer ON ecus(manufacturer);
CREATE INDEX idx_ecus_cost ON ecus(cost);
CREATE INDEX idx_ecus_asil ON ecus(asil_rating);
```

#### Pin Schema (SQL)
```sql
CREATE TABLE pins (
    id SERIAL PRIMARY KEY,
    ecu_id INTEGER REFERENCES ecus(id) ON DELETE CASCADE,
    
    pin_number VARCHAR(10) NOT NULL, -- e.g., 'P47', 'A-12'
    connector VARCHAR(20), -- e.g., 'X1', 'J2'
    
    -- Electrical characteristics
    pin_type VARCHAR(50) NOT NULL, -- 'digital_input', 'digital_output', 'analog_input', 'analog_output', 'power', 'ground', 'can_high', 'can_low'
    voltage_level DECIMAL(5,2), -- Nominal voltage
    voltage_tolerance_percent DECIMAL(4,1) DEFAULT 10.0,
    
    max_current_a DECIMAL(6,3),
    max_voltage_v DECIMAL(5,2),
    
    -- Signal characteristics
    signal_types TEXT[], -- Array: ['digital', 'PWM', 'analog']
    
    pwm_capable BOOLEAN DEFAULT FALSE,
    pwm_frequency_min_hz INTEGER,
    pwm_frequency_max_hz INTEGER,
    pwm_resolution_bits INTEGER,
    
    adc_resolution_bits INTEGER, -- For analog inputs
    adc_sample_rate_hz INTEGER,
    
    -- Pull-up/down
    has_internal_pullup BOOLEAN DEFAULT FALSE,
    has_internal_pulldown BOOLEAN DEFAULT FALSE,
    pullup_resistance_ohm INTEGER,
    
    -- Protection
    esd_protection_kv DECIMAL(4,1),
    over_voltage_protection BOOLEAN DEFAULT FALSE,
    short_circuit_protection BOOLEAN DEFAULT FALSE,
    
    -- Communication specific
    is_differential_pair BOOLEAN DEFAULT FALSE,
    differential_pair_pin_id INTEGER REFERENCES pins(id),
    
    -- Status
    is_available BOOLEAN DEFAULT TRUE,
    reserved_for TEXT, -- Explanation if reserved
    
    UNIQUE(ecu_id, pin_number)
);

CREATE INDEX idx_pins_ecu ON pins(ecu_id);
CREATE INDEX idx_pins_type ON pins(pin_type);
CREATE INDEX idx_pins_available ON pins(is_available);
```

#### Feature Schema (SQL)
```sql
CREATE TABLE features (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'comfort', 'safety', 'powertrain', 'infotainment'
    
    -- Safety
    asil_rating VARCHAR(10) CHECK (asil_rating IN ('QM', 'ASIL-A', 'ASIL-B', 'ASIL-C', 'ASIL-D')),
    requires_redundancy BOOLEAN DEFAULT FALSE,
    
    -- Timing
    max_response_time_ms INTEGER,
    update_rate_hz DECIMAL(6,2),
    
    -- Validation
    validation_status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'review', 'approved', 'obsolete'
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

CREATE TABLE feature_pin_requirements (
    id SERIAL PRIMARY KEY,
    feature_id INTEGER REFERENCES features(id) ON DELETE CASCADE,
    
    requirement_name VARCHAR(100), -- e.g., 'heater_pwm_output', 'temp_sensor_input'
    
    pin_type VARCHAR(50) NOT NULL,
    signal_type VARCHAR(50),
    
    voltage_requirement DECIMAL(5,2),
    current_draw_a DECIMAL(6,3),
    power_consumption_w DECIMAL(6,2),
    
    pwm_frequency_hz INTEGER,
    
    quantity INTEGER DEFAULT 1, -- How many pins of this type needed
    
    is_critical BOOLEAN DEFAULT FALSE -- Must have vs. nice to have
);

CREATE TABLE feature_can_messages (
    id SERIAL PRIMARY KEY,
    feature_id INTEGER REFERENCES features(id) ON DELETE CASCADE,
    
    message_name VARCHAR(100),
    message_id INTEGER NOT NULL, -- CAN ID (0x000 - 0x7FF for standard, up to 0x1FFFFFFF for extended)
    is_extended_id BOOLEAN DEFAULT FALSE,
    
    dlc INTEGER CHECK (dlc BETWEEN 0 AND 8), -- Data Length Code
    cycle_time_ms INTEGER,
    
    is_can_fd BOOLEAN DEFAULT FALSE,
    
    direction VARCHAR(10) CHECK (direction IN ('tx', 'rx')), -- Transmit or receive
    
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'))
);
```

#### Harness Schema (SQL)
```sql
CREATE TABLE harnesses (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) UNIQUE NOT NULL,
    project VARCHAR(100),
    vehicle_platform VARCHAR(100),
    
    description TEXT,
    
    -- Physical
    total_wire_length_m DECIMAL(8,2),
    total_weight_kg DECIMAL(6,3),
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'released', 'obsolete'
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    parent_version VARCHAR(50) REFERENCES harnesses(version) -- Track revision history
);

CREATE TABLE harness_ecus (
    id SERIAL PRIMARY KEY,
    harness_id INTEGER REFERENCES harnesses(id) ON DELETE CASCADE,
    ecu_id INTEGER REFERENCES ecus(id),
    
    location VARCHAR(100), -- Physical location in vehicle
    mounting_type VARCHAR(50),
    
    UNIQUE(harness_id, ecu_id)
);

CREATE TABLE pin_assignments (
    id SERIAL PRIMARY KEY,
    harness_id INTEGER REFERENCES harnesses(id) ON DELETE CASCADE,
    pin_id INTEGER REFERENCES pins(id),
    feature_id INTEGER REFERENCES features(id),
    
    wire_color VARCHAR(50),
    wire_gauge_awg INTEGER,
    wire_length_m DECIMAL(6,2),
    is_shielded BOOLEAN DEFAULT FALSE,
    
    notes TEXT,
    
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(100),
    
    UNIQUE(harness_id, pin_id) -- Each pin can only be assigned once per harness
);

CREATE TABLE networks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    harness_id INTEGER REFERENCES harnesses(id),
    
    protocol VARCHAR(50) NOT NULL, -- 'CAN', 'LIN', 'FlexRay', 'Ethernet'
    baudrate INTEGER,
    
    -- Load management
    max_load_percent INTEGER DEFAULT 80,
    current_load_percent DECIMAL(5,2),
    
    -- Topology
    topology VARCHAR(50), -- 'bus', 'star', 'ring'
    termination_type VARCHAR(50),
    
    -- Cable specs
    cable_type VARCHAR(100),
    max_cable_length_m DECIMAL(6,2)
);

CREATE TABLE network_ecu_connections (
    network_id INTEGER REFERENCES networks(id) ON DELETE CASCADE,
    ecu_id INTEGER REFERENCES ecus(id) ON DELETE CASCADE,
    is_gateway BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (network_id, ecu_id)
);
```

---

### Graph Database Schema (Neo4j Example)

```cypher
// Node Labels and Properties

// ECU Node
CREATE CONSTRAINT ecu_unique IF NOT EXISTS FOR (e:ECU) REQUIRE e.part_number IS UNIQUE;

(:ECU {
  part_number: string,
  manufacturer: string,
  cost: float,
  asil_rating: string,
  can_fd_support: boolean,
  max_power_w: float
})

// Pin Node
(:Pin {
  id: string,
  pin_number: string,
  type: string,
  voltage: float,
  max_current: float,
  signal_types: [string],
  is_available: boolean
})

// Feature Node
(:Feature {
  id: string,
  name: string,
  asil_rating: string,
  validation_status: string
})

// Network Node
(:Network {
  id: string,
  name: string,
  protocol: string,
  baudrate: integer,
  max_load_percent: integer
})

// CANMessage Node
(:CANMessage {
  id: string,
  message_id: integer,
  name: string,
  cycle_time_ms: integer,
  is_can_fd: boolean
})

// Project/Harness Node
(:Harness {
  version: string,
  project: string,
  status: string
})

// Relationships

// ECU to Pin
(:ECU)-[:HAS_PIN {connector: string, position: integer}]->(:Pin)

// Pin to Feature (assignment)
(:Pin)-[:ASSIGNED_TO {
  harness_version: string,
  wire_gauge: integer,
  wire_color: string
}]->(:Feature)

// Feature to Pin (requirement)
(:Feature)-[:REQUIRES_PIN {
  pin_type: string,
  signal_type: string,
  current_draw: float,
  quantity: integer
}]->(:Pin)

// ECU to Network
(:ECU)-[:COMMUNICATES_ON {is_gateway: boolean}]->(:Network)

// Feature to CANMessage
(:Feature)-[:SENDS_MESSAGE]->(:CANMessage)
(:Feature)-[:RECEIVES_MESSAGE]->(:CANMessage)

// CANMessage to Network
(:CANMessage)-[:TRANSMITTED_ON]->(:Network)

// ECU to CANMessage
(:ECU)-[:TRANSMITS]->(:CANMessage)
(:ECU)-[:RECEIVES]->(:CANMessage)

// Feature dependencies
(:Feature)-[:DEPENDS_ON {reason: string}]->(:Feature)

// Harness relationships
(:Harness)-[:INCLUDES_ECU]->(:ECU)
(:Harness)-[:SUPERSEDES]->(:Harness) // Version history

// Example Queries

// Find all ECUs that can support a feature
MATCH (f:Feature {name: 'heated-steering'})-[:REQUIRES_PIN]->(req)
MATCH (e:ECU)-[:HAS_PIN]->(p:Pin)
WHERE p.type = req.pin_type
  AND p.max_current >= req.current_draw
  AND p.is_available = true
WITH e, count(DISTINCT p) as available_pins, f
MATCH (f)-[:REQUIRES_PIN]->()
WITH e, available_pins, count(*) as required_pins
WHERE available_pins >= required_pins
RETURN e.part_number, e.cost, available_pins, required_pins
ORDER BY e.cost;

// Find impact of changing an ECU
MATCH path = (old_ecu:ECU {part_number: 'BCM-2024-V2'})-[:HAS_PIN]->(:Pin)-[:ASSIGNED_TO]->(f:Feature)
OPTIONAL MATCH (f)-[:DEPENDS_ON*]->(dependent_feature:Feature)
OPTIONAL MATCH (f)-[:SENDS_MESSAGE|RECEIVES_MESSAGE]->(msg:CANMessage)<-[:RECEIVES]-(other_ecu:ECU)
RETURN DISTINCT f.name as affected_feature, 
       dependent_feature.name as dependent_features,
       other_ecu.part_number as communicating_ecus;

// Find all features on a network
MATCH (f:Feature)-[:SENDS_MESSAGE|RECEIVES_MESSAGE]->(msg:CANMessage)-[:TRANSMITTED_ON]->(n:Network {name: 'CAN-HS'})
RETURN DISTINCT f.name, collect(msg.name) as messages;

// Calculate network load
MATCH (msg:CANMessage)-[:TRANSMITTED_ON]->(n:Network {name: 'CAN-HS'})
WITH n, 
     sum((msg.dlc * 8 + 67) * (1000.0 / msg.cycle_time_ms)) as total_bits_per_second
RETURN n.name, 
       (total_bits_per_second / n.baudrate * 100) as load_percent,
       n.max_load_percent - (total_bits_per_second / n.baudrate * 100) as remaining_capacity_percent;

// Find similar historical designs
MATCH (current:Feature {name: 'heated-steering'})
MATCH (historical:Feature)-[:REQUIRES_PIN]->(req)
WHERE historical <> current
WITH current, historical, 
     collect(req.pin_type) as hist_requirements
MATCH (current)-[:REQUIRES_PIN]->(curr_req)
WITH historical, hist_requirements, collect(curr_req.pin_type) as curr_requirements
WITH historical, 
     size([x IN hist_requirements WHERE x IN curr_requirements]) as common_requirements,
     size(hist_requirements + [x IN curr_requirements WHERE NOT x IN hist_requirements]) as total_unique_requirements
WITH historical, 
     toFloat(common_requirements) / total_unique_requirements as similarity
WHERE similarity > 0.7
MATCH (historical)-[:ASSIGNED_TO]-(p:Pin)<-[:HAS_PIN]-(ecu:ECU)
RETURN DISTINCT historical.name, 
       ecu.part_number,
       similarity
ORDER BY similarity DESC
LIMIT 5;
```

---

## API Specifications

### REST API Endpoints

**Base URL:** `https://api.ecu-config-system.com/v1`

#### ECU Management

```
GET    /ecus
GET    /ecus/{id}
POST   /ecus
PUT    /ecus/{id}
DELETE /ecus/{id}

GET    /ecus/{id}/pins
GET    /ecus/{id}/compatibility-check?feature_id={feature_id}
GET    /ecus/search?manufacturer={}&cost_max={}&asil_rating={}
```

**Example Request:**
```http
GET /ecus/search?manufacturer=Bosch&cost_max=50&asil_rating=ASIL-B
Authorization: Bearer <token>
```

**Example Response:**
```json
{
  "results": [
    {
      "id": 123,
      "part_number": "BCM-2024-V3",
      "manufacturer": "Bosch",
      "cost": 47.80,
      "asil_rating": "ASIL-B",
      "available_pins": 48,
      "used_pins": 32,
      "capabilities": {
        "can_fd": true,
        "lin": true,
        "ethernet": false
      }
    }
  ],
  "total": 12,
  "page": 1,
  "page_size": 20
}
```

#### Feature Management

```
GET    /features
GET    /features/{id}
POST   /features
PUT    /features/{id}
DELETE /features/{id}

GET    /features/{id}/requirements
POST   /features/{id}/assign-to-ecu
GET    /features/{id}/compatible-ecus
```

#### Harness Management

```
GET    /harnesses
GET    /harnesses/{id}
POST   /harnesses
PUT    /harnesses/{id}
DELETE /harnesses/{id}

GET    /harnesses/{id}/ecus
GET    /harnesses/{id}/pin-assignments
POST   /harnesses/{id}/assign-pin
DELETE /harnesses/{id}/pin-assignments/{assignment_id}

GET    /harnesses/{id}/validate
GET    /harnesses/{id}/impact-analysis
GET    /harnesses/{id}/compare/{other_harness_id}
```

#### Validation & Analysis

```
POST   /validate/pin-assignment
POST   /validate/ecu-compatibility
POST   /validate/network-load

POST   /analyze/impact
POST   /analyze/cost
POST   /analyze/alternatives
```

**Example: Impact Analysis Request**
```http
POST /analyze/impact
Content-Type: application/json
Authorization: Bearer <token>

{
  "harness_id": "H-2024-12",
  "change_type": "add_feature",
  "feature_id": "heated-steering",
  "target_ecu_id": "BCM-2024-V2"
}
```

**Example: Impact Analysis Response**
```json
{
  "analysis_id": "impact-20251118-001",
  "timestamp": "2025-11-18T14:30:00Z",
  "summary": {
    "requires_ecu_change": true,
    "requires_harness_modification": false,
    "requires_software_update": true,
    "risk_level": "MEDIUM"
  },
  "details": {
    "ecu": {
      "current": "BCM-2024-V2",
      "compatible": false,
      "reason": "Insufficient PWM outputs",
      "alternatives": [
        {
          "part_number": "BCM-2024-V3",
          "cost_delta": 12.50,
          "pros": ["Drop-in replacement", "Same connector"],
          "cons": ["Slightly higher power consumption"]
        }
      ]
    },
    "cost": {
      "per_unit_delta": 14.75,
      "engineering_cost": 21000,
      "total_program_cost": 7375000
    }
  },
  "recommendations": [
    "Upgrade to BCM-2024-V3",
    "Update CAN database for HeatedSteeringControl message",
    "Schedule EMC validation testing"
  ]
}
```

#### Natural Language Query

```
POST   /query/natural-language
```

**Example Request:**
```http
POST /query/natural-language
Content-Type: application/json
Authorization: Bearer <token>

{
  "query": "Show me all ECUs from Bosch under $50 that support CAN FD"
}
```

**Example Response:**
```json
{
  "query_id": "nlq-20251118-001",
  "interpreted_as": {
    "entity": "ECU",
    "filters": [
      {"field": "manufacturer", "operator": "=", "value": "Bosch"},
      {"field": "cost", "operator": "<", "value": 50},
      {"field": "can_fd_support", "operator": "=", "value": true}
    ]
  },
  "natural_language_response": "I found 3 Bosch ECUs under $50 with CAN FD support:\n\n1. BCM-2024-V3 at $47.80\n2. GCM-2025-A1 at $44.20\n3. PCM-2024-X5 at $49.50",
  "structured_results": [
    {
      "id": 123,
      "part_number": "BCM-2024-V3",
      "cost": 47.80,
      "available_pins": 48
    }
  ]
}
```

#### Document Parsing

```
POST   /parse/datasheet
GET    /parse/jobs/{job_id}
GET    /parse/jobs/{job_id}/review
PUT    /parse/jobs/{job_id}/approve
```

**Example: Upload Datasheet**
```http
POST /parse/datasheet
Content-Type: multipart/form-data
Authorization: Bearer <token>

{
  "file": <PDF file>,
  "document_type": "ecu_datasheet",
  "expected_part_number": "BCM-2025-V1"
}
```

**Example Response:**
```json
{
  "job_id": "parse-20251118-001",
  "status": "processing",
  "estimated_completion": "2025-11-18T14:35:00Z"
}
```

---

### WebSocket API (Real-Time Updates)

**Connection:** `wss://api.ecu-config-system.com/v1/ws`

**Authentication:** Send JWT token in connection header or as first message

**Message Types:**

```json
// Subscribe to harness updates
{
  "type": "subscribe",
  "channel": "harness",
  "harness_id": "H-2024-12"
}

// Validation result update
{
  "type": "validation_update",
  "harness_id": "H-2024-12",
  "timestamp": "2025-11-18T14:30:15Z",
  "results": {
    "errors": 2,
    "warnings": 5,
    "details": [...]
  }
}

// Collaborative editing update
{
  "type": "edit",
  "harness_id": "H-2024-12",
  "user": "john.doe@company.com",
  "action": "pin_assigned",
  "data": {
    "pin_id": "BCM-P47",
    "feature_id": "heated-steering"
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-6)

**Deliverables:**
- Database setup (PostgreSQL or Neo4j)
- Core data models implemented
- Basic CRUD API for ECUs, pins, features
- Authentication & authorization
- Simple web UI for data entry

**Technology Stack:**
- Backend: Python (FastAPI) or Node.js (Express)
- Database: PostgreSQL with PostGIS OR Neo4j
- Frontend: React + TypeScript
- Authentication: JWT + OAuth2

**Success Criteria:**
- Can create and store ECUs with full specifications
- Can define features with requirements
- Basic search functionality works
- API documented with OpenAPI/Swagger

---

### Phase 2: Validation Engine (Weeks 7-12)

**Deliverables:**
- Rule engine implementation
- All validation rules coded and tested
- Pin assignment compatibility checker
- Network load calculator
- API endpoints for validation

**Success Criteria:**
- Can validate pin assignments with 95%+ accuracy
- Can detect all electrical incompatibilities
- Can calculate CAN bus load correctly
- Unit test coverage >80%

---

### Phase 3: LLM Integration (Weeks 13-18)

**Deliverables:**
- Spec sheet parser
- Natural language query engine
- Document storage and retrieval
- Human-in-the-loop review interface

**LLM Provider Options:**
- Anthropic Claude (Recommended for technical accuracy)
- OpenAI GPT-4
- Google Gemini
- Local model (Llama 3, Mistral) for sensitive data

**Success Criteria:**
- Can extract data from datasheets with 85%+ accuracy
- Human review interface reduces time by 60%
- Natural language queries work for common use cases
- LLM costs <$0.10 per query average

---

### Phase 4: Visual Designer (Weeks 19-26)

**Deliverables:**
- Interactive harness editor
- Real-time validation overlay
- Drag-and-drop feature assignment
- Diff viewer for version comparison
- Export to CAD formats (DXF, DWG)

**Success Criteria:**
- Engineer can design harness in <2 hours (vs 8+ manual)
- Real-time validation catches errors before commit
- Supports collaborative editing (2+ users simultaneously)
- Can import existing harnesses from CAD

---

### Phase 5: Impact Analysis (Weeks 27-34)

**Deliverables:**
- Multi-dimensional impact analyzer
- Cost calculator with historical data
- Alternative ECU recommender
- Risk assessment engine
- Automated report generation (PDF, Word)

**Success Criteria:**
- Impact analysis completes in <10 seconds
- Cost estimates within 10% of actual
- Risk scoring correlates with actual issues (validated on historical data)
- Generates audit-ready reports (ISO 26262 compliant)

---

### Phase 6: Learning & Optimization (Weeks 35-40)

**Deliverables:**
- Historical decision mining
- GraphRAG for similar design retrieval
- Cost optimization algorithms
- A/B testing framework for recommendations

**Success Criteria:**
- Can suggest ECUs based on past successful designs
- Finds cost savings in 30%+ of scenarios
- Learning system improves recommendations over time

---

## Technology Stack Recommendations

### Option A: Modern Python Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Backend | FastAPI | Async support, auto-docs, type safety |
| Database | PostgreSQL 16 | Robust, mature, excellent JSON support |
| ORM | SQLAlchemy 2.0 | Industry standard, supports async |
| Cache | Redis | Fast, simple, widely supported |
| Task Queue | Celery + Redis | Background jobs (parsing, analysis) |
| API Docs | OpenAPI (built-in) | Auto-generated from FastAPI |
| Testing | pytest | Comprehensive, easy to use |

```python
# Example FastAPI setup
from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession

app = FastAPI(title="ECU Configuration System")

@app.post("/ecus/{ecu_id}/validate-feature")
async def validate_feature(
    ecu_id: int,
    feature_id: int,
    db: AsyncSession = Depends(get_db)
):
    ecu = await db.get(ECU, ecu_id)
    feature = await db.get(Feature, feature_id)
    
    validator = ValidationEngine()
    results = await validator.validate(ecu, feature)
    
    return results.to_dict()
```

---

### Option B: TypeScript Full-Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Backend | Node.js + Express | Single language, large ecosystem |
| Database | PostgreSQL 16 | Same as Python option |
| ORM | Prisma | Type-safe, excellent DX |
| Cache | Redis | Same as Python option |
| Task Queue | BullMQ | Modern, TypeScript-native |
| API Docs | tsoa | Generates OpenAPI from TypeScript |
| Testing | Jest | Standard for Node.js |

```typescript
// Example Express + Prisma setup
import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.post('/ecus/:ecuId/validate-feature', async (req, res) => {
  const ecu = await prisma.eCU.findUnique({
    where: { id: parseInt(req.params.ecuId) },
    include: { pins: true }
  });
  
  const feature = await prisma.feature.findUnique({
    where: { id: req.body.featureId },
    include: { requirements: true }
  });
  
  const validator = new ValidationEngine();
  const results = await validator.validate(ecu, feature);
  
  res.json(results);
});
```

---

### Option C: Graph Database Native

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Backend | Python + FastAPI | Easy Neo4j integration |
| Database | Neo4j 5.x | Native graph operations |
| Neo4j Driver | neo4j-python-driver | Official driver |
| Cache | Redis | Supplement Neo4j for frequent queries |
| Task Queue | Celery + Redis | Same as Option A |

```python
from neo4j import AsyncGraphDatabase

class ECURepository:
    def __init__(self, uri, user, password):
        self.driver = AsyncGraphDatabase.driver(uri, auth=(user, password))
    
    async def find_compatible_ecus(self, feature_id: str):
        async with self.driver.session() as session:
            result = await session.run("""
                MATCH (f:Feature {id: $feature_id})-[:REQUIRES_PIN]->(req)
                MATCH (e:ECU)-[:HAS_PIN]->(p:Pin)
                WHERE p.type = req.pin_type
                  AND p.max_current >= req.current_draw
                  AND p.is_available = true
                WITH e, count(DISTINCT p) as available_pins, f
                MATCH (f)-[:REQUIRES_PIN]->()
                WITH e, available_pins, count(*) as required_pins
                WHERE available_pins >= required_pins
                RETURN e.part_number, e.cost
                ORDER BY e.cost
            """, feature_id=feature_id)
            
            return [record.data() async for record in result]
```

---

### Frontend Stack (Common across options)

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Framework | React 18 | Industry standard, large ecosystem |
| Language | TypeScript | Type safety critical for complex domain |
| State | Redux Toolkit | Predictable state for complex UI |
| Routing | React Router v6 | Standard routing solution |
| UI Components | Material-UI OR Ant Design | Rich component library |
| Canvas | React Flow + Fabric.js | Harness visualization |
| Build | Vite | Fast, modern build tool |
| Testing | Vitest + Testing Library | Fast, comprehensive |

---

## Security & Compliance

### Authentication & Authorization

```typescript
// Role-Based Access Control (RBAC)
enum Role {
  VIEWER = 'viewer',           // Read-only access
  ENGINEER = 'engineer',        // Can edit harnesses, validate
  LEAD_ENGINEER = 'lead',      // Can approve changes, release harnesses
  ADMIN = 'admin'              // Full system access
}

const permissions = {
  [Role.VIEWER]: ['read:ecus', 'read:harnesses', 'read:features'],
  [Role.ENGINEER]: [
    ...permissions[Role.VIEWER],
    'create:harness', 'edit:harness', 'validate:harness',
    'create:feature', 'edit:feature'
  ],
  [Role.LEAD_ENGINEER]: [
    ...permissions[Role.ENGINEER],
    'approve:harness', 'release:harness', 'delete:harness'
  ],
  [Role.ADMIN]: ['*'] // All permissions
};
```

### Audit Logging

```sql
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    change_reason TEXT
);

CREATE INDEX idx_audit_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
```

### Data Protection

**Sensitive Data:**
- ECU pricing (competitive data)
- Supplier contracts
- Unreleased vehicle platforms

**Protection Measures:**
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Field-level encryption for cost data
- IP whitelisting for production access
- Multi-factor authentication for admin roles

### ISO 26262 Compliance

**Traceability Requirements:**
```sql
CREATE TABLE requirements_trace (
    id SERIAL PRIMARY KEY,
    requirement_id VARCHAR(100) NOT NULL,
    requirement_source VARCHAR(200), -- Link to requirements doc
    feature_id INTEGER REFERENCES features(id),
    validation_method VARCHAR(100),
    validation_status VARCHAR(50),
    validated_by VARCHAR(100),
    validated_at TIMESTAMP
);
```

**Change Impact Documentation:**
- Every harness change must link to engineering change order (ECO)
- Automated report generation for functional safety assessment
- Version control integration (Git) with mandatory commit messages

---

## Testing Strategy

### Unit Tests

```python
# tests/test_validation_rules.py
import pytest
from validation import ElectricalRules, Pin, Feature

def test_current_validation_exceeds_max():
    pin = Pin(max_current=0.5)
    feature = Feature(current_draw=0.7)
    
    result = ElectricalRules.validate_current(pin, feature)
    
    assert result.valid == False
    assert "exceeds pin limit" in result.message

def test_current_validation_within_limit():
    pin = Pin(max_current=1.0)
    feature = Feature(current_draw=0.5)
    
    result = ElectricalRules.validate_current(pin, feature)
    
    assert result.valid == True

def test_current_validation_warning_threshold():
    pin = Pin(max_current=1.0)
    feature = Feature(current_draw=0.95)
    
    result = ElectricalRules.validate_current(pin, feature)
    
    assert result.valid == True
    assert result.severity == "WARNING"
```

### Integration Tests

```python
# tests/test_api_integration.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_ecu_search_by_manufacturer():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/ecus/search",
            params={"manufacturer": "Bosch", "cost_max": 50}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) > 0
    assert all(ecu["manufacturer"] == "Bosch" for ecu in data["results"])
    assert all(ecu["cost"] <= 50 for ecu in data["results"])

@pytest.mark.asyncio
async def test_feature_compatibility_check():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/ecus/123/compatibility-check",
            params={"feature_id": 456}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert "compatible" in data
    assert "validation_results" in data
```

### End-to-End Tests

```typescript
// tests/e2e/harness-design.spec.ts
import { test, expect } from '@playwright/test';

test('create harness and assign feature', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'engineer@company.com');
  await page.fill('input[name="password"]', 'test123');
  await page.click('button[type="submit"]');
  
  // Create new harness
  await page.goto('/harnesses/new');
  await page.fill('input[name="version"]', 'H-TEST-001');
  await page.fill('input[name="project"]', 'Test Project');
  await page.click('button:has-text("Create")');
  
  // Add ECU
  await page.click('button:has-text("Add ECU")');
  await page.fill('input[name="ecu-search"]', 'BCM-2024-V3');
  await page.click('text=BCM-2024-V3');
  
  // Drag feature onto ECU
  await page.dragAndDrop(
    '[data-feature="heated-steering"]',
    '[data-ecu="BCM-2024-V3"]'
  );
  
  // Verify validation passed
  await expect(page.locator('.validation-status')).toHaveClass(/success/);
  
  // Save harness
  await page.click('button:has-text("Save")');
  await expect(page.locator('.toast-success')).toContainText('Harness saved');
});
```

### Performance Tests

```python
# tests/test_performance.py
import pytest
import time

def test_impact_analysis_performance():
    """Impact analysis should complete in <5 seconds for typical harness"""
    analyzer = ImpactAnalyzer()
    feature = create_test_feature()
    harness = create_test_harness(ecu_count=10, feature_count=50)
    
    start = time.time()
    report = analyzer.analyze_feature_addition(feature, harness)
    duration = time.time() - start
    
    assert duration < 5.0, f"Analysis took {duration:.2f}s, expected <5s"

def test_validation_performance():
    """Validation should handle 1000 rules in <1 second"""
    validator = ValidationEngine()
    pin = create_test_pin()
    feature = create_test_feature()
    
    start = time.time()
    results = validator.validate_all(pin, feature)
    duration = time.time() - start
    
    assert duration < 1.0, f"Validation took {duration:.2f}s, expected <1s"
```

---

## Deployment Architecture

### Cloud Deployment (Recommended)

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/ecu_config
      REDIS_URL: redis://cache:6379
      LLM_API_KEY: ${ANTHROPIC_API_KEY}
    depends_on:
      - db
      - cache
    volumes:
      - ./backend:/app
    command: uvicorn main:app --host 0.0.0.0 --reload

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: http://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: ecu_config
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  cache:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  worker:
    build: ./backend
    command: celery -A tasks worker --loglevel=info
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/ecu_config
      REDIS_URL: redis://cache:6379
    depends_on:
      - db
      - cache

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Deployment (Production Scale)

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ecu-config-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ecu-config-api
  template:
    metadata:
      labels:
        app: ecu-config-api
    spec:
      containers:
      - name: api
        image: ecu-config-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 4Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: ecu-config-api
spec:
  selector:
    app: ecu-config-api
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

---

## Domain Extensions

### Manufacturing / Computer Vision

**Mapped Concepts:**
- **ECU** → Edge device (NVIDIA Jetson, Intel NUC)
- **Pin** → I/O port (USB, Ethernet, GPIO)
- **Feature** → Vision algorithm (pose estimation, defect detection)
- **Harness** → Camera/device topology
- **Network** → Data network (Ethernet, WiFi)

**Additional Constraints:**
- Bandwidth requirements (cameras generate huge data)
- Processing latency (real-time vs. batch)
- GPU memory limits
- Camera calibration compatibility

```python
class VisionSystemValidator:
    def validate_camera_assignment(self, camera: Camera, edge_device: EdgeDevice):
        # Check bandwidth
        if camera.resolution == '4K' and camera.framerate >= 30:
            required_bandwidth_mbps = 250
        else:
            required_bandwidth_mbps = 100
        
        if edge_device.network_bandwidth_mbps < required_bandwidth_mbps:
            return ValidationResult(
                valid=False,
                message=f"Insufficient bandwidth: need {required_bandwidth_mbps}Mbps, have {edge_device.network_bandwidth_mbps}Mbps"
            )
        
        # Check processing capacity
        required_fps = camera.framerate
        device_capacity_fps = edge_device.max_fps_for_algorithm(camera.algorithm)
        
        if device_capacity_fps < required_fps:
            return ValidationResult(
                valid=False,
                message=f"Processing overload: device can handle {device_capacity_fps}fps, camera requires {required_fps}fps"
            )
        
        return ValidationResult(valid=True)
```

---

### Industrial Automation / PLC

**Mapped Concepts:**
- **ECU** → PLC module (Siemens S7, Allen-Bradley)
- **Pin** → I/O point
- **Feature** → Control loop, sensor, actuator
- **Network** → Fieldbus (EtherCAT, PROFINET)

**Additional Constraints:**
- Scan time requirements
- I/O response time
- Safety integrity level (SIL)
- Explosion-proof ratings (ATEX)

---

### Data Center / Cloud

**Mapped Concepts:**
- **ECU** → Server SKU
- **Pin** → Network port, PCIe slot
- **Feature** → Workload, service
- **Network** → Datacenter network topology

**Additional Constraints:**
- Power budget per rack
- Cooling capacity
- Network bisection bandwidth
- Storage IOPS requirements

---

## Success Metrics

### Engineering Efficiency
- **Time to design harness**: Reduce from 8 hours → 2 hours (75% reduction)
- **Time to analyze change impact**: Reduce from 4 hours → 10 minutes (95% reduction)
- **Design errors caught**: Increase from 70% → 95%

### Quality Metrics
- **ECU selection accuracy**: >95% of suggested ECUs work in production
- **Validation false positive rate**: <5%
- **Cost estimation accuracy**: Within 10% of actual

### Business Impact
- **Engineering cost savings**: $500k+ annually per major project
- **Reduced late-stage changes**: 40% reduction (measured by ECO count)
- **Faster time-to-market**: 2-4 weeks saved per vehicle program

---

## Open Questions for AI Coder

1. **Preferred database**: PostgreSQL or Neo4j? (Depends on query patterns)
2. **Backend language**: Python or TypeScript?
3. **LLM provider**: Anthropic, OpenAI, or local?
4. **Cloud provider**: AWS, Azure, GCP, or on-premise?
5. **Frontend complexity**: Full CAD-like editor or simpler block diagram?
6. **Phase priority**: Which phase to implement first? (Recommend Phase 1 + Phase 2)
7. **Integration requirements**: Need to integrate with existing PLM/CAD systems?
8. **Security requirements**: On-premise deployment required due to data sensitivity?
9. **Budget constraints**: Open-source only or can use commercial tools?
10. **Timeline**: What's the target for MVP?

---

## Getting Started

### Recommended First Steps

1. **Set up development environment**
   ```bash
   # Backend
   cd backend
   python -m venv venv
   source venv/bin/activate  # or `venv\Scripts\activate` on Windows
   pip install -r requirements.txt
   
   # Frontend
   cd frontend
   npm install
   
   # Start databases
   docker-compose up -d db cache
   
   # Run migrations
   alembic upgrade head
   
   # Start backend
   uvicorn main:app --reload
   
   # Start frontend (in separate terminal)
   npm run dev
   ```

2. **Load sample data**
   ```bash
   python scripts/seed_database.py
   ```

3. **Run tests**
   ```bash
   pytest
   npm test
   ```

4. **Access application**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs
   - Database: localhost:5432

---

## Appendix

### Glossary

- **ASIL**: Automotive Safety Integrity Level (ISO 26262)
- **CAN**: Controller Area Network (automotive communication protocol)
- **CAN FD**: CAN with Flexible Data-Rate (higher bandwidth variant)
- **DLC**: Data Length Code (number of bytes in CAN message)
- **ECU**: Electronic Control Unit
- **LIN**: Local Interconnect Network (low-speed automotive bus)
- **PWM**: Pulse Width Modulation
- **ASIL ratings**: QM (non-safety), ASIL-A (lowest), ASIL-D (highest)

### References

- ISO 26262: Road vehicles - Functional safety
- CAN Specification 2.0
- SAE J1939: Vehicle Network for Heavy-Duty Vehicles
- AUTOSAR: Automotive Open System Architecture
- CISPR 25: EMC requirements for vehicles

---

## Document Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-18 | Initial specification | AI Assistant |

---

**End of Specification Document**

Total Pages: ~50 equivalent print pages
Total Words: ~15,000+
Estimated Implementation Time: 6-12 months (depending on team size and phase scope)
