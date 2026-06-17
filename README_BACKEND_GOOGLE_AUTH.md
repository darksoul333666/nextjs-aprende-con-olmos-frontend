# Backend: Inicio de sesión con Google

Este documento describe el contrato esperado por el frontend para implementar inicio de sesión con Google usando `@react-oauth/google` en Next.js y `google-auth-library` en Express + TypeScript.

Ruta frontend:

```txt
/login
```

El frontend obtiene un `credential` de Google, lo envía al backend y espera recibir el mismo formato de respuesta que ya usan `/auth/login` y `/auth/register`.

## Configuración en Google Cloud

En el OAuth Client de tipo **Aplicación web**, configurar:

### Orígenes autorizados de JavaScript

Para desarrollo:

```txt
http://localhost:3000
```

Para producción:

```txt
https://tudominio.com
```

### URIs de redireccionamiento autorizados

Para este flujo pueden quedar vacíos. No se usa redirect/callback del servidor; el frontend recibe un ID token y el backend solo lo verifica.

No usar el secreto del cliente en el frontend. Para este flujo tampoco es necesario en el backend.

## Variables de entorno

Frontend:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Backend:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
JWT_SECRET=your-jwt-secret
```

`GOOGLE_CLIENT_ID` debe ser el mismo valor que `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

## Dependencia requerida en backend

```bash
npm install google-auth-library
```

O con yarn:

```bash
yarn add google-auth-library
```

## Endpoint requerido

```http
POST /api/auth/google
Content-Type: application/json
```

Body:

```json
{
  "credential": "google-id-token"
}
```

Respuesta exitosa:

```json
{
  "success": true,
  "message": "Inicio de sesión con Google exitoso",
  "data": {
    "user": {
      "_id": "user_id",
      "email": "alumno@example.com",
      "name": "Alumno Demo",
      "role": "estudiante"
    },
    "token": "jwt-interno-del-backend"
  }
}
```

Respuesta de error:

```json
{
  "success": false,
  "message": "Token de Google inválido"
}
```

## Comportamiento esperado

- Verificar el `credential` con Google usando `google-auth-library`.
- Validar que el token fue emitido para el `GOOGLE_CLIENT_ID` configurado.
- Obtener del payload al menos `email`, `sub`, `name` y `picture`.
- Si el usuario ya existe por `email`, iniciar sesión con ese usuario.
- Si no existe, crear un usuario nuevo con rol `estudiante`.
- Firmar un JWT interno del backend, igual que en `/auth/login`.
- Responder con `{ success, data: { user, token } }`.

Recomendación: no crear usuarios `maestro` desde Google automáticamente. Los maestros deberían crearse por flujo administrativo o manual para evitar escalamiento accidental de permisos.

## Ejemplo de implementación

```ts
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { User } from "../models/User";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "La credencial de Google es requerida",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload.sub) {
      return res.status(401).json({
        success: false,
        message: "Token de Google inválido",
      });
    }

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      user = await User.create({
        email: payload.email,
        name: payload.name,
        googleId: payload.sub,
        avatar: payload.picture,
        role: "estudiante",
        authProvider: "google",
      });
    } else {
      const updates: Record<string, unknown> = {};

      if (!user.googleId) updates.googleId = payload.sub;
      if (!user.name && payload.name) updates.name = payload.name;
      if (payload.picture) updates.avatar = payload.picture;

      if (Object.keys(updates).length > 0) {
        user.set(updates);
        await user.save();
      }
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" },
    );

    return res.json({
      success: true,
      message: "Inicio de sesión con Google exitoso",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "No se pudo iniciar sesión con Google",
    });
  }
};
```

## Ruta Express

```ts
import { Router } from "express";
import { googleLogin } from "../controllers/authController";

const router = Router();

router.post("/google", googleLogin);

export default router;
```

Si las rutas de auth ya están montadas así:

```ts
app.use("/api/auth", authRoutes);
```

Entonces el frontend llamará correctamente a:

```txt
POST /api/auth/google
```

## Campos sugeridos en el modelo User

```ts
{
  email: string;
  name?: string;
  password?: string;
  role: "estudiante" | "maestro";
  googleId?: string;
  avatar?: string;
  authProvider?: "credentials" | "google";
}
```

Si `password` actualmente es obligatorio, debe permitirse opcional para usuarios creados con Google.

## CORS

El backend debe permitir el origen del frontend:

```ts
app.use(
  cors({
    origin: ["http://localhost:3000", "https://tudominio.com"],
    credentials: true,
  }),
);
```

## Checklist de prueba

1. Configurar `NEXT_PUBLIC_GOOGLE_CLIENT_ID` en el frontend.
2. Configurar `GOOGLE_CLIENT_ID` en el backend.
3. Reiniciar frontend y backend después de cambiar variables de entorno.
4. Entrar a `/login`.
5. Dar clic en el botón de Google.
6. Confirmar que el backend recibe `POST /api/auth/google`.
7. Confirmar que la respuesta incluye `data.user` y `data.token`.
8. Confirmar que el frontend redirige a `/` y queda autenticado.
