import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './users/user.entity';
import { Tip } from './tips/tip.entity';
import { TipHistory } from './tips/tip-history.entity';
import { Department } from './departments/department.entity';
import { Conversation } from './whatsapp/entities/conversation.entity';
import { Message } from './whatsapp/entities/message.entity';
import { Configuracion } from './config/entities/configuracion.entity';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TipsModule } from './tips/tips.module';
import { DepartmentsModule } from './departments/departments.module';
import { MetricsModule } from './metrics/metrics.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { ConfiguracionModule } from './config/configuracion.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
            type: 'better-sqlite3',
            database: 'pos-database.sqlite',
            entities: [User, Tip, TipHistory, Department, Conversation, Message, Configuracion],
            synchronize: true,
        }),
        ConfiguracionModule,
        UsersModule,
        AuthModule,
        TipsModule,
        DepartmentsModule,
        MetricsModule,
        WhatsappModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}