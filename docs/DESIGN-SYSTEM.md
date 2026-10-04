# Système de design commun ONE WORLD (PROTOTYPE 0.7.0)

> © 2026 Sébastien Chevrier. Tous droits réservés. L'apparence finale sera décidée à la fin (décision du 4 octobre 2026).

## 1. Couleurs (variables CSS, `everywhere/style.css`)

| Variable | Rôle | Sombre | Clair |
|---|---|---|---|
| `--bg`, `--bg2` | Fond | `#050913`, `#0b1224` | `#f5f8ff`, `#eaf0fb` |
| `--panel`, `--panel2` | Cartes, champs | `#111a30`, `#18233f` | `#ffffff`, `#eef3fc` |
| `--line` | Bordures | `#25325a` | `#d8e1f3` |
| `--text`, `--muted` | Texte, texte secondaire | `#eef3ff`, `#a9b8da` | `#0d1733`, `#4d5b80` |
| `--teal` | Action principale | selon thème | `#1f5fe0` |
| `--ok`, `--warn`, `--err` | Succès, attention, danger | | |

Thèmes : clair (par défaut), sombre, automatique ; **contraste renforcé** (bordures et texte plus foncés).
TALK (`index.html`) : liens en `--link` (`#7aa7ff` sombre, `#1d55d0` clair) pour atteindre le contraste AA.
Couleurs des interfaces (`apps.js`) : TALK bleu, EVERYWHERE vert foncé (dégradé assombri en 0.7.0 pour le contraste du
texte blanc), LEARN violet, AI LAB orange `#b4570f`.

## 2. Texte et mouvement

- 3 tailles de texte (normal, grand, très grand), appliquées à tout ONE WORLD.
- « Animations réduites » (classe `reduce-motion`) + respect du réglage du téléphone.
- Langues de droite à gauche : `dir="auto"` sur tout texte traduit ; positions en `inset-inline-*` (étoile des favorites).

## 3. Composants

| Composant | Classe | Règle |
|---|---|---|
| Bouton | `.btn`, `.btn.primary`, `.btn.wide`, `.btn.danger` | Hauteur 48 px au moins ; `.danger` = contour rouge (actions définitives) |
| Bouton secondaire | `.link-btn` | 44 px au moins ; `.sure` = 2e appui de confirmation |
| Carte | `.card` | |
| Choix exclusif | `.seg` (`role="radiogroup"`) | |
| Interrupteur | bouton `role="switch"` | `aria-disabled` quand indisponible, avec explication |
| Message | `.cx-msg.ok` (`role="status"`), `.cx-msg.err` (`role="alert"`) | |
| Avertissement | `.cx-warn` | Bande orange à gauche |
| Grande entrée | `.tr-big` (+ `.face`, `.call`, `.trip`) | |
| Carte d'interface | `.duo-card` (+ `.ailab`), badge `.duo-btn.soon` « Bientôt » | 1 colonne téléphone, 2 dès 640 px, 4 dès 1 200 px |
| Écran plein « Montrer » | `.vy-big` (`role="dialog"`, `aria-modal`) | Échap ferme, le focus revient |

## 4. Règles d'accessibilité suivies

WCAG 2.1 AA vérifié automatiquement (axe-core) sur 21 écrans et 4 variantes ; cibles tactiles ≥ 44 px ; ordre du
clavier logique ; onglets aux flèches ; aucun identifiant en double ; aucune action définitive sans confirmation.
