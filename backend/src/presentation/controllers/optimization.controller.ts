import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { OptimizeAssignmentUseCase } from '../../application/optimization/optimization.use-case';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';

@Controller('orders')
export class OptimizationController {
  constructor(private readonly optimizeAssignmentUseCase: OptimizeAssignmentUseCase) {}

  @Post('optimize-assignment')
  @HttpCode(HttpStatus.OK)
  @Roles(AppRole.ADMIN)
  optimizeAssignment() {
    return this.optimizeAssignmentUseCase.execute();
  }
}
