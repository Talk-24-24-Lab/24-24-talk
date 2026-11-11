# vendor/ : bibliothèques tierces figées

> © 2026 Sébastien Chevrier pour ce fichier. Les bibliothèques gardent leur propre licence.

| Fichier | Origine | Version | Licence | Empreinte (SHA-384) |
|---|---|---|---|---|
| `supabase-js-2.117.2.js` | paquet npm `@supabase/supabase-js`, fichier `dist/umd/supabase.js`, sans modification | 2.117.2 | MIT (`supabase-js-LICENSE.txt`) | `sha384-Rj26LVGvoeRVR6+mwQmFfcR3QOBEwT+ZmuCWpuiqeTzJpCs0ER4ITAWGb4Hiy3Ok` |

Pourquoi (lot 1, constat C1, 5 octobre 2026) : TALK, ONE WORLD et `gestion/` chargeaient
`https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`, c'est-à-dire **la dernière 2.x publiée**, sans contrôle. Une
version nouvelle ou altérée aurait été exécutée telle quelle avec accès aux sessions. La copie locale ne change que
quand quelqu'un la remplace volontairement.

Mettre à jour (sur un ordinateur, jamais automatiquement) :

```
npm pack @supabase/supabase-js@<version>
tar xzf supabase-supabase-js-<version>.tgz
cp package/dist/umd/supabase.js vendor/supabase-js-<version>.js
openssl dgst -sha384 -binary vendor/supabase-js-<version>.js | openssl base64 -A
```

puis changer le nom du fichier dans `index.html` (`NET_SDK_URL`), `everywhere/config.js` (`sdk`) et
`gestion/index.html`, mettre à jour ce tableau, et relancer `everywhere/tests/expert.js` (il vérifie l'empreinte).
