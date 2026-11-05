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
                { path: 'propina/panel', loadComponent: () => import('./pages/propina/panel-general/panel-general').then(m => m.PanelGeneralComponent) },
                { path: 'propina/distribucion', loadComponent: () => import('./pages/propina/distribucion/distribucion').then(m => m.Distribucion) },
                { path: 'propina/reportes', loadComponent: () => import('./pages/propina/reportes/reportes').then(m => m.Reportes) },
                // Ruta de soporte 
                { path: 'soporte', loadComponent: () => import('./pages/soporte/soporte').then(m => m.Soporte) },
                
                // Ruta de bilioteca digital
                { path: 'biblioteca', loadComponent: () => import('./pages/biblioteca/biblioteca').then(m => m.Biblioteca) },

                { path: '', redirectTo: 'dashboard', pathMatch: 'full' }

            ]
        },
    { path: '**', redirectTo: 'login' }
];