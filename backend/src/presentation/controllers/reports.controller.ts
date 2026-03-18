import { Controller, Get, Query } from '@nestjs/common';
import {
  GetAverageDeliveryTimeUseCase,
  GetOrdersByStatusUseCase,
  GetRevenueByPeriodUseCase,
  GetTopProductsUseCase,
} from '../../application/reports/reports.use-cases';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { ReportDateRangeQueryDto } from '../dto/reports/report-date-range-query.dto';
import { TopProductsReportQueryDto } from '../dto/reports/top-products-report-query.dto';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly getRevenueByPeriodUseCase: GetRevenueByPeriodUseCase,
    private readonly getOrdersByStatusUseCase: GetOrdersByStatusUseCase,
    private readonly getTopProductsUseCase: GetTopProductsUseCase,
    private readonly getAverageDeliveryTimeUseCase: GetAverageDeliveryTimeUseCase,
  ) {}

  @Get('revenue')
  @Roles(AppRole.ADMIN, AppRole.VIEWER)
  revenue(@Query() query: ReportDateRangeQueryDto) {
    return this.getRevenueByPeriodUseCase.execute(query);
  }

  @Get('orders-by-status')
  @Roles(AppRole.ADMIN, AppRole.VIEWER)
  ordersByStatus(@Query() query: ReportDateRangeQueryDto) {
    return this.getOrdersByStatusUseCase.execute(query);
  }

  @Get('top-products')
  @Roles(AppRole.ADMIN, AppRole.VIEWER)
  topProducts(@Query() query: TopProductsReportQueryDto) {
    return this.getTopProductsUseCase.execute(query);
  }

  @Get('average-delivery-time')
  @Roles(AppRole.ADMIN, AppRole.VIEWER)
  averageDeliveryTime(@Query() query: ReportDateRangeQueryDto) {
    return this.getAverageDeliveryTimeUseCase.execute(query);
  }
}
