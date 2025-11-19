# HarnessFlow

**Intelligent Electrical Change-Impact Engine for Automotive Wiring Harness Design**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Documentation](https://img.shields.io/badge/docs-complete-brightgreen.svg)](./docs/README.md)
[![Status](https://img.shields.io/badge/status-planning-yellow.svg)](./docs/implementation/IMPLEMENTATION_ROADMAP.md)

---

## What is HarnessFlow?

HarnessFlow automates the time-consuming process of analyzing electrical changes in automotive wiring harnesses. When adding or modifying vehicle features, engineers can now get instant answers to critical questions:

- ✅ Can this ECU handle the new load?
- ✅ Which pins are available and compatible?
- ✅ What's the impact on wiring, fuses, and bus load?
- ✅ Are there safety compliance issues?
- ✅ How much will this cost?

**What used to take days now takes minutes.**

---

## Key Features

### 🔄 **Multi-Format Support**
- Import from: KBL/VEC XML, WireViz YAML, Excel/CSV, PDF datasheets
- Export to: KBL/VEC, WireViz, Excel, PDF reports
- No vendor lock-in - use your existing data

### ⚡ **Intelligent Validation**
- **Electrical:** Current limits, voltage compatibility, power budgets
- **Protocol:** CAN/LIN/FlexRay bus load and timing
- **Safety:** ISO 26262 ASIL compliance and redundancy
- **Physical:** Wire gauge, connector compatibility, routing

### 📊 **Impact Analysis**
- Graph-based dependency tracking
- Automatic affected component detection
- Cost estimation for changes
- Visual impact highlighting

### 🎨 **Interactive Editor**
- Drag-and-drop harness design
- Real-time validation feedback
- Auto-layout algorithms
- Intuitive UI built with React Flow

### 🤖 **AI-Assisted (But Safe)**
- LLM-powered document parsing (PDFs → structured data)
- Natural language queries ("Can I add heated steering?")
- Plain-English explanations of technical results
- **Note:** All decisions are deterministic - AI assists, never decides

---

## Quick Start

```bash
# Prerequisites
- Node.js 20+
- PostgreSQL 15+
- pnpm 8+

# Clone repository
git clone https://github.com/yourorg/harnessflow.git
cd harnessflow

# Install dependencies
pnpm install

# Set up database
createdb harnessflow_dev
cd backend && npx prisma migrate dev

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development servers
pnpm dev

# Open browser
http://localhost:3000
```

**See:** [Technical Specification](./docs/consolidated/TECHNICAL_SPECIFICATION.md#quick-start-for-developers) for detailed setup

---

## Documentation

### 📚 **Main Documentation**
- **[Documentation Index](./docs/README.md)** - Start here for all documentation
- **[Technical Specification](./docs/consolidated/TECHNICAL_SPECIFICATION.md)** - Complete system overview ⭐
- **[Implementation Roadmap](./docs/implementation/IMPLEMENTATION_ROADMAP.md)** - Development timeline

### 🏗️ **Architecture**
- [Architecture Decision Records](./docs/consolidated/ARCHITECTURE_DECISION_RECORDS.md) - Key technical decisions
- [Data Model Specification](./docs/consolidated/DATA_MODEL_SPECIFICATION.md) - Database schema
- [Architecture Comparison](./docs/architecture-analysis/ARCHITECTURE_COMPARISON.md) - Why we chose this approach

### 🔌 **Integrations**
- [WireViz Integration](./docs/wireviz-integration/README.md) - Open-source harness format support
- [Examples & Use Cases](./docs/wireviz-integration/EXAMPLES_AND_USE_CASES.md)

---

## Project Status

**Current Phase:** 📋 Documentation Complete → 🚀 Ready for Development

### Completed ✅
- [x] Architecture analysis and decision
- [x] Data model design
- [x] Technical specification
- [x] Implementation roadmap
- [x] WireViz integration design

### In Progress 🔨
- [ ] Development environment setup (Week 1-2)
- [ ] Core data model implementation (Week 3-4)
- [ ] Import/export parsers (Weeks 5-8)

### Next Up ⏭️
- MVP delivery target: Month 4
- Production ready: Month 8
- Enterprise features: Month 14

**See:** [Implementation Roadmap](./docs/implementation/IMPLEMENTATION_ROADMAP.md) for detailed timeline

---

## Technology Stack

### Backend
- **Runtime:** Node.js 20 + TypeScript 5
- **Framework:** NestJS 10
- **Database:** PostgreSQL 15 + Apache AGE (graph extension)
- **ORM:** Prisma 5
- **API:** GraphQL (Apollo) + REST

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Visualization:** React Flow 11
- **Components:** Shadcn/UI
- **State:** Zustand 4
- **Styling:** Tailwind CSS 3

### Infrastructure
- **Hosting:** Vercel (frontend) + Railway (backend)
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry
- **LLM:** Anthropic Claude Sonnet 4.5

**See:** [Technical Specification - Technology Stack](./docs/consolidated/TECHNICAL_SPECIFICATION.md#technology-stack)

---

## Architecture Highlights

### Modular Monolith Design
```
┌─────────────────────────────────────┐
│    HarnessFlow Application          │
├─────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐        │
│  │Ingestion │  │  Domain  │        │
│  │  Module  │→│  Module  │        │
│  └──────────┘  └──────────┘        │
│       ↓              ↓               │
│  PostgreSQL + Apache AGE            │
└─────────────────────────────────────┘
```

### Key Design Decisions
1. **Database:** PostgreSQL + Apache AGE (relational + graph in one)
2. **LLM Use:** Parsing & explanation only (not decision-making)
3. **Validation:** Deterministic rules + graph algorithms
4. **Architecture:** Modular monolith → microservices (when needed)

**See:** [Architecture Decision Records](./docs/consolidated/ARCHITECTURE_DECISION_RECORDS.md) for rationale

---

## Example Use Cases

### Use Case 1: Add Heated Steering Wheel
```
Engineer: "Can I add heated steering wheel feature?"

HarnessFlow:
✅ Found 2 compatible pins on BCM_B2 (connector C3)
✅ Current capacity: 15A available (feature needs 3.5A)
✅ Bus load: CAN-HS at 45% (adding 5% = 50%, within limits)
✅ Wiring: 1.5mm² wire required, route via existing harness
⚠️ Impact: Need to update fuse F12 from 10A → 15A
💰 Cost: ~$45 (connector, wire, fuse)

Recommendation: Use BCM_B2_C3_P24 (Option 1)
```

### Use Case 2: Import Legacy Harness
```bash
# Import existing Excel harness data
$ upload harness.xlsx

# Map columns (interactive UI)
From Pin: Column A
To Pin: Column B
Wire Gauge: Column C
Color: Column D

# Validate
✅ Imported 247 wires, 18 connectors, 5 ECUs
⚠️ 3 warnings: Wire gauge undersized for current

# Edit visually in React Flow editor
# Export to KBL for CAD integration
```

### Use Case 3: Validate Design
```typescript
// Run full validation
const results = await validateHarness(harnessId);

// Results:
❌ 2 Errors:
  - Pin BCM_X1_P12: Current 8A exceeds pin limit 5A
  - CAN-HS: Bus load 92% exceeds max 80%

⚠️ 5 Warnings:
  - Wire W45: Voltage drop 0.8V (6.7% of 12V)
  - Feature "Rear Fog Lamp": Missing ASIL rating

ℹ️ 12 Infos:
  - 15 spare pins available on BCM
  - LIN-Body bus has capacity for 3 more nodes
```

**See:** [Examples & Use Cases](./docs/wireviz-integration/EXAMPLES_AND_USE_CASES.md) for more

---

## Contributing

We welcome contributions! Please see:

### Getting Involved
1. **Code:** Follow implementation roadmap, submit PRs
2. **Documentation:** Improve guides, add examples
3. **Testing:** Report bugs, suggest features
4. **Community:** Help others, share use cases

### Development Workflow
```bash
# 1. Fork and clone
git clone https://github.com/yourfork/harnessflow.git

# 2. Create branch
git checkout -b feature/your-feature

# 3. Make changes, add tests
pnpm test

# 4. Commit (conventional commits)
git commit -m "feat: add voltage drop calculator"

# 5. Push and create PR
git push origin feature/your-feature
```

### Code Style
- **TypeScript:** Strict mode, explicit types
- **Formatting:** Prettier (auto-format on commit)
- **Linting:** ESLint (must pass CI)
- **Testing:** >80% coverage for new code
- **Commits:** Conventional Commits format

---

## Roadmap

### Phase 1: MVP (Months 0-4) 🎯 Current
- [x] Documentation complete
- [ ] Core data model
- [ ] WireViz & Excel import
- [ ] Interactive harness editor
- [ ] Basic validation
- **Delivery:** Working prototype

### Phase 2: Production (Months 5-8)
- [ ] KBL/VEC XML support
- [ ] PDF parsing (LLM-powered)
- [ ] Complete constraint engine
- [ ] Impact analysis
- [ ] Change request workflow
- **Delivery:** Production v1.0

### Phase 3: Enterprise (Months 9-14)
- [ ] Real-time collaboration
- [ ] External integrations (Jira, PLM)
- [ ] Advanced reporting
- [ ] On-premise deployment
- **Delivery:** Enterprise-ready

### Phase 4: Scale (Months 15-24)
- [ ] AI-powered suggestions
- [ ] Predictive analytics
- [ ] Mobile app
- [ ] Multi-tenant SaaS
- **Delivery:** Global platform

**See:** [Implementation Roadmap](./docs/implementation/IMPLEMENTATION_ROADMAP.md) for details

---

## Comparison with Existing Tools

| Feature | HarnessFlow | CAD Tools (CATIA, Zuken) | WireViz |
|---------|-------------|--------------------------|---------|
| **Interactive Editor** | ✅ Web-based | ✅ Desktop only | ❌ Text only |
| **Change Impact** | ✅ Automated | ⚠️ Manual | ❌ None |
| **Multi-Format** | ✅ KBL/VEC/WireViz/Excel | ⚠️ Proprietary | ❌ YAML only |
| **Validation** | ✅ Real-time | ⚠️ Limited | ❌ None |
| **Cost** | 💰 Open-source | 💰💰💰 $10k+/seat | 💰 Free |
| **Learning Curve** | ⭐⭐ Easy | ⭐⭐⭐⭐⭐ Steep | ⭐⭐⭐ Medium |
| **Collaboration** | ✅ Cloud-based | ⚠️ File-based | ⚠️ Git-based |
| **AI-Assisted** | ✅ Yes | ❌ No | ❌ No |

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

### Documentation
- 📚 [Full Documentation](./docs/README.md)
- 🏗️ [Technical Specification](./docs/consolidated/TECHNICAL_SPECIFICATION.md)
- 🚀 [Implementation Roadmap](./docs/implementation/IMPLEMENTATION_ROADMAP.md)

### Community
- 💬 [GitHub Discussions](https://github.com/yourorg/harnessflow/discussions) - Q&A and community
- 🐛 [Issue Tracker](https://github.com/yourorg/harnessflow/issues) - Bug reports and feature requests
- 📧 [Email](mailto:hello@harnessflow.com) - General inquiries

### Commercial Support
- Enterprise deployments
- Custom integrations
- Priority support
- Contact: [enterprise@harnessflow.com](mailto:enterprise@harnessflow.com)

---

## Acknowledgments

### Inspired By
- [WireViz](https://github.com/wireviz/WireViz) - Open-source harness documentation
- [React Flow](https://reactflow.dev/) - Interactive node-based UIs
- ISO 26262 community - Safety standards and best practices

### Built With
- [PostgreSQL](https://www.postgresql.org/) + [Apache AGE](https://age.apache.org/)
- [Next.js](https://nextjs.org/) + [React](https://react.dev/)
- [Anthropic Claude](https://www.anthropic.com/) - AI assistance

---

## Star History

⭐ **Star this repo** if you find it useful!

---

**Ready to revolutionize harness design?** Get started with our [Technical Specification](./docs/consolidated/TECHNICAL_SPECIFICATION.md) 🚀

---

<p align="center">
  Made with ❤️ by the HarnessFlow Team
</p>
