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

/** Contenu éditorial de la page d'accueil. Les libellés reprennent la maquette au mot près. */

export const hero = {
  titleLines: ["En pleine réflexion sur votre vie professionnelle ?", "Trouvez par où commencer."],
  subtext:
    "Vous envisagez une reconversion, une évolution professionnelle, une formation ou simplement une réflexion, mais vous ne savez pas par où commencer ? Le simulateur ETAPE vous aide à identifier les dispositifs, accompagnements et financements qui peuvent soutenir votre projet, selon votre situation.",
  cta: "C'est parti !",
};

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

export type ReassuranceItem = {
  icon: LucideIcon;
  label: string;
};

export const trust = {
  caption: "Pourquoi nous faire confiance ?",
  title: "Une démarche simple et sécurisée",
  items: [
    { icon: Euro, label: "Gratuit" },
    { icon: EyeOff, label: "Anonyme" },
    { icon: FolderX, label: "Sans dossier" },
    { icon: Timer, label: "Environ 5 min" },
    { icon: ShieldCheck, label: "Tous profils" },
  ] satisfies ReassuranceItem[],
};

export const didYouKnow = {
  caption: "Le saviez-vous ?",
  sentenceBefore: "Chaque année,",
  highlight: "24 000 personnes",
  sentenceAfter: ["changent de métier grâce à", "un dispositif financé."],
  cta: "Suis-je éligible ?",
};

export const audience = {
  caption: "Pour qui ?",
  title: "Quel que soit votre statut",
  subtext:
    "Le simulateur s'adresse à toute personne qui souhaite évoluer ou se reconvertir — votre situation est prise en compte dès les premières questions.",
  cta: "Commencer la simulation",
};

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

export type FaqItem = {
  /** Valeur de l'item Radix : stable, indépendante du libellé. */
  id: string;
  question: string;
  /** Amorce de la réponse, mise en exergue — « Oui, entièrement. ». */
  lead: string;
  answer: string;
};

export const faq = {
  caption: "FAQ",
  title: "Questions fréquentes",
  items: [
    {
      id: "gratuit",
      question: "Le simulateur est-il vraiment gratuit ?",
      lead: "Oui, entièrement.",
      answer:
        "La simulation est gratuite et sans engagement. Comptez environ 5 minutes pour obtenir une première estimation adaptée à votre situation.",
    },
    {
      id: "donnees",
      question: "Mes réponses sont-elles conservées ?",
      lead: "Non.",
      answer:
        "Vous n'avez pas besoin de créer un compte pour utiliser le simulateur. Les informations renseignées ne sont pas conservées après votre simulation.",
    },
    {
      id: "engagement",
      question: "Est-ce vraiment sans engagement ?",
      lead: "Oui. Rien n'est engagé à ce stade.",
      answer:
        "Le simulateur a pour seul objectif de vous aider à mieux comprendre les solutions qui peuvent correspondre à votre situation. Vous restez libre de poursuivre vos démarches ou non.",
    },
    {
      id: "sous-reserve",
      question: "Que signifie « sous réserve » ?",
      lead: "Le résultat obtenu est une estimation.",
      answer:
        "Il est calculé à partir des informations que vous renseignez. Une analyse plus complète peut être nécessaire pour confirmer vos droits et les accompagnements auxquels vous pouvez prétendre.",
    },
    {
      id: "utilite",
      question: "À quoi sert le simulateur ETAPE ?",
      lead: "Le simulateur ETAPE vous aide à identifier rapidement les solutions adaptées à votre projet.",
      answer:
        "En fonction de votre situation professionnelle et des informations renseignées, il vous permet d'obtenir une première estimation des accompagnements et financements auxquels vous pourriez prétendre.",
    },
    {
      id: "resultat-definitif",
      question: "Le résultat affiché est-il définitif ?",
      lead: "Non.",
      answer:
        "Le résultat vous donne une première indication basée sur les informations que vous avez renseignées. Seule l'étude complète de votre situation permettra de confirmer les dispositifs auxquels vous pouvez accéder.",
    },
  ] satisfies FaqItem[],
};

export const finalCta = {
  title: "Prêt à découvrir vos dispositifs ?",
  subtext: "Quelques minutes suffisent pour y voir clair sur vos droits et vos options.",
  cta: "C'est parti !",
  items: [
    { icon: Euro, label: "Gratuit" },
    { icon: EyeOff, label: "Anonyme" },
    { icon: FolderX, label: "Sans dossier" },
    { icon: Timer, label: "5 minutes" },
    { icon: ShieldCheck, label: "Tous profils" },
  ] satisfies ReassuranceItem[],
};

/*
 * À SOURCER AVANT MISE EN PRODUCTION : les chiffres d'`impact.stats` et les trois
 * `testimonials.items` proviennent de la maquette, pas de données réelles.
 */
