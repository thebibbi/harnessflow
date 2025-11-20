/**
 * Harness Editor Page
 *
 * Loads project data and renders the interactive harness editor
 */

'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useParams } from 'next/navigation';
import { HarnessEditor } from '@/components/harness/HarnessEditor';
import { GET_PROJECT_HARNESS } from '@/lib/graphql/queries';
import { useHarnessStore } from '@/lib/store/harness-store';

export default function EditorPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { initializeFromProject } = useHarnessStore();

  const { data, loading, error } = useQuery(GET_PROJECT_HARNESS, {
    variables: { id: projectId },
    skip: !projectId,
  });

  // Initialize the harness editor when data loads
  useEffect(() => {
    if (data?.project) {
      // Transform GraphQL data to store format
      const project = {
        id: data.project.id,
        name: data.project.name,
        description: data.project.description,
        vehicleManufacturer: data.project.vehicleManufacturer,
        vehicleModel: data.project.vehicleModel,
        vehicleYear: data.project.vehicleYear,
        ecus: data.project.ecus.map((ecu: any) => ({
          id: ecu.id,
          name: ecu.name,
          partNumber: ecu.partNumber,
          manufacturer: ecu.manufacturer,
          metadata: ecu.metadata,
          physical: ecu.physical,
          connectors: ecu.connectors.map((conn: any) => ({
            id: conn.id,
            ecuId: ecu.id,
            name: conn.name,
            type: conn.type,
            gender: conn.gender,
            pinCount: conn.pinCount,
            physical: conn.physical,
            pins: conn.pins.map((pin: any) => ({
              id: pin.id,
              connectorId: conn.id,
              pinNumber: pin.pinNumber,
              label: pin.label,
              capabilities: pin.capabilities,
            })),
          })),
        })),
        wires: data.project.wires.map((wire: any) => ({
          id: wire.id,
          name: wire.name,
          fromPinId: wire.fromPinId,
          toPinId: wire.toPinId,
          physical: wire.physical,
          electrical: wire.electrical,
          routing: wire.routing,
          metadata: wire.metadata,
        })),
      };

      initializeFromProject(project);
    }
  }, [data, initializeFromProject]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading harness data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Project</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data?.project) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600">The project you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return <HarnessEditor projectId={projectId} />;
}
