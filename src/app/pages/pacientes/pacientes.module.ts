import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PacientesRoutingModule } from './pacientes-routing.module';
import { ListarComponent } from './listar/listar.component';
import { FormsModule } from '@angular/forms';
import { FormComponent } from './form/form.component';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';

@NgModule({
  declarations: [ListarComponent, FormComponent],
  imports: [
    CommonModule,
    FormsModule,
    PacientesRoutingModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToolbarModule,
    TagModule,
    DropdownModule,
    CheckboxModule,
    TooltipModule
  ]
})
export class PacientesModule { }
