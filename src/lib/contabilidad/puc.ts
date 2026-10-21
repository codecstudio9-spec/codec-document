/**
 * Plan Único de Cuentas para comerciantes (Decreto 2650 de 1993).
 *
 * Es el PUC base, igual para todas las empresas: clases, grupos, las cuentas
 * de uso diario y las subcuentas que ya usa la causación automática. Lo que
 * cada empresa agrega o renombra vive en la tabla cont_cuentas y se mezcla
 * encima con `planDeCuentas()`.
 *
 * No se cargan las ~3.000 subcuentas del decreto: nadie las usa todas, y un
 * árbol con miles de hojas vacías es justo lo que hace que un plan de cuentas
 * sea difícil de leer. El contador crea las suyas en dos clics.
 */

export type Naturaleza = 'D' | 'C';

export interface Cuenta {
  codigo: string;
  nombre: string;
  naturaleza: Naturaleza;
  /** 1 clase · 2 grupo · 4 cuenta · 6 subcuenta · 8+ auxiliar */
  nivel: number;
  propia?: boolean;
  activa?: boolean;
}

const BASE: Array<[string, string]> = [
  ['1', 'Activo'],
  ['11', 'Disponible'], ['1105', 'Caja'], ['110505', 'Caja general'], ['110510', 'Cajas menores'],
  ['1110', 'Bancos'], ['111005', 'Bancos moneda nacional'], ['1120', 'Cuentas de ahorro'], ['112005', 'Bancos (ahorros)'],
  ['12', 'Inversiones'], ['1205', 'Acciones'], ['1225', 'Certificados'],
  ['13', 'Deudores'], ['1305', 'Clientes'], ['130505', 'Clientes nacionales'], ['1310', 'Cuentas corrientes comerciales'],
  ['1325', 'Cuentas por cobrar a socios y accionistas'], ['1330', 'Anticipos y avances'], ['133005', 'Anticipos a proveedores'],
  ['1355', 'Anticipo de impuestos y contribuciones o saldos a favor'], ['135515', 'Retención en la fuente'],
  ['135517', 'Impuesto a las ventas retenido'], ['135518', 'Impuesto de industria y comercio retenido'],
  ['1365', 'Cuentas por cobrar a trabajadores'], ['1380', 'Deudores varios'], ['1399', 'Provisiones (deudores)'],
  ['14', 'Inventarios'], ['1405', 'Materias primas'], ['1430', 'Productos terminados'], ['1435', 'Mercancías no fabricadas por la empresa'],
  ['143505', 'Mercancías no fabricadas por la empresa'], ['1455', 'Materiales, repuestos y accesorios'],
  ['15', 'Propiedades, planta y equipo'], ['1504', 'Terrenos'], ['1516', 'Construcciones y edificaciones'],
  ['1520', 'Maquinaria y equipo'], ['1524', 'Equipo de oficina'], ['1528', 'Equipo de computación y comunicación'],
  ['1540', 'Flota y equipo de transporte'], ['1592', 'Depreciación acumulada'],
  ['16', 'Intangibles'], ['1635', 'Licencias'], ['1698', 'Amortización acumulada'],
  ['17', 'Diferidos'], ['1705', 'Gastos pagados por anticipado'], ['1710', 'Cargos diferidos'],
  ['18', 'Otros activos'], ['19', 'Valorizaciones'],

  ['2', 'Pasivo'],
  ['21', 'Obligaciones financieras'], ['2105', 'Bancos nacionales'], ['2195', 'Otras obligaciones'],
  ['22', 'Proveedores'], ['2205', 'Nacionales'], ['220505', 'Proveedores nacionales'], ['2210', 'Del exterior'],
  ['23', 'Cuentas por pagar'], ['2335', 'Costos y gastos por pagar'], ['233595', 'Otros costos y gastos por pagar'],
  ['2365', 'Retención en la fuente'], ['236505', 'Salarios y pagos laborales'], ['236515', 'Honorarios'],
  ['236520', 'Comisiones'], ['236525', 'Servicios'], ['236530', 'Arrendamientos'], ['236540', 'Compras'],
  ['2367', 'Impuesto a las ventas retenido'], ['236705', 'Impuesto a las ventas retenido'],
  ['2368', 'Impuesto de industria y comercio retenido'], ['236805', 'Impuesto de industria y comercio retenido'],
  ['2370', 'Retenciones y aportes de nómina'], ['2380', 'Acreedores varios'],
  ['24', 'Impuestos, gravámenes y tasas'], ['2404', 'De renta y complementarios'],
  ['2408', 'Impuesto sobre las ventas por pagar'], ['240805', 'IVA generado'], ['240810', 'IVA descontable'],
  ['2412', 'De industria y comercio'], ['2424', 'Impuesto nacional al consumo'], ['2495', 'Otros'], ['249595', 'Otros impuestos por pagar'],
  ['25', 'Obligaciones laborales'], ['2505', 'Salarios por pagar'], ['2510', 'Cesantías consolidadas'],
  ['2515', 'Intereses sobre cesantías'], ['2520', 'Prima de servicios'], ['2525', 'Vacaciones consolidadas'],
  ['26', 'Pasivos estimados y provisiones'], ['2610', 'Para obligaciones laborales'], ['2615', 'Para obligaciones fiscales'],
  ['27', 'Diferidos'], ['2705', 'Ingresos recibidos por anticipado'],
  ['28', 'Otros pasivos'], ['2805', 'Anticipos y avances recibidos'], ['280505', 'De clientes'],
  ['29', 'Bonos y papeles comerciales'],

  ['3', 'Patrimonio'],
  ['31', 'Capital social'], ['3105', 'Capital suscrito y pagado'], ['3115', 'Aportes sociales'],
  ['32', 'Superávit de capital'], ['33', 'Reservas'], ['3305', 'Reservas obligatorias'],
  ['34', 'Revalorización del patrimonio'], ['36', 'Resultados del ejercicio'], ['3605', 'Utilidad del ejercicio'],
  ['3610', 'Pérdida del ejercicio'], ['37', 'Resultados de ejercicios anteriores'], ['3705', 'Utilidades acumuladas'],
  ['3710', 'Pérdidas acumuladas'], ['38', 'Superávit por valorizaciones'],

  ['4', 'Ingresos'],
  ['41', 'Operacionales'], ['4120', 'Industrias manufactureras'], ['4135', 'Comercio al por mayor y al por menor'],
  ['413595', 'Venta de otros productos'], ['4140', 'Hoteles y restaurantes'], ['4155', 'Actividades inmobiliarias, empresariales y de alquiler'],
  ['4170', 'Otras actividades de servicios comunitarios, sociales y personales'],
  ['4175', 'Devoluciones en ventas (DB)'],
  ['42', 'No operacionales'], ['4210', 'Financieros'], ['4250', 'Recuperaciones'], ['4295', 'Diversos'],
  ['47', 'Ajustes por inflación'],

  ['5', 'Gastos'],
  ['51', 'Operacionales de administración'], ['5105', 'Gastos de personal'], ['5110', 'Honorarios'], ['511095', 'Honorarios, otros'],
  ['5115', 'Impuestos'], ['5120', 'Arrendamientos'], ['512010', 'Arrendamientos, construcciones y edificaciones'],
  ['5125', 'Contribuciones y afiliaciones'], ['5130', 'Seguros'], ['513095', 'Seguros, otros'],
  ['5135', 'Servicios'], ['513505', 'Aseo y vigilancia'], ['513525', 'Acueducto y alcantarillado'],
  ['513530', 'Energía eléctrica'], ['513535', 'Teléfono e internet'], ['513550', 'Transporte, fletes y acarreos'],
  ['513555', 'Gas'], ['513595', 'Servicios, otros'],
  ['5140', 'Gastos legales'], ['5145', 'Mantenimiento y reparaciones'], ['514595', 'Mantenimiento y reparaciones, otros'],
  ['5150', 'Adecuación e instalación'], ['5155', 'Gastos de viaje'], ['5160', 'Depreciaciones'], ['5165', 'Amortizaciones'],
  ['5195', 'Diversos'], ['519520', 'Gastos de representación y relaciones públicas'], ['519525', 'Elementos de aseo y cafetería'],
  ['519530', 'Útiles, papelería y fotocopias'], ['519535', 'Combustibles y lubricantes'], ['519595', 'Otros gastos diversos'],
  ['52', 'Operacionales de ventas'], ['5205', 'Gastos de personal'], ['5235', 'Servicios'], ['523560', 'Publicidad, propaganda y promoción'],
  ['5295', 'Diversos'],
  ['53', 'No operacionales'], ['5305', 'Financieros'], ['530505', 'Gastos bancarios'], ['530520', 'Intereses'],
  ['5315', 'Gastos extraordinarios'], ['5395', 'Gastos diversos'],
  ['54', 'Impuesto de renta y complementarios'], ['5405', 'Impuesto de renta y complementarios'],
  ['59', 'Ganancias y pérdidas'], ['5905', 'Ganancias y pérdidas'],

  ['6', 'Costos de ventas'],
  ['61', 'Costo de ventas y de prestación de servicios'], ['6135', 'Comercio al por mayor y al por menor'],
  ['613595', 'Costo de venta de otros productos'], ['62', 'Compras'], ['6205', 'De mercancías'],

  ['7', 'Costos de producción o de operación'],
  ['71', 'Materia prima'], ['72', 'Mano de obra directa'], ['73', 'Costos indirectos'], ['74', 'Contratos de servicios'],

  ['8', 'Cuentas de orden deudoras'], ['81', 'Derechos contingentes'], ['83', 'Deudoras de control'],
  ['9', 'Cuentas de orden acreedoras'], ['91', 'Responsabilidades contingentes'], ['93', 'Acreedoras de control'],
];

/** Cuentas cuya naturaleza va contra la de su clase (correctoras). */
const CONTRARIAS = new Set(['1399', '1592', '1698', '4175']);

export function naturalezaDe(codigo: string): Naturaleza {
  for (const c of CONTRARIAS) {
    if (codigo.startsWith(c)) return ['1', '5', '6', '7', '8'].includes(c[0]) ? 'C' : 'D';
  }
  return ['1', '5', '6', '7', '8'].includes(codigo[0]) ? 'D' : 'C';
}

export function nivelDe(codigo: string): number {
  return codigo.length <= 2 ? codigo.length : codigo.length <= 4 ? 4 : codigo.length <= 6 ? 6 : codigo.length;
}

export const NOMBRE_CLASE: Record<string, string> = Object.fromEntries(
  BASE.filter(([c]) => c.length === 1),
);

export const PUC_BASE: Cuenta[] = BASE.map(([codigo, nombre]) => ({
  codigo, nombre, naturaleza: naturalezaDe(codigo), nivel: nivelDe(codigo),
}));

export interface CuentaPropia {
  codigo: string;
  nombre: string;
  naturaleza: Naturaleza | null;
  activa: boolean;
}

/** PUC base + lo de la empresa. Una cuenta propia con el mismo código
 *  renombra (o desactiva) la base. */
export function planDeCuentas(propias: CuentaPropia[]): Cuenta[] {
  const m = new Map<string, Cuenta>(PUC_BASE.map((c) => [c.codigo, { ...c, activa: true }]));
  for (const p of propias) {
    m.set(p.codigo, {
      codigo: p.codigo,
      nombre: p.nombre,
      naturaleza: p.naturaleza ?? naturalezaDe(p.codigo),
      nivel: nivelDe(p.codigo),
      propia: true,
      activa: p.activa,
    });
  }
  return [...m.values()].sort((a, b) => a.codigo.localeCompare(b.codigo));
}

/** El nombre más específico que se conozca para un código: el suyo, o el de
 *  la cuenta padre más cercana. Sirve para movimientos a subcuentas que la
 *  empresa todavía no creó en su plan. */
export function nombreCuenta(codigo: string, plan: Map<string, Cuenta>): string {
  const exacta = plan.get(codigo);
  if (exacta) return exacta.nombre;
  for (let n = codigo.length - 1; n >= 1; n--) {
    const padre = plan.get(codigo.slice(0, n));
    if (padre) return padre.nombre;
  }
  return 'Cuenta sin nombre';
}
