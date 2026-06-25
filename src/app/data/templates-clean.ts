import { DocumentTemplate } from '../types/document';
import { residentialLeaseTemplate } from './residential-lease-template';

export const documentTemplates: DocumentTemplate[] = [
  residentialLeaseTemplate,
];

export function getTemplateById(id: string): DocumentTemplate | undefined {
  return documentTemplates.find(template => template.id === id);
}

export function getTemplatesByCategory(category: string): DocumentTemplate[] {
  return documentTemplates.filter(template => template.category === category);
}

export const categories = [
  'Estate Planning & Personal',
  'Real Estate & Property',
  'Business Contracts',
  'Business Formation',
  'Financial & Lending',
  'Digital & Website',
];
