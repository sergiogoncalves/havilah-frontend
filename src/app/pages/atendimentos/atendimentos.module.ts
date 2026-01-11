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
import { QuillModule } from 'ngx-quill';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';



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
    InputTextareaModule,
    QuillModule,
    DropdownModule,
    CalendarModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService]
})
export class AtendimentosModule { }
