/**
 * Harness Editor Store
 *
 * Zustand store for managing harness editor state
 */

import { create } from 'zustand';
import { Node, Edge, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { apolloClient } from '../graphql/client';
import { CREATE_WIRE, DELETE_WIRE, UPDATE_WIRE } from '../graphql/queries';

export interface ECU {
  id: string;
  name: string;
  partNumber: string;
  manufacturer: string;
  metadata?: any;
  physical?: any;
  connectors: Connector[];
}

export interface Connector {
  id: string;
  ecuId: string;
  name: string;
  type: string;
  gender: string;
  pinCount: number;
  physical?: any;
  pins: Pin[];
}

export interface Pin {
  id: string;
  connectorId: string;
  pinNumber: string;
  label?: string;
  capabilities?: any;
}

export interface Wire {
  id: string;
  name?: string;
  fromPinId?: string;
  toPinId?: string;
  physical?: any;
  electrical?: any;
  routing?: any;
  metadata?: any;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  vehicleManufacturer: string;
  vehicleModel: string;
  vehicleYear: number;
  ecus: ECU[];
  wires: Wire[];
}

interface HarnessStore {
  // Project data
  project: Project | null;
  setProject: (project: Project | null) => void;

  // React Flow state
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;

  // Selection
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;

  // Actions
  addWire: (fromPinId: string, toPinId: string) => Promise<void>;
  deleteWire: (wireId: string) => Promise<void>;
  updateWire: (wireId: string, updates: Partial<Wire>) => Promise<void>;

  // Sync state
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;

  // Helpers
  getECUById: (id: string) => ECU | undefined;
  getConnectorById: (id: string) => Connector | undefined;
  getPinById: (id: string) => Pin | undefined;
  getWireById: (id: string) => Wire | undefined;

  // Initialization
  initializeFromProject: (project: Project) => void;
}

export const useHarnessStore = create<HarnessStore>((set, get) => ({
  // Initial state
  project: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  isSaving: false,
  lastSaved: null,
  hasUnsavedChanges: false,

  // Setters
  setProject: (project) => set({ project }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

  // React Flow change handlers
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  // Actions
  addWire: async (fromPinId, toPinId) => {
    const { project } = get();
    if (!project) return;

    set({ isSaving: true });

    try {
      // Call GraphQL mutation
      const result = await apolloClient.mutate({
        mutation: CREATE_WIRE,
        variables: {
          input: {
            projectId: project.id,
            fromPinId,
            toPinId,
            name: `Wire_${project.wires.length + 1}`,
          },
        },
      });

      const newWire = result.data.createWire;

      // Update local state with the created wire
      const updatedProject = {
        ...project,
        wires: [...project.wires, newWire],
      };

      set({
        project: updatedProject,
        lastSaved: new Date(),
        isSaving: false,
      });

      // Re-initialize to update edges
      get().initializeFromProject(updatedProject);
    } catch (error) {
      console.error('Failed to create wire:', error);
      set({ isSaving: false });
      alert('Failed to create wire. Please try again.');
    }
  },

  deleteWire: async (wireId) => {
    const { project } = get();
    if (!project) return;

    set({ isSaving: true });

    try {
      // Call GraphQL mutation
      await apolloClient.mutate({
        mutation: DELETE_WIRE,
        variables: { id: wireId },
      });

      // Update local state
      const updatedProject = {
        ...project,
        wires: project.wires.filter((w) => w.id !== wireId),
      };

      set({
        project: updatedProject,
        lastSaved: new Date(),
        isSaving: false,
      });

      get().initializeFromProject(updatedProject);
    } catch (error) {
      console.error('Failed to delete wire:', error);
      set({ isSaving: false });
      alert('Failed to delete wire. Please try again.');
    }
  },

  updateWire: async (wireId, updates) => {
    const { project } = get();
    if (!project) return;

    set({ isSaving: true });

    try {
      // Call GraphQL mutation
      const result = await apolloClient.mutate({
        mutation: UPDATE_WIRE,
        variables: {
          id: wireId,
          input: updates,
        },
      });

      const updatedWire = result.data.updateWire;

      // Update local state
      const updatedProject = {
        ...project,
        wires: project.wires.map((w) => (w.id === wireId ? updatedWire : w)),
      };

      set({
        project: updatedProject,
        lastSaved: new Date(),
        isSaving: false,
      });

      get().initializeFromProject(updatedProject);
    } catch (error) {
      console.error('Failed to update wire:', error);
      set({ isSaving: false });
      alert('Failed to update wire. Please try again.');
    }
  },

  // Helpers
  getECUById: (id) => {
    return get().project?.ecus.find((ecu) => ecu.id === id);
  },

  getConnectorById: (id) => {
    const ecus = get().project?.ecus || [];
    for (const ecu of ecus) {
      const connector = ecu.connectors.find((c) => c.id === id);
      if (connector) return connector;
    }
    return undefined;
  },

  getPinById: (id) => {
    const ecus = get().project?.ecus || [];
    for (const ecu of ecus) {
      for (const connector of ecu.connectors) {
        const pin = connector.pins.find((p) => p.id === id);
        if (pin) return pin;
      }
    }
    return undefined;
  },

  getWireById: (id) => {
    return get().project?.wires.find((w) => w.id === id);
  },

  // Initialize React Flow nodes and edges from project data
  initializeFromProject: (project) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Create ECU nodes
    project.ecus.forEach((ecu, ecuIndex) => {
      const ecuNode: Node = {
        id: `ecu-${ecu.id}`,
        type: 'ecuNode',
        position: {
          x: 100 + ecuIndex * 400,
          y: 100,
        },
        data: {
          ecu,
          connectors: ecu.connectors,
        },
      };
      nodes.push(ecuNode);

      // Create connector nodes for each ECU
      ecu.connectors.forEach((connector, connIndex) => {
        const connectorNode: Node = {
          id: `connector-${connector.id}`,
          type: 'connectorNode',
          position: {
            x: 100 + ecuIndex * 400,
            y: 250 + connIndex * 200,
          },
          data: {
            connector,
            ecuId: ecu.id,
            ecuName: ecu.name,
            pins: connector.pins,
          },
          parentNode: `ecu-${ecu.id}`,
        };
        nodes.push(connectorNode);
      });
    });

    // Create wire edges
    project.wires.forEach((wire) => {
      if (!wire.fromPinId || !wire.toPinId) return;

      // Find source and target connector nodes
      const fromPin = get().getPinById(wire.fromPinId);
      const toPin = get().getPinById(wire.toPinId);

      if (!fromPin || !toPin) return;

      const edge: Edge = {
        id: `wire-${wire.id}`,
        source: `connector-${fromPin.connectorId}`,
        target: `connector-${toPin.connectorId}`,
        type: 'wireEdge',
        data: {
          wire,
          fromPin,
          toPin,
        },
        animated: true,
      };
      edges.push(edge);
    });

    set({ project, nodes, edges });
  },
}));
