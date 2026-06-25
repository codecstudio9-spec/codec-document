// Field translations for document forms - COMPLETE
// This file contains translations for ALL form field labels, placeholders, and help text

type Language = 'en' | 'es';
type FieldPart = 'label' | 'placeholder' | 'help';

export const fieldTranslations: Record<string, Record<string, Record<FieldPart, Record<Language, string>>>> = {
  'last-will-testament': {
    'testator_name': {
      'label': { en: 'Your Full Legal Name', es: 'Tu Nombre Legal Completo' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'testator_address': {
      'label': { en: 'Your Address', es: 'Tu Dirección' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'testator_dob': {
      'label': { en: 'Your Date of Birth', es: 'Tu Fecha de Nacimiento' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'executor_name': {
      'label': { en: 'Executor Name', es: 'Nombre del Albacea' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Person who will manage your estate', es: 'Persona que administrará tu patrimonio' },
    },
    'executor_address': {
      'label': { en: 'Executor Address', es: 'Dirección del Albacea' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'beneficiary1_name': {
      'label': { en: 'Primary Beneficiary Name', es: 'Nombre del Beneficiario Principal' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'beneficiary1_relation': {
      'label': { en: 'Relationship', es: 'Relación' },
      'placeholder': { en: 'Spouse, Child, etc.', es: 'Esposo/a, Hijo/a, etc.' },
      'help': { en: '', es: '' },
    },
    'beneficiary1_share': {
      'label': { en: 'Share (%)', es: 'Porcentaje (%)' },
      'placeholder': { en: '100', es: '100' },
      'help': { en: '', es: '' },
    },
    'guardian_name': {
      'label': { en: 'Guardian for Minor Children (if applicable)', es: 'Tutor para Hijos Menores (si aplica)' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'state': {
      'label': { en: 'Your State', es: 'Tu Estado' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
  },
  'power-of-attorney': {
    'principal_name': {
      'label': { en: 'Your Name (Principal)', es: 'Tu Nombre (Principal)' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'principal_address': {
      'label': { en: 'Your Address', es: 'Tu Dirección' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'agent_name': {
      'label': { en: 'Agent Name', es: 'Nombre del Apoderado' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Person receiving authority', es: 'Persona que recibe la autoridad' },
    },
    'agent_address': {
      'label': { en: 'Agent Address', es: 'Dirección del Apoderado' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'poa_type': {
      'label': { en: 'Type of Power of Attorney', es: 'Tipo de Poder Notarial' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'effective_date': {
      'label': { en: 'Effective Date', es: 'Fecha Efectiva' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'state': {
      'label': { en: 'State', es: 'Estado' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
  },
  'child-travel-consent': {
    'parent_name': {
      'label': { en: 'Parent/Guardian Name', es: 'Nombre del Padre/Tutor' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'child_name': {
      'label': { en: 'Child Name', es: 'Nombre del Menor' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'child_dob': {
      'label': { en: 'Child Date of Birth', es: 'Fecha de Nacimiento del Menor' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'travel_adult': {
      'label': { en: 'Traveling With (Adult Name)', es: 'Viaja con (Nombre del Adulto)' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'destination': {
      'label': { en: 'Travel Destination', es: 'Destino del Viaje' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'travel_dates': {
      'label': { en: 'Travel Dates', es: 'Fechas del Viaje' },
      'placeholder': { en: 'March 15-22, 2026', es: '15-22 de marzo, 2026' },
      'help': { en: '', es: '' },
    },
  },
  'prenuptial-agreement': {
    'party_a_name': {
      'label': { en: 'First Party Name', es: 'Nombre de la Primera Parte' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'party_b_name': {
      'label': { en: 'Second Party Name', es: 'Nombre de la Segunda Parte' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'marriage_date': {
      'label': { en: 'Intended Marriage Date', es: 'Fecha Prevista de Matrimonio' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'party_a_assets': {
      'label': { en: 'First Party Separate Assets', es: 'Bienes Separados Primera Parte' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'party_b_assets': {
      'label': { en: 'Second Party Separate Assets', es: 'Bienes Separados Segunda Parte' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'state': {
      'label': { en: 'State', es: 'Estado' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
  },
  'residential-lease': {
    'landlord_name': {
      'label': { en: 'Landlord Name', es: 'Nombre del Arrendador' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'tenant_name': {
      'label': { en: 'Tenant Name', es: 'Nombre del Inquilino' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'property_address': {
      'label': { en: 'Property Address', es: 'Dirección de la Propiedad' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'monthly_rent': {
      'label': { en: 'Monthly Rent ($)', es: 'Renta Mensual ($)' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'security_deposit': {
      'label': { en: 'Security Deposit ($)', es: 'Depósito de Garantía ($)' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'lease_start': {
      'label': { en: 'Lease Start Date', es: 'Fecha de Inicio del Contrato' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'lease_term': {
      'label': { en: 'Lease Term', es: 'Duración del Contrato' },
      'placeholder': { en: '12 months', es: '12 meses' },
      'help': { en: '', es: '' },
    },
    'late_fee': {
      'label': { en: 'Late Fee ($)', es: 'Cargo por Mora ($)' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'state': {
      'label': { en: 'State', es: 'Estado' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
  },
  'eviction-notice': {
    'landlord_name': {
      'label': { en: 'Landlord Name', es: 'Nombre del Arrendador' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'tenant_name': {
      'label': { en: 'Tenant Name', es: 'Nombre del Inquilino' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'property_address': {
      'label': { en: 'Property Address', es: 'Dirección de la Propiedad' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'notice_date': {
      'label': { en: 'Notice Date', es: 'Fecha del Aviso' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'violation_reason': {
      'label': { en: 'Reason for Eviction', es: 'Motivo del Desalojo' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'cure_period': {
      'label': { en: 'Days to Cure/Vacate', es: 'Días para Desalojar' },
      'placeholder': { en: '30', es: '30' },
      'help': { en: '', es: '' },
    },
    'state': {
      'label': { en: 'State', es: 'Estado' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
  },
  'bill-of-sale': {
    'seller_name': {
      'label': { en: 'Seller Name', es: 'Nombre del Vendedor' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'buyer_name': {
      'label': { en: 'Buyer Name', es: 'Nombre del Comprador' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'item_description': {
      'label': { en: 'Item Description', es: 'Descripción del Artículo' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'sale_price': {
      'label': { en: 'Sale Price ($)', es: 'Precio de Venta ($)' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'sale_date': {
      'label': { en: 'Sale Date', es: 'Fecha de Venta' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
  },
  'vehicle-bill-of-sale': {
    'seller_name': {
      'label': { en: 'Seller Name', es: 'Nombre del Vendedor' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'buyer_name': {
      'label': { en: 'Buyer Name', es: 'Nombre del Comprador' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'vehicle_year': {
      'label': { en: 'Vehicle Year', es: 'Año del Vehículo' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'vehicle_make': {
      'label': { en: 'Make', es: 'Marca' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'vehicle_model': {
      'label': { en: 'Model', es: 'Modelo' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'vin': {
      'label': { en: 'VIN', es: 'VIN' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'odometer': {
      'label': { en: 'Odometer Reading', es: 'Lectura del Odómetro' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'sale_price': {
      'label': { en: 'Sale Price ($)', es: 'Precio de Venta ($)' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'sale_date': {
      'label': { en: 'Sale Date', es: 'Fecha de Venta' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
  },
  'nda': {
    'agreement_type': {
      'label': { en: 'Type of NDA', es: 'Tipo de NDA' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Unilateral: Only you share info with them. Mutual: Both parties share info with each other.', es: 'Unilateral: Solo tú compartes información con ellos. Mutuo: Ambas partes comparten información entre sí.' },
    },
    'disclosing_party_name': {
      'label': { en: 'Disclosing Party Full Legal Name', es: 'Nombre Legal Completo de la Parte Divulgadora' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'The person or company SHARING confidential information', es: 'La persona o empresa que COMPARTE información confidencial' },
    },
    'disclosing_party_address': {
      'label': { en: 'Disclosing Party Address', es: 'Dirección de la Parte Divulgadora' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'disclosing_party_email': {
      'label': { en: 'Disclosing Party Email', es: 'Email de la Parte Divulgadora' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'disclosing_party_type': {
      'label': { en: 'Disclosing Party Type', es: 'Tipo de Parte Divulgadora' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'receiving_party_name': {
      'label': { en: 'Receiving Party Full Legal Name', es: 'Nombre Legal Completo de la Parte Receptora' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'The person or company RECEIVING confidential information', es: 'La persona o empresa que RECIBE información confidencial' },
    },
    'receiving_party_address': {
      'label': { en: 'Receiving Party Address', es: 'Dirección de la Parte Receptora' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'receiving_party_email': {
      'label': { en: 'Receiving Party Email', es: 'Email de la Parte Receptora' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'receiving_party_type': {
      'label': { en: 'Receiving Party Type', es: 'Tipo de Parte Receptora' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'disclosure_purpose': {
      'label': { en: 'Purpose of Disclosure', es: 'Propósito de la Divulgación' },
      'placeholder': {
        en: 'Example: Evaluating a potential business partnership, discussing a joint venture, employment relationship, contractor services, etc.',
        es: 'Ejemplo: Evaluar una posible asociación comercial, discutir una empresa conjunta, relación laboral, servicios de contratista, etc.',
      },
      'help': { en: 'Describe why confidential information is being shared', es: 'Describe por qué se está compartiendo información confidencial' },
    },
    'effective_date': {
      'label': { en: 'Effective Date', es: 'Fecha Efectiva' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'term_type': {
      'label': { en: 'Term of Confidentiality Obligation', es: 'Plazo de la Obligación de Confidencialidad' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'How long must the receiving party keep information confidential?', es: '¿Por cuánto tiempo debe la parte receptora mantener la información confidencial?' },
    },
    'custom_term_years': {
      'label': { en: 'Custom Duration (Years) - If "Custom Duration" selected', es: 'Duración Personalizada (Años) - Si seleccionaste "Duración Personalizada"' },
      'placeholder': { en: '3', es: '3' },
      'help': { en: '', es: '' },
    },
    'confidential_info_types': {
      'label': { en: 'Types of Confidential Information (check all that apply)', es: 'Tipos de Información Confidencial (marca todos los que apliquen)' },
      'placeholder': {
        en: 'Example: Trade secrets, business plans, financial data, customer lists, proprietary software, marketing strategies, technical specifications, product designs, etc.',
        es: 'Ejemplo: Secretos comerciales, planes de negocios, datos financieros, listas de clientes, software propietario, estrategias de marketing, especificaciones técnicas, diseños de productos, etc.',
      },
      'help': { en: 'Be specific about what information is considered confidential', es: 'Sé específico sobre qué información se considera confidencial' },
    },
    'return_materials': {
      'label': { en: 'Return of Materials Upon Termination?', es: '¿Devolución de Materiales al Terminar?' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'non_compete': {
      'label': { en: 'Include Non-Compete Clause?', es: '¿Incluir Cláusula de No Competencia?' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Restricts receiving party from competing in the same business during the term', es: 'Restringe a la parte receptora de competir en el mismo negocio durante el plazo' },
    },
    'non_compete_duration': {
      'label': { en: 'Non-Compete Duration (Months) - If Yes', es: 'Duración de No Competencia (Meses) - Si es Sí' },
      'placeholder': { en: '12', es: '12' },
      'help': { en: '', es: '' },
    },
    'non_compete_territory': {
      'label': { en: 'Non-Compete Territory - If Yes', es: 'Territorio de No Competencia - Si es Sí' },
      'placeholder': { en: 'United States, California, 50-mile radius, etc.', es: 'Estados Unidos, California, radio de 50 millas, etc.' },
      'help': { en: '', es: '' },
    },
    'non_solicitation': {
      'label': { en: 'Include Non-Solicitation Clause?', es: '¿Incluir Cláusula de No Solicitación?' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Prevents receiving party from hiring employees or soliciting customers', es: 'Previene que la parte receptora contrate empleados o solicite clientes' },
    },
    'non_solicitation_duration': {
      'label': { en: 'Non-Solicitation Duration (Months) - If Yes', es: 'Duración de No Solicitación (Meses) - Si es Sí' },
      'placeholder': { en: '12', es: '12' },
      'help': { en: '', es: '' },
    },
    'governing_state': {
      'label': { en: 'Governing State Law', es: 'Ley Estatal Aplicable' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Which state laws will govern this agreement?', es: '¿Qué leyes estatales regirán este acuerdo?' },
    },
    'injunctive_relief': {
      'label': { en: 'Injunctive Relief Clause?', es: '¿Cláusula de Medida Cautelar?' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Allows immediate court action to stop breaches without delay', es: 'Permite acción judicial inmediata para detener incumplimientos sin demora' },
    },
    'attorney_fees': {
      'label': { en: 'Prevailing Party Attorney Fees?', es: '¿Honorarios de Abogado para la Parte Ganadora?' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'additional_provisions': {
      'label': { en: 'Additional Provisions (Optional)', es: 'Provisiones Adicionales (Opcional)' },
      'placeholder': { en: 'Any additional terms or special conditions for this NDA', es: 'Cualquier término adicional o condición especial para este NDA' },
      'help': { en: '', es: '' },
    },
  },
  'independent-contractor': {
    'client_name': {
      'label': { en: 'Client/Company Full Legal Name', es: 'Nombre Legal Completo del Cliente/Empresa' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'The person or company HIRING the contractor', es: 'La persona o empresa que CONTRATA al contratista' },
    },
    'client_address': {
      'label': { en: 'Client/Company Address', es: 'Dirección del Cliente/Empresa' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'client_email': {
      'label': { en: 'Client/Company Email', es: 'Email del Cliente/Empresa' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'client_phone': {
      'label': { en: 'Client/Company Phone', es: 'Teléfono del Cliente/Empresa' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'client_type': {
      'label': { en: 'Client/Company Type', es: 'Tipo de Cliente/Empresa' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'contractor_name': {
      'label': { en: 'Contractor Full Legal Name', es: 'Nombre Legal Completo del Contratista' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'The person or entity PROVIDING services', es: 'La persona o entidad que PROPORCIONA servicios' },
    },
    'contractor_business_name': {
      'label': { en: 'Contractor Business Name (if applicable)', es: 'Nombre Comercial del Contratista (si aplica)' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'DBA or business entity name', es: 'DBA o nombre de entidad comercial' },
    },
    'contractor_address': {
      'label': { en: 'Contractor Address', es: 'Dirección del Contratista' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'contractor_email': {
      'label': { en: 'Contractor Email', es: 'Email del Contratista' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'contractor_phone': {
      'label': { en: 'Contractor Phone', es: 'Teléfono del Contratista' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'contractor_ssn_ein': {
      'label': { en: 'Contractor SSN or EIN (Last 4 digits only)', es: 'SSN o EIN del Contratista (Solo últimos 4 dígitos)' },
      'placeholder': { en: 'XXXX', es: 'XXXX' },
      'help': { en: 'For 1099 tax reporting purposes. Only include last 4 digits for security.', es: 'Para propósitos de reporte fiscal 1099. Solo incluye últimos 4 dígitos por seguridad.' },
    },
    'services_description': {
      'label': { en: 'Detailed Description of Services', es: 'Descripción Detallada de Servicios' },
      'placeholder': { en: 'Example: Web development services including design, coding, testing...', es: 'Ejemplo: Servicios de desarrollo web incluyendo diseño, programación, pruebas...' },
      'help': { en: 'Be specific about what services the contractor will provide', es: 'Sé específico sobre qué servicios proporcionará el contratista' },
    },
    'deliverables': {
      'label': { en: 'Specific Deliverables', es: 'Entregables Específicos' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'List all expected deliverables', es: 'Lista todos los entregables esperados' },
    },
    'start_date': {
      'label': { en: 'Contract Start Date', es: 'Fecha de Inicio del Contrato' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'contract_type': {
      'label': { en: 'Contract Duration Type', es: 'Tipo de Duración del Contrato' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'end_date': {
      'label': { en: 'Contract End Date (if Fixed Term)', es: 'Fecha de Finalización del Contrato (si es Plazo Fijo)' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Only if you selected "Fixed Term"', es: 'Solo si seleccionaste "Plazo Fijo"' },
    },
    'estimated_completion': {
      'label': { en: 'Estimated Completion Date (if Project-Based)', es: 'Fecha Estimada de Finalización (si es Basado en Proyecto)' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'payment_structure': {
      'label': { en: 'Payment Structure', es: 'Estructura de Pago' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'fixed_fee': {
      'label': { en: 'Fixed Fee Amount ($) - If Applicable', es: 'Monto de Tarifa Fija ($) - Si Aplica' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'hourly_rate': {
      'label': { en: 'Hourly Rate ($) - If Applicable', es: 'Tarifa por Hora ($) - Si Aplica' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'monthly_retainer': {
      'label': { en: 'Monthly Retainer Amount ($) - If Applicable', es: 'Monto de Retención Mensual ($) - Si Aplica' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'payment_schedule': {
      'label': { en: 'Payment Schedule/Terms', es: 'Cronograma/Términos de Pago' },
      'placeholder': { en: 'Example: 50% upfront, 25% at midpoint, 25% upon completion. Net 15 days.', es: 'Ejemplo: 50% por adelantado, 25% a mitad, 25% al completar. Neto 15 días.' },
      'help': { en: 'When and how payments will be made', es: 'Cuándo y cómo se harán los pagos' },
    },
    'expenses_reimbursement': {
      'label': { en: 'Expense Reimbursement', es: 'Reembolso de Gastos' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'work_location': {
      'label': { en: 'Work Location', es: 'Ubicación de Trabajo' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'work_hours': {
      'label': { en: 'Work Hours/Schedule', es: 'Horas/Horario de Trabajo' },
      'placeholder': { en: 'Example: Flexible hours, contractor sets own schedule...', es: 'Ejemplo: Horas flexibles, contratista establece su propio horario...' },
      'help': { en: 'Describe expected availability (but remember: contractor controls their schedule)', es: 'Describe disponibilidad esperada (pero recuerda: el contratista controla su horario)' },
    },
    'ip_ownership': {
      'label': { en: 'Intellectual Property Ownership', es: 'Propiedad de Propiedad Intelectual' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Who owns the work product created?', es: '¿Quién posee el producto de trabajo creado?' },
    },
    'confidentiality': {
      'label': { en: 'Confidentiality Clause', es: 'Cláusula de Confidencialidad' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'non_compete': {
      'label': { en: 'Non-Compete Clause (Use with Caution)', es: 'Cláusula de No Competencia (Usar con Precaución)' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'May not be enforceable for independent contractors in many states', es: 'Puede no ser exigible para contratistas independientes en muchos estados' },
    },
    'non_compete_duration': {
      'label': { en: 'Non-Compete Duration (Months) - If Yes', es: 'Duración de No Competencia (Meses) - Si es Sí' },
      'placeholder': { en: '6', es: '6' },
      'help': { en: '', es: '' },
    },
    'non_solicitation': {
      'label': { en: 'Non-Solicitation Clause', es: 'Cláusula de No Solicitación' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Prevents contractor from soliciting clients/employees', es: 'Previene que contratista solicite clientes/empleados' },
    },
    'non_solicitation_duration': {
      'label': { en: 'Non-Solicitation Duration (Months) - If Yes', es: 'Duración de No Solicitación (Meses) - Si es Sí' },
      'placeholder': { en: '12', es: '12' },
      'help': { en: '', es: '' },
    },
    'insurance_required': {
      'label': { en: 'Insurance Requirements', es: 'Requisitos de Seguro' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'insurance_amount': {
      'label': { en: 'Minimum Insurance Coverage ($) - If Required', es: 'Cobertura Mínima de Seguro ($) - Si es Requerido' },
      'placeholder': { en: '1000000', es: '1000000' },
      'help': { en: 'Example: $1,000,000', es: 'Ejemplo: $1,000,000' },
    },
    'termination_notice': {
      'label': { en: 'Termination Notice Period', es: 'Período de Aviso de Terminación' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'governing_state': {
      'label': { en: 'Governing State Law', es: 'Ley Estatal Aplicable' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'additional_terms': {
      'label': { en: 'Additional Terms/Special Provisions (Optional)', es: 'Términos Adicionales/Provisiones Especiales (Opcional)' },
      'placeholder': { en: 'Any special conditions or additional clauses', es: 'Cualquier condición especial o cláusulas adicionales' },
      'help': { en: '', es: '' },
    },
  },
  'service-agreement': {
    'provider_name': {
      'label': { en: 'Service Provider', es: 'Proveedor de Servicios' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'client_name': {
      'label': { en: 'Client Name', es: 'Nombre del Cliente' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'services': {
      'label': { en: 'Services Provided', es: 'Servicios Proporcionados' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'service_fee': {
      'label': { en: 'Service Fee ($)', es: 'Tarifa del Servicio ($)' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'payment_schedule': {
      'label': { en: 'Payment Schedule', es: 'Calendario de Pagos' },
      'placeholder': { en: 'Monthly', es: 'Mensual' },
      'help': { en: '', es: '' },
    },
    'term': {
      'label': { en: 'Contract Term', es: 'Duración del Contrato' },
      'placeholder': { en: '12 months', es: '12 meses' },
      'help': { en: '', es: '' },
    },
  },
  'employment-agreement': {
    'employer_name': {
      'label': { en: 'Employer Name', es: 'Nombre del Empleador' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'employee_name': {
      'label': { en: 'Employee Name', es: 'Nombre del Empleado' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'position': {
      'label': { en: 'Job Title', es: 'Título del Puesto' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'salary': {
      'label': { en: 'Annual Salary ($)', es: 'Salario Anual ($)' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'start_date': {
      'label': { en: 'Start Date', es: 'Fecha de Inicio' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'duties': {
      'label': { en: 'Job Duties', es: 'Funciones del Puesto' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
  },
  'cease-desist': {
    'sender_name': {
      'label': { en: 'Your Name/Company', es: 'Tu Nombre/Empresa' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'recipient_name': {
      'label': { en: 'Recipient Name', es: 'Nombre del Destinatario' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'recipient_address': {
      'label': { en: 'Recipient Address', es: 'Dirección del Destinatario' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'violation_description': {
      'label': { en: 'Description of Violation', es: 'Descripción de la Violación' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'demand': {
      'label': { en: 'Specific Demand', es: 'Demanda Específica' },
      'placeholder': { en: 'Immediately stop using our trademark', es: 'Dejar de usar inmediatamente nuestra marca' },
      'help': { en: '', es: '' },
    },
  },
  'llc-operating-agreement': {
    'llc_name': {
      'label': { en: 'LLC Name', es: 'Nombre de la LLC' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'formation_state': {
      'label': { en: 'State of Formation', es: 'Estado de Formación' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'formation_date': {
      'label': { en: 'Formation Date', es: 'Fecha de Formación' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'member1_name': {
      'label': { en: 'Member 1 Name', es: 'Nombre del Miembro 1' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'member1_ownership': {
      'label': { en: 'Member 1 Ownership %', es: 'Participación del Miembro 1 %' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'management_type': {
      'label': { en: 'Management', es: 'Administración' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'business_purpose': {
      'label': { en: 'Business Purpose', es: 'Propósito del Negocio' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
  },
  'partnership-agreement': {
    'partnership_name': {
      'label': { en: 'Partnership Name', es: 'Nombre de la Sociedad' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'partner1_name': {
      'label': { en: 'Partner 1 Name', es: 'Nombre del Socio 1' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'partner1_share': {
      'label': { en: 'Partner 1 Share %', es: 'Participación del Socio 1 %' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'partner2_name': {
      'label': { en: 'Partner 2 Name', es: 'Nombre del Socio 2' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'partner2_share': {
      'label': { en: 'Partner 2 Share %', es: 'Participación del Socio 2 %' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'effective_date': {
      'label': { en: 'Effective Date', es: 'Fecha Efectiva' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'business_purpose': {
      'label': { en: 'Business Purpose', es: 'Propósito del Negocio' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
  },
  'articles-of-organization': {
    'llc_name': {
      'label': { en: 'LLC Name', es: 'Nombre de la LLC' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'registered_agent': {
      'label': { en: 'Registered Agent', es: 'Agente Registrado' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'agent_address': {
      'label': { en: 'Agent Address', es: 'Dirección del Agente' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'principal_office': {
      'label': { en: 'Principal Office Address', es: 'Dirección de la Oficina Principal' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'business_purpose': {
      'label': { en: 'Business Purpose', es: 'Propósito del Negocio' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'organizer_name': {
      'label': { en: 'Organizer Name', es: 'Nombre del Organizador' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
  },
  'promissory-note': {
    'borrower_name': {
      'label': { en: 'Borrower Name', es: 'Nombre del Prestatario' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'lender_name': {
      'label': { en: 'Lender Name', es: 'Nombre del Prestamista' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'loan_amount': {
      'label': { en: 'Loan Amount ($)', es: 'Monto del Préstamo ($)' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'interest_rate': {
      'label': { en: 'Interest Rate (%)', es: 'Tasa de Interés (%)' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'payment_schedule': {
      'label': { en: 'Payment Schedule', es: 'Calendario de Pagos' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'due_date': {
      'label': { en: 'Due Date', es: 'Fecha de Vencimiento' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
  },
  'loan-agreement': {
    'lender_name': {
      'label': { en: 'Lender Name', es: 'Nombre del Prestamista' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'borrower_name': {
      'label': { en: 'Borrower Name', es: 'Nombre del Prestatario' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'loan_amount': {
      'label': { en: 'Loan Amount ($)', es: 'Monto del Préstamo ($)' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'interest_rate': {
      'label': { en: 'Interest Rate (%)', es: 'Tasa de Interés (%)' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'loan_term': {
      'label': { en: 'Loan Term', es: 'Plazo del Préstamo' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'monthly_payment': {
      'label': { en: 'Monthly Payment ($)', es: 'Pago Mensual ($)' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'collateral': {
      'label': { en: 'Collateral', es: 'Garantía' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
  },
  'website-terms': {
    'company_name': {
      'label': { en: 'Company Name', es: 'Nombre de la Empresa' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'website_url': {
      'label': { en: 'Website URL', es: 'URL del Sitio Web' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'effective_date': {
      'label': { en: 'Effective Date', es: 'Fecha Efectiva' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'governing_state': {
      'label': { en: 'Governing State', es: 'Estado Aplicable' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'contact_email': {
      'label': { en: 'Contact Email', es: 'Correo de Contacto' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
  },
  'privacy-policy': {
    'company_name': {
      'label': { en: 'Company Name', es: 'Nombre de la Empresa' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'website_url': {
      'label': { en: 'Website URL', es: 'URL del Sitio Web' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'effective_date': {
      'label': { en: 'Effective Date', es: 'Fecha Efectiva' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'data_collected': {
      'label': { en: 'Data Collected', es: 'Datos Recopilados' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'contact_email': {
      'label': { en: 'Contact Email', es: 'Correo de Contacto' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
  },
  'software-license': {
    'company_name': {
      'label': { en: 'Company Name (Licensor)', es: 'Nombre de la Empresa (Licenciante)' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'licensee_name': {
      'label': { en: 'Licensee Name', es: 'Nombre del Licenciatario' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'software_name': {
      'label': { en: 'Software Name', es: 'Nombre del Software' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'license_type': {
      'label': { en: 'License Type', es: 'Tipo de Licencia' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'effective_date': {
      'label': { en: 'Effective Date', es: 'Fecha Efectiva' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
  },
  'bill-of-sale-vehicle': {
    'seller_name': {
      'label': { en: 'Seller Full Legal Name', es: 'Nombre Legal Completo del Vendedor' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Name as it appears on the vehicle title', es: 'Nombre tal como aparece en el título del vehículo' },
    },
    'seller_address': {
      'label': { en: 'Seller Street Address', es: 'Dirección del Vendedor' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'seller_city': {
      'label': { en: 'Seller City', es: 'Ciudad del Vendedor' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'seller_state': {
      'label': { en: 'Seller State', es: 'Estado del Vendedor' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'seller_zip': {
      'label': { en: 'Seller ZIP Code', es: 'Código Postal del Vendedor' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'seller_phone': {
      'label': { en: 'Seller Phone Number', es: 'Teléfono del Vendedor' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'seller_email': {
      'label': { en: 'Seller Email', es: 'Email del Vendedor' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'seller_license': {
      'label': { en: 'Seller Driver\'s License Number', es: 'Número de Licencia del Vendedor' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Optional but recommended for verification', es: 'Opcional pero recomendado para verificación' },
    },
    'buyer_name': {
      'label': { en: 'Buyer Full Legal Name', es: 'Nombre Legal Completo del Comprador' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Name as it will appear on the new title', es: 'Nombre como aparecerá en el nuevo título' },
    },
    'buyer_address': {
      'label': { en: 'Buyer Street Address', es: 'Dirección del Comprador' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'buyer_city': {
      'label': { en: 'Buyer City', es: 'Ciudad del Comprador' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'buyer_state': {
      'label': { en: 'Buyer State', es: 'Estado del Comprador' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'buyer_zip': {
      'label': { en: 'Buyer ZIP Code', es: 'Código Postal del Comprador' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'buyer_phone': {
      'label': { en: 'Buyer Phone Number', es: 'Teléfono del Comprador' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'buyer_email': {
      'label': { en: 'Buyer Email', es: 'Email del Comprador' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'buyer_license': {
      'label': { en: 'Buyer Driver\'s License Number', es: 'Número de Licencia del Comprador' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Optional but recommended for verification', es: 'Opcional pero recomendado para verificación' },
    },
    'vehicle_year': {
      'label': { en: 'Vehicle Year', es: 'Año del Vehículo' },
      'placeholder': { en: '2020', es: '2020' },
      'help': { en: '', es: '' },
    },
    'vehicle_make': {
      'label': { en: 'Vehicle Make', es: 'Marca del Vehículo' },
      'placeholder': { en: 'Toyota, Honda, Ford, etc.', es: 'Toyota, Honda, Ford, etc.' },
      'help': { en: 'Manufacturer of the vehicle', es: 'Fabricante del vehículo' },
    },
    'vehicle_model': {
      'label': { en: 'Vehicle Model', es: 'Modelo del Vehículo' },
      'placeholder': { en: 'Camry, Civic, F-150, etc.', es: 'Camry, Civic, F-150, etc.' },
      'help': { en: '', es: '' },
    },
    'vehicle_trim': {
      'label': { en: 'Vehicle Trim/Style (Optional)', es: 'Versión/Estilo del Vehículo (Opcional)' },
      'placeholder': { en: 'EX, Limited, XLT, etc.', es: 'EX, Limited, XLT, etc.' },
      'help': { en: '', es: '' },
    },
    'vehicle_vin': {
      'label': { en: 'Vehicle VIN (Vehicle Identification Number)', es: 'VIN del Vehículo (Número de Identificación)' },
      'placeholder': { en: '1HGBH41JXMN109186', es: '1HGBH41JXMN109186' },
      'help': { en: '17-character VIN located on dashboard or door jamb', es: 'VIN de 17 caracteres ubicado en el tablero o marco de puerta' },
    },
    'vehicle_color': {
      'label': { en: 'Vehicle Color', es: 'Color del Vehículo' },
      'placeholder': { en: 'Silver, Black, Blue, etc.', es: 'Plateado, Negro, Azul, etc.' },
      'help': { en: '', es: '' },
    },
    'vehicle_body_type': {
      'label': { en: 'Body Type', es: 'Tipo de Carrocería' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'vehicle_mileage': {
      'label': { en: 'Current Odometer Reading (Miles)', es: 'Lectura Actual del Odómetro (Millas)' },
      'placeholder': { en: '75420', es: '75420' },
      'help': { en: 'Exact mileage shown on odometer', es: 'Millaje exacto mostrado en el odómetro' },
    },
    'odometer_brand': {
      'label': { en: 'Odometer Status', es: 'Estado del Odómetro' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Federal requirement - choose accurate status', es: 'Requisito federal - elija el estado preciso' },
    },
    'title_number': {
      'label': { en: 'Title/Certificate Number', es: 'Número de Título/Certificado' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Number on the vehicle title', es: 'Número en el título del vehículo' },
    },
    'sale_price': {
      'label': { en: 'Sale Price ($)', es: 'Precio de Venta ($)' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Total purchase price in US Dollars', es: 'Precio total de compra en dólares estadounidenses' },
    },
    'payment_method': {
      'label': { en: 'Payment Method', es: 'Método de Pago' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'payment_status': {
      'label': { en: 'Payment Status', es: 'Estado del Pago' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'balance_due': {
      'label': { en: 'Balance Due (if applicable)', es: 'Saldo Pendiente (si aplica)' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'payment_due_date': {
      'label': { en: 'Balance Due Date (if applicable)', es: 'Fecha de Vencimiento del Saldo (si aplica)' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'vehicle_condition': {
      'label': { en: 'Vehicle Condition Statement', es: 'Declaración de Condición del Vehículo' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Most private sales are AS-IS', es: 'La mayoría de ventas privadas son TAL CUAL' },
    },
    'warranty_details': {
      'label': { en: 'Warranty Details (if applicable)', es: 'Detalles de Garantía (si aplica)' },
      'placeholder': { en: 'Describe any warranty coverage, expiration dates, transferability, etc.', es: 'Describa cualquier cobertura de garantía, fechas de expiración, transferibilidad, etc.' },
      'help': { en: '', es: '' },
    },
    'known_defects': {
      'label': { en: 'Known Defects/Issues (if any)', es: 'Defectos/Problemas Conocidos (si los hay)' },
      'placeholder': { en: 'List any known mechanical issues, damage, or defects. Honesty protects both parties.', es: 'Liste cualquier problema mecánico conocido, daño o defectos. La honestidad protege a ambas partes.' },
      'help': { en: 'Recommended for transparency', es: 'Recomendado para transparencia' },
    },
    'title_status': {
      'label': { en: 'Title Status', es: 'Estado del Título' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Be honest about title status', es: 'Sea honesto sobre el estado del título' },
    },
    'lienholder_name': {
      'label': { en: 'Lienholder Name (if applicable)', es: 'Nombre del Acreedor Prendario (si aplica)' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Bank or lender with lien on vehicle', es: 'Banco o prestamista con gravamen sobre el vehículo' },
    },
    'lien_payoff': {
      'label': { en: 'Lien Payoff Amount (if applicable)', es: 'Monto a Pagar del Gravamen (si aplica)' },
      'placeholder': { en: '', es: '' },
      'help': { en: '', es: '' },
    },
    'included_items': {
      'label': { en: 'Additional Items Included in Sale', es: 'Artículos Adicionales Incluidos en la Venta' },
      'placeholder': { en: 'Examples: spare tire, floor mats, roof rack, extra keys, owner\'s manual, service records, etc.', es: 'Ejemplos: llanta de repuesto, tapetes, portaequipaje, llaves extra, manual del propietario, registros de servicio, etc.' },
      'help': { en: 'List any extras included with the vehicle', es: 'Liste cualquier extra incluido con el vehículo' },
    },
    'sale_date': {
      'label': { en: 'Date of Sale', es: 'Fecha de Venta' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Date ownership transfers to buyer', es: 'Fecha en que la propiedad se transfiere al comprador' },
    },
    'sale_location': {
      'label': { en: 'Sale Location (City, State)', es: 'Ubicación de Venta (Ciudad, Estado)' },
      'placeholder': { en: 'Los Angeles, California', es: 'Los Ángeles, California' },
      'help': { en: '', es: '' },
    },
    'governing_state': {
      'label': { en: 'Governing State Law', es: 'Ley Estatal Aplicable' },
      'placeholder': { en: '', es: '' },
      'help': { en: 'Usually the state where the sale takes place', es: 'Generalmente el estado donde se realiza la venta' },
    },
  },
};

const fieldOptionTranslations: Record<string, Record<string, Record<string, Record<Language, string>>>> = {
  nda: {
    agreement_type: {
      'Unilateral (One-Way) - Only one party shares confidential information': {
        en: 'Unilateral (One-Way) - Only one party shares confidential information',
        es: 'Unilateral (Una vía) - Solo una parte comparte información confidencial',
      },
      'Mutual (Two-Way) - Both parties share confidential information': {
        en: 'Mutual (Two-Way) - Both parties share confidential information',
        es: 'Mutuo (Dos vías) - Ambas partes comparten información confidencial',
      },
    },
    disclosing_party_type: {
      Individual: { en: 'Individual', es: 'Individual' },
      Corporation: { en: 'Corporation', es: 'Corporación' },
      LLC: { en: 'LLC', es: 'LLC' },
      Partnership: { en: 'Partnership', es: 'Sociedad' },
      'Other Business Entity': { en: 'Other Business Entity', es: 'Otra Entidad Empresarial' },
    },
    receiving_party_type: {
      Individual: { en: 'Individual', es: 'Individual' },
      Corporation: { en: 'Corporation', es: 'Corporación' },
      LLC: { en: 'LLC', es: 'LLC' },
      Partnership: { en: 'Partnership', es: 'Sociedad' },
      'Other Business Entity': { en: 'Other Business Entity', es: 'Otra Entidad Empresarial' },
    },
    term_type: {
      '1 Year from Effective Date': { en: '1 Year from Effective Date', es: '1 Año desde la Fecha Efectiva' },
      '2 Years from Effective Date': { en: '2 Years from Effective Date', es: '2 Años desde la Fecha Efectiva' },
      '3 Years from Effective Date': { en: '3 Years from Effective Date', es: '3 Años desde la Fecha Efectiva' },
      '5 Years from Effective Date': { en: '5 Years from Effective Date', es: '5 Años desde la Fecha Efectiva' },
      'Indefinite (Until information becomes public)': { en: 'Indefinite (Until information becomes public)', es: 'Indefinido (Hasta que la información sea pública)' },
      'Custom Duration': { en: 'Custom Duration', es: 'Duración Personalizada' },
    },
    return_materials: {
      'Yes - All materials must be returned or destroyed': {
        en: 'Yes - All materials must be returned or destroyed',
        es: 'Sí - Todos los materiales deben ser devueltos o destruidos',
      },
      'No - Materials may be retained confidentially': {
        en: 'No - Materials may be retained confidentially',
        es: 'No - Los materiales pueden ser retenidos confidencialmente',
      },
    },
    non_compete: {
      No: { en: 'No', es: 'No' },
      Yes: { en: 'Yes', es: 'Sí' },
    },
    non_solicitation: {
      No: { en: 'No', es: 'No' },
      Yes: { en: 'Yes', es: 'Sí' },
    },
    injunctive_relief: {
      'Yes - Breach may be remedied by injunction without posting bond': {
        en: 'Yes - Breach may be remedied by injunction without posting bond',
        es: 'Sí - El incumplimiento puede remediarse mediante medida cautelar sin fianza',
      },
      No: { en: 'No', es: 'No' },
    },
    attorney_fees: {
      'Yes - Prevailing party in litigation recovers attorney fees': {
        en: 'Yes - Prevailing party in litigation recovers attorney fees',
        es: 'Sí - La parte ganadora en litigio recupera honorarios de abogado',
      },
      'No - Each party pays own attorney fees': {
        en: 'No - Each party pays own attorney fees',
        es: 'No - Cada parte paga sus propios honorarios de abogado',
      },
    },
  },
};

export function getFieldTranslation(
  documentId: string,
  fieldId: string,
  part: FieldPart,
  language: Language
): string {
  const docTranslations = fieldTranslations[documentId];
  if (!docTranslations) {
    // Fallback: return empty string so the original field.label is used
    return '';
  }

  const fieldTranslation = docTranslations[fieldId];
  if (!fieldTranslation) {
    return '';
  }

  const partTranslation = fieldTranslation[part];
  if (!partTranslation) {
    return '';
  }

  return partTranslation[language] || '';
}

export function getFieldOptionTranslation(
  documentId: string,
  fieldId: string,
  option: string,
  language: Language
): string {
  return fieldOptionTranslations[documentId]?.[fieldId]?.[option]?.[language] || option;
}