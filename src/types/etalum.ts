// Tipos TypeScript para el sistema ETALUM
// Todos los IDs siguen el formato: PREFIJO-NUMERO

export interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  año: number;
  tipoVehiculo: "Camión turbo" | "Camioneta" | "Furgón" | "Tractomula";
  capacidadCargaKg: number;
  ciudadBase: string;
  estado: "Activo" | "En taller" | "Inactivo";
  kmActual: number;
  rendimientoKmGal: number;
  soatVencimiento: string;
  tecnomecanicaVencimiento: string;
  proximoMantenimientoKm: number;
  observaciones: string;
}

export interface Conductor {
  id: string;
  nombreCompleto: string;
  cedula: string;
  categoriaLicencia: "B2" | "B3" | "C2" | "C3";
  licenciaVencimiento: string;
  telefono: string;
  ciudadBase: string;
  estado: "Activo" | "Inactivo" | "Vacaciones" | "Incapacidad";
  vehiculoAsignadoId: string | null;
  placaAsignada: string | null;
  fechaIngreso: string;
  observaciones: string;
}

export interface Viaje {
  id: string;
  fecha: string;
  rutaId: string;
  ciudadDestino: string;
  vehiculoId: string;
  placa: string;
  conductorId: string;
  conductorNombre: string;
  despachosIncluidos: string;
  numeroObrasIncluidas: number;
  horaSalida: string;
  kmInicial: number;
  kmFinal: number;
  kmRecorridos: number;
  costoPeajes: number;
  consumoGalones: number;
  costoCombustible: number;
  costoTotal: number;
  estado: "Programado" | "En ruta" | "Completado" | "Cancelado";
  observaciones: string;
  cliente: string;
  direccionOrigen: string;
  direccionDestino: string;
  horaLlegada: string;
  cantidadPeajes: number;
  tiempoRecorridoMin: number;
}

export interface Despacho {
  id: string;
  fecha: string;
  dia: string;
  obraId: string;
  nombreObra: string;
  ciudad: string;
  clienteId: string;
  descripcionCarga: string;
  areaResponsable: string;
  memo: string;
  cot: string;
  responsableAutoriza: string;
  estado:
    | "Programado"
    | "En preparación"
    | "Despachado"
    | "Entregado"
    | "Cancelado";
  viajeAsignadoId: string | null;
  observaciones: string;
  registradoPor: string;
  fechaRegistro: string;
}

export interface Obra {
  id: string;
  nombre: string;
  torre: string;
  clienteId: string;
  ciudad: string;
  direccion: string;
  estadoDireccion: "Completo" | "Falta dirección";
  estadoObra: "Activa" | "Finalizada" | "Suspendida";
  fuente: string;
  alias: string;
  observaciones: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  nit: string;
  contacto: string;
  telefono: string;
  email: string;
  ciudad: string;
  obrasActivas: number;
  estado: "Activa" | "Inactiva";
  observaciones: string;
}

export interface Ruta {
  id: string;
  origen: string;
  destino: string;
  via: string;
  distanciaKm: number | null;
  tiempoMin: number | null;
  peajeReferencia: number | null;
  linkGoogleMaps: string;
  ultimaActualizacion: string;
  observaciones: string;
}

export interface Peaje {
  id: string;
  nombre: string;
  via: string;
  departamento: string;
  categoriaVehiculo:
    | "Categoría I"
    | "Categoría II"
    | "Categoría III"
    | "Categoría IV"
    | "Categoría V";
  tarifa: number;
  fechaActualizacion: string;
  fuente: string;
  observaciones: string;
}

export interface Combustible {
  id: string;
  fecha: string;
  ciudad: string;
  tipo: "Diésel" | "Gasolina corriente" | "Gasolina extra";
  precioGalon: number;
  fuente: string;
  observaciones: string;
}

export interface LogEntry {
  fechaHora: string;
  usuario: string;
  modulo: string;
  accion: "Crear" | "Editar" | "Eliminar" | "Importar" | "Generar";
  idRegistro: string;
  campoModificado: string;
  valorAnterior: string;
  valorNuevo: string;
  detalle: string;
}

export interface Indicador {
  id: string;
  nombre: string;
  descripcion: string;
  periodo: "Semanal" | "Mensual" | "Anual" | "Permanente";
  valorActual: number;
  meta: string;
  unidad: string;
  tendencia: "up" | "down" | "stable";
  observaciones: string;
}

export interface Parametro {
  parametro: string;
  valor: string;
  descripcion: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: "Admin" | "Editor" | "Visual";
  estado: "Activo" | "Inactivo";
  fechaCreacion: string;
  ultimoAcceso: string;
}

// Tipos auxiliares
export type Ciudad =
  | "Bogotá"
  | "Barranquilla"
  | "Cartagena"
  | "Santa Marta"
  | "Bucaramanga";

export type AreaResponsable =
  | "Ensamble"
  | "Vidrio"
  | "Almacén"
  | "Aluminio"
  | "Acero";

export interface HookResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface CRUDHookResult<T> extends HookResult<T> {
  create: (item: Omit<T, "id">) => Promise<T>;
  update: (id: string, item: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
}
