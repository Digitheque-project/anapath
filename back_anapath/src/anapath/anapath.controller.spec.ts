import { Test, TestingModule } from '@nestjs/testing';
import { AnapathController } from './anapath.controller';

describe('AnapathController', () => {
  let controller: AnapathController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnapathController],
    }).compile();

    controller = module.get<AnapathController>(AnapathController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
