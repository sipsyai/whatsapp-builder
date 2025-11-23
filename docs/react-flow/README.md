# React Flow Dokümantasyon Linkleri

Bu projede kullanılan **React Flow** kütüphanesi için kapsamlı dokümantasyon rehberi.

---

## 📚 İçindekiler

- [İndirilen Dokümantasyonlar](#indirilen-dokümantasyonlar)
- [Temel Dokümantasyon](#temel-dokümantasyon)
- [API Referansları](#api-referansları)
- [Özelleştirme](#özelleştirme)
- [Ek Bileşenler](#ek-bileşenler)
- [İleri Seviye Konular](#ileri-seviye-konular)
- [Örnekler](#örnekler)
- [Projedeki Kullanım](#projedeki-kullanım)

---

## 📥 İndirilen Dokümantasyonlar

Bu klasörde React Flow'un resmi dokümantasyonlarından önemli sayfalar markdown formatında indirilmiştir:

### 1. [Custom Nodes](./01-custom-nodes.md)
**Dosya**: `01-custom-nodes.md`

**İçerik**:
- Custom node oluşturma adımları
- NodeTypes yapılandırması
- Best practices
- Kod örnekleri

**Ne zaman oku**: Kendi özel node'larını yazmak istediğinde

---

### 2. [useNodesState Hook](./02-use-nodes-state-hook.md)
**Dosya**: `02-use-nodes-state-hook.md`

**İçerik**:
- Hook API referansı
- Parametreler ve return değerleri
- Kullanım örnekleri
- TypeScript desteği

**Ne zaman oku**: Node state yönetimi öğrenmek istediğinde

---

### 3. [ReactFlow Component API](./03-react-flow-component-api.md)
**Dosya**: `03-react-flow-component-api.md`

**İçerik**:
- Tüm ReactFlow props'ları
- Event handlers listesi
- Interaction props
- Viewport kontrolü
- Keyboard shortcuts

**Ne zaman oku**: ReactFlow component'ini detaylı öğrenmek istediğinde
**Önemli**: Bu dokümantasyon referans olarak sürekli açık tutulabilir

---

### 4. [useEdgesState Hook](./04-use-edges-state-hook.md)
**Dosya**: `04-use-edges-state-hook.md`

**İçerik**:
- Hook API referansı
- Edge state yönetimi
- Kullanım örnekleri
- TypeScript desteği

**Ne zaman oku**: Edge (bağlantı) state yönetimi öğrenmek istediğinde

---

### 5. [Background Component](./05-background-component.md)
**Dosya**: `05-background-component.md`

**İçerik**:
- Background component props'ları
- Pattern variants (dots, lines, cross)
- Multiple background layering
- Customization örnekleri

**Ne zaman oku**: Canvas arka planını özelleştirmek istediğinde

---

### 6. [Controls Component](./06-controls-component.md)
**Dosya**: `06-controls-component.md`

**İçerik**:
- Controls component props'ları
- Zoom ve pan kontrolü
- Customization seçenekleri
- ControlButton kullanımı

**Ne zaman oku**: Viewport kontrol butonlarını özelleştirmek istediğinde

---

### Kullanım Notu
Bu dokümantasyonlar offline kullanım için indirilmiştir. Her dosyanın sonunda orijinal kaynak linki bulunmaktadır.

---

## 🎯 Temel Dokümantasyon

### 1. Ana Sayfa
**Link**: [https://reactflow.dev/](https://reactflow.dev/)

**Ne zaman kullan**: İlk olarak buradan başla
- Genel bakış
- Temel özellikler
- Kurulum bilgileri

---

### 2. Getting Started
**Link**: [https://reactflow.dev/learn](https://reactflow.dev/learn)

**İçerik**:
- React Flow'a giriş
- Temel kavramlar
- İlk flow'unu oluştur

**Kimlere Önerilir**: React Flow'a yeni başlayanlar

---

### 3. Quick Start Guide
**Link**: [https://reactflow.dev/learn/getting-started/installation-and-setup](https://reactflow.dev/learn/getting-started/installation-and-setup)

**İçerik**:
- Kurulum adımları
- Temel setup
- İlk örnek uygulama

**Tahmini Süre**: 10-15 dakika

---

## 🔧 API Referansları

### 4. React Flow Component
**Link**: [https://reactflow.dev/api-reference/react-flow](https://reactflow.dev/api-reference/react-flow)

**İçerik**:
- `<ReactFlow>` component props
- Event handlers
- Callback fonksiyonlar

**Proje Kullanımı**: `client/src/components/BuilderPage.tsx:300-316`

```tsx
<ReactFlow
    nodes={nodesWithHandler}
    edges={edges}
    onNodesChange={onNodesChange}
    onEdgesChange={onEdgesChange}
    onConnect={onConnect}
    onInit={setReactFlowInstance}
    onDrop={onDrop}
    onDragOver={onDragOver}
    onNodeClick={onNodeClick}
    nodeTypes={nodeTypes}
    fitView
/>
```

---

### 5. Hooks
**Link**: [https://reactflow.dev/api-reference/hooks](https://reactflow.dev/api-reference/hooks)

**Alt Konular**:

#### 5.1. useNodesState
**Link**: [https://reactflow.dev/api-reference/hooks/use-nodes-state](https://reactflow.dev/api-reference/hooks/use-nodes-state)

**Kullanım**: Node state yönetimi için
**Proje Kullanımı**: `client/src/components/BuilderPage.tsx:27`

```tsx
const [nodes, setNodes, onNodesChange] = useNodesState([
    { id: 'start-1', type: 'start', position: { x: 50, y: 50 }, data: { label: 'Start Flow' } }
]);
```

#### 5.2. useEdgesState
**Link**: [https://reactflow.dev/api-reference/hooks/use-edges-state](https://reactflow.dev/api-reference/hooks/use-edges-state)

**Kullanım**: Edge (bağlantı) state yönetimi için
**Proje Kullanımı**: `client/src/components/BuilderPage.tsx:30`

```tsx
const [edges, setEdges, onEdgesChange] = useEdgesState([]);
```

---

### 6. Types & Interfaces
**Link**: [https://reactflow.dev/api-reference/types](https://reactflow.dev/api-reference/types)

**İçerik**:
- TypeScript type tanımları
- Interface'ler
- Generic types

**Kimlere Önerilir**: TypeScript kullananlar

---

## 🎨 Özelleştirme

### 7. Custom Nodes
**Link**: [https://reactflow.dev/learn/customization/custom-nodes](https://reactflow.dev/learn/customization/custom-nodes)

**İçerik**:
- Custom node oluşturma
- Node component yapısı
- Node data yönetimi

**Proje Kullanımı**: `client/src/nodes/` klasöründe custom node'lar mevcut:
- `StartNode.tsx`
- `MessageNode.tsx`
- `QuestionNode.tsx`
- `ConditionNode.tsx`

**Örnek**:
```tsx
// client/src/components/BuilderPage.tsx:19-24
const nodeTypes = {
    start: StartNode,
    message: MessageNode,
    question: QuestionNode,
    condition: ConditionNode,
};
```

---

### 8. Custom Edges
**Link**: [https://reactflow.dev/learn/customization/custom-edges](https://reactflow.dev/learn/customization/custom-edges)

**İçerik**:
- Custom edge oluşturma
- Edge styling
- Animated edges

---

### 9. Node Types
**Link**: [https://reactflow.dev/api-reference/types/node](https://reactflow.dev/api-reference/types/node)

**İçerik**:
- Node type tanımları
- Node data structure
- Position ve dimension

---

## 🧩 Ek Bileşenler

### 10. Background
**Link**: [https://reactflow.dev/api-reference/components/background](https://reactflow.dev/api-reference/components/background)

**İçerik**:
- Background pattern'leri
- Grid ve dot patterns
- Customization options

**Proje Kullanımı**: `client/src/components/BuilderPage.tsx:314`

```tsx
<Background color="#333" gap={20} />
```

---

### 11. Controls
**Link**: [https://reactflow.dev/api-reference/components/controls](https://reactflow.dev/api-reference/components/controls)

**İçerik**:
- Zoom controls
- Fit view button
- Interactive controls

**Proje Kullanımı**: `client/src/components/BuilderPage.tsx:315`

```tsx
<Controls />
```

---

### 12. MiniMap
**Link**: [https://reactflow.dev/api-reference/components/minimap](https://reactflow.dev/api-reference/components/minimap)

**İçerik**:
- MiniMap ekleme
- Customization
- Styling options

**Not**: Projede henüz kullanılmıyor, eklenebilir.

---

## 🚀 İleri Seviye Konular

### 13. Drag and Drop
**Link**: [https://reactflow.dev/learn/advanced-use/drag-and-drop](https://reactflow.dev/learn/advanced-use/drag-and-drop)

**İçerik**:
- Node drag & drop implementasyonu
- Event handling
- Position calculation

**Proje Kullanımı**: `client/src/components/BuilderPage.tsx:46-79`

```tsx
const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}, []);

const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    // ... implementation
}, [reactFlowInstance, setNodes]);
```

---

### 14. ReactFlowProvider
**Link**: [https://reactflow.dev/api-reference/react-flow-provider](https://reactflow.dev/api-reference/react-flow-provider)

**İçerik**:
- Provider component
- Context API kullanımı
- Multiple instances

**Proje Kullanımı**: `client/src/App.tsx:2,11`

```tsx
import { ReactFlowProvider } from "reactflow";

const App = () => {
  return (
    <ReactFlowProvider>
      {/* Your components */}
    </ReactFlowProvider>
  );
};
```

---

### 15. TypeScript Support
**Link**: [https://reactflow.dev/learn/advanced-use/typescript](https://reactflow.dev/learn/advanced-use/typescript)

**İçerik**:
- Type safety
- Generic types
- Custom type definitions

**Kimlere Önerilir**: TypeScript kullanıcıları (Bu proje TypeScript kullanıyor!)

---

## 💡 Örnekler

### 16. Examples Gallery
**Link**: [https://reactflow.dev/examples](https://reactflow.dev/examples)

**İçerik**:
- Çeşitli kullanım senaryoları
- Interactive örnekler
- CodeSandbox linkleri

**Önerilen Örnekler**:
- Basic Flow
- Custom Nodes
- Drag and Drop
- Save and Restore

---

### 17. Interactive Examples - Custom Node
**Link**: [https://reactflow.dev/examples/nodes/custom-node](https://reactflow.dev/examples/nodes/custom-node)

**İçerik**:
- Custom node implementasyonu
- Canlı örnek
- Kaynak kod

**Kullanım**: Custom node yazarken bu örneğe bak

---

## 📁 Projedeki Kullanım

### Dosya Yapısı

```
client/
├── src/
│   ├── App.tsx                           # ReactFlowProvider kullanımı
│   ├── components/
│   │   ├── BuilderPage.tsx              # Ana React Flow implementasyonu
│   │   ├── ConfigModals.tsx             # Node configuration modals
│   │   └── QuestionTypeModal.tsx        # Question node type selector
│   ├── nodes/
│   │   ├── StartNode.tsx                # Custom start node
│   │   ├── MessageNode.tsx              # Custom message node
│   │   ├── QuestionNode.tsx             # Custom question node
│   │   └── ConditionNode.tsx            # Custom condition node
│   └── types.ts                         # Type definitions
```

---

### Kullanılan React Flow Özellikleri

| Özellik | Dosya | Satır |
|---------|-------|-------|
| ReactFlowProvider | `App.tsx` | 2, 11 |
| useNodesState | `BuilderPage.tsx` | 27 |
| useEdgesState | `BuilderPage.tsx` | 30 |
| ReactFlow Component | `BuilderPage.tsx` | 300-316 |
| Custom Nodes | `BuilderPage.tsx` | 19-24 |
| Drag & Drop | `BuilderPage.tsx` | 46-79 |
| Background | `BuilderPage.tsx` | 314 |
| Controls | `BuilderPage.tsx` | 315 |
| onConnect | `BuilderPage.tsx` | 44 |
| onNodeClick | `BuilderPage.tsx` | 106-111 |

---

### Import Statements

```tsx
// BuilderPage.tsx
import ReactFlow, {
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    type Node,
} from "reactflow";

// App.tsx
import { ReactFlowProvider } from "reactflow";
```

---

## 🎯 Öğrenme Yolu

### Beginner (0-1 hafta)

1. ✅ [Ana Sayfa](https://reactflow.dev/) - React Flow nedir?
2. ✅ [Getting Started](https://reactflow.dev/learn) - Temel kavramlar
3. ✅ [Quick Start](https://reactflow.dev/learn/getting-started/installation-and-setup) - İlk uygulama
4. ✅ [React Flow Component](https://reactflow.dev/api-reference/react-flow) - Component API
5. ✅ Projedeki `BuilderPage.tsx` dosyasını incele

---

### Intermediate (1-2 hafta)

1. ✅ [Custom Nodes](https://reactflow.dev/learn/customization/custom-nodes) - Özel node'lar
2. ✅ [Hooks](https://reactflow.dev/api-reference/hooks) - State yönetimi
3. ✅ [Drag and Drop](https://reactflow.dev/learn/advanced-use/drag-and-drop) - İnteraktif özellikler
4. ✅ Projedeki custom node'ları (`nodes/` klasörü) incele
5. ✅ Kendi custom node'unu oluştur

---

### Advanced (2+ hafta)

1. ✅ [TypeScript Support](https://reactflow.dev/learn/advanced-use/typescript) - Type safety
2. ✅ [Examples Gallery](https://reactflow.dev/examples) - Advanced patterns
3. ✅ Performance optimization
4. ✅ Complex layouts
5. ✅ Custom edge implementations

---

## 🔍 Hızlı Referans

### Sık Kullanılan Props

| Prop | Tip | Açıklama |
|------|-----|----------|
| `nodes` | `Node[]` | Node dizisi |
| `edges` | `Edge[]` | Edge dizisi |
| `onNodesChange` | `function` | Node değişiklik handler |
| `onEdgesChange` | `function` | Edge değişiklik handler |
| `onConnect` | `function` | Yeni bağlantı handler |
| `nodeTypes` | `object` | Custom node types |
| `fitView` | `boolean` | Otomatik zoom to fit |

---

### Sık Kullanılan Hooks

| Hook | Kullanım | Dönen Değer |
|------|----------|-------------|
| `useNodesState` | Node state yönetimi | `[nodes, setNodes, onNodesChange]` |
| `useEdgesState` | Edge state yönetimi | `[edges, setEdges, onEdgesChange]` |
| `useReactFlow` | Flow instance erişimi | `reactFlowInstance` |

---

## 📝 Best Practices

### 1. Node Types
- Her custom node için ayrı component oluştur
- `nodeTypes` objesini component dışında tanımla (re-render önlemek için)

### 2. State Management
- `useNodesState` ve `useEdgesState` kullan
- Manuel state yönetiminden kaçın

### 3. Performance
- `useCallback` kullan (event handler'lar için)
- `memo` kullan (custom node'lar için)
- Büyük flow'lar için virtualization düşün

### 4. TypeScript
- Node data için interface tanımla
- Generic types kullan
- Type safety'i koru

---

## 🐛 Troubleshooting

### Sık Karşılaşılan Sorunlar

#### 1. "ReactFlow must be wrapped in ReactFlowProvider"
**Çözüm**: `App.tsx`'te `ReactFlowProvider` kullanıldığından emin ol

```tsx
<ReactFlowProvider>
  <YourComponent />
</ReactFlowProvider>
```

#### 2. Node'lar görünmüyor
**Çözüm**:
- `nodes` array'inin doğru formatta olduğunu kontrol et
- `position` değerlerinin set edildiğini kontrol et
- `nodeTypes` mapping'inin doğru olduğunu kontrol et

#### 3. Drag & Drop çalışmıyor
**Çözüm**:
- `onDragOver` event handler'da `preventDefault()` çağrıldığından emin ol
- `reactFlowInstance` initialized olmalı

---

## 📞 Ek Kaynaklar

### Resmi Kaynaklar
- **GitHub**: [https://github.com/xyflow/xyflow](https://github.com/xyflow/xyflow)
- **Discord**: [https://discord.gg/Bqt6xrs](https://discord.gg/Bqt6xrs)
- **Twitter**: [@reactflowdev](https://twitter.com/reactflowdev)

### Video Tutorials
- YouTube'da "React Flow tutorial" ara
- Resmi blog: [https://reactflow.dev/blog](https://reactflow.dev/blog)

---

## 📊 Versiyon Bilgisi

**Proje Kullanılan Versiyon**: `11.11.4` (`client/package.json`)

**Son Stabil Versiyon**: React Flow dokümantasyonunu kontrol et

**Breaking Changes**: Major version upgrade'lerde migration guide'a bak

---

## 🔄 Güncelleme Geçmişi

| Tarih | Versiyon | Değişiklik |
|-------|----------|------------|
| 23 Kasım 2025 | 1.0.0 | İlk dokümantasyon oluşturuldu |

---

**Hazırlayan**: Claude Code
**Proje**: WhatsApp Builder
**React Flow Versiyonu**: 11.11.4
**Son Güncelleme**: 23 Kasım 2025
