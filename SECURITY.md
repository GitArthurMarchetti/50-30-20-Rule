# Guia de Segurança - Gold Rule

Este documento descreve as medidas de segurança implementadas no projeto e como mantê-las atualizadas.

## 🔒 Medidas de Segurança Implementadas

### 1. Autenticação e Autorização

#### JWT (JSON Web Tokens)
- ✅ Tokens assinados com algoritmo HS256
- ✅ Tokens armazenados em cookies HttpOnly (não acessíveis via JavaScript)
- ✅ Cookies com flag `Secure` em produção
- ✅ Cookies com `SameSite=Lax` para proteção CSRF
- ✅ Expiração de tokens configurável (padrão: 2 horas)

#### Middleware de Autenticação
- ✅ Verificação de token em todas as rotas protegidas
- ✅ Redirecionamento automático para login quando não autenticado
- ✅ Proteção de rotas de API com retorno 401

### 2. Proteção CSRF (Cross-Site Request Forgery)

- ✅ Implementação do padrão Double Submit Cookie
- ✅ Token CSRF gerado por sessão
- ✅ Validação obrigatória em métodos POST, PUT, PATCH, DELETE
- ✅ Endpoint `/api/csrf-token` para obter token no frontend
- ✅ Comparação constante de tempo para prevenir timing attacks

**Como usar no frontend:**
```typescript
// Obter token CSRF
const response = await fetch('/api/csrf-token');
const { csrfToken } = await response.json();

// Incluir em requisições
fetch('/api/transactions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify(data),
});
```

### 3. Rate Limiting

- ✅ Rate limiting por IP para login (5 tentativas / 15 minutos)
- ✅ Rate limiting por email para login (3 tentativas / 15 minutos)
- ✅ Rate limiting por IP para registro (3 tentativas / 15 minutos)
- ✅ Limpeza automática de entradas expiradas
- ✅ Implementação em memória (considerar Redis para produção)

**Configuração:**
- Login: 5 tentativas por 15 minutos por IP
- Login por email: 3 tentativas por 15 minutos
- Registro: 3 tentativas por 15 minutos por IP

### 4. Validação de Entrada

- ✅ Validação de formato de email
- ✅ Validação de força de senha
- ✅ Sanitização de strings para prevenir XSS
- ✅ Validação de tipos de transação
- ✅ Validação de valores numéricos (amount)
- ✅ Validação de datas
- ✅ Limites de tamanho para todos os campos
- ✅ Validação de Content-Type nas requisições

**Sanitização XSS:**
- Remoção de tags HTML (`<`, `>`)
- Remoção de protocolos JavaScript (`javascript:`)
- Remoção de event handlers (`onclick=`, `onerror=`, etc.)
- Escape de caracteres especiais

### 5. Security Headers HTTP

Configurados no `next.config.ts`:
- ✅ `Strict-Transport-Security` (HSTS)
- ✅ `X-Frame-Options: SAMEORIGIN`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-XSS-Protection: 1; mode=block`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Content-Security-Policy` (CSP)
- ✅ `Permissions-Policy`

### 6. CORS (Cross-Origin Resource Sharing)

- ✅ Configuração explícita de origens permitidas
- ✅ Suporte a preflight requests (OPTIONS)
- ✅ Headers de credenciais configurados
- ✅ Validação de origem antes de permitir requisições

**Configuração:**
Defina `ALLOWED_ORIGINS` no `.env`:
```env
ALLOWED_ORIGINS=https://seusite.com,https://www.seusite.com
```

### 7. Proteção de Senhas

- ✅ Hash com bcrypt (10 rounds)
- ✅ Validação de força de senha
- ✅ Mínimo de 6 caracteres
- ✅ Máximo de 128 caracteres
- ✅ Verificação de padrões comuns de senha

### 8. Proteção contra Timing Attacks

- ✅ Comparação constante de tempo para CSRF tokens
- ✅ Comparação de hash de senha com tempo constante
- ✅ Dummy hash comparison em login para prevenir user enumeration

### 9. Logging Seguro

- ✅ Sanitização automática de dados sensíveis nos logs
- ✅ Remoção de senhas, tokens e secrets dos logs
- ✅ Stack traces apenas em desenvolvimento
- ✅ Contexto sanitizado antes de logar

### 10. Autorização de Recursos

- ✅ Verificação de propriedade de recursos (transações, categorias)
- ✅ Uso de composite keys no Prisma (`id_userId`)
- ✅ Validação de categoria pertence ao usuário antes de usar

## 🛡️ Práticas Recomendadas

### Variáveis de Ambiente

**Nunca commite:**
- `.env`
- `.env.local`
- Arquivos com secrets

**Variáveis obrigatórias:**
- `DATABASE_URL` - String de conexão PostgreSQL
- `DIRECT_URL` - String de conexão direta PostgreSQL
- `JWT_SECRET` - Secret para assinatura de JWT (mínimo 32 caracteres)

**Variáveis opcionais:**
- `NODE_ENV` - Ambiente (development/production)
- `ALLOWED_ORIGINS` - Origens permitidas para CORS (separadas por vírgula)

### Geração de JWT_SECRET

```bash
# Usando OpenSSL
openssl rand -base64 32

# Ou usando o script do projeto
npm run generate:jwt-secret
```

### Atualização de Dependências

Execute regularmente:
```bash
npm audit
npm audit fix
```

### Verificação de Segurança

```bash
# Verificar variáveis de ambiente
npm run check:env

# Verificar saúde do sistema
npm run check:health
```

## 🚨 Checklist de Segurança para Deploy

- [ ] `JWT_SECRET` configurado e seguro (mínimo 32 caracteres)
- [ ] `NODE_ENV=production` em produção
- [ ] `ALLOWED_ORIGINS` configurado corretamente
- [ ] Cookies `Secure` habilitados (automático em produção)
- [ ] HTTPS habilitado
- [ ] Rate limiting configurado adequadamente
- [ ] Logs não expõem informações sensíveis
- [ ] Dependências atualizadas (`npm audit`)
- [ ] Banco de dados com backups regulares
- [ ] Firewall configurado
- [ ] Monitoramento de segurança ativo

## 🔄 Melhorias Futuras Recomendadas

### Curto Prazo
1. **Refresh Tokens**: Implementar refresh tokens para melhorar gestão de sessão
2. **2FA (Two-Factor Authentication)**: Adicionar autenticação de dois fatores
3. **Audit Logging**: Log de todas as ações críticas do usuário

### Médio Prazo
1. **Redis para Rate Limiting**: Migrar rate limiting para Redis para suportar múltiplas instâncias
2. **WAF (Web Application Firewall)**: Implementar WAF para proteção adicional
3. **IP Whitelisting**: Permitir whitelist de IPs para admin

### Longo Prazo
1. **Penetration Testing**: Testes de penetração regulares
2. **Security Monitoring**: Sistema de monitoramento de segurança
3. **Compliance**: Verificar conformidade com LGPD/GDPR

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

## 🐛 Reportar Vulnerabilidades

Se você encontrar uma vulnerabilidade de segurança, por favor:
1. **NÃO** abra uma issue pública
2. Entre em contato diretamente com a equipe de desenvolvimento
3. Forneça detalhes suficientes para reproduzir o problema
4. Aguarde confirmação antes de divulgar publicamente

---

**Última atualização:** Dezembro 2024
