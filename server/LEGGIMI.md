# Catalogo comune

Il server del catalogo: esercizi pubblicati dagli insegnanti, controlli, stelle, segnalazioni e moderazione.
Gira su Cloudflare Workers con un database D1, nel piano gratuito.

## Regole

- Per giocare non serve un account. Degli alunni non si salva nulla.
- Gli insegnanti accedono con Google. Si salvano la loro email (mai mostrata) e il nome che scelgono di mostrare.
- Un esercizio nuovo si gioca subito con il suo link. Entra nel catalogo quando **due** altri insegnanti dicono che va bene.
- Chi modifica un esercizio lo rimanda al controllo.
- Stelle da 1 a 5: solo insegnanti, una per insegnante, mai sui propri esercizi.
- Segnalazioni, aperte a tutti, solo con il menu e senza testo libero:
  - «Contiene nomi o foto di alunni» nasconde subito;
  - «Non adatto» e «Materiale protetto» nascondono dopo 1 segnalazione di un insegnante o 3 anonime;
  - «Risposta sbagliata» e «Non funziona» arrivano solo all'autore.
- Gli esercizi nascosti aspettano chi modera: li rimette o li rimuove, e può bloccare un autore.
- Chi modera si sceglie con il segreto `ADMIN_EMAIL`: una o più email separate da virgola. Per aggiungere qualcuno basta cambiare il segreto.

## Messa in linea

```bash
npm install
npx wrangler login
npx wrangler d1 create lavagnaamica
```

1. Copia il `database_id` in `wrangler.toml`.
2. Scrivi in `GOOGLE_CLIENT_ID` il client OAuth (tipo «Applicazione web», con l'indirizzo del sito tra le origini JavaScript).
3. Esegui:

```bash
npm run db-online
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put SALE
npm run pubblica
```

4. Scrivi l'indirizzo del worker e il client Google in `docs/app/js/config.js`.

## Prova sul computer

```bash
npm run db-locale
npm run locale
```

Il server risponde su `http://localhost:8787`. L'app servita da `http://localhost:8765` lo usa da sola.
