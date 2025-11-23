# Task Scheduling

## Setup

```bash
npm install @nestjs/schedule
```

```typescript
// app.module.ts
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
```

## Cron Jobs

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  // Run every minute
  @Cron('* * * * *')
  handleEveryMinute() {
    console.log('Task runs every minute');
  }

  // Run at specific time: every day at 3:00 AM
  @Cron('0 3 * * *')
  handleDailyTask() {
    console.log('Daily task at 3:00 AM');
  }

  // Using predefined expressions
  @Cron(CronExpression.EVERY_30_SECONDS)
  handleEvery30Seconds() {
    console.log('Task runs every 30 seconds');
  }

  @Cron(CronExpression.EVERY_HOUR)
  handleEveryHour() {
    console.log('Task runs every hour');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  handleMidnight() {
    console.log('Task runs at midnight');
  }

  @Cron(CronExpression.MONDAY_TO_FRIDAY_AT_1AM)
  handleWeekdayMorning() {
    console.log('Task runs Monday to Friday at 1:00 AM');
  }
}
```

## Cron Expression Format

```
* * * * * *
| | | | | |
| | | | | day of week (0-7, 0 or 7 is Sunday)
| | | | month (1-12)
| | | day of month (1-31)
| | hour (0-23)
| minute (0-59)
second (0-59, optional)
```

Examples:
- `0 0 * * *` - Every day at midnight
- `0 */2 * * *` - Every 2 hours
- `0 9-17 * * 1-5` - Every hour from 9 AM to 5 PM, Monday to Friday
- `*/15 * * * *` - Every 15 minutes
- `0 0 1 * *` - First day of every month at midnight
- `0 0 * * 0` - Every Sunday at midnight

## Cron Options

```typescript
@Injectable()
export class TasksService {
  @Cron('0 0 * * *', {
    name: 'dailyReport',
    timeZone: 'America/New_York',
  })
  handleDailyReport() {
    console.log('Generate daily report');
  }

  // Disable cron job
  @Cron('* * * * *', {
    disabled: true,
  })
  handleDisabledTask() {
    console.log('This will not run');
  }

  // Run immediately on startup, then on schedule
  @Cron('0 0 * * *', {
    runOnInit: true,
  })
  handleWithInitialRun() {
    console.log('Runs on startup and then daily');
  }
}
```

## Intervals

```typescript
import { Interval } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  // Run every 10 seconds
  @Interval(10000)
  handleInterval() {
    console.log('Task runs every 10 seconds');
  }

  // Named interval
  @Interval('notifications', 30000)
  handleNotifications() {
    console.log('Check notifications every 30 seconds');
  }
}
```

## Timeouts

```typescript
import { Timeout } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  // Run once after 5 seconds
  @Timeout(5000)
  handleTimeout() {
    console.log('Task runs once after 5 seconds');
  }

  // Named timeout
  @Timeout('warmup', 3000)
  handleWarmup() {
    console.log('Warmup cache after 3 seconds');
  }
}
```

## Dynamic Scheduling

```typescript
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

@Injectable()
export class DynamicTasksService {
  constructor(private schedulerRegistry: SchedulerRegistry) {}

  addCronJob(name: string, cronExpression: string) {
    const job = new CronJob(cronExpression, () => {
      console.log(`Job ${name} executed`);
    });

    this.schedulerRegistry.addCronJob(name, job);
    job.start();

    console.log(`Job ${name} added with expression: ${cronExpression}`);
  }

  deleteCronJob(name: string) {
    this.schedulerRegistry.deleteCronJob(name);
    console.log(`Job ${name} deleted`);
  }

  getCronJobs() {
    const jobs = this.schedulerRegistry.getCronJobs();
    jobs.forEach((value, key) => {
      console.log(`Job: ${key}, Next run: ${value.nextDate()}`);
    });
  }

  addInterval(name: string, milliseconds: number) {
    const callback = () => {
      console.log(`Interval ${name} executed`);
    };

    const interval = setInterval(callback, milliseconds);
    this.schedulerRegistry.addInterval(name, interval);
  }

  deleteInterval(name: string) {
    this.schedulerRegistry.deleteInterval(name);
    console.log(`Interval ${name} deleted`);
  }

  addTimeout(name: string, milliseconds: number) {
    const callback = () => {
      console.log(`Timeout ${name} executed`);
    };

    const timeout = setTimeout(callback, milliseconds);
    this.schedulerRegistry.addTimeout(name, timeout);
  }

  deleteTimeout(name: string) {
    this.schedulerRegistry.deleteTimeout(name);
    console.log(`Timeout ${name} deleted`);
  }
}
```

## Controller for Dynamic Jobs

```typescript
@Controller('tasks')
export class TasksController {
  constructor(private dynamicTasksService: DynamicTasksService) {}

  @Post('cron')
  addCronJob(@Body() body: { name: string; expression: string }) {
    this.dynamicTasksService.addCronJob(body.name, body.expression);
    return { message: 'Cron job added' };
  }

  @Delete('cron/:name')
  deleteCronJob(@Param('name') name: string) {
    this.dynamicTasksService.deleteCronJob(name);
    return { message: 'Cron job deleted' };
  }

  @Get('cron')
  getCronJobs() {
    this.dynamicTasksService.getCronJobs();
    return { message: 'Check console for jobs' };
  }
}
```

## Error Handling

```typescript
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron('0 0 * * *')
  async handleDailyReport() {
    try {
      this.logger.log('Starting daily report generation');
      await this.generateReport();
      this.logger.log('Daily report generated successfully');
    } catch (error) {
      this.logger.error('Failed to generate daily report', error.stack);
      // Send alert
      await this.notifyAdmins(error);
    }
  }

  private async generateReport() {
    // Report generation logic
  }

  private async notifyAdmins(error: Error) {
    // Send notification to admins
  }
}
```

## Distributed Scheduling with Redis

```typescript
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import Redis from 'ioredis';

@Injectable()
export class DistributedTasksService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  @Cron('0 * * * *')
  async handleDistributedTask() {
    const lockKey = 'lock:hourly-task';
    const lockTimeout = 300; // 5 minutes

    // Try to acquire lock
    const acquired = await this.redis.set(
      lockKey,
      'locked',
      'EX',
      lockTimeout,
      'NX',
    );

    if (!acquired) {
      console.log('Task already running on another instance');
      return;
    }

    try {
      await this.performTask();
    } finally {
      await this.redis.del(lockKey);
    }
  }

  private async performTask() {
    console.log('Performing task on this instance');
    // Task logic
  }
}
```

## Database Cleanup Example

```typescript
@Injectable()
export class DatabaseCleanupService {
  constructor(
    private usersRepository: UsersRepository,
    private logsRepository: LogsRepository,
  ) {}

  // Delete inactive users every week
  @Cron('0 0 * * 0')
  async cleanupInactiveUsers() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleted = await this.usersRepository.deleteMany({
      active: false,
      lastLogin: { $lt: thirtyDaysAgo },
    });

    console.log(`Deleted ${deleted} inactive users`);
  }

  // Delete old logs every day
  @Cron('0 2 * * *')
  async cleanupOldLogs() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const deleted = await this.logsRepository.deleteMany({
      createdAt: { $lt: ninetyDaysAgo },
    });

    console.log(`Deleted ${deleted} old log entries`);
  }
}
```

## Report Generation Example

```typescript
@Injectable()
export class ReportsService {
  constructor(
    private ordersService: OrdersService,
    private emailService: EmailService,
  ) {}

  // Generate daily sales report
  @Cron('0 8 * * *', {
    name: 'dailySalesReport',
    timeZone: 'America/New_York',
  })
  async generateDailySalesReport() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sales = await this.ordersService.getSalesBetween(yesterday, today);

    const report = {
      date: yesterday.toISOString().split('T')[0],
      totalSales: sales.reduce((sum, order) => sum + order.total, 0),
      orderCount: sales.length,
      topProducts: this.getTopProducts(sales),
    };

    await this.emailService.sendSalesReport(report);
  }

  // Generate monthly report on first day of month
  @Cron('0 9 1 * *')
  async generateMonthlyReport() {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const report = await this.ordersService.getMonthlyReport(lastMonth);
    await this.emailService.sendMonthlyReport(report);
  }

  private getTopProducts(sales: any[]) {
    // Calculate top products
  }
}
```

## Cache Warming Example

```typescript
@Injectable()
export class CacheWarmingService {
  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
  ) {}

  // Warm cache every hour
  @Cron('0 * * * *')
  async warmCache() {
    console.log('Starting cache warming');

    // Warm popular products
    const popularProducts = await this.productsService.getPopular();
    await Promise.all(
      popularProducts.map((product) =>
        this.cache.set(`product:${product.id}`, product, 3600),
      ),
    );

    // Warm categories
    const categories = await this.categoriesService.findAll();
    await this.cache.set('categories:all', categories, 3600);

    console.log('Cache warming complete');
  }

  // Clear cache at midnight
  @Cron('0 0 * * *')
  async clearExpiredCache() {
    await this.cache.reset();
    console.log('Cache cleared');
  }
}
```

## Notification Service Example

```typescript
@Injectable()
export class NotificationService {
  constructor(
    private usersService: UsersService,
    private emailService: EmailService,
  ) {}

  // Send reminder emails every day at 10 AM
  @Cron('0 10 * * *')
  async sendDailyReminders() {
    const users = await this.usersService.getUsersWithPendingTasks();

    for (const user of users) {
      await this.emailService.sendReminderEmail(user);
    }

    console.log(`Sent reminders to ${users.length} users`);
  }

  // Send weekly digest every Monday at 9 AM
  @Cron('0 9 * * 1')
  async sendWeeklyDigest() {
    const users = await this.usersService.getActiveUsers();

    for (const user of users) {
      const digest = await this.generateWeeklyDigest(user);
      await this.emailService.sendDigest(user, digest);
    }

    console.log(`Sent weekly digest to ${users.length} users`);
  }

  private async generateWeeklyDigest(user: any) {
    // Generate digest logic
  }
}
```

## Monitoring Scheduled Jobs

```typescript
@Injectable()
export class JobMonitoringService {
  private jobExecutions = new Map<string, JobExecution>();

  @Cron('0 0 * * *', { name: 'dailyBackup' })
  async dailyBackup() {
    const jobName = 'dailyBackup';
    const startTime = Date.now();

    try {
      await this.performBackup();

      this.recordExecution(jobName, {
        status: 'success',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      });
    } catch (error) {
      this.recordExecution(jobName, {
        status: 'failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
        error: error.message,
      });

      throw error;
    }
  }

  private recordExecution(jobName: string, execution: JobExecution) {
    this.jobExecutions.set(jobName, execution);
    console.log(`Job ${jobName} execution:`, execution);
  }

  getJobStatus(jobName: string) {
    return this.jobExecutions.get(jobName);
  }

  getAllJobStatuses() {
    return Array.from(this.jobExecutions.entries()).map(([name, execution]) => ({
      name,
      ...execution,
    }));
  }

  private async performBackup() {
    // Backup logic
  }
}

interface JobExecution {
  status: 'success' | 'failed';
  duration: number;
  timestamp: Date;
  error?: string;
}
```

## Best Practices

### Job Design
- Keep jobs idempotent (safe to run multiple times)
- Use appropriate error handling
- Log job execution for monitoring
- Set reasonable timeouts

### Timing
- Consider time zones for scheduled jobs
- Avoid scheduling heavy jobs during peak hours
- Use staggered schedules for multiple jobs
- Account for daylight saving time changes

### Distributed Systems
- Use distributed locks (Redis) for singleton jobs
- Ensure only one instance runs critical jobs
- Handle job failures gracefully
- Implement retry logic for transient failures

### Monitoring
- Log all job executions
- Track job duration and success rate
- Set up alerts for failed jobs
- Monitor system resources during job execution

### Performance
- Batch operations when possible
- Use pagination for large datasets
- Limit job execution time
- Clean up resources after job completion
