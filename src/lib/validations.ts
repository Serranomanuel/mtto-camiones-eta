import { z } from "zod";

const positiveNumber = z.coerce.number().min(0, "Debe ser un número positivo");
const positiveNumberRequired = z.coerce.number().min(1, "Requerido");
const nonEmptyString = z.string().min(1, "Campo obligatorio");
const optionalString = z.string().optional().default("");

export const vehiculoSchema = z.object({
  placa: nonEmptyString.min(3, "Mínimo 3 caracteres"),
  marca: nonEmptyString,
  modelo: nonEmptyString,
  año: z.coerce.number().min(2000, "Año mínimo 2000").max(2030, "Año máximo 2030"),
  tipoVehiculo: nonEmptyString,
  capacidadCargaKg: positiveNumberRequired,
  ciudadBase: nonEmptyString,
  estado: nonEmptyString,
  kmActual: positiveNumber,
  rendimientoKmGal: positiveNumberRequired.min(1, "Debe ser mayor a 0"),
  soatVencimiento: nonEmptyString,
  tecnomecanicaVencimiento: nonEmptyString,
  proximoMantenimientoKm: positiveNumber,
  observaciones: optionalString,
});

export const conductorSchema = z.object({
  nombreCompleto: nonEmptyString,
  cedula: nonEmptyString.min(5, "Mínimo 5 caracteres"),
  categoriaLicencia: nonEmptyString,
  licenciaVencimiento: nonEmptyString,
  telefono: nonEmptyString.min(7, "Mínimo 7 caracteres"),
  ciudadBase: nonEmptyString,
  estado: nonEmptyString,
  vehiculoAsignadoId: z.string().nullable().optional().default(null),
  placaAsignada: z.string().nullable().optional().default(null),
  observaciones: optionalString,
});

export const viajeSchema = z.object({
  fecha: nonEmptyString,
  rutaId: nonEmptyString,
  ciudadDestino: nonEmptyString,
  vehiculoId: nonEmptyString,
  placa: nonEmptyString,
  conductorId: nonEmptyString,
  conductorNombre: nonEmptyString,
  despachosIncluidos: optionalString,
  numeroObrasIncluidas: z.coerce.number().min(0).optional().default(0),
  horaSalida: nonEmptyString,
  kmInicial: positiveNumber,
  kmFinal: positiveNumber,
  kmRecorridos: positiveNumber,
  costoPeajes: positiveNumber,
  consumoGalones: positiveNumber,
  costoCombustible: positiveNumber,
  costoTotal: positiveNumber,
  estado: nonEmptyString,
  observaciones: optionalString,
  cliente: optionalString,
  direccionOrigen: nonEmptyString,
  direccionDestino: nonEmptyString,
  horaLlegada: optionalString,
  cantidadPeajes: z.coerce.number().min(0).optional().default(0),
  tiempoRecorridoMin: z.coerce.number().min(0).optional().default(0),
});

export const despachoSchema = z.object({
  fecha: nonEmptyString,
  obraId: nonEmptyString,
  nombreObra: nonEmptyString,
  ciudad: nonEmptyString,
  clienteId: optionalString,
  descripcionCarga: nonEmptyString,
  areaResponsable: nonEmptyString,
  memo: optionalString,
  cot: optionalString,
  responsableAutoriza: optionalString,
  estado: nonEmptyString,
  viajeAsignadoId: z.string().nullable().optional().default(null),
  observaciones: optionalString,
});

export const obraSchema = z.object({
  nombre: nonEmptyString,
  torre: optionalString,
  clienteId: nonEmptyString,
  ciudad: nonEmptyString,
  direccion: nonEmptyString,
  estadoDireccion: nonEmptyString,
  estadoObra: nonEmptyString,
  fuente: optionalString,
  alias: optionalString,
  observaciones: optionalString,
});

export const clienteSchema = z.object({
  nombre: nonEmptyString,
  nit: nonEmptyString.min(5, "Mínimo 5 caracteres"),
  contacto: optionalString,
  telefono: optionalString,
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  ciudad: nonEmptyString,
  obrasActivas: z.coerce.number().min(0).optional().default(0),
  estado: nonEmptyString,
  observaciones: optionalString,
});

export const rutaSchema = z.object({
  origen: nonEmptyString,
  destino: nonEmptyString,
  via: optionalString,
  distanciaKm: z.coerce.number().nullable().optional().default(null),
  tiempoMin: z.coerce.number().nullable().optional().default(null),
  peajeReferencia: z.coerce.number().nullable().optional().default(null),
  linkGoogleMaps: optionalString,
  observaciones: optionalString,
});

export const peajeSchema = z.object({
  nombre: nonEmptyString,
  via: nonEmptyString,
  departamento: nonEmptyString,
  categoriaVehiculo: nonEmptyString,
  tarifa: positiveNumberRequired,
  fuente: optionalString,
  observaciones: optionalString,
});

export const combustibleSchema = z.object({
  fecha: nonEmptyString,
  ciudad: nonEmptyString,
  tipo: nonEmptyString,
  precioGalon: positiveNumberRequired,
  fuente: optionalString,
  observaciones: optionalString,
});

export type VehiculoFormData = z.infer<typeof vehiculoSchema>;
export type ConductorFormData = z.infer<typeof conductorSchema>;
export type ViajeFormData = z.infer<typeof viajeSchema>;
export type DespachoFormData = z.infer<typeof despachoSchema>;
export type ObraFormData = z.infer<typeof obraSchema>;
export type ClienteFormData = z.infer<typeof clienteSchema>;
export type RutaFormData = z.infer<typeof rutaSchema>;
export type PeajeFormData = z.infer<typeof peajeSchema>;
export type CombustibleFormData = z.infer<typeof combustibleSchema>;
