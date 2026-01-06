import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtendimentosRoutingModule } from './atendimentos-routing.module';
import { ListarComponent } from './listar/listar.component';
import { FormComponent } from './form/form.component';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';

@NgModule({
  declarations: [ListarComponent, FormComponent],
  imports: [
    CommonModule,
    FormsModule,
    AtendimentosRoutingModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    InputTextModule,
    InputTextareaModule
  ]
})
export class AtendimentosModule { }
