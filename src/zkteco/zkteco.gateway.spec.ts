import { Test, TestingModule } from '@nestjs/testing';
import { ZktecoGateway } from './zkteco.gateway';

describe('ZktecoGateway', () => {
  let gateway: ZktecoGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZktecoGateway],
    }).compile();

    gateway = module.get<ZktecoGateway>(ZktecoGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
