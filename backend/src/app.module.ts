import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entidades
import { User } from './users/user.entity';
import { Tip } from './tips/tip.entity';
import { TipHistory } from './tips/tip-history.entity' 
import { Department } from './departments/department.entity';


// Modulos 
import { UsersModule } from './users/users.module'; 
import { AuthModule } from './auth/auth.module';
import { TipsModule } from './tips/tips.module';
import { DepartmentsModule } from './departments/departments.module';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'pos-database.sqlite',
      entities: [User, Tip,TipHistory,Department], 
      synchronize: true,     
    }),
    UsersModule,
    AuthModule,
    TipsModule,
    DepartmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}