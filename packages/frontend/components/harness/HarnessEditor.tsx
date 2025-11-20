/**
 * Harness Editor Component
 *
 * Main interactive harness editor using React Flow
 */

'use client';

import React from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useHarnessStore } from '@/lib/store/harness-store';
import { ECUNode } from './ECUNode';
import { ConnectorNode } from './ConnectorNode';
import { WireEdge } from './WireEdge';

const nodeTypes = {
  ecuNode: ECUNode,
  connectorNode: ConnectorNode,
};

const edgeTypes = {
  wireEdge: WireEdge,
};

interface HarnessEditorProps {
  projectId: string;
}

function HarnessEditorInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, project, selectedNodeId, selectedEdgeId } =
    useHarnessStore();

  const proOptions = { hideAttribution: true };

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {project?.name || 'Harness Editor'}
            </h1>
            <p className="text-sm text-gray-500">
              {project?.vehicleManufacturer} {project?.vehicleModel} {project?.vehicleYear}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{project?.ecus.length || 0}</span> ECUs
              <span className="mx-2">·</span>
              <span className="font-medium">{project?.wires.length || 0}</span> Wires
            </div>
          </div>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 bg-gray-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          proOptions={proOptions}
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            animated: true,
            style: { strokeWidth: 2 },
          }}
        >
          <Background color="#e5e7eb" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'ecuNode') return '#3b82f6';
              if (node.type === 'connectorNode') return '#8b5cf6';
              return '#6b7280';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
            className="bg-white border border-gray-300 rounded"
          />

          {/* Info Panel */}
          <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
            <h3 className="font-bold text-sm text-gray-900 mb-2">Legend</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded" />
                <span>ECU Module</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded" />
                <span>Connector</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-0.5 bg-gray-700" />
                <span>Wire</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-semibold text-xs text-gray-700 mb-1">Controls</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Drag nodes to reposition</li>
                <li>• Scroll to zoom</li>
                <li>• Click to select</li>
                <li>• Double-click to expand pins</li>
              </ul>
            </div>
          </Panel>

          {/* Selection Info Panel */}
          {(selectedNodeId || selectedEdgeId) && (
            <Panel position="bottom-left" className="bg-white rounded-lg shadow-lg p-4 max-w-md">
              <h3 className="font-bold text-sm text-gray-900 mb-2">Selection Details</h3>
              {selectedNodeId && (
                <div className="text-xs">
                  <p className="text-gray-600">Selected: Node {selectedNodeId}</p>
                </div>
              )}
              {selectedEdgeId && (
                <div className="text-xs">
                  <p className="text-gray-600">Selected: Wire {selectedEdgeId}</p>
                </div>
              )}
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}

export function HarnessEditor({ projectId: _projectId }: HarnessEditorProps) {
  return (
    <ReactFlowProvider>
      <HarnessEditorInner />
    </ReactFlowProvider>
  );
}
