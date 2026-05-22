import { Test, TestingModule } from '@nestjs/testing';
import { AnapathService } from './anapath.service';

describe('AnapathService', () => {
  let service: AnapathService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnapathService],
    }).compile();

    service = module.get<AnapathService>(AnapathService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
