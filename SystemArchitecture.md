1. System architecture (Mermaid diagram)

flowchart LR
    %% Users
    U[Design / EE / Systems Engineer]

    %% Frontend
    subgraph FE[Frontend (Web UI)]
        FE1[Model Browser\n(ECUs, harnesses, features)]
        FE2[Upload & Mapping UI\n(PDF/Excel/specs)]
        FE3[Change Request UI\n(\"Add feature X\")]
        FE4[Impact Visualization\n(graphs, harness views)]
        FE5[Review & Approval UI]
    end

    %% Backend API
    subgraph API[Backend API Layer]
        APIGW[API Gateway / BFF]
        AUTH[Auth & RBAC]
    end

    %% Services
    subgraph SVC[Backend Services]
        subgraph ING[Ingestion Services]
            IS1[ECU Spec Ingestion Service]
            IS2[Harness Ingestion Service]
            IS3[Requirement/Feature\nNL → Structured Mapper]
        end
        
        subgraph CORE[Core Domain Services]
            GS[Graph Service\n(read/write graph)]
            RS[Rules & Constraint Engine]
            QS[Query & Reporting Service]
        end

        subgraph AI[LLM Adapter Layer]
            LLMAPI[LLM / Multimodal Adapter\n(PDF→JSON, NL Q&A)]
        end
    end

    %% Data Stores
    subgraph DATA[Data & Knowledge Stores]
        GDB[(Graph DB\n(ECU–Harness–Feature graph))]
        RDB[(Relational DB\n(projects, users, versions))]
        DOC[(Document Store\n(raw PDFs, Excels))]
        VDB[(Vector DB\n(semantic search over specs))]
    end

    %% External
    subgraph EXT[External Services]
        LLMEXT[LLM Provider\n(Hosted/On-prem)]
        EVT[Tool Integrations\n(RM/ALM, PLM, Jira, etc.)]
    end

    %% User -> Frontend
    U --> FE1
    U --> FE2
    U --> FE3
    U --> FE4
    U --> FE5

    %% Frontend <-> API
    FE1 --> APIGW
    FE2 --> APIGW
    FE3 --> APIGW
    FE4 --> APIGW
    FE5 --> APIGW
    APIGW --> AUTH

    %% Upload / ingestion flows
    APIGW --> IS1
    APIGW --> IS2
    APIGW --> IS3

    IS1 --> DOC
    IS2 --> DOC

    IS1 --> LLMAPI
    IS2 --> LLMAPI
    IS3 --> LLMAPI

    LLMAPI --> LLMEXT

    %% Parsed data to stores
    IS1 --> GDB
    IS1 --> RDB
    IS2 --> GDB
    IS2 --> RDB
    IS3 --> GDB
    IS3 --> RDB
    IS1 --> VDB
    IS2 --> VDB

    %% Core domain flows
    APIGW --> GS
    APIGW --> RS
    APIGW --> QS

    GS --> GDB
    RS --> GDB
    RS --> RDB
    QS --> GDB
    QS --> RDB

    %% Reporting / integration
    QS --> EVT
    
    
    2. What each piece does (brief)

Frontend (FE)
	•	Model Browser (FE1)
Browse ECUs, harnesses, connectors, pins, and features as a graph/table. Think: “show me BCM_B2 and all outputs on connector C3.”
	•	Upload & Mapping UI (FE2)
	•	Upload ECU PDFs, harness Excels, or existing exports.
	•	Let user confirm/adjust how columns/tables map to your internal schema (pin capabilities, wire gauge, etc.).
	•	Change Request UI (FE3)
	•	Engineer creates a “change request”:
e.g., “Add rear fog lamp” or “Move camera to different ECU.”
	•	Can be free-text + structured form.
	•	Impact Visualization (FE4)
	•	Shows:
	•	Affected harness segments, ECUs, pins, fuses, busses.
	•	Graph view and simplified harness layout.
	•	Lets user inspect alternative solutions (e.g., different spare pins).
	•	Review & Approval (FE5)
	•	Formalize the change:
	•	“Selected option: use BCM_B2_C3_24, add 1.5mm² wire to X_RR, update F12 to 15A.”
	•	Capture approvals, comments, and exportable reports.

⸻

Backend API Layer
	•	API Gateway / BFF (APIGW)
	•	Single entry point for the frontend.
	•	Handles request shaping for the underlying services.
	•	Auth & RBAC (AUTH)
	•	Who can:
	•	Import/modify ECU libraries?
	•	Approve changes?
	•	Just view models?

⸻

Ingestion Services (ING)
	•	ECU Spec Ingestion (IS1)
	•	Takes PDF/specs.
	•	Sends them through LLM adapter to extract:
	•	Connectors, pins, pin names.
	•	Electrical capabilities, current limits.
	•	Bus capabilities, special modes.
	•	Produces structured entities for GDB / RDB, stores original files in DOC, embeddings in VDB.
	•	UI step for human validation before committing.
	•	Harness Ingestion (IS2)
	•	Accepts Excel/CSV or tool-specific export.
	•	LLM can assist column mapping and error checking.
	•	Builds harness graph: wires, splices, fuses, connectors.
	•	Requirement/Feature Mapper (IS3)
	•	Input: free-text “feature” description.
	•	Output: structured signal requirements:
	•	Signal types, I/O requirements, safety level, bus preference.
	•	Ties new feature to graph entities.

⸻

Core Domain Services (CORE)
	•	Graph Service (GS)
	•	Thin layer over Graph DB.
	•	APIs like:
	•	getEcuGraph(ecuId)
	•	getHarnessSegment(pathId)
	•	getSignalsForFeature(featureId)
	•	Rules & Constraint Engine (RS)
	•	Deterministic engine:
	•	Pin type compatibility (DIO vs analog vs PWM vs bus).
	•	Current/voltage limits, wire gauge/fuse constraints.
	•	Bus utilization & timing.
	•	Safety constraints (redundancy, ASIL separation, etc.).
	•	Given a “change request” + feature mapping, it:
	•	Searches graph for candidate implementation options (spare pins, new ECUs).
	•	Rejects options that violate constraints.
	•	Scores viable options.
	•	Query & Reporting Service (QS)
	•	Generates:
	•	Change impact reports (affected parts, harness segments, ECUs, tests).
	•	Traceability views (feature → signals → pins → harness paths).
	•	Feeds both frontend and external tools (e.g., RM/ALM).

⸻

AI / LLM Adapter (AI)
	•	LLM Adapter (LLMAPI)
	•	Responsible for:
	•	Chunking PDFs.
	•	Prompting the LLM consistently.
	•	Validating JSON outputs against schemas.
	•	Hides the details of the external LLM provider behind a stable internal interface.
	•	LLM Provider (LLMEXT)
	•	Could be:
	•	Cloud LLM.
	•	On-prem instance for IP-sensitive work.
	•	You can swap this without touching the rest of the system.

⸻

Data & Knowledge Stores (DATA)
	•	Graph DB (GDB)
	•	Stores the “digital twin” of the electrical system:
	•	ECUs, pins, connectors, wires, fuses, harness branches, signals, features.
	•	Backbone for change impact and constraint checks.
	•	Relational DB (RDB)
	•	Stores:
	•	Projects, variants, users, roles.
	•	Change requests, approvals, audit logs.
	•	Versioned snapshots of the graph.
	•	Document Store (DOC)
	•	Raw imported assets:
	•	PDFs, images, excels.
	•	Supports traceability: “These ECU definitions came from this spec version.”
	•	Vector DB (VDB)
	•	For semantic search:
	•	“Find all ECUs with at least 2 high-side outputs >10A.”
	•	“Show spec pages mentioning ‘heated steering wheel’ and ‘PWM’.”

⸻

External Integrations (EXT)
	•	RM/ALM / PLM / Jira (EVT)
	•	Push:
	•	Change impact reports as attachments or comments.
	•	Links between requirements and features/pins.
	•	Pull:
	•	Requirements and test artifacts for richer traceability.

⸻

3. How a typical “add new feature” flows through

Example: “Add rear fog lamp”
	1.	Engineer goes to Change Request UI (FE3) and describes the feature.
	2.	UI calls IS3 via APIGW:
	•	IS3 + LLM adapter → propose a structured requirement:
	•	1× high-side output, 2–3A @12V, diagnostics, controlled by BCM, rear harness.
	3.	Rules Engine (RS) + Graph Service (GS):
	•	Query graph for:
	•	Spare high-side capable pins on candidate ECUs near the rear.
	•	Available fuse capacity, harness branch capacity, bus signals/control path.
	•	Evaluate constraints → return viable options + constraints.
	4.	Query & Reporting (QS):
	•	Assemble impact report:
	•	Which wires/connectors/fuses to add or change.
	•	Any ECU change needed or not.
	5.	Frontend (FE4):
	•	Shows options visually & textually.
	6.	Engineer chooses an option, goes to FE5:
	•	Approves and pushes to external RM/PLM via EVT.
