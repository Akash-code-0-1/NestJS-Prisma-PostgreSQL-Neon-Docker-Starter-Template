import { Module } from '@nestjs/common';
import { TestimonialController } from './testimonial.controller';
import { TestimonialService } from './testimonial.service';
import { PrismaModule } from '../../../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TestimonialController],
  providers: [TestimonialService],
})
export class TestimonialModule {}
