/**
 * ECU Node Component
 *
 * React Flow custom node for ECUs
 */

'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ECU } from '@/lib/store/harness-store';

interface ECUNodeData {
  ecu: ECU;
  connectors: any[];
}

export function ECUNode({ data, selected }: NodeProps<ECUNodeData>) {
  const { ecu } = data;

  return (
    <div
      className={`
        bg-white rounded-lg shadow-lg border-2 p-4 min-w-[280px]
        ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}
        hover:shadow-xl transition-all duration-200
      `}
    >
      {/* ECU Header */}
      <div className="border-b border-gray-200 pb-2 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{ecu.name}</h3>
            <p className="text-xs text-gray-500">{ecu.partNumber}</p>
          </div>
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">ECU</span>
          </div>
        </div>
      </div>

      {/* ECU Details */}
      <div className="space-y-1 text-sm">
        <div>
          <span className="text-gray-500">Manufacturer:</span>
          <span className="ml-2 font-medium">{ecu.manufacturer}</span>
        </div>
        <div>
          <span className="text-gray-500">Connectors:</span>
          <span className="ml-2 font-medium">{ecu.connectors.length}</span>
        </div>
      </div>

      {/* Connector List */}
      <div className="mt-3 space-y-1">
        <p className="text-xs font-semibold text-gray-600 mb-1">Connectors:</p>
        {ecu.connectors.map((connector) => (
          <div
            key={connector.id}
            className="text-xs bg-gray-50 rounded px-2 py-1 flex justify-between"
          >
            <span>{connector.name}</span>
            <span className="text-gray-500">{connector.pinCount}p</span>
          </div>
        ))}
      </div>

      {/* Handles for connections */}
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-green-500" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-red-500" />
    </div>
  );
}
