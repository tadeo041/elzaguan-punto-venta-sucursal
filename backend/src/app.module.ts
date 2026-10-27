import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
// Entidades
import { User } from './users/user.entity';
// Modulos 
import { UsersModule } from './users/users.module'; 

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'pos-database.sqlite',
      entities: [User], 
      synchronize: true, 
    }),
    UsersModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}