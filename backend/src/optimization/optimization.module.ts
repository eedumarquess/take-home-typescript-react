import { Module } from '@nestjs/common';
import { OptimizationService } from './optimization.service';

@Module({
  providers: [OptimizationService],
  exports: [OptimizationService],
})
export class OptimizationModule {}
