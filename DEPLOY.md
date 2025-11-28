# 🚀 Como Hospedar no GitHub Pages

Guia passo a passo para publicar seu Dark Channel Manager online gratuitamente!

## 📋 Passo a Passo

### 1️⃣ Acessar o Repositório no GitHub

1. Abra seu navegador
2. Acesse: `https://github.com/aiaipedrox/roteirista`

### 2️⃣ Criar a Branch Main (Primeira vez)

**Opção A: Via Interface Web (Mais fácil)**

1. No seu repositório, clique em **"Branch: claude/..."** (no topo esquerdo)
2. Digite `main` na caixa de busca
3. Clique em **"Create branch: main from claude/..."**

**Opção B: Via Terminal Local**

```bash
# Clonar o repositório (se ainda não tiver)
git clone https://github.com/aiaipedrox/roteirista.git
cd roteirista

# Criar e enviar branch main
git checkout -b main
git push origin main
```

### 3️⃣ Ativar o GitHub Pages

1. No repositório, clique em **"Settings"** (⚙️ Configurações)
2. No menu lateral esquerdo, clique em **"Pages"**
3. Em **"Source"** (Fonte), selecione:
   - **Branch:** `main`
   - **Folder:** `/ (root)`
4. Clique em **"Save"** (Salvar)

### 4️⃣ Aguardar Deploy

- O GitHub levará 1-3 minutos para fazer o deploy
- Você verá uma mensagem: **"Your site is ready to be published at..."**
- Após alguns minutos, a mensagem mudará para: **"Your site is live at..."**

### 5️⃣ Acessar Seu Site

Seu site estará disponível em:
```
https://aiaipedrox.github.io/roteirista/
```

## 🎯 Opção Alternativa: Usar a Branch Atual

Se você não quiser criar a branch main, pode usar a branch atual:

1. Vá em **Settings → Pages**
2. Em **"Source"**, selecione:
   - **Branch:** `claude/dark-channel-manager-app-01353rhtENXSDstmgJdreTQx`
   - **Folder:** `/ (root)`
3. Clique em **"Save"**

**Porém, recomendo usar a branch `main` para facilitar atualizações futuras!**

## 🔄 Atualizações Futuras

Sempre que fizer alterações e quiser atualizar o site:

```bash
# Na branch main
git add .
git commit -m "Descrição das alterações"
git push origin main
```

O GitHub Pages atualizará automaticamente em 1-3 minutos!

## ✅ Checklist de Verificação

- [ ] Repositório existe no GitHub
- [ ] Branch `main` criada
- [ ] GitHub Pages ativado nas configurações
- [ ] Aguardou 1-3 minutos para deploy
- [ ] Site acessível em `https://aiaipedrox.github.io/roteirista/`

## 📱 Adicionar ao Celular como App

Depois que o site estiver no ar:

### iPhone (Safari)
1. Acesse o site
2. Toque no botão **Compartilhar** (quadrado com seta)
3. Role para baixo e toque em **"Adicionar à Tela de Início"**
4. Digite um nome (ex: "Canal Manager")
5. Toque em **"Adicionar"**

### Android (Chrome)
1. Acesse o site
2. Toque no menu **⋮** (três pontos)
3. Toque em **"Adicionar à tela inicial"**
4. Digite um nome (ex: "Canal Manager")
5. Toque em **"Adicionar"**

Agora você terá um ícone na tela do celular e o app funcionará como nativo! 📱

## 🆘 Problemas Comuns

### "404 - Page Not Found"
- **Solução:** Aguarde 3-5 minutos após ativar o GitHub Pages

### "Site não atualiza após push"
- **Solução 1:** Aguarde alguns minutos
- **Solução 2:** Force refresh no navegador (Ctrl+Shift+R ou Cmd+Shift+R)
- **Solução 3:** Limpe o cache do navegador

### "Cannot access Settings"
- **Solução:** Você precisa ser o dono do repositório ou ter permissões de admin

## 🌟 Domínio Personalizado (Opcional)

Se você quiser usar seu próprio domínio (ex: `meucanal.com`):

1. Compre um domínio (Namecheap, Google Domains, etc.)
2. Nas configurações do domínio, adicione um CNAME apontando para:
   ```
   aiaipedrox.github.io
   ```
3. No GitHub Pages, em **"Custom domain"**, digite seu domínio
4. Marque **"Enforce HTTPS"**

## 📊 Ver Estatísticas de Acesso (Opcional)

Para ver quantas pessoas acessam seu site, você pode adicionar:

### Google Analytics (Grátis)
1. Crie uma conta em: analytics.google.com
2. Obtenha seu código de rastreamento
3. Adicione no `index.html` antes de `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=SEU-ID-AQUI"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'SEU-ID-AQUI');
</script>
```

## 🎉 Pronto!

Seu Dark Channel Manager está agora acessível de qualquer lugar do mundo!

Compartilhe o link com sua equipe ou acesse do seu celular a qualquer momento! 📱💻

---

**Link do seu site:** `https://aiaipedrox.github.io/roteirista/`

**Dúvidas?** Consulte a [documentação oficial do GitHub Pages](https://docs.github.com/pages)
