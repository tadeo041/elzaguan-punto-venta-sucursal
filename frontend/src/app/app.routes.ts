import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { AuthGuard } from '../app/guards/auth-guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
        {
            path: '',
            component: MainLayoutComponent,
            canActivate: [AuthGuard],
            children: [
                { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
                
                // Rutas de Propina
                {
                    path: 'propina',
                    children: [
                        { path: 'panel-general', loadComponent: () => import('./pages/propina/panel-general/panel-general').then(m => m.PanelGeneralComponent) },
                        { path: 'distribucion', loadComponent: () => import('./pages/propina/distribucion/distribucion').then(m => m.Distribucion) },
                        { path: 'reportes', loadComponent: () => import('./pages/propina/reportes/reportes').then(m => m.Reportes) },
                        { path: '', redirectTo: 'panel-general', pathMatch: 'full' },                        
                    ],
                },                  
                // Ruta de WhatsApp
                {
                    path: 'whatsapp',
                    children: [
                        { path: 'bandeja', loadComponent: () => import('./pages/whatsapp/bandeja/bandeja').then(m => m.Bandeja) },
                        { path: '', redirectTo: 'bandeja', pathMatch: 'full' },                        
                    ],
                },                
                // Ruta de bilioteca digital
                { path: 'biblioteca', loadComponent: () => import('./pages/biblioteca/biblioteca').then(m => m.Biblioteca) },

                // Ruta de soporte 
                { path: 'soporte', loadComponent: () => import('./pages/soporte/soporte').then(m => m.Soporte) },
                { path: 'configuracion', loadComponent: () => import('./pages/configuracion/configuracion').then(m => m.Configuracion) },
                { path: 'usuarios', loadComponent: () => import('./pages/usuarios/usuarios').then(m => m.Usuarios) },                                
                { path: '', redirectTo: 'dashboard', pathMatch: 'full' }

            ]
        },
    { path: '**', redirectTo: 'login' }
];