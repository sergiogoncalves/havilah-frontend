import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListarComponent } from './listar/listar.component';
import { FormComponent } from './form/form.component';

const routes: Routes = [
  { path: '', component: ListarComponent }, // /pacientes
  { path: 'novo', component: FormComponent },
  { path: ':id', component: FormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PacientesRoutingModule {}
