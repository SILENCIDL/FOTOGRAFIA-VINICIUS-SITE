# Auditoria de acesso — admin e galeria do cliente

Data: 04/08/2026 · Escopo: `site-astro/` (protótipo, ainda não publicado)

Pergunta que motivou: dar acesso livre ao cliente sem vazar dado de admin.

O resumo em uma frase: **o lado do admin está bem construído; o cofre do
cliente estava aberto.**

---

## O que estava certo

Não foi achado nada a corrigir aqui:

- Senha com bcrypt, custo 12.
- Sessão em JWT HS256 com emissor, público e expiração de 24h; cookie
  `httpOnly` + `secure` + `SameSite=strict`.
- **Todas** as 6 páginas de `/admin` e as 4 rotas de `/api/admin` chamam
  `requireAuth` com papel exigido. Nenhuma passou batida.
- Notas de cliente criptografadas com AES-256-GCM.
- Log de auditoria nas ações sensíveis.
- Rate limit no login (5 tentativas / 5 min).

Ou seja: **não havia caminho de cliente para dado de admin.** A preocupação
que originou esta auditoria não se confirmou — o vazamento era outro, e em
sentido contrário: as fotos dos clientes é que estavam expostas.

## O que estava errado

### 1. A senha da galeria não protegia nada — crítico

Acertar a senha gravava o cookie `gallery_<id>` com o texto `1`. Esse cookie
era a única prova exigida depois. Como qualquer pessoa pode escrever os
próprios cookies (um `curl -H 'Cookie: gallery_<id>=1'` basta), bastava
conhecer o endereço da galeria para entrar sem senha.

`httpOnly` não cobria isso: ele impede o JavaScript de outro site de **ler** o
cookie, não impede o visitante de **forjar** um.

O que segurava a porta era só o UUID da galeria ser difícil de adivinhar — e
UUID vaza fácil: vai no link mandado por WhatsApp, fica no histórico do
navegador, aparece em `Referer`.

**Corrigido** em `src/lib/galleryAuth.ts`: o cookie agora carrega um token
assinado pelo servidor, com validade e amarrado à galeria que nomeia. Sem a
`JWT_SECRET` não dá para fabricar um.

### 2. As fotos não chegavam ao cliente — ou chegavam a todo mundo

`/api/uploads/<id>` autorizava por "é público **ou** é admin". O cookie da
galeria tinha `path=/galeria/<id>` e por isso **nunca era enviado** para
`/api/uploads`. Resultado, sem saída boa:

| Foto marcada como | O que acontecia |
|---|---|
| privada | cliente acertava a senha e via **imagem quebrada** (401) |
| pública | **qualquer um** com o UUID do arquivo baixava, sem senha |

Na prática a galeria privada não funcionava, e a solução natural do fotógrafo
(marcar como pública) abria o acervo.

**Corrigido**: o endpoint passou a aceitar um terceiro caso — portador de
token válido **da galeria à qual aquele arquivo pertence**. Token de outra
galeria não serve. O cookie passou a `path=/` para chegar lá.

### 3. Rate limit da galeria era contornável

`getClientIp` lia `x-forwarded-for` sem condição. Esse header é texto que o
próprio cliente escreve: trocando o valor a cada tentativa, o limite de 10
senhas por 15 minutos virava ilimitado, e senha fraca de galeria cairia por
força bruta.

**Corrigido**: o header só é lido quando `TRUST_PROXY=true` declara que há um
proxy na frente reescrevendo o valor.

### 4. O log de auditoria não servia para auditar

`hashIp` usava bcrypt, que sorteia salt novo a cada chamada — o mesmo IP saía
com hash diferente toda vez. O log não respondia justamente a pergunta que
existe para responder: *foram 300 tentativas da mesma origem, ou de 300
origens?*

**Corrigido**: HMAC-SHA256 com chave do servidor. Mesmo IP, mesmo valor; sem a
chave, ninguém reverte.

## Verificação

`site-astro/scripts/verificar-acesso-galeria.ts` (`npm run test:galeria`) roda
sem banco e cobre os sete casos, incluindo o furo antigo:

```
ok  cliente que acertou a senha entra na própria galeria
ok  cookie forjado na mão ("1") não entra
ok  token da galeria A não abre a galeria B
ok  token assinado com outro segredo não entra
ok  token adulterado para outra galeria não entra
ok  galeria já expirada não entra
ok  sem cookie não entra
```

**Limite desta verificação:** ela exercita a lógica do token isolada. O fluxo
completo — senha → cookie → foto servida — não foi executado, porque exige um
Postgres que ainda não existe em lugar nenhum. `npm run build` passa.

## Segunda rodada — mesmo dia

Os itens que ficaram em aberto acima foram fechados, e a varredura das peças
que ainda não tinham sido lidas (upload, storage, layout) achou mais quatro.

### 5. O Astro embutia os scripts no HTML — e a CSP os bloqueava

`admin/login`, `galeria/[id]`, `admin/clients`, `admin/sessions` e
`admin/sessions/[id]` tinham `<script>` dentro do `.astro`. O Astro **embute**
script pequeno direto no HTML (`"type":"inline"` no manifest), e a CSP do
`BaseLayout` traz `script-src 'self'`, sem `'unsafe-inline'`.

Ou seja: com a política valendo, **o botão de login do admin e o de senha da
galeria não fariam nada**. A proteção e a funcionalidade se anulavam — mesma
armadilha que o `corrigir-2-csp.py` já tinha desarmado no site estático.

**Corrigido**: os cinco scripts saíram para `public/assets/js/` e são
carregados com `is:inline src`. O manifest agora tem zero script embutido.

### 6. O upload confiava no rótulo, não no arquivo

`isAllowedMimeType(file.type)` — e `file.type` é texto que o remetente
escreve. Bastava rotular qualquer coisa como `image/jpeg`. Pior: a extensão
gravada no disco vinha de `extname(file.name)`, também escolhida por quem
envia.

**Corrigido**: o tipo agora sai da **assinatura de bytes** do próprio arquivo;
o nome e a extensão são gerados por nós a partir do tipo detectado. Executável,
HTML e SVG disfarçados de imagem são recusados.

### 7. `storageKey` virava caminho no disco sem conferência

Hoje ela é sempre gerada por nós, então não havia exploração real — mas
qualquer mudança futura que aceitasse a chave de outra origem viraria leitura
de arquivo arbitrário, e nada no código avisaria.

**Corrigido**: formato conferido (`32 hex + extensão conhecida`) antes de
qualquer `join` de caminho.

### 8. O erro do upload voltava cru para o cliente

`errorResponse(err.message, 500)` devolvia caminho de disco e mensagem do
Postgres. **Corrigido**: recusa por tipo/tamanho continua explicada; o resto
vira "Erro interno." e fica no log.

### E os dois que estavam em aberto

- **2FA implementado** (`src/lib/totp.ts`), sem dependência nova, conferido
  contra os vetores oficiais da RFC 6238 — o que garante que funciona com
  Google Authenticator, Authy e 1Password sem precisar testar num celular.
  Cadastro em `/admin/seguranca`, com 8 códigos de recuperação de uso único.
- **`src/middleware.ts` criado**: `/admin/*` e `/api/admin/*` exigem sessão
  antes de a rota rodar, e toda resposta recebe os headers de segurança que a
  `<meta>` não consegue dar.

### Verificação desta rodada

`npm test` — 43 checagens, todas passando, sem precisar de banco.

E o middleware foi testado no servidor de verdade (build + `node
dist/server/entry.mjs`):

| Requisição | Resultado |
|---|---|
| `GET /admin` sem sessão | 302 → `/admin/login` |
| `GET /admin/seguranca` sem sessão | 302 → `/admin/login` |
| `POST /api/admin/sessions` sem sessão | 401 JSON |
| `POST /api/admin/2fa` sem sessão | 401 JSON |
| `GET /api/admin/rota-que-nao-existe` | **401**, não 404 |
| `GET /admin/login` | 200 |

A penúltima linha é a que importa: rota que **não existe** já responde 401.
Isso prova que a barreira está antes do roteamento — uma rota nova criada sem
`requireAuth` nasce fechada.

## O que continua em aberto

- **Nada disso está publicado, nem foi rodado contra um banco.** O fluxo
  completo — login com 2FA, senha de galeria, foto entregue — nunca foi
  percorrido ponta a ponta, porque não existe Postgres em lugar nenhum ainda
  (e não há Docker nesta máquina para subir um).
- Falta decidir onde hospedar e qual Postgres usar — ver
  [`../plano-execucao.md`](../plano-execucao.md).
- `cdn.tailwindcss.com` no site estático continua sendo um compilador rodando
  no navegador do visitante, em produção.
