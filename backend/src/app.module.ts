import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './users/user.entity';
import { Tip } from './tips/tip.entity';
import { TipHistory } from './tips/tip-history.entity';
import { Department } from './departments/department.entity';
import { DailyConfig } from './daily/daily-config.entity';
import { Configuracion } from './config/entities/configuracion.entity';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TipsModule } from './tips/tips.module';
import { DepartmentsModule } from './departments/departments.module';
import { DailyModule } from './daily/daily.module';
import { MetricsModule } from './metrics/metrics.module';
import { ConfiguracionModule } from './config/configuracion.module';
import { SoftRestaurantModule } from './soft-restaurant/soft-restaurant.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            url: process.env.DATABASE_URL, 
            autoLoadEntities: true, 
            synchronize: false, 
            ssl: {
                rejectUnauthorized: false 
            },
        }),
        ConfiguracionModule,
        SoftRestaurantModule,          
        UsersModule,
        AuthModule,
        TipsModule,
        DepartmentsModule,
        DailyModule,
        MetricsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}