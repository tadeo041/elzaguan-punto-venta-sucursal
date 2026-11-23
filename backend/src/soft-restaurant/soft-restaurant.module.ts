import { Module } from '@nestjs/common';
import { ConfiguracionModule } from '../config/configuracion.module';
import { SoftRestaurantService } from './soft-restaurant.service';
import { SoftRestaurantController } from './soft-restaurant.controller';

@Module({
    imports: [ConfiguracionModule],
    controllers: [SoftRestaurantController],
    providers: [SoftRestaurantService],
    exports: [SoftRestaurantService],
})
export class SoftRestaurantModule {}