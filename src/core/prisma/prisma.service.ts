/* eslint-disable @typescript-eslint/no-misused-promises */
// import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
// import { PrismaClient } from '@prisma/client';

// @Injectable()
// export class PrismaService extends PrismaClient implements OnModuleInit {
//   service: any;
//   async onModuleInit() {
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-call
//     await this.$connect();
//   }

//   enableShutdownHooks(app: INestApplication) {
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-misused-promises
//     this.$on('beforeExit' as never, async () => {
//       await app.close();
//     });
//   }
// }

import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  // appointment: any;
  // testimonial: any;
  // ✅ Removed "service: any;" — this was overwriting Prisma's model

  async onModuleInit() {
    await this.$connect();
  }

  enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit' as never, async () => {
      await app.close();
    });
  }
}
