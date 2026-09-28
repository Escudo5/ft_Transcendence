/* 📄 THE LEGAL DOCUMENTS IN ENGLISH
 *
 * Same shape as es.js. See that file for the markup the renderer understands:
 *    **bold**          ->  <strong>bold</strong>
 *    [text](/path)     ->  a link
 */
export default {
  fecha: '3 September 2026',
  ultimaActualizacion: 'Last updated',
  volver: '← Back to home',
  verTerminos: 'See the Terms of Service →',
  verPrivacidad: 'See the Privacy Policy →',

  privacidad: {
    titulo: 'Privacy Policy',
    intro: '**42 Card Album** is an academic project built by students of 42 Madrid as part of the cursus (the ft_transcendence project). It is non-profit and it is not officially affiliated with 42. Here we explain, plainly, what data we keep and what for.',
    apartados: [
      {
        h: 'What data we keep',
        bloques: [
          { p: 'It depends on how you sign in:' },
          { p: '**If you sign in with your 42 account:**' },
          { ul: [
            'Your login, first name, surname and Intra email address',
            'The URL of your Intra profile picture',
            'Your Intra identifier, so we recognise you when you come back',
            'Whether you are alumni',
          ] },
          { p: 'This data is refreshed every time you sign in, so it stays current. **We do not store your 42 password and we never have access to it**: the authentication is done by the Intra itself.' },
          { p: '**If you register with an email address and a password:**' },
          { ul: [
            'Your email address and the name you choose',
            'Your password, stored **hashed irreversibly and salted**. Not even we can read it',
          ] },
          { p: '**In both cases, while you use the application:**' },
          { ul: [
            'Your card collection and how many copies you have of each one',
            'The packs in your inventory and when you claimed your daily gift',
            'Your connection status (online, offline or playing)',
            'The biography and display name you write on your profile',
            'The profile picture you upload, if you choose to upload one',
            'A session cookie, needed to keep you signed in',
          ] },
          { p: 'About the picture you upload: before storing it we shrink it and generate it again, and in that step **the hidden data that phone cameras embed in every image is removed**, including the coordinates of the place where the photo was taken. We never store that information at any point. You can remove your picture whenever you want from your profile, and doing so deletes it from the server.' },
        ],
      },
      {
        h: 'Where the cards come from',
        bloques: [
          { p: 'The cards in the game are generated from **public information** about students of 42 Madrid obtained from the official Intra API: login, coalition, title, cursus level, evaluation points and profile picture. No private data is included.' },
          { p: 'If you appear as a card and you do not want to, write to us and we will remove you from the catalogue.' },
        ],
      },
      {
        h: 'What we use your data for',
        bloques: [
          { p: 'Only to make the application work: to identify you, to keep your collection and to hand out your daily packs. **We do not advertise, we do not profile users and we do not sell or share data with third parties.** We use no tracking cookies and no external analytics.' },
        ],
      },
      {
        h: 'Where it is stored',
        bloques: [
          { p: 'In a PostgreSQL database hosted on the project infrastructure. Connections between your browser and the server are encrypted with HTTPS.' },
        ],
      },
      {
        h: 'For how long',
        bloques: [
          { p: 'For as long as you have an account. If you delete it, your data is removed immediately and permanently, your collection included.' },
        ],
      },
      {
        h: 'Your rights',
        bloques: [
          { destacado: [
            { p: 'From [your profile](/perfil) you can, at any time and without asking anyone:' },
            { ul: [
              '**Download all your data** in a readable file',
              '**Delete your account** and everything attached to it',
              '**Edit** your biography and your display name',
            ] },
          ] },
          { p: 'The data that comes from the Intra (name, email, picture) refreshes itself from 42 on every sign-in, so to change it you have to do it on the Intra itself.' },
        ],
      },
      {
        h: 'Contact',
        bloques: [
          { p: 'For any question about your data, write to any of the students who maintain the project through the 42 Madrid Intra.' },
        ],
      },
    ],
  },

  terminos: {
    titulo: 'Terms of Service',
    intro: 'By using **42 Card Album** you accept these terms. If you do not agree, simply do not use the application.',
    apartados: [
      {
        h: 'What this is',
        bloques: [
          { p: 'A collectible sticker album featuring students of 42, made by students of 42 Madrid as an academic project of the cursus. **It is a non-profit educational project** and it is not officially affiliated with 42 or the Intra.' },
        ],
      },
      {
        h: 'Who can use it',
        bloques: [
          { p: 'You can sign in with your 42 account or register with an email address and a password. You are responsible for keeping your password safe and for everything that happens in your account.' },
        ],
      },
      {
        h: 'Cards and packs are not worth money',
        bloques: [
          { p: 'Cards, packs and any other item in the game are **virtual content with no monetary value**. They cannot be bought, sold or exchanged for money, inside or outside the application. You do not acquire ownership of them: only the right to use them inside the game.' },
          { p: 'We may adjust the rules of the game (how many packs are handed out, the odds of each rarity or how contracts work) in order to balance it.' },
        ],
      },
      {
        h: 'What you cannot do',
        bloques: [
          { ul: [
            'Automate the opening of packs or any other action with programs or scripts',
            'Try to get around the limits of the game, such as the daily gift',
            'Impersonate another person or use their account',
            'Attack the application or try to access other users’ data',
            'Use the content for commercial purposes',
          ] },
        ],
      },
      {
        h: 'If you appear as a card',
        bloques: [
          { p: 'Cards are generated from public information from the 42 API. If you are a student of 42 Madrid, you may appear. If you do not want to, tell us and we will remove you from the catalogue.' },
        ],
      },
      {
        h: 'That this is a student project',
        bloques: [
          { p: 'The application is offered **as it is**. It may have bugs, be down or lose data, and accounts may be reset during development or when the project ends. We do not guarantee availability or that your collection will be kept.' },
        ],
      },
      {
        h: 'Your account',
        bloques: [
          { p: 'You can delete it whenever you want from [your profile](/perfil). We may also close accounts that break these rules.' },
        ],
      },
      {
        h: 'Changes',
        bloques: [
          { p: 'If we change these terms, we will update the date above. Continuing to use the application means you accept the new version.' },
        ],
      },
    ],
  },
};
