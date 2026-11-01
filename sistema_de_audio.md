
# Especificación: Sistema de Audio para Chat IA

## 1. Contexto y Objetivo

Integrar un sistema de reproducción de audio en las respuestas del chatbot existente, permitiendo al usuario escuchar los mensajes generados en lugar de solo leerlos. El objetivo es ofrecer una experiencia de audio **simple, limpia y funcional**, superior al típico botón simplón que implementan la mayoría de IAs, pero sin caer en sobre-ingeniería.

## 2. Tecnología Elegida: Web Speech API

### Justificación
- **Gratis e ilimitada**: No consume tokens ni tiene costos asociados.
- **Sin backend**: Todo el procesamiento ocurre en el navegador del usuario.
- **Latencia mínima**: La voz se genera instantáneamente, sin esperas de red.
- **Sin carga al servidor**: No requiere infraestructura adicional.
- **Privacidad**: El audio no pasa por servidores externos.

### Arquitectura
```
Backend: Solo genera y envía TEXTO.
Frontend: Recibe el texto y, cuando el usuario lo solicita, genera y reproduce el audio LOCALMENTE usando Web Speech API (speechSynthesis).
```

El backend **nunca** genera audio. Todo el flujo de audio es 100% cliente.

### Limitaciones conocidas de la tecnología
- No existe `seek` (no se puede saltar a un punto específico del audio).
- No hay barra de progreso nativa.
- El comportamiento de `pause()` / `resume()` puede variar entre navegadores:
  - Chrome/Edge: funciona correctamente.
  - Firefox/Safari/móviles: puede tener comportamientos inconsistentes (saltarse una palabra o repetir un fragmento al reanudar).
  - Esta limitación se acepta como edge case; no se implementará workaround.

## 3. Interfaz de Usuario

### Ubicación
Debajo de cada mensaje del chatbot, se mostrarán **3 iconos** en fila:

```
[📋 Copiar]  [▶️ Reproducir]  [⚙️ Config]
```

### Icono 1: Copiar
- Copia el texto completo del mensaje al portapapeles.
- **Feedback visual obligatorio**: al hacer clic, el icono cambia brevemente a "✓ Copiado" (durante ~2 segundos) y luego vuelve al estado original.

### Icono 2: Reproducir / Pausar (toggle)
- **Un solo botón** que alterna entre play y pause.
- Estado inicial: ▶️ (play)
- Al hacer clic mientras reproduce: cambia a ⏸️ (pause) y pausa el audio.
- Al hacer clic mientras está pausado: cambia a ▶️ (play) y reanuda desde donde se quedó.
- Al terminar la reproducción (evento `onend`): vuelve automáticamente a ▶️.
- **Regla de exclusividad**: solo puede haber un mensaje reproduciéndose a la vez. Si el usuario hace clic en "reproducir" de un mensaje mientras otro se está reproduciendo, el anterior se detiene automáticamente y comienza el nuevo.

### Icono 3: Config (⚙️)
- Abre un **popover flotante** al lado del icono.
- El popover se cierra al hacer clic fuera de él.
- Contiene **solo 2 controles** (ver sección 5).

## 4. Comportamiento General

- La configuración de audio es **global**: aplica a todos los mensajes del chat.
- La configuración se **persiste en `localStorage`** del navegador para que el usuario no tenga que reconfigurarla cada vez que entre.
- Si el usuario cambia la velocidad o la voz, el cambio aplica inmediatamente a la reproducción en curso (si la hay) y a todas las futuras.
- Al terminar la reproducción de un mensaje, el botón vuelve a su estado de play y no se reproduce automáticamente el siguiente mensaje.

## 5. Popover de Configuración

Contiene únicamente estos dos controles:

### 5.1 Velocidad (rate)
- Slider con rango de **0.5x a 2.0x**, paso de 0.1.
- Valor por defecto: **1.0x**.
- Muestra el valor actual al lado del slider (ej: "1.2x").

### 5.2 Voz (voice)
- Dropdown con todas las voces disponibles en el navegador/sistema del usuario.
- Las voces deben cargarse dinámicamente usando `speechSynthesis.getVoices()`.
- Se recomienda mostrar primero las voces en español y, dentro de ellas, priorizar las que contengan "Neural" o "Natural" en el nombre.
- Cada opción debe mostrar el nombre de la voz y su idioma, ej: `"Microsoft Helena - es-ES"`.
- La voz seleccionada se guarda en `localStorage`.

## 6. Estado y Persistencia

Usar `localStorage` con las siguientes keys (sugeridas):

- `tts-voice`: nombre de la voz seleccionada.
- `tts-rate`: velocidad seleccionada (número).

Al cargar la app, leer estos valores y aplicarlos. Si no existen, usar los valores por defecto (voz por defecto del sistema, rate 1.0).


## 8. Criterios de Aceptación

La implementación se considera completa cuando:

1. Aparecen los 3 iconos debajo de cada mensaje del chatbot.
2. El botón de copiar funciona y muestra feedback visual.
3. El botón de reproducir alterna correctamente entre play/pause con cambio de icono.
4. Solo un mensaje puede reproducirse a la vez.
5. El popover de config abre y cierra correctamente.
6. La velocidad y la voz se pueden cambiar y los cambios se aplican.
7. La configuración persiste entre sesiones (recargar la página).
8. La implementación funciona en Chrome, Edge, Firefox y Safari (con las limitaciones conocidas de pause/resume aceptadas).
