import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtendimentosRoutingModule } from './atendimentos-routing.module';
import { ListarComponent } from './listar/listar.component';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@NgModule({
  declarations: [ListarComponent],
  imports: [
    CommonModule,
    FormsModule,
    AtendimentosRoutingModule,
    TableModule,
    ButtonModule,
    TooltipModule
  ]
})
export class AtendimentosModule { }
