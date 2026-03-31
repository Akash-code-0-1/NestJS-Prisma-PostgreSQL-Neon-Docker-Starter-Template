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
const throttler_1 = require("@nestjs/throttler");
const prisma_module_1 = require("./core/prisma/prisma.module");
const auth_module_1 = require("./modules/iam/auth/auth.module");
const users_module_1 = require("./modules/iam/auth/users/users.module");
const salons_module_1 = require("./modules/tenancy/salons/salons.module");
const health_module_1 = require("./health/health.module");
const salonOwner_auth_module_1 = require("./modules/iam/auth/salon-owners/salonOwner-auth.module");
const employee_module_1 = require("./modules/iam/auth/employee/employee.module");
const client_auth_module_1 = require("./modules/iam/auth/client/client-auth.module");
const services_module_1 = require("./modules/tenancy/salons/services/services.module");
const testimonial_module_1 = require("./modules/tenancy/salons/testimonials/testimonial.module");
const employee_management_module_1 = require("./modules/tenancy/salons/employee-management/employee-management.module");
const appointment_module_1 = require("./modules/tenancy/appointments/appointment.module");
const create_voucher_module_1 = require("./modules/tenancy/create-voucher/create-voucher.module");
const buy_voucher_module_1 = require("./modules/tenancy/buy_voucher/buy-voucher.module");
const contact_module_1 = require("./modules/tenancy/contact/contact.module");
const receipt_module_1 = require("./modules/finance/receipts/receipt.module");
const bundle_module_1 = require("./modules/tenancy/salons/bundle-management/bundle.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60,
                    limit: 20,
                },
            ]),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            salons_module_1.SalonsModule,
            health_module_1.HealthModule,
            salonOwner_auth_module_1.OwnerAuthModule,
            employee_module_1.EmployeeAuthModule,
            client_auth_module_1.ClientAuthModule,
            services_module_1.ServicesModule,
            testimonial_module_1.TestimonialModule,
            employee_management_module_1.EmployeeManagementModule,
            appointment_module_1.AppointmentModule,
            create_voucher_module_1.VoucherModule,
            buy_voucher_module_1.BuyVoucherModule,
            contact_module_1.ContactModule,
            receipt_module_1.ReceiptsModule,
            bundle_module_1.BundleModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map