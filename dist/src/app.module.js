"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const salons_module_1 = require("./salons/salons.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const billing_module_1 = require("./billing/billing.module");
const leads_module_1 = require("./leads/leads.module");
const analytics_module_1 = require("./analytics/analytics.module");
const support_module_1 = require("./support/support.module");
const alerts_module_1 = require("./alerts/alerts.module");
const automations_module_1 = require("./automations/automations.module");
const settings_module_1 = require("./settings/settings.module");
const health_module_1 = require("./health/health.module");
const jobs_module_1 = require("./jobs/jobs.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            salons_module_1.SalonsModule,
            subscriptions_module_1.SubscriptionsModule,
            billing_module_1.BillingModule,
            leads_module_1.LeadsModule,
            analytics_module_1.AnalyticsModule,
            support_module_1.SupportModule,
            alerts_module_1.AlertsModule,
            automations_module_1.AutomationsModule,
            settings_module_1.SettingsModule,
            health_module_1.HealthModule,
            jobs_module_1.JobsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map