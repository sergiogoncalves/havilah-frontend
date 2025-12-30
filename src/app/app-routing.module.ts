import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'pacientes', pathMatch: 'full' },
  {
    path: 'pacientes',
    loadChildren: () =>
      import('./pages/pacientes/pacientes.module').then(m => m.PacientesModule)
  },
  { path: '**', redirectTo: 'pacientes' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
