import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { AppRole } from '../common/enums/app-role.enum';
import { ReportDateRangeQueryDto } from './dto/report-date-range-query.dto';
import { TopProductsReportQueryDto } from './dto/top-products-report-query.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  @Roles(AppRole.ADMIN, AppRole.VIEWER)
  revenue(@Query() query: ReportDateRangeQueryDto) {
    return this.reportsService.getRevenue(query);
  }

  @Get('orders-by-status')
  @Roles(AppRole.ADMIN, AppRole.VIEWER)
  ordersByStatus(@Query() query: ReportDateRangeQueryDto) {
    return this.reportsService.getOrdersByStatus(query);
  }

  @Get('top-products')
  @Roles(AppRole.ADMIN, AppRole.VIEWER)
  topProducts(@Query() query: TopProductsReportQueryDto) {
    return this.reportsService.getTopProducts(query);
  }

  @Get('average-delivery-time')
  @Roles(AppRole.ADMIN, AppRole.VIEWER)
  averageDeliveryTime(@Query() query: ReportDateRangeQueryDto) {
    return this.reportsService.getAverageDeliveryTime(query);
  }
}
