// Plantillas de documentos en español COMPLETAS Y PROFESIONALES
// Estas se usan para vista previa cuando el idioma de la interfaz está en español
// Los documentos finales exportados respetan el idioma seleccionado por el usuario

import { residentialLeaseTemplateES } from './residential-lease-es';
import { ndaTemplateES } from './nda-es';
import { independentContractorTemplateES } from './independent-contractor-es';
import { billOfSaleVehicleTemplateES } from './bill-of-sale-vehicle-es';
import { serviceAgreementTemplateES } from './service-agreement-es';
import { promissoryNoteTemplateES } from './promissory-note-es';

export const spanishTemplates: Record<string, string> = {
  // Documentos reales disponibles
  'residential-lease': residentialLeaseTemplateES,
  'nda': ndaTemplateES.template,
  'independent-contractor': independentContractorTemplateES.template,
  'bill-of-sale-vehicle': billOfSaleVehicleTemplateES.template,
  'service-agreement': serviceAgreementTemplateES.template,
  'promissory-note': promissoryNoteTemplateES.template,
  

};