/**
 * Wire Edit Dialog Component
 *
 * Modal dialog for editing wire properties
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useHarnessStore } from '@/lib/store/harness-store';

interface WireEditDialogProps {
  wireId: string;
  onClose: () => void;
}

export function WireEditDialog({ wireId, onClose }: WireEditDialogProps) {
  const { getWireById, updateWire } = useHarnessStore();
  const wire = getWireById(wireId);

  const [name, setName] = useState(wire?.name || '');
  const [gauge, setGauge] = useState(wire?.physical?.gauge || 22);
  const [color, setColor] = useState(wire?.physical?.color?.primary || 'Black');
  const [length, setLength] = useState(wire?.physical?.length || 0);
  const [voltage, setVoltage] = useState(wire?.electrical?.voltage || 12);
  const [maxCurrent, setMaxCurrent] = useState(wire?.electrical?.maxCurrent || 5);

  useEffect(() => {
    if (wire) {
      setName(wire.name || '');
      setGauge(wire.physical?.gauge || 22);
      setColor(wire.physical?.color?.primary || 'Black');
      setLength(wire.physical?.length || 0);
      setVoltage(wire.electrical?.voltage || 12);
      setMaxCurrent(wire.electrical?.maxCurrent || 5);
    }
  }, [wire]);

  if (!wire) return null;

  const handleSave = async () => {
    await updateWire(wireId, {
      name: name || undefined,
      physical: {
        ...wire.physical,
        gauge: Number(gauge),
        length: Number(length),
        length_unit: 'mm',
        color: {
          primary: color,
          primaryHex: getColorHex(color),
        },
      },
      electrical: {
        ...wire.electrical,
        voltage: Number(voltage),
        maxCurrent: Number(maxCurrent),
        type: maxCurrent > 10 ? 'POWER' : 'SIGNAL',
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Edit Wire Properties</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Wire Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wire Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., PWR_12V_MAIN"
            />
          </div>

          {/* Physical Properties */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Physical Properties</h3>

            <div className="space-y-3">
              {/* Gauge */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wire Gauge (AWG)
                </label>
                <select
                  value={gauge}
                  onChange={(e) => setGauge(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="30">30 AWG (0.5A max)</option>
                  <option value="28">28 AWG (0.8A max)</option>
                  <option value="26">26 AWG (1.3A max)</option>
                  <option value="24">24 AWG (2.1A max)</option>
                  <option value="22">22 AWG (3.0A max)</option>
                  <option value="20">20 AWG (5.0A max)</option>
                  <option value="18">18 AWG (8.0A max)</option>
                  <option value="16">16 AWG (13A max)</option>
                  <option value="14">14 AWG (20A max)</option>
                  <option value="12">12 AWG (25A max)</option>
                  <option value="10">10 AWG (40A max)</option>
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wire Color</label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Black">Black</option>
                  <option value="Red">Red</option>
                  <option value="Blue">Blue</option>
                  <option value="Green">Green</option>
                  <option value="Yellow">Yellow</option>
                  <option value="White">White</option>
                  <option value="Brown">Brown</option>
                  <option value="Orange">Orange</option>
                  <option value="Purple">Purple</option>
                  <option value="Gray">Gray</option>
                </select>
              </div>

              {/* Length */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Length (mm)</label>
                <input
                  type="number"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="10"
                />
              </div>
            </div>
          </div>

          {/* Electrical Properties */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Electrical Properties</h3>

            <div className="space-y-3">
              {/* Voltage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voltage (V)</label>
                <select
                  value={voltage}
                  onChange={(e) => setVoltage(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="5">5V (Signal/Logic)</option>
                  <option value="12">12V (Standard Auto)</option>
                  <option value="24">24V (Truck/Heavy Duty)</option>
                  <option value="48">48V (Hybrid/EV)</option>
                  <option value="400">400V (EV High Voltage)</option>
                </select>
              </div>

              {/* Max Current */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Current (A)
                </label>
                <input
                  type="number"
                  value={maxCurrent}
                  onChange={(e) => setMaxCurrent(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Get hex color code from color name
 */
function getColorHex(color: string): string {
  const colorMap: Record<string, string> = {
    Black: '#000000',
    Red: '#FF0000',
    Blue: '#0000FF',
    Green: '#00FF00',
    Yellow: '#FFFF00',
    White: '#FFFFFF',
    Brown: '#8B4513',
    Orange: '#FFA500',
    Purple: '#800080',
    Gray: '#808080',
  };
  return colorMap[color] || '#374151';
}
