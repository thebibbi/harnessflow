# **Project: AutoGraph \- Intelligent Wiring Harness Validation System**

## **1\. Executive Summary**

AutoGraph is a hybrid system combining **Generative AI** (for unstructured data ingestion) and **Deterministic Graph Theory** (for physical validation). It solves the "feature creep" problem in automotive engineering by automatically validating if existing ECUs and Wiring Harnesses can support new electrical loads.

## **2\. System Architecture**

### **2.1 High-Level Data Flow**

1. **Ingestion (Unstructured):** Users upload PDF Datasheets (ECUs) or Images (Legacy Diagrams).  
2. **Processing (AI):** LLM Agents extract specific entities (Pinouts, Voltage, Current Limits) into structured JSON.  
3. **Ingestion (Structured):** Users upload KBL (VDA 4964\) or VEC (VDA 4968\) XML files for the physical harness.  
4. **Storage:** Data is mapped into a Property Graph Database.  
5. **Analysis:** A Python Logic Engine queries the graph to validate connectivity, voltage drop, and current loads.  
6. **Interface:** Users query the system via Chat ("Can I add a 10A pump to the rear BCM?") or 3D Visualization.

## **3\. Tech Stack Recommendations**

### **A. The Brain (LLM Layer)**

* **Model:** Gemini 1.5 Pro (excellent at long-context PDF parsing) or GPT-4o.  
* **Role:** ONLY used for extraction and summary. NEVER used for calculation.  
* **Prompt Strategy:** "Extract all pin definitions from this table. Return as JSON with keys: pin\_id, type (Input/Output/Power), max\_current\_amps."

### **B. The Memory (Database Layer) \- OPTIONS**

We recommend Option 1, but offer alternatives based on enterprise constraints.

| Option | Technology | Pros | Cons | Best For |
| :---- | :---- | :---- | :---- | :---- |
| **1\. Native Graph (Recommended)** | **Neo4j** or **Memgraph** | Native handling of "Node A connects to B connects to C". Fast pathfinding algorithms (Dijkstra/A\*). | Requires learning Cypher query language. | Production Logic, Complex Tracing. |
| **2\. Relational (Legacy)** | **PostgreSQL** | ACID compliance, likely already approved by IT. Can use WITH RECURSIVE for trees. | Recursive queries are slow and hard to write. Rigid schema makes adding new wire attributes painful. | Conservative IT environments. |
| **3\. In-Memory (Prototype)** | **NetworkX (Python)** | Zero infrastructure setup. Pure Python. Extremely fast for small graphs (\<100k nodes). | Not persistent. Not multi-user. | Single-user desktop tools. |

### **C. The Logic (Validation Layer)**

* **Language:** Python 3.10+  
* **Key Libraries:** \* lxml: For fast parsing of KBL/VEC XML files.  
  * networkx: For calculating shortest paths and resistance.  
  * pint: For physical unit handling (ensuring you don't subtract Volts from Amps).

## **4\. Data Model (Graph Schema)**

### **Nodes**

1. ECU (Props: PartNumber, Supplier)  
2. Connector (Props: PinCount, IP\_Rating)  
3. Cavity/Pin (Props: PinNumber, MaxCurrent, Type)  
4. Splice (Props: Type=Ultrasonic/Crimp)  
5. Component (Props: LoadResistance, Inductive?)

### **Edges**

1. CONTAINS (ECU \-\> Pin)  
2. PLUGS\_INTO (ECU \-\> Connector)  
3. WIRED\_TO (Pin \-\> Wire \-\> Pin)  
   * *Critical Edge Properties:* wire\_gauge\_awg, length\_mm, color, material\_type (Cu/Al).

## **5\. Implementation Steps for the AI Coder**

### **Phase 1: The Parser (VEC/KBL)**

Automotive harnesses use XML standards. You must build a parser that reads a standard KBL file and instantiates Nodes/Edges.

* **Task:** Write a Python function parse\_kbl\_to\_graph(xml\_file) that iterates through \<Connector\_occurrence\> and \<Wire\_occurrence\> tags.

### **Phase 2: The Trace Logic**

Do not rely on the LLM to guess connectivity. Use Graph Traversal.

* **Algorithm:**  
  def get\_voltage\_drop(start\_node, end\_node, current):  
      path \= shortest\_path(start\_node, end\_node)  
      total\_resistance \= sum(edge\['resistance'\] for edge in path)  
      return current \* total\_resistance

### **Phase 3: The LLM Integration**

The LLM is the "Datasheet Librarian".

* **Task:** Create a vector store (RAG) of all historical ECU defects and datasheets.  
* **Query:** When a user selects an ECU, retrieve its specific constraints ("Note: Pin 4 shares a fuse with the Wiper Motor") and inject this into the validation logic.

## **6\. Extension to Other Domains**

The underlying logic (Source \-\> Capacity Constrained Link \-\> Sink) applies to:

1. **Hydraulics:** Pump (ECU) \-\> Hose (Wire) \-\> Cylinder (Light). *Check: Pressure drop.*  
2. **Supply Chain:** Factory (ECU) \-\> Truck Route (Wire) \-\> Store (Light). *Check: Volume capacity.*  
3. **IT Networking:** Switch Port (ECU) \-\> Cat6 Cable (Wire) \-\> AP (Light). *Check: PoE Budget.*