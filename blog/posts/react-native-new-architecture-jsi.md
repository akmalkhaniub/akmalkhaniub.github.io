# React Native's New Architecture: JSI, Fabric, and Bridgeless Mode

> [!NOTE]
> **📖 Article Overview**
> For years, React Native's primary bottleneck has been **the Bridge** — the asynchronous, serialized JSON gateway that handled all communication between the JavaScript engine and the Native platform. Whenever a user scrolled quickly through a list or performed a fast gesture, the Bridge would choke, leading to dropped frames and sluggish UI performance. React Native's New Architecture (introduced fully in version 0.74+) solves this by replacing the Bridge with the **JavaScript Interface (JSI)**, enabling direct C++ communication. This article covers the mechanics of JSI, the Fabric renderer, and how Bridgeless Mode eliminates latency.

---

## The Bottleneck: Why the Old Bridge Failed

In the old architecture, JavaScript and Native code operated like two separate islands connected by a single shipping channel. If JavaScript wanted to render a view, it had to serialize the layout payload into JSON, send it asynchronously over the Bridge, wait for the Native thread to parse it, and then render it. 

This asynchronous nature meant:
1. **No Synchronous Execution**: JavaScript could not invoke native functions instantly on the same thread.
2. **Double Serialization Overhead**: Every coordinate, string, and layout instruction had to be packed and unpacked as JSON strings.
3. **Dropped UI Frames**: Under high load, layout instructions lagged behind user scroll gestures, leading to empty white spaces.

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#38bdf8', 'primaryTextColor': '#f3f4f6', 'primaryBorderColor': '#0ea5e9', 'lineColor': '#38bdf8', 'secondaryColor': '#111827', 'tertiaryColor': '#0b0f19'}}}%%
flowchart TD
    subgraph Old Architecture (Async JSON Bridge)
        JS_Old[JavaScript Engine] -->|1. Serialize JSON| Bridge[Async Bridge]
        Bridge -->|2. Deserialize JSON| Native_Old[Native UI Thread]
    end

    subgraph New Architecture (Direct C++ JSI Bindings)
        JS_New[JavaScript Engine] ===|Direct C++ Pointer Call| JSI[JSI Interface]
        JSI ===|Direct Memory Access| Native_New[Native UI Thread / Fabric]
    end
    
    style JS_New fill:#111827,stroke:#38bdf8,stroke-width:2px
    style Native_New fill:#111827,stroke:#38bdf8,stroke-width:2px
    style JSI fill:#0f172a,stroke:#38bdf8,stroke-width:3px
```

---

## The New Core Pillars

The new React Native architecture is built on three core pillars:

### 1. JavaScript Interface (JSI)
JSI replaces the Bridge. It is a lightweight C++ interface that gives the JavaScript engine (Hermes) **direct access to the native C++ object pointers**. JavaScript can call native functions directly, sync or async, without JSON serialization.

### 2. Fabric Renderer
Fabric is the new UI rendering engine. Instead of scheduling async native updates, Fabric runs synchronously. This allows React Native to execute heavy animations, transitions, and user interactions directly on the UI thread, eliminating the "white flash" layout issue.

### 3. TurboModules
TurboModules are the new native modules. In the old system, all native modules (camera, filesystem, Bluetooth) had to be initialized when the app started. TurboModules are **lazy-loaded** and communicate directly through JSI, significantly reducing app startup latency.

---

## Coding a C++ TurboModule under the New Architecture

Under the new architecture, we use C++ to write high-performance native modules. Here is a simple demonstration showing a shared calculation module (`FastMath`) using JSI.

### 1. The Codegen Schema Definition (TypeScript)
First, define the module interface using Flow or TypeScript:

```typescript
// Spec/NativeFastMath.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  multiply(a: number, b: number): number;
  hashString(input: string): string;
}

export default TurboModuleRegistry.getEnrolled<Spec>('FastMath');
```

---

### 2. The Native C++ Implementation (`FastMath.cpp`)
Codegen automatically creates the boilerplate, and we implement the C++ logic:

```cpp
#include "FastMath.h"

namespace facebook {
namespace react {

FastMath::FastMath(std::shared_ptr<CallInvoker> jsInvoker)
    : TurboModule(jsInvoker) {}

// Direct native computation on the JS thread without bridge overhead
double FastMath::multiply(double a, double b) {
  return a * b;
}

// Memory-direct string hashing
std::string FastMath::hashString(std::string input) {
  unsigned long hash = 5381;
  for (char c : input) {
    hash = ((hash << 5) + hash) + c;
  }
  return std::to_string(hash);
}

} // namespace react
} // namespace facebook
```

---

## Conclusion & Takeaways

React Native's new architecture bridges the native performance gap completely:
* [ ] **Eliminate JSON overhead**: Leverage JSI to pass binary data, images, and raw objects directly between JavaScript and native memory.
* [ ] **Use lazy loading**: Migrating native modules to TurboModules ensures your app startup remains fast.
* [ ] **Optimize layout transitions**: Take advantage of the synchronous Fabric renderer to build complex, fluid layouts.
* [ ] **Enforce Bridgeless Mode**: Configure your app to run in complete Bridgeless Mode to fully disable the legacy Bridge thread and claim maximum memory savings.
