"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@pm2/io");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const global_exception_filter_1 = require("./core/filters/global-exception.filter");
const winston_logger_1 = require("./core/logger/winston.logger");
const logging_interceptor_1 = require("./core/interceptors/logging.interceptor");
const performance_interceptor_1 = require("./core/matrics/performance.interceptor");
const response_interceptor_1 = require("./core/interceptors/response.interceptor");
const debug_interceptor_1 = require("./core/interceptors/debug.interceptor");
const monitoring_interceptor_1 = require("./core/interceptors/monitoring.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: winston_logger_1.WinstonLogger,
    });
    app.useGlobalFilters(new global_exception_filter_1.AllExceptionsFilter());
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor(), new performance_interceptor_1.PerformanceInterceptor(), new response_interceptor_1.ResponseInterceptor(), new debug_interceptor_1.DebugInterceptor(), new monitoring_interceptor_1.MonitoringInterceptor());
    await app.listen(process.env.PORT ?? 3000);
    console.log(`🚀 App running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
//# sourceMappingURL=main.js.map