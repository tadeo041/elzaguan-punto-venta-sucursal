import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Department, TipType } from './department.entity';
import { CreateDepartmentDto } from './create-department.dto';
import { Tip } from '../tips/tip.entity';

@Injectable()
export class DepartmentsService {
    constructor(
        @InjectRepository(Department)
        private departmentRepository: Repository<Department>,
        @InjectRepository(Tip)
        private tipRepository: Repository<Tip>,
    ) { }

    // 1. Crear un departamento
    async create(createDto: CreateDepartmentDto) {
        const department = this.departmentRepository.create(createDto);
        return await this.departmentRepository.save(department);
    }

    // 2. Listar todos los departamentos activos
    async findAll() {
        return await this.departmentRepository.find({
            where: { isActive: true }
        });
    }

    // 3. Calcular la distribución basada en la fecha de inicio
    async getDistribution(startDate: string) {
        // A. Convertimos el string "YYYY-MM-DD" a un objeto Date real
        const fechaInicio = new Date(`${startDate}T00:00:00`);

        // B. Buscamos todas las propinas desde la fecha de inicio hasta hoy
        const tips = await this.tipRepository.find({
            where: {
                createdAt: MoreThanOrEqual(fechaInicio)
            }
        });

        // C. Sumamos el total de la bolsa
        const totalTips = tips.reduce((sum, tip) => sum + Number(tip.amount), 0);

        // D. Traemos los departamentos configurados
        const departments = await this.findAll();

        // E. Calculamos cuánto le toca a cada uno
        let totalFixedAmounts = 0;
        let totalPercentages = 0;

        departments.forEach(dep => {
            if (dep.type === TipType.CANTIDAD_FIJA) {
                totalFixedAmounts += Number(dep.value);
            } else {
                totalPercentages += Number(dep.value);
            }
        });

        // F. Armamos la respuesta calculando el monto de cada departamento
        const distribution = departments.map(dep => {
            let departmentTotal = 0;

            if (dep.type === TipType.CANTIDAD_FIJA) {
                // Si es cantidad fija, se asigna exactamente ese monto
                departmentTotal = Number(dep.value);
            } else {
                // Si es porcentaje, se calcula sobre el TOTAL de las propinas
                departmentTotal = (Number(dep.value) / 100) * totalTips;
            }

            // Dividimos el total del departamento entre sus trabajadores
            const individualAmount = departmentTotal / dep.workerCount;

            return {
                id: dep.id,
                name: dep.name,
                type: dep.type,
                value: Number(dep.value),
                workerCount: dep.workerCount,
                icon: dep.icon,
                departmentTotal: Number(departmentTotal.toFixed(2)),
                individualAmount: Number(individualAmount.toFixed(2)),
            };
        });

        return {
            startDate,
            totalTips: Number(totalTips.toFixed(2)),
            totalFixedAmounts: Number(totalFixedAmounts.toFixed(2)),
            remainingForPercentages: Number((totalTips - totalFixedAmounts).toFixed(2)), // Solo informativo
            distribution
        };
    }
    // 4. Actualizar un departamento existente
    async update(id: number, updateDto: any) {
        const department = await this.departmentRepository.findOne({ where: { id } });
        if (!department) {
            throw new NotFoundException('Departamento no encontrado');
        }

        // Mezclamos los datos actuales con los nuevos
        Object.assign(department, updateDto);

        return await this.departmentRepository.save(department);
    }
}