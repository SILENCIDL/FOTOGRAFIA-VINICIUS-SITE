/* Extraído de casamento-patricia-e-marcos.html para funcionar com o CSP (script-src 'self').
   Não voltar a colocar este código dentro do HTML. */

document.addEventListener('DOMContentLoaded', () => {
            const basePath = "../assets/img-web/portfolio/casamentos/Patricia & Marcos/";
            const folderData = [
                { title: "O Ensaio (Pre Wedding)", path: "Pre Wedding/", count: 40 },
                { title: "O Grande Dia (Cerimônia)", path: "Cerimonia/", count: 120 }
            ];
            
            const container = document.getElementById('dynamic-wedding-gallery');
            
            folderData.forEach(folder => {
                const section = document.createElement('div');
                section.className = 'mb-24 md:mb-32';
                
                const header = document.createElement('div');
                header.className = 'flex items-center gap-4 mb-12';
                header.innerHTML = `
                    <div class="h-px flex-grow" style="background:rgba(240,237,230,0.08);"></div>
                    <h2 class="font-serif text-2xl md:text-3xl tracking-tighter px-4 text-center text-[#f0ede6]">${folder.title}</h2>
                    <div class="h-px flex-grow" style="background:rgba(240,237,230,0.08);"></div>
                `;
                section.appendChild(header);
                
                const grid = document.createElement('div');
                grid.className = 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 md:gap-6 space-y-4 md:space-y-6';
                section.appendChild(grid);
                container.appendChild(section);
                
                if(window.gallery && gallery.loadFromFolder) {
                    gallery.loadFromFolder(grid, basePath, folder.path, 1, folder.count);
                }
            });
        });
