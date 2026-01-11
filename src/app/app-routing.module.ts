import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OpcaoPageComponent } from './pages/opcao/opcao.component';

const routes: Routes = [
  { path: '', redirectTo: 'pacientes', pathMatch: 'full' },
  {
    path: 'pacientes',
    loadChildren: () =>
      import('./pages/pacientes/pacientes.module').then(m => m.PacientesModule)
  },
  {
    path: 'atendimentos',
    loadChildren: () =>
      import('./pages/atendimentos/atendimentos.module').then(m => m.AtendimentosModule)
  },
  { path: 'opcao/:key', component: OpcaoPageComponent },
  { path: '**', redirectTo: 'pacientes' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
