/**
 * Wire Edge Component
 *
 * Custom React Flow edge for wires
 */

'use client';

import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';
import { Wire, Pin } from '@/lib/store/harness-store';
import { useHarnessStore } from '@/lib/store/harness-store';

interface WireEdgeData {
  wire: Wire;
  fromPin: Pin;
  toPin: Pin;
}

export function WireEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<WireEdgeData>) {
  const { wire, fromPin, toPin } = data;
  const { setSelectedEdge, deleteWire } = useHarnessStore();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Get wire color from physical properties
  const wireColor = wire.physical?.color?.primaryHex || '#374151'; // Default gray
  const wireGauge = wire.physical?.gauge || 22;

  // Calculate stroke width based on gauge (thicker for lower AWG numbers)
  const strokeWidth = Math.max(2, Math.min(8, 30 - wireGauge / 2));

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3b82f6' : wireColor,
          strokeWidth: selected ? strokeWidth + 2 : strokeWidth,
          strokeLinecap: 'round',
        }}
      />

      {/* Edge Label */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div
            className={`
              flex items-center gap-2 bg-white border rounded-md px-2 py-1 shadow-sm text-xs
              ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}
              hover:shadow-md transition-all cursor-pointer
            `}
            onClick={() => setSelectedEdge(id.replace('wire-', ''))}
          >
            {/* Wire Info */}
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full border border-gray-300"
                style={{ backgroundColor: wireColor }}
                title={`Color: ${wire.physical?.color?.primary || 'Unknown'}`}
              />
              <span className="font-medium">
                {wire.name || `${fromPin.pinNumber} → ${toPin.pinNumber}`}
              </span>
            </div>

            {/* Wire Gauge */}
            {wireGauge && (
              <span className="text-gray-500 text-[10px]">
                {wireGauge}
                {wire.physical?.gauge_unit || 'AWG'}
              </span>
            )}

            {/* Delete Button */}
            {selected && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete wire "${wire.name}"?`)) {
                    deleteWire(wire.id);
                  }
                }}
                className="ml-1 text-red-500 hover:text-red-700 font-bold"
                title="Delete wire"
              >
                ×
              </button>
            )}
          </div>

          {/* Wire Details on Selection */}
          {selected && (
            <div className="absolute top-full mt-1 bg-white border border-gray-200 rounded-md p-2 shadow-lg text-xs min-w-[200px]">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">From:</span>
                  <span className="font-medium">{fromPin.label || fromPin.pinNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">To:</span>
                  <span className="font-medium">{toPin.label || toPin.pinNumber}</span>
                </div>
                {wire.physical?.length && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Length:</span>
                    <span className="font-medium">
                      {wire.physical.length} {wire.physical.length_unit || 'mm'}
                    </span>
                  </div>
                )}
                {wire.electrical?.resistance && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Resistance:</span>
                    <span className="font-medium">{wire.electrical.resistance.toFixed(3)} Ω</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
