// ============================================================
//  config.js : réglages du site ScanContact
//  👉 Après avoir créé le projet Supabase (GUIDE_SUPABASE.md),
//     collez ici la même adresse et la même clé publique que
//     dans l'app : le site comptera alors les visites et les
//     téléchargements (visibles dans l'espace admin de l'app).
// ============================================================
window.SCANCONTACT = {
  // Adresse du projet Supabase, ex : 'https://abcdefghijkl.supabase.co'
  supabaseUrl: 'https://riczwgxplzcjgdicmqzr.supabase.co',
  // Clé publique (publishable / anon) — faite pour être publique
  supabaseKey: 'sb_publishable_ktasX4lWsj9u8u-ee2PZJw_ao7t8al6',

  // Don pour soutenir le créateur et le projet (lien Wave)
  don: {
    url: 'https://pay.wave.com/m/M_ci_rcRuVRkKnG3c/c/ci/?amount=1000',
    montant: '1 000 FCFA',
  },

  // La version et les fichiers à télécharger sont dans
  // ../version.json (écrit par outils/preparer_version.py).
};
