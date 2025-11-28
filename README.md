# 🎬 Dark Channel Manager

Sistema completo para gerenciamento de produção de vídeos para canais dark. Interface mobile-first otimizada para gerenciar seus canais e produção de conteúdo diretamente do celular.

## ✨ Funcionalidades

### 📺 Gerenciamento de Canais
- Adicionar múltiplos canais
- Editar informações dos canais
- Excluir canais (com aviso de vídeos associados)
- Visualizar estatísticas por canal

### 🎥 Gerenciamento de Vídeos
- **Sistema de Checklist Completo:**
  - ✅ Thumbnail
  - ✅ Roteiro
  - ✅ Edição
  - ✅ Upload

- **Sistema de Estágios Automático:**
  - 📋 **PLANEJAMENTO** - Nenhuma tarefa concluída
  - 🎬 **PRODUÇÃO** - 1-2 tarefas concluídas
  - ✅ **FINALIZADO** - 3 tarefas concluídas (falta só o upload)
  - 🚀 **POSTADO** - Todas as tarefas concluídas

- **Campos Disponíveis:**
  - Título do vídeo
  - Descrição
  - Texto da thumbnail
  - Upload de thumbnail (com preview)
  - Roteiro completo

### 📝 Conversor de Texto para SRT
- Conversão automática de texto para formato SRT
- Configuração de palavras por legenda
- Configuração de duração por legenda
- Contagem de palavras, caracteres e legendas
- Download direto do arquivo .srt

### 💾 Persistência de Dados
- Todos os dados salvos localmente no navegador (LocalStorage)
- Função de backup/export de dados em JSON
- Nenhum dado enviado para servidores externos

## 🚀 Como Usar

### 🌐 Hospedagem Online (GitHub Pages)

**A forma mais fácil de usar de qualquer dispositivo!**

📖 **[Veja o guia completo de deploy](DEPLOY.md)**

**Resumo rápido:**
1. Acesse seu repositório no GitHub
2. Vá em **Settings → Pages**
3. Em **Source**, selecione a branch `main`
4. Clique em **Save**
5. Aguarde 2-3 minutos
6. Acesse: `https://aiaipedrox.github.io/roteirista/`

### 💻 Instalação Local
1. Clone ou baixe este repositório
2. Abra o arquivo `index.html` em qualquer navegador moderno
3. Não precisa instalar nada, funciona 100% offline!

### 📱 Uso no Celular
1. Acesse o site online OU abra o `index.html` no navegador do celular
2. Adicione à tela inicial para acesso rápido como app:
   - **iPhone/Safari:** Toque no botão de compartilhar > "Adicionar à Tela de Início"
   - **Android/Chrome:** Menu (⋮) > "Adicionar à tela inicial"

### Fluxo de Trabalho Recomendado

#### 1. Configurar Canais
```
📺 Canais → + Adicionar Canal
- Nome do canal
- Descrição (opcional)
```

#### 2. Criar Vídeo
```
🎥 Vídeos → + Novo Vídeo
1. Selecione o canal
2. Adicione o título
3. Preencha os campos necessários:
   - Descrição
   - Texto da thumbnail
   - Upload da thumb (opcional)
   - Roteiro
```

#### 3. Acompanhar Produção
```
Marque as caixinhas conforme avança:
☐ Thumbnail → 📋 PLANEJAMENTO
☑ Thumbnail → 🎬 PRODUÇÃO
☑ Thumbnail + ☑ Roteiro → 🎬 PRODUÇÃO
☑ Thumbnail + ☑ Roteiro + ☑ Edição → ✅ FINALIZADO
☑ Todas → 🚀 POSTADO
```

#### 4. Filtrar e Organizar
```
Use os filtros para ver:
- Vídeos por canal específico
- Vídeos em determinado estágio
```

### Conversor SRT

#### Converter Texto
```
📝 SRT → Cole seu texto
1. Ajuste palavras por legenda (padrão: 10)
2. Ajuste duração (padrão: 3 segundos)
3. Clique em "Converter para SRT"
4. Baixe o arquivo .srt
```

### Backup dos Dados

#### Via Console do Navegador
```javascript
// Abra o Console (F12) e execute:
exportData()
```

Isso baixará um arquivo JSON com todos os seus canais e vídeos.

## 📱 Recursos Mobile

- Interface 100% responsiva
- Touch-friendly (botões e áreas grandes)
- Design otimizado para telas pequenas
- Funciona offline
- Sem necessidade de conexão com internet

## 🎨 Funcionalidades Visuais

- **Tema Dark:** Design moderno e confortável para os olhos
- **Badges Coloridos:** Identificação visual clara dos estágios
- **Barra de Progresso:** Acompanhamento visual do andamento
- **Preview de Thumbnails:** Visualize suas thumbs antes de salvar
- **Animações Suaves:** Interface fluida e responsiva

## 🔒 Privacidade e Segurança

- ✅ 100% offline após carregar
- ✅ Dados salvos apenas no seu dispositivo
- ✅ Nenhuma conexão externa
- ✅ Nenhum tracking ou analytics
- ✅ Código fonte aberto e auditável

## 🛠️ Tecnologias

- HTML5
- CSS3 (Grid, Flexbox, Animations)
- JavaScript Vanilla (ES6+)
- LocalStorage API
- FileReader API

## 📊 Estrutura de Dados

### Canal
```json
{
  "id": "timestamp",
  "name": "Nome do Canal",
  "description": "Descrição",
  "createdAt": "ISO date"
}
```

### Vídeo
```json
{
  "id": "timestamp",
  "channelId": "id-do-canal",
  "title": "Título do Vídeo",
  "description": "Descrição",
  "thumbText": "Texto da Thumb",
  "thumbImage": "base64-image-data",
  "script": "Roteiro completo",
  "checklist": {
    "thumb": true,
    "script": true,
    "edit": false,
    "upload": false
  },
  "stage": "producao",
  "createdAt": "ISO date"
}
```

## 🆘 Solução de Problemas

### Dados não estão salvando
- Verifique se o navegador permite LocalStorage
- Não use modo anônimo/privado

### Thumbnail não aparece
- Verifique o tamanho da imagem (recomendado < 5MB)
- Use formatos comuns: JPG, PNG, WebP

### SRT não baixa
- Verifique permissões de download do navegador
- Tente outro navegador

## 🔄 Atualizações Futuras Possíveis

- [ ] Sincronização entre dispositivos
- [ ] Estatísticas e gráficos
- [ ] Templates de descrição e títulos
- [ ] Integração com APIs do YouTube
- [ ] Sistema de tags
- [ ] Calendário de publicações
- [ ] Modo claro/escuro
- [ ] Notificações de lembretes

## 📄 Licença

Livre para uso pessoal e comercial.

## 👨‍💻 Suporte

Para dúvidas ou sugestões, abra uma issue no repositório.

---

**Desenvolvido para criadores de conteúdo que precisam de controle total sobre sua produção! 🚀**
