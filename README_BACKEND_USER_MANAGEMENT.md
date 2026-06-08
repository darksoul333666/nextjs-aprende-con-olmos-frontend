# Backend: Gestión de estudiantes por maestro

Este documento describe el contrato esperado por el frontend para el módulo de gestión de usuarios estudiantes.

Ruta frontend:

```txt
/teacher/users
```

El módulo permite altas, bajas por desactivación, reactivaciones y modificaciones de estudiantes desde una cuenta con rol `maestro`.

## Modelo esperado

```ts
interface StudentUser {
  _id: string;
  email: string;
  name?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  purchasesCount?: number;
}
```

## Endpoints requeridos

### Listar estudiantes

```http
GET /api/users/students?search=&status=all
Authorization: Bearer <token>
```

Query params:

- `search`: opcional. Busca por nombre o correo.
- `status`: `all | active | inactive`.

Respuesta:

```json
{
  "success": true,
  "data": {
    "students": [
      {
        "_id": "student_id",
        "email": "alumno@example.com",
        "name": "Alumno Demo",
        "isActive": true,
        "createdAt": "2026-06-07T00:00:00.000Z",
        "updatedAt": "2026-06-07T00:00:00.000Z",
        "lastLoginAt": "2026-06-07T01:00:00.000Z",
        "purchasesCount": 2
      }
    ]
  }
}
```

### Crear estudiante

```http
POST /api/users/students
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "email": "alumno@example.com",
  "name": "Alumno Demo",
  "password": "password123"
}
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "student": {
      "_id": "student_id",
      "email": "alumno@example.com",
      "name": "Alumno Demo",
      "isActive": true
    }
  },
  "message": "Estudiante creado correctamente"
}
```

### Actualizar estudiante

```http
PUT /api/users/students/:studentId
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "email": "alumno@example.com",
  "name": "Alumno actualizado",
  "password": "nuevaPasswordOpcional",
  "isActive": true
}
```

Notas:

- `password` es opcional. Si viene vacío o no viene, no cambiar contraseña.
- `isActive` permite activar/desactivar al estudiante.

Respuesta:

```json
{
  "success": true,
  "data": {
    "student": {
      "_id": "student_id",
      "email": "alumno@example.com",
      "name": "Alumno actualizado",
      "isActive": true
    }
  },
  "message": "Estudiante actualizado correctamente"
}
```

### Baja de estudiante (soft delete / desactivación)

```http
DELETE /api/users/students/:studentId
Authorization: Bearer <token>
```

Comportamiento recomendado:

- Hacer soft delete o cambiar `isActive` a `false`.
- No borrar compras/progreso históricos de forma irreversible.
- El estudiante inactivo no debe poder iniciar sesión.

Respuesta:

```json
{
  "success": true,
  "message": "Estudiante dado de baja correctamente"
}
```

### Reactivar estudiante

```http
PUT /api/users/students/:studentId
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "isActive": true
}
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "student": {
      "_id": "student_id",
      "email": "alumno@example.com",
      "name": "Alumno Demo",
      "isActive": true
    }
  },
  "message": "Estudiante reactivado correctamente"
}
```

## Nota sobre eliminación permanente

El frontend no expone una acción de eliminación permanente. Si se agrega en el futuro, debería ser una acción administrativa peligrosa con confirmación fuerte, porque puede romper historial de compras, progreso, recibos, becas y auditoría.

## Reglas de seguridad

- Todos los endpoints requieren JWT.
- Solo usuarios con rol `maestro` pueden acceder.
- Crear estudiantes siempre debe asignar `role: "estudiante"`.
- No devolver hashes de contraseña.
- Validar email único.
- Validar contraseña mínima, sugerido 6 caracteres.
- Si el usuario está inactivo, el login debería bloquearse o responder un mensaje claro.
