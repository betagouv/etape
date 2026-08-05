/** Contenu de la FAQ de la page d'accueil. Les libellés reprennent la table de l'US au mot près. */

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
