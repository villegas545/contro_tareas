# Control de Tareas - Documentación Completa del Sistema

> **⚠️ IMPORTANTE**: Este archivo debe actualizarse con cada refactorización o adición nueva al proyecto.  
> **Última actualización**: 2026-02-01

---

## 📋 Descripción General

**Control de Tareas** es una aplicación React Native/Expo para gestionar tareas familiares. Los padres asignan tareas a los hijos, quienes las completan para ganar puntos y canjear recompensas.

### Características Principales
- Sistema de roles (padres vs hijos)
- Tareas recurrentes (diarias, semanales) y únicas
- Sistema de puntos y recompensas
- Billetera electrónica para hijos
- Estadísticas y reportes
- Modo vacaciones
- Debug mode con fecha simulada
- Soporte multi-idioma (ES, EN, FR, PT, IT)

---

## 🏗️ Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| React Native | Framework móvil |
| Expo | Plataforma de desarrollo |
| NativeWind | Estilos (TailwindCSS para RN) |
| Firebase Firestore | Base de datos |
| Firebase Auth | (Preparado, no implementado) |
| React Navigation | Navegación |
| TypeScript | Tipado estático |

---

## 📁 Estructura de Archivos Detallada

### Raíz del Proyecto

```
inventario - Copy/
├── .agent/                    # Configuración del agente IA
│   ├── SYSTEM.md             # ← ESTE ARCHIVO (documentación del sistema)
│   ├── workflows/            # Workflows automatizados
│   │   └── db-debug.md       # Workflow para debug de BD
│   └── plans/                # Planes de implementación
│
├── App.tsx                   # Punto de entrada principal
├── firebaseConfig.ts         # Configuración de Firebase
├── index.ts                  # Entry point para Expo
├── package.json              # Dependencias y scripts
├── tsconfig.json             # Configuración TypeScript
├── tailwind.config.js        # Configuración NativeWind/Tailwind
├── babel.config.js           # Configuración Babel
├── metro.config.js           # Configuración Metro bundler
├── eas.json                  # Configuración EAS Build
├── app.json                  # Configuración Expo
│
├── serviceAccountKey.json    # 🔒 Credenciales Firebase Admin (NO commitear)
├── google-services.json      # Credenciales Android Firebase
└── .env                      # Variables de entorno
```

### `/context/` - Estado Global

| Archivo | Descripción | Tamaño |
|---------|-------------|--------|
| `TaskContext.tsx` | **Estado global principal** - Contiene TODA la lógica de negocio, autenticación, tareas, recompensas, schedules, etc. (~1280 líneas) | 52KB |

#### Funciones Principales en TaskContext

| Función | Descripción |
|---------|-------------|
| `login(username, password?)` | Autenticar usuario |
| `logout()` | Cerrar sesión |
| `addTask(task)` | Crear tarea nueva |
| `updateTask(taskId, updates)` | Actualizar tarea |
| `deleteTask(taskId)` | Eliminar tarea |
| `completeTask(taskId, evidenceUrl?)` | Marcar como completada |
| `verifyTask(taskId)` | Verificar tarea (padre) |
| `rejectTask(taskId)` | Rechazar tarea (padre) |
| `addSchedule(schedule)` | Crear regla de recurrencia |
| `deleteSchedule(scheduleId)` | Eliminar recurrencia |
| `addReward(reward)` | Crear recompensa |
| `redeemReward(redemption)` | Solicitar canje |
| `approveRedemption(id)` | Aprobar canje |
| `isTaskActiveToday(task)` | Filtrar tareas del día |
| `getCurrentDate()` | Obtener fecha (respeta debug) |
| `getLocalDateString(date?)` | Fecha en formato YYYY-MM-DD |
| `checkAndGenerateWeeklyTasks()` | Generar tareas desde schedules |
| `processDailyReset()` | Procesar expiraciones |

### `/screens/` - Pantallas

| Archivo | Descripción | Tamaño |
|---------|-------------|--------|
| `LoginScreen.tsx` | Pantalla de login | 4KB |
| `ParentDashboard.tsx` | Dashboard principal del padre | 9KB |
| `ChildDashboard.tsx` | Dashboard del hijo | 24KB |
| `StatisticsScreen.tsx` | Estadísticas y gráficos | 39KB |
| `CreateTaskScreen.tsx` | Crear nueva tarea | 16KB |
| `AddFamilyMemberScreen.tsx` | Agregar hijo/padre | 7KB |
| `AddMessageScreen.tsx` | Agregar mensaje motivacional | 2KB |
| `HistoryScreen.tsx` | Historial de tareas | 3KB |
| `ManageCategoriesScreen.tsx` | Gestionar categorías | 9KB |
| `ManageJustificationsScreen.tsx` | Gestionar justificaciones | 5KB |
| `SchoolCalendarScreen.tsx` | Calendario escolar | 5KB |

### `/components/` - Componentes Reutilizables

#### `/components/dashboard/` - Tabs del Dashboard del Padre

| Archivo | Descripción | Tamaño |
|---------|-------------|--------|
| `MonitoringTab.tsx` | Ver y verificar tareas del día | 29KB |
| `AssignmentTab.tsx` | Asignar tareas a hijos | 26KB |
| `SettingsTab.tsx` | Configuración (idioma, vacation, debug) | 17KB |
| `FamilyTab.tsx` | Gestionar miembros de familia | 6KB |
| `MessagesTab.tsx` | Mensajes motivacionales | 5KB |
| `RewardsTab.tsx` | Gestionar recompensas | 10KB |
| `WalletTab.tsx` | Billetera electrónica | 9KB |
| `CategoriesTab.tsx` | Categorías de tareas | 8KB |

#### `/components/ui/` - Componentes UI Base

| Archivo | Descripción |
|---------|-------------|
| `Button.tsx` | Botón reutilizable con variantes |
| `Card.tsx` | Contenedor tipo tarjeta |
| `DatePicker.tsx` | Selector de fecha (web + nativo) |
| `SearchInput.tsx` | Input de búsqueda |
| `ConfirmationModal.tsx` | Modal de confirmación |
| `AdvancedFilterControls.tsx` | Controles de filtrado avanzado |

#### `/components/` - Otros Componentes

| Archivo | Descripción |
|---------|-------------|
| `ChildTaskCard.tsx` | Tarjeta de tarea para hijos |
| `ParentTaskCard.tsx` | Tarjeta de tarea para padres |
| `ScheduleModal.tsx` | Modal para crear/editar schedules |
| `TaskTags.tsx` | Tags visuales de tarea (tipo, estado) |

### `/types/` - Definiciones de Tipos

| Archivo | Descripción |
|---------|-------------|
| `index.ts` | Tipos principales (User, Task, TaskSchedule, Reward, etc.) |
| `history.ts` | Tipo TaskHistory |

#### Tipos Principales

```typescript
// Roles de usuario
type Role = 'parent' | 'child';

// Estados de tarea
type TaskStatus = 'pending' | 'completed' | 'verified' | 'expired';

// Frecuencia de tareas
type TaskFrequency = 'daily' | 'weekly' | 'one-time';

// Tipos de tarea
type TaskType = 'obligatory' | 'additional';

// Arquitectura de 3 tablas
interface TaskTemplate { ... }  // Plantilla base
interface TaskSchedule { ... }  // Regla de asignación
interface Task { ... }          // Instancia diaria

// Otros
interface User { ... }
interface Reward { ... }
interface Redemption { ... }
interface Category { ... }
interface GlobalSettings { ... }
```

### `/scripts/` - Scripts de Utilidad

| Archivo | Uso | Comando |
|---------|-----|---------|
| `db_debug.js` | **Debug de Firebase** - Consultar y limpiar datos | `node scripts/db_debug.js <cmd>` |
| `debug_elmo_tasks.js` | Debug específico de tareas de Elmo | `node scripts/debug_elmo_tasks.js` |
| `wipeClean.js` | Limpiar toda la base de datos | `node scripts/wipeClean.js` |
| `wipe_assignments.ts` | Limpiar asignaciones | `npx ts-node scripts/wipe_assignments.ts` |
| `migrate_templates.ts` | Migrar templates legacy | `npx ts-node scripts/migrate_templates.ts` |
| `backup_db.ts` | Hacer backup de la BD | `npx ts-node scripts/backup_db.ts` |

### `/data/` - Datos y Traducciones

| Archivo | Descripción |
|---------|-------------|
| `mockData.ts` | Datos mock para testing |
| `historyData.ts` | Historial mock |

### `/utils/` - Utilidades

| Archivo | Descripción |
|---------|-------------|
| `translations.ts` | Sistema de traducciones i18n (68KB) |
| `notifications.ts` | Manejo de push notifications |

### `/hooks/` - Custom Hooks

| Archivo | Descripción |
|---------|-------------|
| `index.ts` | Exports centralizados |
| `useDateUtils.ts` | Utilidades de fecha |
| `useSelection.ts` | Lógica de selección múltiple |
| `useTaskFilters.ts` | Filtrado de tareas |

### `/src/` - Código Refactorizado (En Progreso)

Esta carpeta contiene código en proceso de refactorización con mejor arquitectura:

```
/src/
├── context/              # Contextos modulares (en progreso)
│   ├── AuthContext.tsx
│   ├── TasksContext.tsx
│   ├── RewardsContext.tsx
│   ├── FamilyContext.tsx
│   ├── SettingsContext.tsx
│   └── AppProviders.tsx
├── constants/            # Constantes centralizadas
│   ├── colors.ts
│   ├── frequency.ts
│   ├── shifts.ts
│   ├── taskStatus.ts
│   └── weekDays.ts
├── types/               # Tipos TypeScript
├── services/            # Servicios Firebase
│   └── firebase/
└── i18n/                # Internacionalización
```

---

## 🔧 Scripts de Debug (Firebase)

### Ubicación: `scripts/db_debug.js`

```bash
# ===== CONSULTAS =====

# Listar todos los usuarios
node scripts/db_debug.js users

# Listar todas las tareas (resumen)
node scripts/db_debug.js tasks

# Listar tareas con detalles completos
node scripts/db_debug.js tasks --full

# Filtrar tareas por usuario
node scripts/db_debug.js tasks --user <userId>

# Filtrar tareas por fecha
node scripts/db_debug.js tasks --date 2026-02-01

# Filtrar por status
node scripts/db_debug.js tasks --status pending

# Ver una tarea específica
node scripts/db_debug.js task <taskId>

# Listar schedules (plantillas recurrentes)
node scripts/db_debug.js schedules

# Listar templates
node scripts/db_debug.js templates

# Ver historial de tareas (últimas 20)
node scripts/db_debug.js history

# Ver historial con límite personalizado
node scripts/db_debug.js history 50

# Consultar cualquier colección
node scripts/db_debug.js query <collectionName>

# ===== LIMPIEZA =====

# Encontrar tareas huérfanas/problemáticas (solo mostrar)
node scripts/db_debug.js fix-orphans

# Eliminar tareas huérfanas (¡CUIDADO!)
node scripts/db_debug.js fix-orphans --fix

# Eliminar una tarea específica
node scripts/db_debug.js delete-task <taskId>
```

---

## 📊 Modelo de Datos (Firestore)

### Colecciones

| Colección | Descripción | Campos Clave |
|-----------|-------------|--------------|
| `users` | Usuarios del sistema | id, name, role, username, walletBalance |
| `tasks` | Instancias de tareas | id, title, status, dueDate, assignedTo, points |
| `schedules` | Reglas de recurrencia | id, title, frequency, daysOfWeek, assignedTo, active |
| `taskTemplates` | Plantillas base | id, title, type, points, frequency |
| `taskHistory` | Historial completado | id, title, date, completedAt, verifiedAt, points |
| `rewards` | Recompensas | id, title, cost, icon |
| `redemptions` | Canjes de recompensas | id, rewardId, childId, status |
| `globalSettings` | Configuración global | id, isVacationMode, timezone, language |
| `categories` | Categorías de tareas | id, name, icon, color, order |
| `justificationReasons` | Razones de justificación | id, text |
| `messages` | Mensajes motivacionales | id, text |
| `transactions` | Transacciones de billetera | id, childId, amount, type |

### Arquitectura de 3 Tablas para Tareas

```
┌──────────────────┐
│  TaskTemplate    │  ← Plantilla base (definición)
└────────┬─────────┘
         │ se usa para crear
         ▼
┌──────────────────┐
│  TaskSchedule    │  ← Regla de asignación (quién, cuándo)
└────────┬─────────┘
         │ genera automáticamente
         ▼
┌──────────────────┐
│      Task        │  ← Instancia diaria (con dueDate específico)
└──────────────────┘
```

---

## 🐛 Modo Debug (Fecha Simulada)

### Propósito
Permite simular diferentes fechas para testing sin esperar que cambien los días reales.

### Cómo Activar
1. Ir a **Configuración** (Settings) en el dashboard del padre
2. Activar **"Debug: Fecha Simulada"** (sección roja)
3. Seleccionar la fecha deseada o usar botones rápidos

### Cómo Funciona Internamente

```typescript
// Estado en TaskContext
const [debugDate, setDebugDate] = useState<string | null>(null);

// Función que retorna fecha debug o real
const getCurrentDate = (): Date => {
    if (debugDate) {
        const [year, month, day] = debugDate.split('-').map(Number);
        return new Date(year, month - 1, day);
    }
    return new Date();
};

// getLocalDateString usa getCurrentDate internamente
const getLocalDateString = (date?: Date): string => {
    const targetDate = date || getCurrentDate();
    // ... formateo
};
```

### Componentes que Usan Debug Date
- `isTaskActiveToday()` - Filtrado de tareas
- `processDailyReset()` - Expiraciones
- `checkAndGenerateWeeklyTasks()` - Generación de tareas
- `MonitoringTab` - Filtro de fecha
- `AssignmentTab` - Fecha por defecto

### Indicadores Visuales
- **Banner rojo** en `ParentDashboard` cuando debug está activo
- **Banner rojo** en `ChildDashboard` cuando debug está activo

---

## 🔄 Flujo de Tareas

```
┌─────────────────────────────────────────────────────────────────┐
│  1. CREACIÓN                                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Padre crea Template → Schedule → Tasks se generan auto  │  │
│  │          O                                                │  │
│  │ Padre asigna tarea one-time directamente                │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  2. VISUALIZACIÓN                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ isTaskActiveToday() filtra qué tareas mostrar            │  │
│  │ Solo muestra tareas con dueDate = hoy (o debug date)     │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  3. COMPLETAR                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Hijo marca como completada → status = 'completed'        │  │
│  │ Puede agregar evidencia (foto)                           │  │
│  │ Se envía push notification al padre                      │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  4. VERIFICAR                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Padre verifica → status = 'verified'                     │  │
│  │ Se suman puntos al hijo (taskHistory)                    │  │
│  │ Tarea se mueve a historial                               │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  5. CANJE DE PUNTOS                                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Hijo solicita canje → redemption status = 'pending'      │  │
│  │ Padre aprueba → puntos se descuentan, status = 'approved'│  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo (web + dispositivos)
npm run start

# Iniciar solo para web
npm run web

# Compilar TypeScript (verificar errores)
npx tsc --noEmit

# Ejecutar en Android (requiere emulador o dispositivo)
npm run android

# Build APK para Android
npx expo run:android

# Limpiar cache
npx expo start --clear
```

---

## ⚠️ Problemas Comunes y Soluciones

### Tarea "fantasma" que no debería mostrarse

**Síntoma**: Aparece una tarea completada/verificada de un día pasado.

**Causa**: Tareas antiguas con fechas pasadas que no se filtraron correctamente.

**Solución**: 
```bash
# 1. Encontrar tareas huérfanas
node scripts/db_debug.js fix-orphans

# 2. Eliminarlas
node scripts/db_debug.js fix-orphans --fix
```

### Tareas no aparecen para un hijo

**Verificar**:
1. ¿La tarea tiene `dueDate` = hoy?
2. ¿El `assignedTo` es el ID correcto del hijo?
3. ¿El schedule está `active: true`?
4. ¿Está activo el debug date con otra fecha?

```bash
# Ver tareas del hijo específico
node scripts/db_debug.js tasks --user <childId>
```

### Error de permisos en Firestore

**Causa**: Reglas de seguridad expiradas o restrictivas.

**Solución**: Actualizar reglas en Firebase Console → Firestore → Rules

```javascript
// Reglas de desarrollo (temporales)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2026, 3, 1);
    }
  }
}
```

### Tareas no se generan automáticamente

**Verificar**:
1. ¿Existe un schedule activo?
2. ¿Los días de la semana están configurados correctamente?
3. Revisar logs de `checkAndGenerateWeeklyTasks`

---

## 📝 Convenciones de Código

### Estilos
- Usar NativeWind (`className`) para estilos
- Evitar estilos inline excepto para valores dinámicos
- Colores en `src/constants/colors.ts`

### Tipos
- Tipos principales en `types/index.ts`
- Crear interfaces para props de componentes

### Traducciones
- Todas las strings UI deben usar `t('key')`
- Traducciones en `utils/translations.ts`

### Componentes
- Componentes en PascalCase
- Hooks personalizados con prefijo `use`
- Archivos de componentes con `.tsx`

---

## 🔒 Seguridad

### Archivos Sensibles (NO commitear)
- `serviceAccountKey.json` - Credenciales Firebase Admin
- `.env` - Variables de entorno

### En Producción
- Reglas de Firestore restrictivas
- Desactivar debug mode
- Usar Firebase Auth real

---

## 📜 Historial de Cambios Importantes

| Fecha | Cambio |
|-------|--------|
| 2026-02-01 | Agregado sistema de Debug Date Override |
| 2026-02-01 | Creado script `db_debug.js` para consultas a Firebase |
| 2026-02-01 | Fix de tareas one-time pasadas que aparecían como fantasma |
| 2026-01-24 | Migración a arquitectura de 3 tablas |
| 2026-01-23 | Refactorización del TaskContext |

---

> **Recordatorio**: Actualizar este archivo cuando se hagan cambios significativos al sistema.
