import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { AppRole } from '../common/enums/app-role.enum';
import { OptimizationService } from './optimization.service';

@Controller('orders')
export class OptimizationController {
  constructor(private readonly optimizationService: OptimizationService) {}

  @Post('optimize-assignment')
  @HttpCode(HttpStatus.OK)
  @Roles(AppRole.ADMIN)
  optimizeAssignment() {
    return this.optimizationService.optimizeAssignment();
  }
}
