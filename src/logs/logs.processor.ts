import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { LogsService } from './logs.service';

@Processor('logs')
export class LogsProcessor {
  constructor(private readonly logsService: LogsService) {}

  @Process('storeLog')
  async handleStoreLog(job: Job) {
    const logData = job.data;
    console.log('logData', logData);
    await this.logsService.processAndStoreLog(logData);
  }
}
