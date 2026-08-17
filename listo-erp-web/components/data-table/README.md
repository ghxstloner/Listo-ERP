# Data tables

`DataTable` recibe una instancia de TanStack Table y centraliza el renderizado
de headers, filas, celdas y estado vacío. `DataTablePagination` centraliza los
controles de página y acepta etiquetas traducidas.

Todas las tablas de datos de la aplicación usan `DataTable`, incluyendo las
que tienen formularios, switches, imágenes, diálogos o acciones por fila.
Esas capacidades se mantienen dentro de las celdas definidas por cada módulo.

Las tablas usan sorting y paginación de TanStack Table con un tamaño inicial de
10 filas. `components/ui/table.tsx` sigue siendo la primitiva de bajo nivel
que `DataTable` utiliza internamente.
