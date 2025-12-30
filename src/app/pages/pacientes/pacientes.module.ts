import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PacientesRoutingModule } from './pacientes-routing.module';
import { ListarComponent } from './listar/listar.component';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';

@NgModule({
  declarations: [ListarComponent],
  imports: [
    CommonModule,
    FormsModule,
    PacientesRoutingModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToolbarModule,
    TagModule
  ]
})
export class PacientesModule { }
