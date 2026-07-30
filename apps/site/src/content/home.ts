import {
  Euro,
  EyeOff,
  FolderX,
  MessageCircleQuestion,
  SearchCheck,
  ShieldCheck,
  Signpost,
  Timer,
  type LucideIcon,
} from "lucide-react";

/**
 * Contenu éditorial de la page d'accueil.
 *
 * Tout le texte est regroupé ici, hors du JSX : la règle « pas d'ajout de texte
 * aux composants » de l'US reste vérifiable d'un coup d'œil, la relecture métier
 * ne demande pas de lire du balisage, et les tableaux sont des constantes de
 * module — créées une fois, pas à chaque rendu.
 *
 * Les libellés reprennent la maquette au mot près. Certains chiffres et
 * témoignages sont des valeurs de maquette : cf. la note en fin de fichier.
 */

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export const hero = {
  /** Une ligne par tableau : la maquette coupe le titre après le point d'interrogation. */
  titleLines: ["En pleine réflexion sur votre vie professionnelle ?", "Trouvez par où commencer."],
  subtext:
    "Vous envisagez une reconversion, une évolution professionnelle, une formation ou simplement une réflexion, mais vous ne savez pas par où commencer ? Le simulateur ETAPE vous aide à identifier les dispositifs, accompagnements et financements qui peuvent soutenir votre projet, selon votre situation.",
  cta: "C'est parti !",
};

/* ------------------------------------------------------------------ */
/* Comment ça marche                                                   */
/* ------------------------------------------------------------------ */

export type Step = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const howItWorks = {
  caption: "En 3 étapes",
  title: "Comment ça marche",
  subtext: "Un parcours guidé, sans jargon, qui s'adapte à vos réponses.",
  steps: [
    {
      icon: MessageCircleQuestion,
      title: "Vous répondez",
      description:
        "Un questionnaire court sur votre situation (statut, ancienneté, projet, diplôme…).",
    },
    {
      icon: SearchCheck,
      title: "Vous découvrez vos dispositifs",
      description:
        "Vos résultats apparaissent en trois sections : éligible, sous réserve, et inéligible",
    },
    {
      icon: Signpost,
      title: "Vous êtes orienté",
      description:
        "Pour chaque dispositif, un lien vers l'organisme concerné et les étapes à suivre.",
    },
  ] satisfies Step[],
};

/* ------------------------------------------------------------------ */
/* Réassurance                                                         */
/* ------------------------------------------------------------------ */

export type ReassuranceItem = {
  icon: LucideIcon;
  label: string;
};

export const trust = {
  caption: "Pourquoi nous faire confiance ?",
  title: "Une démarche simple et sécurisée",
  /** « Tous profils » remplacé par « Sans engagement » (US). */
  items: [
    { icon: Euro, label: "Gratuit" },
    { icon: EyeOff, label: "Anonyme" },
    { icon: FolderX, label: "Sans dossier" },
    { icon: Timer, label: "Environ 5 min" },
    { icon: ShieldCheck, label: "Sans engagement" },
  ] satisfies ReassuranceItem[],
};

/* ------------------------------------------------------------------ */
/* Le saviez-vous                                                      */
/* ------------------------------------------------------------------ */

export const didYouKnow = {
  caption: "Le saviez-vous ?",
  /** La maquette met « 24 000 personnes » en exergue au milieu de la phrase. */
  sentenceBefore: "Chaque année,",
  highlight: "24 000 personnes",
  sentenceAfter: ["changent de métier grâce à", "un dispositif financé."],
  cta: "Suis-je éligible ?",
};

/* ------------------------------------------------------------------ */
/* Pour qui                                                            */
/* ------------------------------------------------------------------ */

export const audience = {
  caption: "Pour qui ?",
  title: "Quel que soit votre statut",
  subtext:
    "Le simulateur s'adresse à toute personne qui souhaite évoluer ou se reconvertir — votre situation est prise en compte dès les premières questions.",
  cta: "Commencer la simulation",
};

/* ------------------------------------------------------------------ */
/* Mesurer notre impact                                                */
/* ------------------------------------------------------------------ */

export type Stat = {
  value: string;
  label: string;
  description: string;
};

export const impact = {
  caption: "Mesurer notre impact",
  title: "La clé d'un nouveau départ professionnel réussi et certifié",
  subtext:
    "Chaque jour, nous aidons des centaines de travailleurs français à évaluer sereinement leurs options de reconversion grâce à un croisement de données ultra-fiable et entièrement sécurisé. Notre simulateur analyse les bassins d'emploi en temps réel.",
  stats: [
    {
      value: "160 000",
      label: "Reconversions financées",
      description: "Plébiscité par l'ensemble de nos bénéficiaires en reconversion.",
    },
    {
      value: "98%",
      label: "De satisfaction",
      description: "Un bilan exhaustif, gratuit et sans engagement, réalisé en un temps record.",
    },
    {
      value: "54 000+",
      label: "Simulations",
      description: "Des parcours professionnels débouchant sur un emploi durable.",
    },
    {
      value: "5+",
      label: "Dispositifs éligibles",
      description: "Présentes de façon uniforme sur l'ensemble du territoire français.",
    },
  ] satisfies Stat[],
};

/* ------------------------------------------------------------------ */
/* Témoignages                                                         */
/* ------------------------------------------------------------------ */

export type Testimonial = {
  name: string;
  role: string;
  quote: string;
};

export const testimonials = {
  caption: "Pour qui ?",
  title: "Ils ont franchi le pas",
  subtext:
    "Le simulateur s'adresse à toute personne qui souhaite évoluer ou se reconvertir — votre situation est prise en compte dès les premières questions.",
  /** Les guillemets français sont posés par le composant, pas stockés ici. */
  items: [
    {
      name: "Marie",
      role: "Développeuse web",
      quote:
        "Le simulateur m'a aidée à comprendre mes droits avant d'oser sauter le pas. En 2 minutes je savais que mon Projet de Transition Professionnelle était possible.",
    },
    {
      name: "Kévin",
      role: "Reprise d'une boulangerie",
      quote:
        "J'ai découvert le Dispositif Démissionnaire grâce à ce simulateur. Sans lui, je n'aurais jamais su que je pouvais quitter mon CDI pour me lancer.",
    },
    {
      name: "Aïcha",
      role: "Architecte d'intérieur",
      quote:
        "J'ai mûri mon projet pendant 1 an. Le Dispositif Démissionnaire m'a donné les moyens financiers de me lancer en confiance.",
    },
  ] satisfies Testimonial[],
};

/* ------------------------------------------------------------------ */
/* CTA final                                                           */
/* ------------------------------------------------------------------ */

export const finalCta = {
  title: "Prêt à découvrir vos dispositifs ?",
  subtext: "Quelques minutes suffisent pour y voir clair sur vos droits et vos options.",
  /** « Lancer le simulateur » remplacé par « C'est parti ! » (US). */
  cta: "C'est parti !",
  /** Même liste que `trust.items`, aux libellés près : la maquette dit « 5 minutes » ici. */
  items: [
    { icon: Euro, label: "Gratuit" },
    { icon: EyeOff, label: "Anonyme" },
    { icon: FolderX, label: "Sans dossier" },
    { icon: Timer, label: "5 minutes" },
    { icon: ShieldCheck, label: "Sans engagement" },
  ] satisfies ReassuranceItem[],
};

/*
 * Le contenu du pied de page (colonnes « Liens utiles » / « Légal » / « Mise à
 * jour », mention « Simulateur informatif… ») n'est pas repris ici : l'en-tête et
 * le pied de page sont traités ailleurs, et dupliquer leur copie dans ce module
 * ferait diverger les deux sources.
 */

/*
 * À VALIDER AVANT MISE EN PRODUCTION
 *
 * Les chiffres de `impact.stats` (160 000 reconversions, 98 % de satisfaction,
 * 54 000+ simulations, 5+ dispositifs) et les trois `testimonials.items`
 * proviennent de la maquette. Sur un service public, ils doivent être sourcés ou
 * remplacés par des données réelles. Ils sont isolés ici pour être remplaçables
 * sans toucher au balisage.
 */
