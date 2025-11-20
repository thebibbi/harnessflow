/**
 * GraphQL Queries and Mutations
 */

import { gql } from '@apollo/client';

/**
 * Get project with full harness data
 */
export const GET_PROJECT_HARNESS = gql`
  query GetProjectHarness($id: ID!) {
    project(id: $id) {
      id
      name
      description
      vehicleManufacturer
      vehicleModel
      vehicleYear
      ecus {
        id
        name
        partNumber
        manufacturer
        metadata
        physical
        connectors {
          id
          name
          type
          gender
          pinCount
          physical
          pins {
            id
            pinNumber
            label
            capabilities
          }
        }
      }
      wires {
        id
        name
        fromPinId
        toPinId
        physical
        electrical
        routing
        metadata
        fromPin {
          id
          pinNumber
          label
          connector {
            id
            name
            ecu {
              id
              name
            }
          }
        }
        toPin {
          id
          pinNumber
          label
          connector {
            id
            name
            ecu {
              id
              name
            }
          }
        }
      }
    }
  }
`;

/**
 * Get all projects (list view)
 */
export const GET_PROJECTS = gql`
  query GetProjects($pagination: PaginationInput, $filter: ProjectFilterInput) {
    projects(pagination: $pagination, filter: $filter) {
      items {
        id
        name
        description
        vehicleManufacturer
        vehicleModel
        vehicleYear
        status
        createdAt
        modifiedAt
      }
      total
      page
      pageSize
      totalPages
    }
  }
`;

/**
 * Create new project
 */
export const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      vehicleManufacturer
      vehicleModel
      vehicleYear
    }
  }
`;

/**
 * Create wire
 */
export const CREATE_WIRE = gql`
  mutation CreateWire($input: CreateWireInput!) {
    createWire(input: $input) {
      id
      name
      fromPinId
      toPinId
      physical
      electrical
    }
  }
`;

/**
 * Update wire
 */
export const UPDATE_WIRE = gql`
  mutation UpdateWire($id: ID!, $input: UpdateWireInput!) {
    updateWire(id: $id, input: $input) {
      id
      name
      fromPinId
      toPinId
      physical
      electrical
      routing
    }
  }
`;

/**
 * Delete wire
 */
export const DELETE_WIRE = gql`
  mutation DeleteWire($id: ID!) {
    deleteWire(id: $id)
  }
`;

/**
 * Import WireViz
 */
export const IMPORT_WIREVIZ = gql`
  mutation ImportWireViz($input: WireVizImportInput!) {
    importWireViz(input: $input) {
      success
      projectId
      errors
      stats
    }
  }
`;
