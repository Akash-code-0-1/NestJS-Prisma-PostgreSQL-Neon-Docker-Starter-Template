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
const prisma_module_1 = require("./core/prisma/prisma.module");
const auth_module_1 = require("./modules/iam/auth/auth.module");
const users_module_1 = require("./modules/iam/auth/users/users.module");
const salons_module_1 = require("./modules/tenancy/salons/salons.module");
const health_module_1 = require("./health/health.module");
const salonOwner_auth_module_1 = require("./modules/iam/auth/salon-owners/salonOwner-auth.module");
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
            health_module_1.HealthModule,
            salonOwner_auth_module_1.OwnerAuthModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map