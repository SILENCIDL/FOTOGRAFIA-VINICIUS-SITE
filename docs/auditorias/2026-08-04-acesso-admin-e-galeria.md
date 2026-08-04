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

## O que continua em aberto

- **2FA não existe.** A coluna `totpSecret` está no schema e nenhuma linha de
  código a usa. Hoje o admin é só e-mail + senha.
- **Sem `middleware.ts`.** A proteção funciona porque cada rota se protege.
  Funciona hoje; falha no dia em que alguém criar uma rota e esquecer. Um
  middleware casando `/admin/*` e `/api/admin/*` seria rede de segurança.
- **Nada disso está publicado.** Falta decidir onde hospedar e qual Postgres
  usar — ver [`../plano-execucao.md`](../plano-execucao.md).
