/* Extraído de portfolio.html para funcionar com o CSP (script-src 'self').
   Não voltar a colocar este código dentro do HTML. */

document.addEventListener('DOMContentLoaded', () => {
            const track = document.getElementById('portfolio-carousel');
            if(track) {
                const items = Array.from(track.children);
                items.forEach(item => {
                    track.appendChild(item.cloneNode(true));
                });
            }
        });
