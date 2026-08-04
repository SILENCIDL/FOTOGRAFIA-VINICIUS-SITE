/**
 * Verificação do token de acesso à galeria do cliente.
 *
 * Roda sem banco e sem servidor: exercita lib/galleryAuth.ts direto. Existe
 * porque essa é a peça que separa "galeria privada" de "qualquer um com o
 * link entra", e regressão aqui é silenciosa — nada quebra na tela, só o
 * cofre abre.
 *
 *   npm run test:galeria
 */
import {
  grantGalleryAccess,
  hasGalleryAccess,
  galleryCookieName,
} from '../src/lib/galleryAuth';

process.env.JWT_SECRET = 'x'.repeat(48);

/** dublê mínimo do AstroCookies — só o que galleryAuth usa */
function fakeCookies() {
  const store = new Map<string, string>();
  return {
    set(name: string, value: string) {
      store.set(name, value);
    },
    get(name: string) {
      const v = store.get(name);
      return v === undefined ? undefined : { value: v };
    },
    delete(name: string) {
      store.delete(name);
    },
  } as any;
}

const GAL_A = '11111111-1111-4111-8111-111111111111';
const GAL_B = '22222222-2222-4222-8222-222222222222';

let falhas = 0;
function checa(nome: string, real: boolean, esperado: boolean) {
  const ok = real === esperado;
  if (!ok) falhas++;
  console.log(`${ok ? '  ok  ' : ' FALHA'}  ${nome}`);
}

async function main() {
  const c = fakeCookies();
  await grantGalleryAccess(c, GAL_A, null);
  checa('cliente que acertou a senha entra na própria galeria',
    await hasGalleryAccess(c, GAL_A), true);

  // este é o furo que existia: o cookie guardava o texto "1"
  const forjado = fakeCookies();
  forjado.set(galleryCookieName(GAL_A), '1');
  checa('cookie forjado na mão ("1") não entra',
    await hasGalleryAccess(forjado, GAL_A), false);

  checa('token da galeria A não abre a galeria B',
    await hasGalleryAccess(c, GAL_B), false);

  const outro = fakeCookies();
  process.env.JWT_SECRET = 'y'.repeat(48);
  await grantGalleryAccess(outro, GAL_A, null);
  process.env.JWT_SECRET = 'x'.repeat(48);
  checa('token assinado com outro segredo não entra',
    await hasGalleryAccess(outro, GAL_A), false);

  // adultera o payload para apontar a outra galeria: a assinatura quebra
  const adult = fakeCookies();
  await grantGalleryAccess(adult, GAL_A, null);
  const partes = (adult.get(galleryCookieName(GAL_A))!.value as string).split('.');
  const payload = JSON.parse(Buffer.from(partes[1], 'base64url').toString());
  payload.sub = GAL_B;
  partes[1] = Buffer.from(JSON.stringify(payload)).toString('base64url');
  adult.set(galleryCookieName(GAL_B), partes.join('.'));
  checa('token adulterado para outra galeria não entra',
    await hasGalleryAccess(adult, GAL_B), false);

  const venc = fakeCookies();
  await grantGalleryAccess(venc, GAL_A, new Date(Date.now() - 60_000));
  checa('galeria já expirada não entra',
    await hasGalleryAccess(venc, GAL_A), false);

  checa('sem cookie não entra',
    await hasGalleryAccess(fakeCookies(), GAL_A), false);

  console.log(falhas === 0 ? '\ntodos passaram' : `\n${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
}

main();
