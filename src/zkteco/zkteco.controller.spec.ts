import { Test, TestingModule } from '@nestjs/testing';
import { ZktecoController } from './zkteco.controller';

describe('ZktecoController', () => {
  let controller: ZktecoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ZktecoController],
    }).compile();

    controller = module.get<ZktecoController>(ZktecoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
