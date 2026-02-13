# Control de Tareas - Nueva Arquitectura

## 📁 Estructura del Proyecto

```
📦 src/
├── 📁 components/           # Componentes React
│   ├── 📁 common/          # Componentes UI reutilizables
│   │   ├── Badge.tsx       # Badges y chips
│   │   ├── ConfirmationModal.tsx
│   │   ├── EmptyState.tsx
│   │   └── LoadingSpinner.tsx
│   └── index.ts
│
├── 📁 constants/            # Constantes y configuración
│   ├── colors.ts           # Colores de marca
│   ├── frequency.ts        # Frecuencias de tareas
│   ├── shifts.ts           # Turnos (mañana, tarde, noche)
│   ├── taskStatus.ts       # Estados de tareas
│   ├── weekDays.ts         # Días de la semana
│   └── index.ts
│
├── 📁 context/              # Contextos de React (estado global)
│   ├── AuthContext.tsx     # Autenticación
│   ├── FamilyContext.tsx   # Usuarios, categorías, mensajes
│   ├── RewardsContext.tsx  # Recompensas y canjes
│   ├── SettingsContext.tsx # Configuración global
│   ├── TasksContext.tsx    # Tareas y plantillas
│   └── index.ts
│
├── 📁 hooks/                # Hooks personalizados
│   ├── useDateUtils.ts     # Utilidades de fecha
│   ├── useFilters.ts       # Lógica de filtrado
│   ├── useSelection.ts     # Selección múltiple
│   ├── useTaskSort.ts      # Ordenamiento de tareas
│   └── index.ts
│
├── 📁 i18n/                 # Internacionalización
│   ├── 📁 locales/
│   │   ├── es.json         # Español
│   │   └── en.json         # Inglés
│   └── index.ts            # Configuración i18n
│
├── 📁 services/             # Servicios externos
│   └── 📁 firebase/
│       ├── rewards.ts      # Operaciones de recompensas
│       ├── settings.ts     # Operaciones de configuración
│       ├── tasks.ts        # Operaciones de tareas
│       ├── users.ts        # Operaciones de usuarios
│       └── index.ts
│
└── 📁 types/                # Definiciones de TypeScript
    ├── history.ts
    ├── reward.ts
    ├── settings.ts
    ├── task.ts
    ├── user.ts
    └── index.ts
```

## 🎯 Guía de Uso

### Importar Constantes
```typescript
import { TASK_STATUS, STATUS_CONFIG } from '@/src/constants';
import { SHIFTS, SHIFT_ORDER } from '@/src/constants';
import { BRAND_COLORS, TAG_COLORS } from '@/src/constants';
```

### Usar Hooks
```typescript
import { useDateUtils, useFilters, useSelection } from '@/src/hooks';

// En un componente:
const { to12h, getLocalDateString, isToday } from useDateUtils();
const { filters, setFilter, filteredItems } = useFilters({ items: tasks });
const { selectedIds, toggleSelection, clearSelection } = useSelection({ items: verifiableTasks });
```

### Usar Contextos
```typescript
import { useAuth, useTasks, useRewards, useFamily, useSettings } from '@/src/context';

// En un componente:
const { currentUser, login, logout } = useAuth();
const { tasks, completeTask, verifyTask } = useTasks();
const { rewards, addReward, redeemReward } = useRewards();
const { users, categories, messages } = useFamily();
const { t, language, globalSettings } = useSettings();
```

### Usar Servicios Firebase
```typescript
import { tasksService, usersService, rewardsService } from '@/src/services/firebase';

// En una función async:
await tasksService.addTask(newTask);
await usersService.updateUser(userId, updates);
```

### Usar Tipos
```typescript
import { Task, User, Reward, TaskStatus, ShiftType } from '@/src/types';
```

### Usar Traducciones
```typescript
import { translate, createTranslator } from '@/src/i18n';

// Obtener una traducción:
const label = translate('es', 'common.save'); // "Guardar"

// Con parámetros:
const t = createTranslator('es');
const msg = t('stats.punishment_msg', { count: 3 }); // "Ha fallado 3 tareas..."
```

## 🔄 Migración

La estructura anterior sigue funcionando. Para migrar gradualmente:

1. **Importar desde `/src/` para nuevo código**
2. **Los componentes existentes pueden seguir usando `/context/TaskContext`**
3. **Migrar componentes uno a uno cuando se modifiquen**

## 📋 Componentes Comunes Disponibles

```typescript
import { EmptyState, LoadingSpinner, Badge, ConfirmationModal } from '@/src/components/common';

// EmptyState
<EmptyState 
  emoji="📭" 
  title="No hay tareas" 
  subtitle="Intenta cambiar los filtros" 
/>

// LoadingSpinner
<LoadingSpinner message="Cargando..." fullScreen />

// Badge
<Badge text="Pendiente" variant="warning" emoji="⏳" />

// ConfirmationModal
<ConfirmationModal
  visible={showModal}
  title="Confirmar"
  message="¿Estás seguro?"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
```

## 🏷️ Convenciones de Código

### Nombres de Archivos
- **Componentes**: `PascalCase.tsx` (ej: `EmptyState.tsx`)
- **Hooks**: `useCamelCase.ts` (ej: `useDateUtils.ts`)
- **Utilidades**: `camelCase.ts` (ej: `dateUtils.ts`)
- **Constantes**: `camelCase.ts` (ej: `taskStatus.ts`)

### Estructura de Componentes
```typescript
/**
 * Component Description
 */
import React from 'react';
// ... imports

interface ComponentProps {
  // props
}

export const Component: React.FC<ComponentProps> = ({ props }) => {
  // hooks
  // logic
  // return JSX
};

export default Component;
