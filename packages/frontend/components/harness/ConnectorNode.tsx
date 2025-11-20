/**
 * Connector Node Component
 *
 * React Flow custom node for connectors with pin visualization
 */

'use client';

import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Connector, Pin } from '@/lib/store/harness-store';
import { useHarnessStore } from '@/lib/store/harness-store';

interface ConnectorNodeData {
  connector: Connector;
  ecuId: string;
  ecuName: string;
  pins: Pin[];
}

export function ConnectorNode({ data, selected }: NodeProps<ConnectorNodeData>) {
  const { connector, ecuName, pins } = data;
  const [expanded, setExpanded] = useState(false);
  const { setSelectedNode } = useHarnessStore();

  // Determine connector color based on gender
  const connectorColor = connector.gender === 'male' ? 'bg-blue-100' : 'bg-pink-100';
  const borderColor = connector.gender === 'male' ? 'border-blue-400' : 'border-pink-400';

  return (
    <div
      className={`
        bg-white rounded-lg shadow-md border-2 p-3 min-w-[240px]
        ${selected ? 'border-blue-600 ring-2 ring-blue-200' : borderColor}
        hover:shadow-lg transition-all duration-200
      `}
      onClick={() => setSelectedNode(connector.id)}
    >
      {/* Connector Header */}
      <div className={`${connectorColor} rounded-md p-2 mb-2`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm text-gray-900">{connector.name}</h4>
            <p className="text-xs text-gray-600">{ecuName}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-gray-700">
              {connector.gender === 'male' ? '♂' : '♀'} {connector.pinCount}p
            </span>
          </div>
        </div>
      </div>

      {/* Connector Details */}
      <div className="space-y-1 text-xs mb-2">
        <div className="flex justify-between">
          <span className="text-gray-500">Type:</span>
          <span className="font-medium">{connector.type}</span>
        </div>
      </div>

      {/* Toggle Pin View */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="text-xs text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? '▼' : '▶'} {expanded ? 'Hide' : 'Show'} Pins ({pins.length})
      </button>

      {/* Pin List */}
      {expanded && (
        <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
          {pins.map((pin) => (
            <div
              key={pin.id}
              className="flex items-center justify-between bg-gray-50 rounded px-2 py-1 text-xs hover:bg-gray-100 cursor-pointer"
              title={`${pin.label || pin.pinNumber} - Click to create wire`}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center text-white font-bold text-[10px]">
                  {pin.pinNumber}
                </div>
                <span className="font-medium">{pin.label || `Pin ${pin.pinNumber}`}</span>
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id={`${pin.id}-source`}
                className="w-2 h-2 bg-green-500"
                style={{ position: 'relative', transform: 'none', right: -8 }}
              />
              <Handle
                type="target"
                position={Position.Left}
                id={`${pin.id}-target`}
                className="w-2 h-2 bg-red-500"
                style={{ position: 'relative', transform: 'none', left: -8 }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Main Handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-500"
        style={{ top: '50%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-red-500"
        style={{ top: '50%' }}
      />
    </div>
  );
}
