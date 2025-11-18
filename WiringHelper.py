import json
import networkx as nx # Standard graph library for Python
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

class HarnessDigitalTwin:
    def __init__(self):
        # The Graph: Nodes = ECUs, Splices, Loads; Edges = Wires
        self.graph = nx.DiGraph()
        
    def load_ecu_specs(self, json_data):
        """
        In production, this JSON comes from an LLM parsing a PDF Datasheet.
        """
        ecu_id = json_data['ecu_id']
        self.graph.add_node(ecu_id, type='ECU', specs=json_data)
        
        # Add internal pin nodes to the graph for granular tracing
        for pin in json_data['pins']:
            pin_id = f"{ecu_id}:{pin['pin_number']}"
            self.graph.add_node(pin_id, type='PIN', 
                                max_current=pin['max_current_amps'],
                                voltage_ref=pin['voltage_ref'])
            # Connect ECU to its Pin
            self.graph.add_edge(ecu_id, pin_id, type='INTERNAL')
            logging.info(f"Loaded Spec for {ecu_id} Pin {pin['pin_number']}")

    def load_harness_netlist(self, netlist_data):
        """
        In production, this parses KBL/VEC XML files.
        """
        for connection in netlist_data:
            source = connection['from']
            target = connection['to']
            
            # Physics attributes of the wire
            wire_props = {
                'gauge_awg': connection['gauge'],
                'length_m': connection['length_m'],
                'resistance_ohm_per_m': connection['resistance_per_m'] 
            }
            
            self.graph.add_edge(source, target, **wire_props)
            # Bi-directional for connectivity checks, though current flows one way
            self.graph.add_edge(target, source, **wire_props) 

    def validate_feature_change(self, load_node_id, new_current_draw):
        """
        Deterministic Logic: Traces path backwards from load to ECU and checks physics.
        """
        logging.info(f"--- Validating change for {load_node_id}: {new_current_draw}A ---")
        
        # 1. Find the ECU Pin powering this load
        # Simple BFS to find the nearest upstream PIN node
        try:
            path = nx.shortest_path(self.graph, source=load_node_id, target="BCM_Gen2:Pin4") 
            # Note: In real life, we'd search for any ancestor of type 'PIN'
        except nx.NetworkXNoPath:
            return {"status": "FAIL", "reason": "No path to power source found."}

        # 2. Extract the Pin Node
        pin_node = path[-1] # simplistic assumption for demo
        pin_specs = self.graph.nodes[pin_node]
        
        # 3. Calculate Wire Physics (Voltage Drop)
        total_resistance = 0
        for i in range(len(path)-1):
            u, v = path[i], path[i+1]
            edge_data = self.graph.get_edge_data(u, v)
            if edge_data.get('type') != 'INTERNAL':
                r = edge_data['resistance_ohm_per_m'] * edge_data['length_m']
                total_resistance += r
        
        v_drop = new_current_draw * total_resistance
        
        # 4. The "Hard" Engineering Check
        results = {
            "target_pin": pin_node,
            "load_request": f"{new_current_draw}A",
            "pin_capacity": f"{pin_specs['max_current']}A",
            "voltage_drop": f"{v_drop:.4f}V",
            "checks": []
        }

        # Rule A: Current Capacity
        if new_current_draw > pin_specs['max_current']:
            results['checks'].append("FAIL: Pin Overcurrent")
        else:
            results['checks'].append("PASS: Current OK")

        # Rule B: Voltage Drop (assuming 12V system, max 0.5V drop allowed)
        if v_drop > 0.5:
            results['checks'].append(f"FAIL: Voltage Drop High ({v_drop:.2f}V)")
        else:
            results['checks'].append("PASS: Voltage Drop OK")

        return results

# --- MOCK DATA GENERATION (The part LLMs would normally generate) ---

# 1. The LLM reads a PDF and outputs this JSON:
bcm_specs = {
    "ecu_id": "BCM_Gen2",
    "description": "Body Control Module - High Line",
    "pins": [
        {"pin_number": "Pin4", "function": "Fog_Light_Front_L", "type": "HSD", "max_current_amps": 5.0, "voltage_ref": 12.0},
        {"pin_number": "Pin5", "function": "Logic_Low_Ref", "type": "GND", "max_current_amps": 0.5, "voltage_ref": 0.0}
    ]
}

# 2. The Engineering System exports this Netlist (or parses a KBL XML):
harness_data = [
    {"from": "BCM_Gen2:Pin4", "to": "Splice_A22", "gauge": 18, "length_m": 1.5, "resistance_per_m": 0.021},
    {"from": "Splice_A22", "to": "Conn_Fog_L", "gauge": 18, "length_m": 0.5, "resistance_per_m": 0.021},
    {"from": "Conn_Fog_L", "to": "Lamp_Fog_L", "gauge": 20, "length_m": 0.2, "resistance_per_m": 0.033} # Pigtail
]

# --- EXECUTION ---
twin = HarnessDigitalTwin()
twin.load_ecu_specs(bcm_specs)
twin.load_harness_netlist(harness_data)

# Scenario 1: Standard Fog Light (4 Amps) - Should Pass
print(json.dumps(twin.validate_feature_change("Lamp_Fog_L", 4.0), indent=2))

# Scenario 2: User installs off-road Light Bar (10 Amps) - Should Fail
print(json.dumps(twin.validate_feature_change("Lamp_Fog_L", 10.0), indent=2))