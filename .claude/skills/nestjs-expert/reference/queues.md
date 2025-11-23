# Background Jobs and Queues

## Setup

```bash
npm install @nestjs/bull bull
npm install @types/bull --save-dev
```

```typescript
// app.module.ts
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT, 10),
        password: process.env.REDIS_PASSWORD,
      },
    }),
  ],
})
export class AppModule {}
```

## Queue Definition

```typescript
// email.module.ts
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}
```

## Producer (Adding Jobs)

```typescript
// email.service.ts
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class EmailService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  async sendWelcomeEmail(userId: number, email: string) {
    const job = await this.emailQueue.add('welcome', {
      userId,
      email,
    });

    return { jobId: job.id };
  }

  async sendPasswordResetEmail(email: string, token: string) {
    await this.emailQueue.add(
      'password-reset',
      { email, token },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  async sendBulkEmails(emails: string[]) {
    const jobs = emails.map((email) => ({
      name: 'bulk-email',
      data: { email },
    }));

    await this.emailQueue.addBulk(jobs);
  }

  // Delayed job
  async sendReminderEmail(email: string, delayMs: number) {
    await this.emailQueue.add(
      'reminder',
      { email },
      { delay: delayMs },
    );
  }

  // Repeating job
  async scheduleWeeklyNewsletter(email: string) {
    await this.emailQueue.add(
      'newsletter',
      { email },
      {
        repeat: {
          cron: '0 9 * * 1', // Every Monday at 9 AM
        },
      },
    );
  }

  // Priority job
  async sendUrgentEmail(email: string, message: string) {
    await this.emailQueue.add(
      'urgent',
      { email, message },
      { priority: 1 }, // Higher priority (lower number = higher priority)
    );
  }
}
```

## Consumer (Processing Jobs)

```typescript
// email.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private mailService: MailService) {}

  @Process('welcome')
  async sendWelcomeEmail(job: Job<{ userId: number; email: string }>) {
    this.logger.log(`Sending welcome email to ${job.data.email}`);

    try {
      await this.mailService.send({
        to: job.data.email,
        subject: 'Welcome!',
        template: 'welcome',
        context: { userId: job.data.userId },
      });

      this.logger.log(`Welcome email sent to ${job.data.email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email: ${error.message}`);
      throw error;
    }
  }

  @Process('password-reset')
  async sendPasswordResetEmail(job: Job<{ email: string; token: string }>) {
    this.logger.log(`Sending password reset to ${job.data.email}`);

    await this.mailService.send({
      to: job.data.email,
      subject: 'Password Reset',
      template: 'password-reset',
      context: { token: job.data.token },
    });

    return { success: true };
  }

  @Process('bulk-email')
  async sendBulkEmail(job: Job<{ email: string }>) {
    await this.mailService.send({
      to: job.data.email,
      subject: 'Newsletter',
      template: 'newsletter',
    });

    // Update progress
    await job.progress(100);
  }

  // Process all jobs in the queue
  @Process()
  async handleAnyJob(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case 'reminder':
        await this.sendReminderEmail(job);
        break;
      case 'newsletter':
        await this.sendNewsletterEmail(job);
        break;
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async sendReminderEmail(job: Job) {
    // Logic
  }

  private async sendNewsletterEmail(job: Job) {
    // Logic
  }
}
```

## Event Listeners

```typescript
import { OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';

@Processor('email')
export class EmailProcessor {
  @OnQueueActive()
  onActive(job: Job) {
    console.log(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    console.log(`Job ${job.id} completed with result:`, result);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    console.log(`Job ${job.id} failed with error:`, error.message);
    // Send alert, log to monitoring service, etc.
  }

  @OnQueueProgress()
  onProgress(job: Job, progress: number) {
    console.log(`Job ${job.id} progress: ${progress}%`);
  }

  @OnQueueStalled()
  onStalled(job: Job) {
    console.log(`Job ${job.id} stalled`);
  }

  @OnQueueWaiting()
  onWaiting(jobId: number | string) {
    console.log(`Job ${jobId} is waiting`);
  }
}
```

## Queue Management

```typescript
@Injectable()
export class QueueManagementService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  // Get job by ID
  async getJob(jobId: string) {
    return this.emailQueue.getJob(jobId);
  }

  // Get all jobs by state
  async getJobs(state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed') {
    return this.emailQueue.getJobs([state]);
  }

  // Get queue metrics
  async getQueueMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  // Pause queue
  async pauseQueue() {
    await this.emailQueue.pause();
  }

  // Resume queue
  async resumeQueue() {
    await this.emailQueue.resume();
  }

  // Clean queue
  async cleanQueue(grace: number = 0, status?: 'completed' | 'failed') {
    await this.emailQueue.clean(grace, status);
  }

  // Remove job
  async removeJob(jobId: string) {
    const job = await this.emailQueue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  // Retry failed job
  async retryJob(jobId: string) {
    const job = await this.emailQueue.getJob(jobId);
    if (job) {
      await job.retry();
    }
  }

  // Empty queue
  async emptyQueue() {
    await this.emailQueue.empty();
  }

  // Get job logs
  async getJobLogs(jobId: string) {
    const job = await this.emailQueue.getJob(jobId);
    if (job) {
      return job.log;
    }
  }
}
```

## Advanced Job Options

```typescript
@Injectable()
export class AdvancedJobService {
  constructor(
    @InjectQueue('processing') private processingQueue: Queue,
  ) {}

  async addAdvancedJob() {
    await this.processingQueue.add(
      'complex-task',
      { data: 'payload' },
      {
        // Basic options
        priority: 1,
        delay: 5000, // 5 seconds
        attempts: 3,

        // Backoff strategy
        backoff: {
          type: 'exponential', // or 'fixed'
          delay: 5000,
        },

        // Rate limiting
        limiter: {
          max: 10, // 10 jobs
          duration: 1000, // per second
        },

        // Job ID (for deduplication)
        jobId: 'unique-job-id',

        // Remove options
        removeOnComplete: true,
        removeOnFail: false,

        // Timeout
        timeout: 30000, // 30 seconds

        // Repeat options
        repeat: {
          cron: '0 0 * * *',
          tz: 'America/New_York',
          endDate: new Date('2025-12-31'),
          limit: 100, // Max 100 repetitions
        },

        // Stack trace limit
        stackTraceLimit: 10,
      },
    );
  }
}
```

## Job Progress Tracking

```typescript
@Processor('file-processing')
export class FileProcessor {
  @Process('convert')
  async convertFile(job: Job<{ fileId: string }>) {
    const totalSteps = 100;

    for (let i = 0; i <= totalSteps; i++) {
      // Process file
      await this.processChunk(job.data.fileId, i);

      // Update progress
      await job.progress(i);

      // Check if job is still active
      const state = await job.getState();
      if (state === 'failed' || state === 'completed') {
        break;
      }
    }

    return { fileId: job.data.fileId, status: 'completed' };
  }

  private async processChunk(fileId: string, chunk: number) {
    // Processing logic
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Monitor progress
@Injectable()
export class ProgressMonitorService {
  constructor(
    @InjectQueue('file-processing') private queue: Queue,
  ) {}

  async monitorJob(jobId: string) {
    const job = await this.queue.getJob(jobId);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return {
      id: job.id,
      name: job.name,
      progress: job.progress(),
      state: await job.getState(),
      data: job.data,
    };
  }
}
```

## Multiple Queues

```typescript
@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'file-processing' },
      { name: 'notifications' },
    ),
  ],
})
export class AppModule {}

// Service using multiple queues
@Injectable()
export class MultiQueueService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    @InjectQueue('file-processing') private fileQueue: Queue,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  async processUserRegistration(user: User) {
    // Send welcome email
    await this.emailQueue.add('welcome', { userId: user.id });

    // Process profile picture
    if (user.profilePicture) {
      await this.fileQueue.add('resize-image', {
        userId: user.id,
        imageUrl: user.profilePicture
      });
    }

    // Send notification
    await this.notificationQueue.add('new-user', { userId: user.id });
  }
}
```

## Queue Dashboard/API

```typescript
@Controller('queues')
export class QueuesController {
  constructor(
    private queueManagementService: QueueManagementService,
  ) {}

  @Get('metrics')
  async getMetrics() {
    return this.queueManagementService.getQueueMetrics();
  }

  @Get('jobs/:state')
  async getJobs(@Param('state') state: string) {
    return this.queueManagementService.getJobs(state as any);
  }

  @Get('jobs/:jobId')
  async getJob(@Param('jobId') jobId: string) {
    return this.queueManagementService.getJob(jobId);
  }

  @Post('jobs/:jobId/retry')
  async retryJob(@Param('jobId') jobId: string) {
    await this.queueManagementService.retryJob(jobId);
    return { message: 'Job retry initiated' };
  }

  @Delete('jobs/:jobId')
  async removeJob(@Param('jobId') jobId: string) {
    await this.queueManagementService.removeJob(jobId);
    return { message: 'Job removed' };
  }

  @Post('pause')
  async pauseQueue() {
    await this.queueManagementService.pauseQueue();
    return { message: 'Queue paused' };
  }

  @Post('resume')
  async resumeQueue() {
    await this.queueManagementService.resumeQueue();
    return { message: 'Queue resumed' };
  }

  @Delete('clean')
  async cleanQueue(@Query('grace') grace: number, @Query('status') status: string) {
    await this.queueManagementService.cleanQueue(grace, status as any);
    return { message: 'Queue cleaned' };
  }
}
```

## Real-World Examples

### Image Processing

```typescript
@Injectable()
export class ImageService {
  constructor(
    @InjectQueue('image-processing') private imageQueue: Queue,
  ) {}

  async uploadImage(file: Express.Multer.File, userId: number) {
    // Save original image
    const imageId = await this.saveImage(file);

    // Queue processing jobs
    await this.imageQueue.addBulk([
      {
        name: 'thumbnail',
        data: { imageId, width: 150, height: 150 },
      },
      {
        name: 'medium',
        data: { imageId, width: 500, height: 500 },
      },
      {
        name: 'large',
        data: { imageId, width: 1200, height: 1200 },
      },
      {
        name: 'optimize',
        data: { imageId },
      },
    ]);

    return { imageId };
  }

  private async saveImage(file: Express.Multer.File) {
    // Save logic
  }
}

@Processor('image-processing')
export class ImageProcessor {
  @Process('thumbnail')
  async createThumbnail(job: Job) {
    // Resize image to thumbnail
  }

  @Process('optimize')
  async optimizeImage(job: Job) {
    // Optimize image
  }
}
```

### Report Generation

```typescript
@Injectable()
export class ReportsService {
  constructor(
    @InjectQueue('reports') private reportsQueue: Queue,
  ) {}

  async generateReport(reportType: string, filters: any) {
    const job = await this.reportsQueue.add(
      'generate',
      { reportType, filters },
      {
        attempts: 2,
        timeout: 300000, // 5 minutes
      },
    );

    return { jobId: job.id };
  }
}

@Processor('reports')
export class ReportsProcessor {
  @Process('generate')
  async generateReport(job: Job) {
    const { reportType, filters } = job.data;

    // Fetch data
    await job.progress(25);
    const data = await this.fetchData(reportType, filters);

    // Process data
    await job.progress(50);
    const processed = await this.processData(data);

    // Generate PDF
    await job.progress(75);
    const pdf = await this.generatePDF(processed);

    // Upload to storage
    await job.progress(90);
    const url = await this.uploadToS3(pdf);

    await job.progress(100);

    return { url };
  }
}
```

### Email Campaigns

```typescript
@Injectable()
export class CampaignService {
  constructor(
    @InjectQueue('campaigns') private campaignQueue: Queue,
  ) {}

  async sendCampaign(campaignId: number, recipientIds: number[]) {
    // Add individual email jobs
    const jobs = recipientIds.map((recipientId) => ({
      name: 'send-email',
      data: { campaignId, recipientId },
      opts: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 60000 },
        removeOnComplete: true,
      },
    }));

    await this.campaignQueue.addBulk(jobs);

    return { totalRecipients: recipientIds.length };
  }
}

@Processor('campaigns')
export class CampaignProcessor {
  @Process('send-email')
  async sendCampaignEmail(job: Job) {
    const { campaignId, recipientId } = job.data;

    const campaign = await this.getCampaign(campaignId);
    const recipient = await this.getRecipient(recipientId);

    await this.emailService.send({
      to: recipient.email,
      subject: campaign.subject,
      html: campaign.html,
    });

    // Track sent
    await this.trackEmailSent(campaignId, recipientId);
  }
}
```

## Best Practices

### Job Design
- Keep jobs small and focused
- Make jobs idempotent
- Store minimal data in job payload
- Use job IDs for deduplication

### Error Handling
- Set appropriate retry attempts
- Use exponential backoff
- Log failures for debugging
- Alert on critical failures

### Performance
- Use priority for important jobs
- Implement rate limiting
- Clean completed/failed jobs regularly
- Monitor queue depth

### Monitoring
- Track job metrics (success, failure, duration)
- Set up alerts for queue depth
- Monitor worker health
- Log job lifecycle events

### Scalability
- Use multiple workers for parallel processing
- Partition large workloads
- Use separate queues for different job types
- Scale workers based on queue depth
