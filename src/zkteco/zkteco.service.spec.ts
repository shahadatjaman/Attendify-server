import { Test, TestingModule } from '@nestjs/testing';
import { ZktecoService } from './zkteco.service';

describe('ZktecoService', () => {
  let service: ZktecoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZktecoService],
    }).compile();

    service = module.get<ZktecoService>(ZktecoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
