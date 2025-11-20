/**
 * Simple tests for WireViz Import Service
 */

import { Test, TestingModule } from '@nestjs/testing';
import { WireVizImportService } from './wireviz-import.service';
import { ProjectRepository } from '../../database/repositories/project.repository';
import { ECURepository } from '../../database/repositories/ecu.repository';

describe('WireVizImportService', () => {
  let service: WireVizImportService;

  beforeEach(async () => {
    const mockProjectRepo = {
      create: jest.fn().mockResolvedValue({
        id: 'project-123',
        name: 'Test Project',
      }),
    };

    const mockECURepo = {
      create: jest.fn().mockResolvedValue({
        id: 'ecu-123',
        name: 'X1',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WireVizImportService,
        { provide: ProjectRepository, useValue: mockProjectRepo },
        { provide: ECURepository, useValue: mockECURepo },
      ],
    }).compile();

    service = module.get<WireVizImportService>(WireVizImportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return error for invalid YAML', async () => {
    const invalidYaml = 'connectors:\n  X1:\n    type: "unclosed';

    const result = await service.importFromYAML(invalidYaml, {
      createdBy: 'test',
    });

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
