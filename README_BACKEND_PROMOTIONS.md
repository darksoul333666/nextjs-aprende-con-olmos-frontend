# Backend README: Promociones, Tarjetas de Regalo y Becas

## Contexto

El frontend ya tiene implementada la pantalla de administración para maestro en:

`/teacher/promotions`

La pantalla tiene 3 tabs:

1. `Promociones`
2. `Tarjetas de regalo`
3. `Becas`

El frontend usa `apiService`, que apunta a:

`http://localhost:3200/api`

Por lo tanto, cuando aquí se menciona `/promotions`, el request real será:

`http://localhost:3200/api/promotions`

## Objetivo Backend

Implementar el backend completo para:

- Crear y listar promociones por curso.
- Mostrar promociones activas en el listado público de cursos.
- Crear y listar tarjetas de regalo.
- Permitir canje de tarjetas de regalo.
- Buscar estudiantes para becas.
- Crear, actualizar, listar y remover becas.
- Aplicar promociones y becas al precio real cobrado en Stripe/backend.

## 1. Promociones

### Descripción

Una promoción es un descuento temporal aplicado a un curso específico.

El maestro podrá:

- Seleccionar un curso.
- Definir porcentaje de descuento.
- Definir fecha de inicio.
- Definir fecha final.

La promoción debe impactar el listado público de cursos y el precio real de compra.

### Modelo Sugerido: `Promotion`

```ts
{
  courseId: ObjectId ref Course, required: true,
  teacherId: ObjectId ref Teacher, required: true,
  discountPercentage: number, required: true, min: 1, max: 99,
  startsAt: Date, required: true,
  endsAt: Date, required: true,
  isActive: boolean, default: true,
  createdAt: Date,
  updatedAt: Date
}
```

Índices sugeridos:

```ts
promotionSchema.index({ courseId: 1, startsAt: 1, endsAt: 1 });
promotionSchema.index({ teacherId: 1, createdAt: -1 });
```

### Crear Promoción

Endpoint:

`POST /api/promotions`

Auth:

- `authMiddleware`
- `isTeacher`

Payload que envía el frontend:

```json
{
  "courseId": "66f000000000000000000001",
  "discountPercentage": 25,
  "startsAt": "2026-06-05T10:00",
  "endsAt": "2026-06-10T23:59"
}
```

Validaciones:

- `courseId` es requerido.
- `discountPercentage` debe ser mayor a `0` y menor a `100`.
- `startsAt` es requerido.
- `endsAt` es requerido.
- `endsAt` debe ser posterior a `startsAt`.
- El curso debe existir.
- El curso debe pertenecer al maestro autenticado.
- No permitir promociones activas superpuestas para el mismo curso.

Respuesta esperada:

```json
{
  "success": true,
  "message": "Promoción creada correctamente",
  "data": {
    "promotion": {
      "_id": "66f000000000000000000010",
      "courseId": {
        "_id": "66f000000000000000000001",
        "title": "Curso de Álgebra"
      },
      "discountPercentage": 25,
      "startsAt": "2026-06-05T16:00:00.000Z",
      "endsAt": "2026-06-11T05:59:00.000Z",
      "isActive": true,
      "createdAt": "2026-06-05T01:00:00.000Z"
    }
  }
}
```

### Listar Promociones

Endpoint:

`GET /api/promotions`

Auth:

- `authMiddleware`
- `isTeacher`

Respuesta esperada:

```json
{
  "success": true,
  "data": {
    "promotions": [
      {
        "_id": "66f000000000000000000010",
        "courseId": {
          "_id": "66f000000000000000000001",
          "title": "Curso de Álgebra"
        },
        "discountPercentage": 25,
        "startsAt": "2026-06-05T16:00:00.000Z",
        "endsAt": "2026-06-11T05:59:00.000Z",
        "isActive": true,
        "createdAt": "2026-06-05T01:00:00.000Z"
      }
    ]
  }
}
```

## 2. Promociones en Cursos Públicos

El frontend ya está preparado para mostrar:

- Label de promoción.
- Porcentaje de descuento.
- Precio original tachado.
- Precio con descuento.
- Contador de tiempo restante.

Para eso, el backend debe agregar `activePromotion` en cada curso del endpoint público.

Endpoint existente:

`GET /api/courses`

Regla para promoción activa:

```ts
promotion.isActive === true
promotion.startsAt <= now
promotion.endsAt > now
```

Forma esperada dentro de cada curso:

```json
{
  "_id": "66f000000000000000000001",
  "title": "Curso de Álgebra",
  "description": "Aprende álgebra desde cero",
  "price": 500,
  "activePromotion": {
    "_id": "66f000000000000000000010",
    "discountPercentage": 25,
    "startsAt": "2026-06-05T16:00:00.000Z",
    "endsAt": "2026-06-11T05:59:00.000Z",
    "discountedPrice": 375
  }
}
```

Cálculo:

```ts
discountedPrice = course.price * (1 - discountPercentage / 100)
```

Ejemplo:

```ts
500 * (1 - 25 / 100) = 375
```

## 3. Tarjetas de Regalo

### Descripción

Una tarjeta de regalo otorga acceso gratuito a un curso específico usando un código.

El maestro puede:

- Escribir nombre de tarjeta.
- Seleccionar curso.
- Definir número de canjes disponibles.
- Generar/copiar el código desde frontend.
- Crear la tarjeta.

El código lo genera el frontend con formato:

`ABCD-EFGH`

Reglas:

- 8 letras.
- Solo A-Z.
- Mayúsculas.
- Separado de 4 en 4 con guion.

El backend debe validar formato y unicidad.

### Modelo Sugerido: `GiftCard`

```ts
{
  name: string, required: true,
  code: string, required: true, unique: true, uppercase: true,
  courseId: ObjectId ref Course, required: true,
  teacherId: ObjectId ref Teacher, required: true,
  maxRedemptions: number, required: true, min: 1,
  redeemedCount: number, default: 0,
  isActive: boolean, default: true,
  createdAt: Date,
  updatedAt: Date
}
```

Índices sugeridos:

```ts
giftCardSchema.index({ code: 1 }, { unique: true });
giftCardSchema.index({ teacherId: 1, createdAt: -1 });
giftCardSchema.index({ courseId: 1 });
```

### Crear Tarjeta de Regalo

Endpoint:

`POST /api/promotions/gift-cards`

Auth:

- `authMiddleware`
- `isTeacher`

Payload que envía el frontend:

```json
{
  "name": "Regalo graduación",
  "courseId": "66f000000000000000000001",
  "maxRedemptions": 10,
  "code": "ABCD-EFGH"
}
```

Validaciones:

- `name` requerido.
- `courseId` requerido.
- `maxRedemptions` mayor a `0`.
- `code` requerido.
- `code` debe cumplir regex similar a: `^[A-Z]{4}-[A-Z]{4}$`.
- `code` debe ser único.
- El curso debe existir.
- El curso debe pertenecer al maestro autenticado.

Respuesta esperada:

```json
{
  "success": true,
  "message": "Tarjeta de regalo creada correctamente",
  "data": {
    "giftCard": {
      "_id": "66f000000000000000000020",
      "name": "Regalo graduación",
      "code": "ABCD-EFGH",
      "courseId": {
        "_id": "66f000000000000000000001",
        "title": "Curso de Álgebra"
      },
      "maxRedemptions": 10,
      "redeemedCount": 0,
      "isActive": true,
      "createdAt": "2026-06-05T01:00:00.000Z"
    }
  }
}
```

### Listar Tarjetas de Regalo

Endpoint:

`GET /api/promotions/gift-cards`

Auth:

- `authMiddleware`
- `isTeacher`

Respuesta esperada:

```json
{
  "success": true,
  "data": {
    "giftCards": [
      {
        "_id": "66f000000000000000000020",
        "name": "Regalo graduación",
        "code": "ABCD-EFGH",
        "courseId": {
          "_id": "66f000000000000000000001",
          "title": "Curso de Álgebra"
        },
        "maxRedemptions": 10,
        "redeemedCount": 0,
        "isActive": true,
        "createdAt": "2026-06-05T01:00:00.000Z"
      }
    ]
  }
}
```

### Canjear Tarjeta de Regalo

Este endpoint será usado por estudiantes.

Endpoint sugerido:

`POST /api/promotions/gift-cards/redeem`

Auth:

- `authMiddleware`
- usuario estudiante autenticado

Payload:

```json
{
  "code": "ABCD-EFGH"
}
```

Validaciones:

- Código requerido.
- Código existe.
- Tarjeta está activa.
- `redeemedCount < maxRedemptions`.
- El estudiante no tiene ya acceso al curso.
- Crear acceso al curso.
- Incrementar `redeemedCount`.

Forma sugerida de otorgar acceso:

```ts
Purchase.create({
  userId,
  courseId: giftCard.courseId,
  price: 0,
  paymentMethod: "free",
  status: "completed",
  transactionId: `gift-card-${giftCard._id}-${userId}`
});
```

Respuesta sugerida:

```json
{
  "success": true,
  "message": "Tarjeta canjeada correctamente",
  "data": {
    "courseId": "66f000000000000000000001"
  }
}
```

## 4. Becas

### Descripción

Una beca es un descuento global asignado a un estudiante.

El maestro puede:

- Buscar un estudiante.
- Seleccionarlo.
- Asignar porcentaje de beca.
- Si el estudiante ya tiene beca, modificarla.
- Si el estudiante ya tiene beca, removerla.
- La beca aplica para todos los cursos que ese estudiante adquiera.

### Modelo Sugerido: `Scholarship`

```ts
{
  studentId: ObjectId ref User, required: true,
  teacherId: ObjectId ref Teacher, required: true,
  discountPercentage: number, required: true, min: 1, max: 100,
  isActive: boolean, default: true,
  createdAt: Date,
  updatedAt: Date
}
```

Índices sugeridos:

```ts
scholarshipSchema.index({ studentId: 1 }, { unique: true });
scholarshipSchema.index({ teacherId: 1, createdAt: -1 });
```

Reglas:

- Solo debe existir una beca por estudiante.
- Si se vuelve a guardar una beca para el mismo estudiante, debe actualizar la existente.
- Si `discountPercentage` es `100`, el curso queda gratis.
- Se recomienda soft delete con `isActive: false`.

### Buscar Estudiantes

Endpoint:

`GET /api/promotions/scholarships/students?search=juan`

Auth:

- `authMiddleware`
- `isTeacher`

Reglas de búsqueda:

Buscar usuarios con rol:

```ts
role === "estudiante"
```

Buscar por:

- `email`
- `name` si existe
- cualquier campo equivalente disponible

Debe incluir si el estudiante ya tiene beca.

Respuesta esperada:

```json
{
  "success": true,
  "data": {
    "students": [
      {
        "_id": "66f000000000000000000030",
        "email": "juan@test.com",
        "name": "Juan Pérez",
        "scholarship": {
          "_id": "66f000000000000000000040",
          "discountPercentage": 50,
          "isActive": true
        }
      },
      {
        "_id": "66f000000000000000000031",
        "email": "maria@test.com",
        "name": "María López",
        "scholarship": null
      }
    ]
  }
}
```

### Consultar Mi Beca

Endpoint:

`GET /api/promotions/scholarships/me`

Auth:

- Requiere token JWT.
- Usuario con rol `estudiante`.

Uso:

- El frontend lo consulta al montar la sesión y después del login.
- Sirve para mostrar en la UX que el estudiante tiene una beca activa antes de llegar a Stripe.

Respuesta esperada si el estudiante tiene beca:

```json
{
  "success": true,
  "data": {
    "scholarship": {
      "_id": "66f000000000000000000040",
      "discountPercentage": 50,
      "isActive": true
    }
  }
}
```

Respuesta esperada si no tiene beca:

```json
{
  "success": true,
  "data": {
    "scholarship": null
  }
}
```

### Listar Becas

Endpoint:

`GET /api/promotions/scholarships`

Auth:

- `authMiddleware`
- `isTeacher`

Respuesta esperada:

```json
{
  "success": true,
  "data": {
    "scholarships": [
      {
        "_id": "66f000000000000000000040",
        "studentId": {
          "_id": "66f000000000000000000030",
          "email": "juan@test.com",
          "name": "Juan Pérez"
        },
        "discountPercentage": 50,
        "isActive": true,
        "createdAt": "2026-06-05T01:00:00.000Z",
        "updatedAt": "2026-06-05T01:10:00.000Z"
      }
    ]
  }
}
```

### Crear o Actualizar Beca

Endpoint:

`POST /api/promotions/scholarships`

Auth:

- `authMiddleware`
- `isTeacher`

Este endpoint debe funcionar como `upsert`.

Si el estudiante no tiene beca, la crea.

Si el estudiante ya tiene beca, actualiza el porcentaje y reactiva `isActive`.

Payload que envía el frontend:

```json
{
  "studentId": "66f000000000000000000030",
  "discountPercentage": 50
}
```

Validaciones:

- `studentId` requerido.
- El usuario debe existir.
- El usuario debe tener rol `estudiante`.
- `discountPercentage` debe ser mayor a `0`.
- `discountPercentage` debe ser menor o igual a `100`.

Respuesta esperada:

```json
{
  "success": true,
  "message": "Beca guardada correctamente",
  "data": {
    "scholarship": {
      "_id": "66f000000000000000000040",
      "studentId": {
        "_id": "66f000000000000000000030",
        "email": "juan@test.com",
        "name": "Juan Pérez"
      },
      "discountPercentage": 50,
      "isActive": true,
      "createdAt": "2026-06-05T01:00:00.000Z",
      "updatedAt": "2026-06-05T01:10:00.000Z"
    }
  }
}
```

### Remover Beca

Endpoint:

`DELETE /api/promotions/scholarships/:studentId`

Auth:

- `authMiddleware`
- `isTeacher`

Regla recomendada:

Hacer soft delete:

```ts
isActive = false
```

También es válido borrar el documento, pero soft delete conserva historial.

Respuesta esperada:

```json
{
  "success": true,
  "message": "Beca removida correctamente"
}
```

## 5. Aplicación de Descuentos en Compra

El backend debe calcular siempre el precio final.

No confiar en precios o descuentos enviados por el frontend.

Al crear una sesión de Stripe o registrar una compra, el backend debe validar:

1. Precio base del curso.
2. Promoción activa del curso.
3. Beca activa del estudiante.
4. Precio final.

### Regla de negocio recomendada

Usar el mayor descuento disponible, no acumular descuentos.

Ejemplo:

- Precio curso: `$500`
- Promoción activa: `25%`
- Beca estudiante: `50%`

Descuento aplicado: `50%`

Precio final: `$250`

```ts
const promotionDiscount = activePromotion?.discountPercentage || 0;
const scholarshipDiscount = activeScholarship?.discountPercentage || 0;

const finalDiscount = Math.max(promotionDiscount, scholarshipDiscount);

const finalPrice = course.price * (1 - finalDiscount / 100);
```

Si `finalDiscount === 100`, no debería enviarse a Stripe. Se puede crear una compra gratuita directamente.

## 6. Stripe

Cuando se cree sesión de Stripe para comprar un curso, el backend debe:

1. Buscar curso.
2. Buscar promoción activa del curso.
3. Buscar beca activa del estudiante.
4. Calcular mejor descuento.
5. Crear sesión de Stripe con precio final.
6. Guardar en compra el precio realmente cobrado.

Campos sugeridos para `Purchase`:

```ts
{
  originalPrice: number,
  finalPrice: number,
  price: number,
  discountPercentage: number,
  discountType: "promotion" | "scholarship" | "none",
  promotionId?: ObjectId,
  scholarshipId?: ObjectId
}
```

Si no se quiere migrar mucho todavía, al menos guardar `price` con el precio final cobrado.

## 7. Estructura Sugerida

Crear:

```txt
src/models/Promotion.ts
src/models/GiftCard.ts
src/models/Scholarship.ts

src/controllers/promotionController.ts
src/routes/promotionRoutes.ts
```

Actualizar:

```txt
src/models/index.ts
src/routes/index.ts
```

En `src/models/index.ts` exportar:

```ts
export { Promotion, type IPromotion } from './Promotion';
export { GiftCard, type IGiftCard } from './GiftCard';
export { Scholarship, type IScholarship } from './Scholarship';
```

En `src/routes/index.ts` montar:

```ts
import promotionRoutes from './promotionRoutes';

router.use('/promotions', promotionRoutes);
```

## 8. Rutas Esperadas

```ts
router.get('/', authMiddleware, isTeacher, getPromotions);
router.post('/', authMiddleware, isTeacher, createPromotion);

router.get('/gift-cards', authMiddleware, isTeacher, getGiftCards);
router.post('/gift-cards', authMiddleware, isTeacher, createGiftCard);
router.post('/gift-cards/redeem', authMiddleware, redeemGiftCard);

router.get('/scholarships', authMiddleware, isTeacher, getScholarships);
router.post('/scholarships', authMiddleware, isTeacher, upsertScholarship);
router.delete('/scholarships/:studentId', authMiddleware, isTeacher, removeScholarship);

router.get('/scholarships/students', authMiddleware, isTeacher, searchStudentsForScholarship);
```

Importante:

`/scholarships/students` debe ir antes de rutas dinámicas tipo `/:id`.

## 9. Contratos Exactos que Espera el Frontend

### Promoción

```ts
{
  _id: string;
  courseId: string | {
    _id: string;
    title: string;
  };
  discountPercentage: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
}
```

### Promoción activa en curso

```ts
activePromotion?: {
  _id: string;
  discountPercentage: number;
  startsAt?: string;
  endsAt?: string;
  discountedPrice?: number;
}
```

### Tarjeta de regalo

```ts
{
  _id: string;
  name: string;
  code: string;
  courseId: string | {
    _id: string;
    title: string;
  };
  maxRedemptions: number;
  redeemedCount: number;
  isActive: boolean;
  createdAt: string;
}
```

### Estudiante para selector de beca

```ts
{
  _id: string;
  email: string;
  name?: string;
  scholarship: null | {
    _id: string;
    discountPercentage: number;
    isActive: boolean;
  };
}
```

### Beca

```ts
{
  _id: string;
  studentId: {
    _id: string;
    email: string;
    name?: string;
  };
  discountPercentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## 10. Resumen de `data` que el Frontend Consume

El frontend espera estos nombres exactos:

```ts
data.promotions
data.promotion

data.giftCards
data.giftCard

data.students

data.scholarships
data.scholarship
```

No cambiar estos nombres sin actualizar el frontend.

## 11. Consideraciones Finales

- Mantener formato de respuesta `{ success, message, data }`.
- Fechas siempre en ISO string.
- Validar permisos del maestro sobre los cursos.
- Validar que becas solo se asignen a usuarios con rol `estudiante`.
- Validar que los descuentos reales se calculen en backend.
- No confiar en precio calculado por frontend.
- No acumular promoción + beca salvo que se decida explícitamente.
- Si hay beca de 100%, crear compra gratuita sin Stripe.
- Si una gift card se canjea, crear acceso gratuito y aumentar `redeemedCount`.
