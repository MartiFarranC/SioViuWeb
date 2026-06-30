# Context complet del projecte Sió Viu — per traspassar a Claude Code

## Resum del projecte
Pàgina web estàtica (HTML/CSS/JS pur, sense framework) per a **Sió Viu**, associació de defensa ambiental territorial de Tarroja de Segarra, la Prenyanosa i pobles veïns (Lleida), que lluiten contra la construcció de dues macroplantes industrials de biogàs prop dels seus pobles.

El disseny prové d'un **Canva exportat a PDF** (2 pàgines, la pàgina 2 és la versió definitiva amb comentaris d'edició com "FER UN APARTAT DE DADES" que calia implementar correctament, no copiar literalment).

## Ubicació del projecte
- Carpeta local de l'usuari: **Escriptori/SioViu**
- Treballat en l'entorn Claude com a `/home/claude/SioViu/` i lliurat com a ZIP

## Estructura de fitxers
```
SioViu/
├── index.html
├── css/style.css
├── js/main.js
├── images/
│   ├── logo-sioviu.png       (extret del PDF, fons transparent, verd/blau)
│   ├── hero-bg.jpg           (foto camp de blat, fons del hero)
│   ├── hero-title.png        (no s'usa actualment — es va passar a text natiu HTML)
│   ├── territori.jpg         (foto poble Tarroja de Segarra)
│   ├── manifest.jpg          (imatge "MANIFEST" amb siluetes d'animals, blau)
│   ├── planta-biogas.jpg     (recreació IA de la planta industrial)
│   ├── mapa-zona.jpg         (captura estàtica Google Earth del PDF — ja NO s'usa al HTML, substituïda per mapa Leaflet interactiu, però el fitxer es conserva)
│   ├── noticia-segre.png
│   └── noticia-ara.png
├── .vscode/
│   ├── settings.json   (Live Server port 5500, format on save)
│   └── extensions.json (recomana Live Server, Prettier, etc.)
└── README.md            (instruccions d'ús, publicació a Netlify, llista de links pendents)
```

Totes les imatges es van **extreure directament del PDF original** amb `pdfimages` i `pdftoppm` (no són stock genèric), per mantenir fidelitat exacta amb el Canva.

## Stack tècnic
- HTML5 semàntic pur
- CSS3 amb variables (`:root`), Grid/Flexbox, mobile-first responsive amb breakpoints a 900px / 768px / 480px
- JS vanilla (sense frameworks): burger menu mòbil, IntersectionObserver per marcar el link de nav actiu segons secció visible, i càrrega dinàmica de **Leaflet.js** (via CDN unpkg) per al mapa interactiu
- Sense build tools, sense npm — funciona obrint directament amb Live Server

## Paleta de colors (variables CSS)
```css
--blau:       #2D3FE0;   /* blau principal, fons de moltes seccions */
--blau-fosc:  #001f6b;
--groc:       #FFD200;   /* accents, botons destacats */
--verd-logo:  #7FFF00;   /* verd llima del logo, link actiu al nav */
--vermell:    #CC0000;   /* dades destacades, alertes */
```

## Estructura de seccions de la pàgina (ordre final)
1. **Nav** sticky — logo + descripció associació + links (Qui Som, Projecte, Premsa, Accions, Ajuda'ns)
2. **Hero** — foto camp de blat + text gegant "ATUREM MACROPLANTES DE BIOGÀS" + franja blava amb subtítol
3. **Qui Som** — 2 columnes (El Territori + La Plataforma), cadascuna amb text i imatge
4. **El Projecte** (fons blau) — text explicatiu + **imatge de la planta i mapa interactiu Leaflet costat a costat** + links "Vols saber-ne més" / "Consulta el mapa"
5. **Per Què En Hi Oposem?** — bloc de dades (350 adherits, 120 socis, 8 pobles, 25.000€) + llista de 4 raons (Cuidem la salut / Preservem qualitat de vida / Protegim la terra / Defensem el territori)
6. **Implica't** (fons blau) — 4 cards **blanques** amb icones SVG/símbols blaus (Fes-te soci, Caixa resistència+Bizum, Suma comerç, Instagram) + frase destacada en majúscules
7. **Notícies i Accions** — 2 columnes: notícies estil premsa (logo SEGRE, tag, títol, autor+data) i accions estil fitxa de calendari (mes + dia gran)
8. **Footer** — logo + dades associació + bloc "Contacte:" amb icones (@ email, 📍 ubicació) + barra inferior amb avís legal

## Funcionalitat del mapa (Leaflet)
- Substitueix la imatge estàtica de Google Earth del Canva
- Carregat dinàmicament via JS (CDN, sense API key necessària — OpenStreetMap tiles)
- **Marcador principal: Tarroja de Segarra** (coordenades `41.7303, 1.2744`) amb icona 📍 blava, popup obert per defecte
- Marcador secundari: La Prenyanosa (`41.7108, 1.2891`), punt groc
- Important: l'usuari va corregir que el marcador principal havia de ser **Tarroja de Segarra**, no les ubicacions de les plantes (que eren coordenades inventades/aproximades i es van eliminar)
- `scrollWheelZoom` desactivat fins que l'usuari fa clic (evita capturar el scroll de la pàgina)

## Historial de canvis fets (cronològic)
1. Primera versió genèrica (abans de veure el PDF amb detall) — descartada
2. Usuari va demanar fidelitat exacta al Canva → es van rasteritzar les 2 pàgines del PDF a alta resolució i es van extreure totes les imatges natives amb `pdfimages`
3. Reconstrucció HTML inline amb imatges en base64 (versió de prova ràpida)
4. Usuari va demanar estructura de projecte per VS Code → es va crear l'arbre de carpetes amb fitxers separats (html/css/js/images) + `.vscode/` + README
5. Usuari va preguntar si hi havia secció de mapa al Canva → es va confirmar que sí (imatge estàtica Google Earth amb creu vermella) i es va implementar com a **mapa interactiu Leaflet** en comptes d'imatge estàtica
6. Usuari va corregir: el marcador havia de ser Tarroja de Segarra, no les plantes inventades → corregit
7. **Revisió final comparant Canva vs HTML actual**, es van detectar 6 discrepàncies i es van corregir totes:
   - Cards d'Implica't (havien de ser fons blanc, no blau transparent)
   - Notícies (calien estil premsa real: logo font, tag, autor+data)
   - Accions (calia estil fitxa de calendari, no quadrat pla)
   - Eliminar el text de comentari editorial "FER UN APARTAT DE DADES" que estava al Canva com a nota, no com a contingut real
   - Footer (calia bloc "Contacte:" amb icones @ i 📍, no text pla)
   - Mapa mogut de secció separada cap a dins de "El Projecte", al costat de la imatge de la planta

## Estat actual: TOT IMPLEMENTAT segons l'última revisió de l'usuari

## Pendents / TODO (marcats al README, dades placeholder que calen substituir)
- Link real botó "Associar-te"
- Link real botó "Adherir-te" (manifest)
- Link real Instagram (`@sioviu`)
- Número de Bizum real (actualment `6XX 123 456`)
- Confirmar email definitiu: el PDF té dues versions diferents (`info@sioviu.cat` a la pàgina 1, `info@sioviu.com` a la pàgina 2) — actualment s'usa `.com` seguint la versió 2 (definitiva), cal confirmar amb el client
- Logo i fotos podrien necessitar versions en més alta resolució si es coneixen els originals (ara provenen de la compressió del PDF)
- Tots els `href="#"` són placeholders pendents d'enllaçar a formularis/pàgines reals

## Com continuar a Claude Code
1. Descomprimir el ZIP dins `~/Desktop/SioViu` (o la ubicació equivalent)
2. Obrir la carpeta com a workspace
3. El fitxer font de veritat per a disseny és el PDF original del Canva (`Sió_Viu__Web.pdf`, 2 pàgines, pàgina 2 = definitiva) — si cal tornar a comparar disseny, recomano rasteritzar-lo amb `pdftoppm -jpeg -r 200` i revisar per seccions, ja que les imatges renderitzades són massa altes per veure-les senceres
4. Imatges natives del PDF ja extretes i guardades a `images/` — no cal tornar-les a extreure
5. Per publicar: Netlify Drop (arrossegar carpeta) o GitHub Pages, instruccions ja al README.md del projecte
