/* 24/24 ONE WORLD — registre des interfaces (une application, un compte, trois interfaces : TALK, EVERYWHERE, LEARN). © 2026 Sébastien Chevrier.
   Ajouter une application = ajouter une entrée ici (et son dossier). Le portail crée tout seul
   sa carte, sa route (#/app/<id>) et son cadre ; rien d'autre à modifier.

   Champs :
   - id       : identifiant court, utilisé dans l'adresse (#/app/talk)
   - name     : nom affiché
   - tagline  : une phrase, { fr, en, … } (les 11 langues du portail depuis 0.8.3)
   - status   : "available" (ouvrable), "soon" (annoncé « Bientôt », page d'information seulement)
                ou "reserved" (emplacement réservé) ; rien n'est simulé
   - src      : page de l'application, relative à EW_CONFIG.basePath (application ouverte en pleine page)
   - route    : OU écran interne du portail (#/…), pour un module construit dans le portail lui-même
   - accent   : couleur de la carte
   - icon     : clé d'icône (voir ICONS dans app.js) */
window.EW_APPS = [
  {
    id: "talk",
    name: "24/24 TALK",
    tagline: { fr: "Communiquer sans barrières : appels et messages traduits, 112 langues.", en: "Communicate without barriers: translated calls and messages, 112 languages.", es: "Comunicarse sin barreras: llamadas y mensajes traducidos, 112 idiomas.", pt: "Comunicar sem barreiras: chamadas e mensagens traduzidas, 112 línguas.", de: "Ohne Grenzen kommunizieren: übersetzte Anrufe und Nachrichten, 112 Sprachen.", it: "Comunicare senza barriere: chiamate e messaggi tradotti, 112 lingue.", zh: "无障碍沟通：通话和消息自动翻译，支持 112 种语言。", ja: "言葉の壁なくつながる：通話とメッセージを翻訳、112 言語に対応。", ar: "تواصل بلا حواجز: مكالمات ورسائل مترجمة، 112 لغة.", ru: "Общение без барьеров: переведённые звонки и сообщения, 112 языков.", mg: "Mifandray tsy misy sakana: antso sy hafatra voadika, fiteny 112." },
    status: "available",
    src: "index.html?embed=1",
    accent: "#1f5fe0",
    icon: "talk",
    bottomNav: true
  },
  {
    id: "everywhere",
    name: "24/24 EVERYWHERE",
    tagline: { fr: "Traduire et connecter partout : conversation côte à côte, appel traduit avec un contact TALK.", en: "Translate and connect everywhere: side-by-side conversation, translated call with a TALK contact.", es: "Traducir y conectar en todas partes: conversación cara a cara, llamada traducida con un contacto de TALK.", pt: "Traduzir e ligar em todo o lado: conversa lado a lado, chamada traduzida com um contacto do TALK.", de: "Überall übersetzen und verbinden: Gespräch von Angesicht zu Angesicht, übersetzter Anruf mit einem TALK-Kontakt.", it: "Tradurre e connettersi ovunque: conversazione faccia a faccia, chiamata tradotta con un contatto TALK.", zh: "随时随地翻译与连接：面对面对话，与 TALK 联系人进行翻译通话。", ja: "どこでも翻訳してつながる：対面での会話、TALK の連絡先との翻訳通話。", ar: "ترجم وتواصل في كل مكان: محادثة وجهًا لوجه، ومكالمة مترجمة مع جهة اتصال في TALK.", ru: "Переводите и общайтесь везде: разговор лицом к лицу, звонок с переводом контакту из TALK.", mg: "Mandika sy mampifandray na aiza na aiza: resaka mifanatrika, antso voadika amin'ny olona ao amin'ny TALK." },
    status: "available",
    route: "#/everywhere",
    accent: "#13a05a",
    icon: "globe"
  },
  {
    id: "learn",
    name: "24/24 LEARN",
    tagline: { fr: "Apprendre sans limites : leçons, exercices, progression.", en: "Learn without limits: lessons, exercises, progress.", es: "Aprender sin límites: lecciones, ejercicios, progreso.", pt: "Aprender sem limites: lições, exercícios, progresso.", de: "Lernen ohne Grenzen: Lektionen, Übungen, Fortschritt.", it: "Imparare senza limiti: lezioni, esercizi, progressi.", zh: "无限学习：课程、练习、进度。", ja: "限界なく学ぶ：レッスン、練習問題、進み具合。", ar: "تعلّم بلا حدود: دروس وتمارين وتقدّم.", ru: "Учитесь без ограничений: уроки, упражнения, прогресс.", mg: "Mianara tsy misy fetra: lesona, fanazaran-tena, fandrosoana." },
    status: "available",
    route: "#/learn",
    accent: "#6b3fd6",
    icon: "learn"
  },
  {
    id: "ailab",
    name: "24/24 AI LAB",
    tagline: { fr: "Innover avec l'IA : espace d'expérimentation, bientôt disponible.", en: "Innovating with AI: an experimentation space, coming soon.", es: "Innovar con la IA: un espacio de experimentación, próximamente.", pt: "Inovar com a IA: um espaço de experimentação, em breve.", de: "Mit KI Neues schaffen: ein Raum zum Experimentieren, bald verfügbar.", it: "Innovare con l'IA: uno spazio di sperimentazione, presto disponibile.", zh: "用 AI 创新：实验空间，即将推出。", ja: "AI でイノベーション：実験の場、近日公開。", ar: "الابتكار بالذكاء الاصطناعي: مساحة للتجربة، قريبًا.", ru: "Инновации с ИИ: пространство для экспериментов, скоро.", mg: "Manavao miaraka amin'ny AI: toerana fanandramana, ho avy tsy ho ela." },
    status: "soon",
    route: "#/ailab",
    accent: "#b4570f",
    icon: "lab"
  }
];
