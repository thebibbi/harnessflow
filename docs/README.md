# HarnessFlow Documentation

**Last Updated:** 2025-11-19
**Version:** 1.0

---

## Welcome

This directory contains all technical documentation for HarnessFlow, an intelligent electrical change-impact engine for automotive wiring harness design and validation.

---

## Quick Navigation

### 🚀 **Getting Started**
- [Main README](../README.md) - Project overview
- [Technical Specification](./consolidated/TECHNICAL_SPECIFICATION.md) - **START HERE** for complete system overview
- [Implementation Roadmap](./implementation/IMPLEMENTATION_ROADMAP.md) - Development timeline and milestones

### 📐 **Architecture**
- [Architecture Comparison](./architecture-analysis/ARCHITECTURE_COMPARISON.md) - Analysis of different approaches
- [Architecture Decision Records](./consolidated/ARCHITECTURE_DECISION_RECORDS.md) - Key technical decisions
- [Data Model Specification](./consolidated/DATA_MODEL_SPECIFICATION.md) - Complete database schema and types

### 🔌 **Integrations**
- [WireViz Integration Guide](./wireviz-integration/README.md) - Multi-format import/export
- [WireViz Implementation Roadmap](./wireviz-integration/IMPLEMENTATION_ROADMAP.md)
- [WireViz ADR](./wireviz-integration/ADR_WIREVIZ_INTEGRATION.md)
- [WireViz Examples](./wireviz-integration/EXAMPLES_AND_USE_CASES.md)

### 🔨 **Implementation**
- [Implementation Roadmap](./implementation/IMPLEMENTATION_ROADMAP.md) - Detailed phased development plan

---

## Documentation Structure

```
docs/
├── README.md                       # This file - documentation index
│
├── consolidated/                   # Single source of truth
│   ├── TECHNICAL_SPECIFICATION.md  # ⭐ Main spec document
│   ├── ARCHITECTURE_DECISION_RECORDS.md
│   └── DATA_MODEL_SPECIFICATION.md
│
├── architecture-analysis/          # Historical analysis
│   └── ARCHITECTURE_COMPARISON.md
│
├── wireviz-integration/            # WireViz-specific docs
│   ├── README.md
│   ├── IMPLEMENTATION_ROADMAP.md
│   ├── ADR_WIREVIZ_INTEGRATION.md
│   └── EXAMPLES_AND_USE_CASES.md
│
└── implementation/                 # Development planning
    └── IMPLEMENTATION_ROADMAP.md
```

---

## Document Status

| Document | Status | Audience |
|----------|--------|----------|
| [TECHNICAL_SPECIFICATION.md](./consolidated/TECHNICAL_SPECIFICATION.md) | **AUTHORITATIVE** | All stakeholders |
| [DATA_MODEL_SPECIFICATION.md](./consolidated/DATA_MODEL_SPECIFICATION.md) | **AUTHORITATIVE** | Developers |
| [ARCHITECTURE_DECISION_RECORDS.md](./consolidated/ARCHITECTURE_DECISION_RECORDS.md) | **APPROVED** | Architects, Lead Devs |
| [IMPLEMENTATION_ROADMAP.md](./implementation/IMPLEMENTATION_ROADMAP.md) | **ACTIVE** | Project Managers, Devs |
| [WireViz Integration/*](./wireviz-integration/) | **APPROVED** | Developers |
| [ARCHITECTURE_COMPARISON.md](./architecture-analysis/ARCHITECTURE_COMPARISON.md) | **REFERENCE** | Architects |

---

## Reading Guide

### For Project Managers
**Goal:** Understand timeline, resources, and deliverables

1. Start: [TECHNICAL_SPECIFICATION.md](./consolidated/TECHNICAL_SPECIFICATION.md) - Executive Summary
2. Then: [IMPLEMENTATION_ROADMAP.md](./implementation/IMPLEMENTATION_ROADMAP.md) - Full timeline
3. Reference: [ARCHITECTURE_COMPARISON.md](./architecture-analysis/ARCHITECTURE_COMPARISON.md) - Why we chose this approach

### For Developers
**Goal:** Build the system

1. Start: [TECHNICAL_SPECIFICATION.md](./consolidated/TECHNICAL_SPECIFICATION.md) - Complete overview
2. Then: [DATA_MODEL_SPECIFICATION.md](./consolidated/DATA_MODEL_SPECIFICATION.md) - Database schemas
3. Reference: [ARCHITECTURE_DECISION_RECORDS.md](./consolidated/ARCHITECTURE_DECISION_RECORDS.md) - Why decisions were made
4. Implementation: [IMPLEMENTATION_ROADMAP.md](./implementation/IMPLEMENTATION_ROADMAP.md) - Week-by-week tasks
5. Integration: [WireViz Integration](./wireviz-integration/README.md) - Format support

### For Architects
**Goal:** Understand system design and decisions

1. Start: [ARCHITECTURE_COMPARISON.md](./architecture-analysis/ARCHITECTURE_COMPARISON.md) - Analysis of options
2. Then: [ARCHITECTURE_DECISION_RECORDS.md](./consolidated/ARCHITECTURE_DECISION_RECORDS.md) - Decisions made
3. Reference: [TECHNICAL_SPECIFICATION.md](./consolidated/TECHNICAL_SPECIFICATION.md) - Final architecture
4. Deep Dive: [DATA_MODEL_SPECIFICATION.md](./consolidated/DATA_MODEL_SPECIFICATION.md) - Data architecture

### For Stakeholders
**Goal:** Understand value proposition and timeline

1. Start: [TECHNICAL_SPECIFICATION.md](./consolidated/TECHNICAL_SPECIFICATION.md) - Executive Summary
2. Then: [IMPLEMENTATION_ROADMAP.md](./implementation/IMPLEMENTATION_ROADMAP.md) - Phases and milestones
3. Reference: [ARCHITECTURE_COMPARISON.md](./architecture-analysis/ARCHITECTURE_COMPARISON.md) - Why this approach

---

## Key Decisions Summary

### Database
✅ **PostgreSQL 15+ with Apache AGE graph extension**
- Single database for relational + graph data
- Team-familiar SQL with powerful graph queries
- Lower operational complexity than multi-DB approach

See: [ADR-001](./consolidated/ARCHITECTURE_DECISION_RECORDS.md#adr-001-database-strategy)

### LLM Integration
✅ **LLM as "Smart ETL + Assistant" (Not Decision Maker)**
- Document parsing and extraction
- Natural language interface
- Result explanation
- NEVER for calculations or final decisions

See: [ADR-002](./consolidated/ARCHITECTURE_DECISION_RECORDS.md#adr-002-llm-integration-boundaries)

### Architecture Style
✅ **Modular Monolith → Microservices**
- Start simple with clear module boundaries
- Extract services only when needed
- Easier development and debugging initially

See: [ADR-003](./consolidated/ARCHITECTURE_DECISION_RECORDS.md#adr-003-architecture-style)

### Input Formats
✅ **Multi-Format Support: KBL/VEC, WireViz, Excel, PDF**
- Unified internal model
- Import from any source
- Export to multiple formats

See: [ADR-004](./consolidated/ARCHITECTURE_DECISION_RECORDS.md#adr-004-multi-format-input-support)

### Validation
✅ **Hybrid: Deterministic Rules + Graph Algorithms**
- Electrical, protocol, safety, physical constraints
- Graph traversal for impact analysis
- LLM for explanation only

See: [ADR-005](./consolidated/ARCHITECTURE_DECISION_RECORDS.md#adr-005-constraint-engine-design)

### Frontend
✅ **Next.js 14 + React Flow + Shadcn/UI**
- Modern, performant stack
- Interactive harness visualization
- Type-safe with TypeScript

See: [ADR-006](./consolidated/ARCHITECTURE_DECISION_RECORDS.md#adr-006-frontend-technology-stack)

### API
✅ **GraphQL for Queries + REST for Mutations**
- Flexible nested data fetching
- Simple mutations
- Type-safe with code generation

See: [ADR-007](./consolidated/ARCHITECTURE_DECISION_RECORDS.md#adr-007-api-design)

---

## Superseded Documents

The following original documents have been **superseded** by the consolidated specifications:

### ⚠️ Historical Reference Only
- `/SystemArchitecture.md` → Superseded by [TECHNICAL_SPECIFICATION.md](./consolidated/TECHNICAL_SPECIFICATION.md)
- `/ECU_Configuration_System_Specification.md` → Consolidated into [DATA_MODEL_SPECIFICATION.md](./consolidated/DATA_MODEL_SPECIFICATION.md)
- `/AdditionalSpec.md` → Analysis incorporated into [ARCHITECTURE_COMPARISON.md](./architecture-analysis/ARCHITECTURE_COMPARISON.md)
- `/AlternateConfig.md` → Analysis incorporated into [ARCHITECTURE_COMPARISON.md](./architecture-analysis/ARCHITECTURE_COMPARISON.md)

**Important:** Do NOT use these documents for implementation. Refer to the consolidated documents instead.

---

## Development Workflow

### Phase 1: MVP (Months 0-4)

**Current Phase:** ✅ Documentation Complete → ⏭️ Ready for Development

**Next Steps:**
1. Review [IMPLEMENTATION_ROADMAP.md](./implementation/IMPLEMENTATION_ROADMAP.md) - Week 1-2 tasks
2. Set up development environment
3. Initialize project structure
4. Begin Sprint 1

**Key Documents:**
- [TECHNICAL_SPECIFICATION.md](./consolidated/TECHNICAL_SPECIFICATION.md) - System overview
- [DATA_MODEL_SPECIFICATION.md](./consolidated/DATA_MODEL_SPECIFICATION.md) - Database schema
- [IMPLEMENTATION_ROADMAP.md](./implementation/IMPLEMENTATION_ROADMAP.md) - Weekly tasks

---

## Contributing to Documentation

### Document Naming Conventions
- Use `SCREAMING_SNAKE_CASE.md` for major documents
- Use `lowercase-with-dashes.md` for supporting documents
- Always include version and date in document header

### Document Templates

**Technical Specification:**
```markdown
# [Title]

**Version:** X.Y
**Date:** YYYY-MM-DD
**Status:** [Draft|Approved|Authoritative|Reference]

## Executive Summary
...

## [Sections]
...

**Document Status:** [Status]
**Next Review:** [Date]
```

**Architecture Decision Record:**
```markdown
## ADR-XXX: [Title]

### Status
[Proposed|Approved|Deprecated|Superseded]

### Context
...

### Decision
...

### Consequences
...
```

### Review Process
1. Create PR with documentation changes
2. Tag relevant reviewers (@architects, @tech-leads)
3. Address feedback
4. Merge after approval
5. Update version and date

---

## Glossary

| Term | Definition |
|------|------------|
| **ECU** | Electronic Control Unit - embedded computer in vehicle |
| **ASIL** | Automotive Safety Integrity Level (ISO 26262) |
| **KBL** | Kabelbaum Liste - German automotive wiring standard (VDA 4964) |
| **VEC** | Vehicle Electric Container - newer automotive wiring standard (VDA 4968) |
| **CAN** | Controller Area Network - vehicle communication protocol |
| **LIN** | Local Interconnect Network - low-speed vehicle bus |
| **BOM** | Bill of Materials - list of parts and quantities |
| **ADR** | Architecture Decision Record - document explaining key technical decisions |
| **MVP** | Minimum Viable Product - initial working version |

---

## External Resources

### Standards
- [ISO 26262](https://www.iso.org/standard/68383.html) - Functional safety for road vehicles
- [KBL Standard (VDA 4964)](https://www.vda.de/) - Cable harness standard
- [VEC Standard (VDA 4968)](https://www.vda.de/) - Vehicle electrical container

### Technologies
- [PostgreSQL](https://www.postgresql.org/) - Primary database
- [Apache AGE](https://age.apache.org/) - Graph extension for PostgreSQL
- [Next.js](https://nextjs.org/) - Frontend framework
- [React Flow](https://reactflow.dev/) - Interactive node-based UIs
- [WireViz](https://github.com/wireviz/WireViz) - Harness documentation tool

### Similar Projects
- [Zuken E3.series](https://www.zuken.com/en/products/e3-series) - Commercial harness design
- [CATIA Electrical](https://www.3ds.com/products/catia/electrical) - CAD-integrated harness design

---

## Support

### Questions?
- Technical: See [TECHNICAL_SPECIFICATION.md](./consolidated/TECHNICAL_SPECIFICATION.md)
- Architecture: See [ARCHITECTURE_DECISION_RECORDS.md](./consolidated/ARCHITECTURE_DECISION_RECORDS.md)
- Implementation: See [IMPLEMENTATION_ROADMAP.md](./implementation/IMPLEMENTATION_ROADMAP.md)

### Report Issues
- Documentation bugs: Create issue with label `documentation`
- Technical questions: Create discussion in GitHub Discussions

---

## Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-19 | Initial consolidated documentation | HarnessFlow Team |

---

**Ready to build?** Start with [TECHNICAL_SPECIFICATION.md](./consolidated/TECHNICAL_SPECIFICATION.md) 🚀
