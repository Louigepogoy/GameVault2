// Curated games for the Discover page.
// Links point only to official stores and websites; GameVault never hosts downloads.
// Platform and genre names match the frontend's PLATFORMS / GENRES lists.

const steam = (id) => ({ label: 'Steam', url: `https://store.steampowered.com/app/${id}/` });
const play = (pkg) => ({ label: 'Google Play', url: `https://play.google.com/store/apps/details?id=${pkg}` });
// PH store, since some games (e.g. Mobile Legends) aren't listed in the US store.
const appStore = (id) => ({ label: 'App Store', url: `https://apps.apple.com/ph/app/id${id}` });
const site = (url) => ({ label: 'Official site', url });
const steamCover = (id) => `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/library_600x900.jpg`;
const steamHeader = (id) => `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`;

export const CATALOG = [
  // ---------- Free to play ----------
  {
    slug: 'genshin-impact',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/2d/09/2f/2d092f1a-f550-9e4e-51f3-483a973ffc53/EN-1.jpg/920x0w.jpg',
    cover:
      'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/5c/e2/13/5ce21317-a08a-24ac-cc5f-2b25a4d71fa6/AppIcon-0-0-1x_U007epad-0-1-85-220.png/600x600bb.jpg',
    title: 'Genshin Impact',
    developer: 'HoYoverse',
    year: 2020,
    genre: 'Action RPG',
    tags: ['RPG', 'Action RPG', 'Adventure', 'Open World'],
    platforms: ['PC', 'PlayStation 5', 'Android', 'iOS'],
    price: 'free',
    summary: 'Explore a huge anime-style fantasy world with a team of elemental heroes.',
    about:
      'You travel across the continent of Teyvat looking for your lost sibling. Combat is fast and ' +
      'built around combining elements, like freezing an enemy with Cryo and shattering it with a claymore. ' +
      'The story, music and exploration are free; new characters come from an optional gacha system.',
    highlights: [
      'Big open world with climbing, gliding and puzzles',
      'Element-combo combat with a 4-person team',
      'Free story updates every few weeks',
    ],
    links: [site('https://genshin.hoyoverse.com/'), play('com.miHoYo.GenshinImpact'), appStore('1517783697')],
  },
  {
    slug: 'honkai-star-rail',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/61/61/96/616196cd-2cf5-19bd-120b-2bbeec236934/EN-2688_U00d71242-0-4.6KV.jpg/920x0w.jpg',
    cover:
      'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/fd/65/dc/fd65dc18-c4b6-7b64-8266-a423f3f113e0/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/600x600bb.jpg',
    title: 'Honkai: Star Rail',
    developer: 'HoYoverse',
    year: 2023,
    genre: 'RPG',
    tags: ['RPG', 'Strategy'],
    platforms: ['PC', 'PlayStation 5', 'Android', 'iOS'],
    price: 'free',
    summary: 'A space-fantasy RPG with turn-based battles and a train that travels between worlds.',
    about:
      'You ride the Astral Express across different planets, each with its own story and characters. ' +
      'Battles are turn-based, so it is about planning your team and timing ultimates rather than fast reflexes. ' +
      'Easy to play in short sessions, including on a phone.',
    highlights: ['Relaxed turn-based combat', 'Funny, well-voiced story', 'Auto-battle for grinding'],
    links: [site('https://hsr.hoyoverse.com/'), play('com.HoYoverse.hkrpgoversea'), appStore('1599719154')],
  },
  {
    slug: 'mobile-legends',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/87/dd/35/87dd3513-220a-4cae-2279-e84995ca703a/1_EN.jpg/920x0w.jpg',
    cover:
      'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/d9/88/76/d9887647-00fd-09c8-8a61-c6c31a1bfe2a/AppIcon-0-0-1x_U007emarketing-0-7-0-85-220.png/600x600bb.jpg',
    title: 'Mobile Legends: Bang Bang',
    developer: 'Moonton',
    year: 2016,
    genre: 'MOBA',
    tags: ['MOBA', 'Strategy'],
    platforms: ['Android', 'iOS'],
    price: 'free',
    summary: 'Quick 5v5 MOBA matches made for phones, about 10–15 minutes each.',
    about:
      'Two teams of five pick heroes and fight across three lanes to destroy the enemy base. ' +
      'It is one of the most played games in Southeast Asia, with a big esports scene (MPL). ' +
      'Short matches and simple controls make it easy to play with friends.',
    highlights: ['Fast 5v5 matches', 'Over 100 heroes', 'Huge community and esports in the Philippines'],
    links: [site('https://m.mobilelegends.com/'), play('com.mobile.legends'), appStore('1160056295')],
  },
  {
    slug: 'call-of-duty-mobile',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/dc/7e/9b/dc7e9b41-15c4-a0f9-a7c8-743eaf2ee5aa/1_2688x1242.jpg/920x0w.jpg',
    cover:
      'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/ac/6e/89/ac6e89d5-edca-7dea-3eaa-fe971293b3bc/AppIcon-0-0-1x_U007emarketing-0-10-0-85-220.png/600x600bb.jpg',
    title: 'Call of Duty: Mobile',
    developer: 'TiMi Studio Group / Activision (Garena in SEA)',
    year: 2019,
    genre: 'Shooter',
    tags: ['Shooter', 'Action'],
    platforms: ['Android', 'iOS'],
    price: 'free',
    summary: 'Classic Call of Duty multiplayer maps and a 100-player battle royale on your phone.',
    about:
      'Play team deathmatch and other modes on famous maps like Nuketown, or drop into battle royale. ' +
      'Controls are made for touch screens but controllers work too. ' +
      'Regular seasons add new weapons, maps and events. In the Philippines and Southeast Asia it is published by Garena.',
    highlights: ['Famous Call of Duty maps', 'Multiplayer and battle royale', 'Controller support'],
    // Garena publishes the Southeast Asian version, which is the one available in the Philippines.
    links: [site('https://codm.garena.com/'), play('com.garena.game.codm'), appStore('1465688043')],
  },
  {
    slug: 'valorant',
    image:
      'https://cdn2.unrealengine.com/egs-valorant-riotgames-s1-2560x1440-4742836df9eb.jpg?w=920&h=518&resize=1&quality=medium',
    cover:
      'https://cdn2.unrealengine.com/egs-valorant-riotgames-s2-1200x1600-45ecd201ffcc.jpg?w=600&h=800&resize=1&quality=medium',
    title: 'VALORANT',
    developer: 'Riot Games',
    year: 2020,
    genre: 'Shooter',
    tags: ['Shooter', 'Strategy'],
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S'],
    price: 'free',
    summary: 'A tactical 5v5 shooter where precise aim meets unique agent abilities.',
    about:
      'One team plants a bomb (the Spike) while the other defends, round after round. ' +
      'Gunplay is precise like Counter-Strike, and each agent adds abilities like smokes, walls or healing. ' +
      'Teamwork and communication matter as much as aim.',
    highlights: ['Tight, skill-based gunplay', 'Agents with unique abilities', 'Ranked mode and big esports'],
    links: [site('https://playvalorant.com/')],
  },
  {
    slug: 'league-of-legends',
    image:
      'https://cdn2.unrealengine.com/epic-2560x1440-2560x1440-2c0f0cf09af6.png?w=920&h=518&resize=1&quality=medium',
    cover:
      'https://cdn2.unrealengine.com/epic-1200x1600-1200x1600-62d626f118e0.png?w=600&h=800&resize=1&quality=medium',
    title: 'League of Legends',
    developer: 'Riot Games',
    year: 2009,
    genre: 'MOBA',
    tags: ['MOBA', 'Strategy'],
    platforms: ['PC'],
    price: 'free',
    summary: 'The PC MOBA that defined the genre, with 160+ champions to master.',
    about:
      'Two teams of five battle on Summoner’s Rift to destroy the enemy Nexus. ' +
      'Matches are deep and strategic, and there is always more to learn. ' +
      'It also has the world’s biggest esports event, the World Championship.',
    highlights: ['Deep team strategy', '160+ champions', 'Also has quick modes like ARAM'],
    links: [site('https://www.leagueoflegends.com/')],
  },
  {
    slug: 'counter-strike-2',
    title: 'Counter-Strike 2',
    developer: 'Valve',
    year: 2023,
    genre: 'Shooter',
    tags: ['Shooter', 'Strategy'],
    platforms: ['PC'],
    price: 'free',
    summary: 'The legendary competitive shooter: Terrorists vs Counter-Terrorists.',
    about:
      'Buy weapons each round, plant or defuse the bomb, and outplay the other team. ' +
      'It is simple to learn but has huge skill depth in aim, recoil control and grenades. ' +
      'Runs well even on older PCs.',
    highlights: [
      'Pure skill-based competition',
      'Classic maps like Dust II and Mirage',
      'Runs on modest PCs',
    ],
    links: [steam(730)],
    steamId: 730,
  },
  {
    slug: 'dota-2',
    title: 'Dota 2',
    developer: 'Valve',
    year: 2013,
    genre: 'MOBA',
    tags: ['MOBA', 'Strategy'],
    platforms: ['PC'],
    price: 'free',
    summary: 'A deep, complex MOBA where every hero is free from the start.',
    about:
      'Two teams of five fight to destroy the enemy Ancient. ' +
      'All 120+ heroes are unlocked for free; you only pay for cosmetics. ' +
      'Known for being hard to master, which makes big comebacks very satisfying.',
    highlights: ['All heroes free', 'Very deep strategy', 'The International esports tournament'],
    links: [steam(570)],
    steamId: 570,
  },
  {
    slug: 'apex-legends',
    title: 'Apex Legends',
    developer: 'Respawn Entertainment',
    year: 2019,
    genre: 'Shooter',
    tags: ['Shooter', 'Action'],
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S', 'Nintendo Switch'],
    price: 'free',
    summary: 'A squad-based battle royale with fast movement and hero abilities.',
    about:
      'Drop in with a team of three, loot weapons, and be the last squad standing. ' +
      'Sliding, climbing and each legend’s abilities make fights fast and creative. ' +
      'The ping system lets you play well with strangers even without a mic.',
    highlights: ['Smooth, fast movement', 'Legends with special abilities', 'Great ping system for teamwork'],
    links: [steam(1172470), site('https://www.ea.com/games/apex-legends')],
    steamId: 1172470,
  },
  {
    slug: 'warframe',
    title: 'Warframe',
    developer: 'Digital Extremes',
    year: 2013,
    genre: 'Action',
    tags: ['Shooter', 'Action', 'RPG'],
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S', 'Nintendo Switch', 'iOS'],
    price: 'free',
    summary: 'Space ninjas with guns: a fast co-op action game with tons of content.',
    about:
      'You are a Tenno, a warrior in powerful armor called a Warframe. ' +
      'Run, slide and wall-jump through missions while collecting hundreds of weapons and frames. ' +
      'Almost everything can be earned by playing, without paying.',
    highlights: ['Fast parkour combat', 'Huge amount of free content', 'Co-op with friends'],
    links: [steam(230410), site('https://www.warframe.com/')],
    steamId: 230410,
  },
  {
    slug: 'marvel-rivals',
    title: 'Marvel Rivals',
    developer: 'NetEase Games',
    year: 2024,
    genre: 'Shooter',
    tags: ['Shooter', 'Action'],
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S'],
    price: 'free',
    summary: 'A 6v6 hero shooter starring Marvel heroes and villains.',
    about:
      'Play as Spider-Man, Iron Man, Loki and many more in team battles. ' +
      'Heroes can team up for special combo abilities, and parts of the maps can be destroyed. ' +
      'Easy to jump into if you like Overwatch-style games.',
    highlights: ['Famous Marvel characters', 'Team-up combo abilities', 'Destructible maps'],
    links: [steam(2767030), site('https://www.marvelrivals.com/')],
    steamId: 2767030,
  },
  {
    slug: 'fortnite',
    // Epic Games Launcher protocol activation: starts Fortnite without opening the launcher window.
    pcLaunch: 'com.epicgames.launcher://apps/Fortnite?action=launch&silent=true',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/bd/a7/e3/bda7e31a-7341-2cf8-d54f-880aec955620/EN_FNBR_42-00_C7S4_Shot_1_iOS_AppStore_Screenshot_iPhone_2868x1320.jpg/920x0w.jpg',
    cover:
      'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/a0/1d/74/a01d74d6-5975-c315-7db7-faa54a254b28/AppIcon-0-0-1x_U007epad-0-1-85-220.png/600x600bb.jpg',
    title: 'Fortnite',
    developer: 'Epic Games',
    year: 2017,
    genre: 'Shooter',
    tags: ['Shooter', 'Action', 'Sandbox'],
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S', 'Nintendo Switch', 'Android'],
    price: 'free',
    summary: 'The famous battle royale, plus building, racing, LEGO and thousands of player-made games.',
    about:
      '100 players drop onto an island and fight to be the last one standing. ' +
      'Besides battle royale, Fortnite now has LEGO survival, racing, music and many creator-made modes. ' +
      'Big collabs with movies, anime and artists happen all the time.',
    highlights: ['Many modes in one game', 'Frequent events and collabs', 'Cross-play on every platform'],
    links: [site('https://www.fortnite.com/')],
  },
  {
    slug: 'roblox',
    // Roblox has no store page on PC; the site's Play buttons open the Roblox app.
    webLaunch: 'https://www.roblox.com/home',
    image: 'https://images.rbxcdn.com/5348266ea6c5e67b19d6a814cbbb70f6.jpg',
    cover:
      'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/a2/5d/b7/a25db7ef-5fd9-160f-3158-5753572d2fdb/AppIcon-0-0-1x_U007epad-0-1-0-85-220.png/600x600bb.jpg',
    title: 'Roblox',
    developer: 'Roblox Corporation',
    year: 2006,
    genre: 'Sandbox',
    tags: ['Sandbox', 'Party', 'Simulation'],
    platforms: ['PC', 'Xbox Series X|S', 'PlayStation 5', 'Android', 'iOS'],
    price: 'free',
    summary: 'Millions of games made by players, from obbies to tycoons and horror.',
    about:
      'Roblox is a platform where anyone can create and share games. ' +
      'You can play obstacle courses, role-play towns, simulators, shooters and more, all from one app. ' +
      'You can even learn to make your own games with Roblox Studio.',
    highlights: ['Endless variety of games', 'Play with friends on any device', 'Make your own games'],
    links: [site('https://www.roblox.com/'), play('com.roblox.client'), appStore('431946152')],
  },

  // ---------- Paid ----------
  {
    slug: 'hades',
    title: 'Hades',
    developer: 'Supergiant Games',
    year: 2020,
    genre: 'Roguelike',
    tags: ['Roguelike', 'Action', 'Action RPG'],
    platforms: ['PC', 'Nintendo Switch', 'PlayStation 5', 'Xbox Series X|S'],
    price: 'paid',
    summary: 'Fight your way out of the Underworld in one of the best action roguelikes ever.',
    about:
      'You play Zagreus, son of Hades, trying to escape the Underworld. ' +
      'Each run gives you random powers (boons) from the Olympian gods, and dying moves the story forward. ' +
      'Excellent combat, art, music and voice acting.',
    highlights: [
      'Fast, satisfying combat',
      'Story that continues every time you die',
      'Award-winning art and music',
    ],
    links: [steam(1145360)],
    steamId: 1145360,
  },
  {
    slug: 'hades-ii',
    title: 'Hades II',
    developer: 'Supergiant Games',
    year: 2025,
    genre: 'Roguelike',
    tags: ['Roguelike', 'Action', 'Action RPG'],
    platforms: ['PC', 'Nintendo Switch'],
    price: 'paid',
    summary: 'The sequel to Hades: play as Melinoë, witch and princess of the Underworld.',
    about:
      'Melinoë battles the Titan of Time, Chronos, using magic, new weapons and blessings from the gods. ' +
      'It keeps everything great about Hades and adds spellcasting, gathering and a new cast of characters.',
    highlights: ['Bigger than the original', 'Magic-based combat', 'Great if you loved Hades'],
    links: [steam(1145350)],
    steamId: 1145350,
  },
  {
    slug: 'hollow-knight',
    title: 'Hollow Knight',
    developer: 'Team Cherry',
    year: 2017,
    genre: 'Metroidvania',
    tags: ['Metroidvania', 'Platformer', 'Action', 'Adventure'],
    platforms: ['PC', 'Nintendo Switch', 'PlayStation 4', 'Xbox One'],
    price: 'paid',
    summary: 'Explore a beautiful, ruined bug kingdom full of secrets and tough bosses.',
    about:
      'You are a small knight exploring Hallownest, a huge underground world. ' +
      'Find new abilities to reach new areas, fight challenging bosses and uncover a sad, mysterious story. ' +
      'Hand-drawn art and a haunting soundtrack. Very cheap for 40+ hours of content.',
    highlights: ['Huge interconnected map', '40+ challenging bosses', 'Amazing value for the price'],
    links: [steam(367520), site('https://www.hollowknight.com/')],
    steamId: 367520,
  },
  {
    slug: 'hollow-knight-silksong',
    title: 'Hollow Knight: Silksong',
    developer: 'Team Cherry',
    year: 2025,
    genre: 'Metroidvania',
    tags: ['Metroidvania', 'Platformer', 'Action', 'Adventure'],
    platforms: ['PC', 'Nintendo Switch', 'PlayStation 5', 'Xbox Series X|S'],
    price: 'paid',
    summary: 'The long-awaited sequel: play as Hornet in a new kingdom of silk and song.',
    about:
      'Hornet is captured and taken to Pharloom, a kingdom ruled by silk and song. ' +
      'She is faster and more acrobatic than the Knight, with new tools and a crafting system. ' +
      'Expect a big world and a lot of hard, fair bosses.',
    highlights: ['Faster, acrobatic combat', 'Brand-new kingdom to explore', 'Sequel to a modern classic'],
    links: [steam(1030300), site('https://www.hollowknightsilksong.com/')],
    steamId: 1030300,
  },
  {
    slug: 'stardew-valley',
    title: 'Stardew Valley',
    developer: 'ConcernedApe',
    year: 2016,
    genre: 'Simulation',
    tags: ['Simulation', 'RPG', 'Party'],
    platforms: ['PC', 'Nintendo Switch', 'PlayStation 4', 'Xbox One', 'Android', 'iOS'],
    price: 'paid',
    summary: 'Leave city life, inherit a farm, and build a new life in a friendly small town.',
    about:
      'Grow crops, raise animals, fish, mine, make friends with the villagers and even get married. ' +
      'There is no pressure: play at your own pace. ' +
      'Up to 8 players can farm together in co-op. Made by just one developer.',
    highlights: ['Relaxing and cozy', 'Co-op farming with friends', 'Tons of free updates'],
    links: [steam(413150), site('https://www.stardewvalley.net/'), play('com.chucklefish.stardewvalley')],
    steamId: 413150,
  },
  {
    slug: 'minecraft',
    // Opens Minecraft for Windows (Bedrock).
    pcLaunch: 'minecraft://',
    image:
      'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/07/47/6f/07476fcd-1ecf-18ca-e7f7-364d6c6cd5e1/pr_source.png/920x0w.jpg',
    cover:
      'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/3b/b7/24/3bb724be-0244-933a-af48-ad2195689877/AppIcon-0-0-1x_U007emarketing-0-10-0-85-220.png/600x600bb.jpg',
    title: 'Minecraft',
    developer: 'Mojang Studios',
    year: 2011,
    genre: 'Sandbox',
    tags: ['Sandbox', 'Adventure', 'Simulation'],
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S', 'Nintendo Switch', 'Android', 'iOS'],
    price: 'paid',
    summary: 'Build anything you can imagine and survive in an endless blocky world.',
    about:
      'In Survival mode you gather resources, craft tools and survive the night against monsters. ' +
      'In Creative mode you have unlimited blocks to build anything. ' +
      'The best-selling game of all time, and great to play with friends.',
    highlights: ['Unlimited creativity', 'Survival and Creative modes', 'Huge community, mods and servers'],
    links: [site('https://www.minecraft.net/'), play('com.mojang.minecraftpe')],
  },
  {
    slug: 'terraria',
    title: 'Terraria',
    developer: 'Re-Logic',
    year: 2011,
    genre: 'Sandbox',
    tags: ['Sandbox', 'Adventure', 'Action', 'RPG'],
    platforms: ['PC', 'Nintendo Switch', 'PlayStation 4', 'Xbox One', 'Android', 'iOS'],
    price: 'paid',
    summary: 'Dig, fight, build and explore in a 2D world packed with bosses and loot.',
    about:
      'Like a 2D Minecraft with much more combat. Explore caves, find thousands of items, and fight epic bosses. ' +
      'It is very cheap and gives hundreds of hours of fun, especially in multiplayer.',
    highlights: ['Thousands of items', 'Epic boss fights', 'Hundreds of hours for a low price'],
    links: [steam(105600), site('https://terraria.org/')],
    steamId: 105600,
  },
  {
    slug: 'elden-ring',
    title: 'Elden Ring',
    developer: 'FromSoftware',
    year: 2022,
    genre: 'Action RPG',
    tags: ['Action RPG', 'RPG', 'Adventure', 'Open World'],
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S'],
    price: 'paid',
    summary: 'A massive, challenging open-world fantasy RPG from the makers of Dark Souls.',
    about:
      'Explore the Lands Between on horseback, discover hidden dungeons and face giant bosses. ' +
      'It is hard, but the open world lets you go somewhere else and come back stronger. ' +
      'Game of the Year 2022, with world-building co-written by George R. R. Martin.',
    highlights: [
      'Huge world full of secrets',
      'Unforgettable boss fights',
      'Many ways to build your character',
    ],
    links: [steam(1245620)],
    steamId: 1245620,
  },
  {
    slug: 'baldurs-gate-3',
    title: "Baldur's Gate 3",
    developer: 'Larian Studios',
    year: 2023,
    genre: 'RPG',
    tags: ['RPG', 'Strategy', 'Adventure'],
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S'],
    price: 'paid',
    summary: 'A huge Dungeons & Dragons RPG where your choices really change the story.',
    about:
      'Build your character and gather a party of memorable companions. ' +
      'Combat is turn-based and very creative: almost anything you can think of works. ' +
      'Game of the Year 2023. Can be played in co-op with up to 4 friends.',
    highlights: ['Choices that truly matter', 'Creative turn-based combat', 'Co-op for up to 4 players'],
    links: [steam(1086940)],
    steamId: 1086940,
  },
  {
    slug: 'the-witcher-3',
    title: 'The Witcher 3: Wild Hunt',
    developer: 'CD PROJEKT RED',
    year: 2015,
    genre: 'RPG',
    tags: ['RPG', 'Action RPG', 'Adventure', 'Open World'],
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S', 'Nintendo Switch'],
    price: 'paid',
    summary: 'Hunt monsters as Geralt of Rivia in one of the greatest story-driven RPGs.',
    about:
      'Geralt searches for his adopted daughter Ciri while the Wild Hunt chases her. ' +
      'Even the side quests have great stories with hard moral choices. ' +
      'Often on sale for a very low price, including its two excellent expansions.',
    highlights: ['Amazing story and side quests', 'Huge open world', 'Two great expansions'],
    links: [steam(292030)],
    steamId: 292030,
  },
  {
    slug: 'cyberpunk-2077',
    title: 'Cyberpunk 2077',
    developer: 'CD PROJEKT RED',
    year: 2020,
    genre: 'RPG',
    tags: ['RPG', 'Action RPG', 'Shooter', 'Open World'],
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S'],
    price: 'paid',
    summary: 'An open-world RPG set in Night City, a neon megacity obsessed with power and body mods.',
    about:
      'You are V, a mercenary with a digital ghost (played by Keanu Reeves) stuck in your head. ' +
      'After many updates and the Phantom Liberty expansion, it is now considered a great game. ' +
      'Play it as a shooter, a stealth hacker, or a sword-wielding cyborg.',
    highlights: ['Stunning futuristic city', 'Many play styles', 'Much improved since launch'],
    links: [steam(1091500)],
    steamId: 1091500,
  },
  {
    slug: 'red-dead-redemption-2',
    title: 'Red Dead Redemption 2',
    developer: 'Rockstar Games',
    year: 2018,
    genre: 'Action-Adventure',
    tags: ['Action-Adventure', 'Adventure', 'Shooter', 'Open World'],
    platforms: ['PC', 'PlayStation 4', 'Xbox One'],
    price: 'paid',
    summary: 'An epic Wild West story about outlaw Arthur Morgan and his gang.',
    about:
      'America, 1899. The age of outlaws is ending, and Arthur must choose between his ideals and his loyalty to the gang. ' +
      'The open world is incredibly detailed and alive. Slow-paced but unforgettable.',
    highlights: ['One of the best stories in games', 'Incredibly detailed world', 'Online mode included'],
    links: [steam(1174180), site('https://www.rockstargames.com/reddeadredemption2')],
    steamId: 1174180,
  },
  {
    slug: 'it-takes-two',
    title: 'It Takes Two',
    developer: 'Hazelight Studios',
    year: 2021,
    genre: 'Action-Adventure',
    tags: ['Action-Adventure', 'Platformer', 'Puzzle', 'Party'],
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S', 'Nintendo Switch'],
    price: 'paid',
    summary: 'A co-op-only adventure for two players; your friend can play free with the Friend’s Pass.',
    about:
      'Cody and May, a couple about to divorce, are turned into dolls and must work together to get home. ' +
      'Every level brings new gameplay ideas. ' +
      'Only one person needs to buy it: the second player joins online for free. Game of the Year 2021.',
    highlights: ['Made for two players', 'New ideas in every level', 'Friend plays free (Friend’s Pass)'],
    links: [steam(1426210), site('https://www.ea.com/games/it-takes-two')],
    steamId: 1426210,
  },
  {
    slug: 'celeste',
    title: 'Celeste',
    developer: 'Maddy Makes Games',
    year: 2018,
    genre: 'Platformer',
    tags: ['Platformer', 'Adventure'],
    platforms: ['PC', 'Nintendo Switch', 'PlayStation 4', 'Xbox One'],
    price: 'paid',
    summary: 'A tough but kind platformer about climbing a mountain and fighting your own anxiety.',
    about:
      'Help Madeline reach the top of Celeste Mountain through hundreds of precise jump-and-dash challenges. ' +
      'It is hard, but checkpoints are everywhere and Assist Mode helps if you get stuck. ' +
      'The story about mental health is heartfelt, and the soundtrack is amazing.',
    highlights: ['Precise, satisfying controls', 'Meaningful story', 'Assist Mode for any skill level'],
    links: [steam(504230), site('https://www.celestegame.com/')],
    steamId: 504230,
  },
  {
    slug: 'dead-cells',
    title: 'Dead Cells',
    developer: 'Motion Twin',
    year: 2018,
    genre: 'Roguelike',
    tags: ['Roguelike', 'Metroidvania', 'Action'],
    platforms: ['PC', 'Nintendo Switch', 'PlayStation 4', 'Xbox One', 'Android', 'iOS'],
    price: 'paid',
    summary: 'A fast roguelike-metroidvania: die, learn, and try again with new weapons.',
    about:
      'Explore a changing castle, collect weapons and skills, and fight tough bosses. ' +
      'When you die, you start over, but you keep unlocks that make the next run stronger. ' +
      'Combat is fast and smooth, and it plays great on phones too.',
    highlights: ['Very smooth combat', 'Every run is different', 'Also on mobile'],
    links: [steam(588650), site('https://dead-cells.com/')],
    steamId: 588650,
  },
  {
    slug: 'slay-the-spire',
    title: 'Slay the Spire',
    developer: 'MegaCrit',
    year: 2019,
    genre: 'Roguelike',
    tags: ['Roguelike', 'Strategy'],
    platforms: ['PC', 'Nintendo Switch', 'PlayStation 4', 'Xbox One', 'Android', 'iOS'],
    price: 'paid',
    summary: 'The card game roguelike that started a genre: build a deck and climb the Spire.',
    about:
      'Pick a character, climb floor by floor, and add new cards and relics to your deck after each fight. ' +
      'Every choice matters, and every run creates a different strategy. ' +
      'Easy to learn, very hard to master.',
    highlights: ['Smart deck-building strategy', 'Every run is different', 'Great on phones too'],
    links: [steam(646570), site('https://www.megacrit.com/')],
    steamId: 646570,
  },
  {
    slug: 'balatro',
    title: 'Balatro',
    developer: 'LocalThunk',
    year: 2024,
    genre: 'Roguelike',
    tags: ['Roguelike', 'Strategy'],
    platforms: ['PC', 'Nintendo Switch', 'PlayStation 5', 'Xbox Series X|S', 'Android', 'iOS'],
    price: 'paid',
    summary: 'A poker-themed roguelike where crazy Joker combos make your score explode.',
    about:
      'Play poker hands to beat score targets, and buy Jokers that change the rules in wild ways. ' +
      'Finding a broken combo that multiplies your score into the millions feels amazing. ' +
      'Very addictive: “just one more run”. You don’t need to know poker to enjoy it.',
    highlights: ['Extremely addictive', '150 Jokers to combine', 'Cheap and plays anywhere'],
    links: [steam(2379780), site('https://www.playbalatro.com/')],
    steamId: 2379780,
  },
  {
    slug: 'vampire-survivors',
    title: 'Vampire Survivors',
    developer: 'poncle',
    year: 2022,
    genre: 'Roguelike',
    tags: ['Roguelike', 'Action'],
    platforms: ['PC', 'Nintendo Switch', 'PlayStation 5', 'Xbox Series X|S', 'Android', 'iOS'],
    price: 'paid',
    summary: 'Survive 30 minutes against thousands of monsters while your weapons fire on their own.',
    about:
      'You only move; your weapons attack automatically. ' +
      'Level up, combine weapons into powerful evolutions, and watch the screen fill with chaos. ' +
      'Very cheap on PC and consoles, and free on phones.',
    highlights: ['Simple to play, hard to stop', 'Weapon evolutions', 'Free on mobile'],
    links: [steam(1794680), site('https://poncle.itch.io/vampire-survivors')],
    steamId: 1794680,
  },
  {
    slug: 'among-us',
    title: 'Among Us',
    developer: 'Innersloth',
    year: 2018,
    genre: 'Party',
    tags: ['Party', 'Strategy'],
    platforms: ['PC', 'Nintendo Switch', 'Android', 'iOS'],
    price: 'paid',
    summary: 'Find the impostor among your crewmates. Best with friends on voice chat.',
    about:
      'Crewmates do tasks around the ship while one or more impostors secretly sabotage and eliminate them. ' +
      'Call meetings, argue, and vote out who you think is lying. ' +
      'Free on phones and cheap on PC.',
    highlights: ['Perfect for friend groups', 'Simple rules, lots of drama', 'Free on mobile'],
    links: [steam(945360), play('com.innersloth.spacemafia')],
    steamId: 945360,
  },
  {
    slug: 'portal-2',
    title: 'Portal 2',
    developer: 'Valve',
    year: 2011,
    genre: 'Puzzle',
    tags: ['Puzzle', 'Platformer', 'Party'],
    platforms: ['PC'],
    price: 'paid',
    summary: 'A brilliant, funny puzzle game where you solve rooms with a portal gun.',
    about:
      'Shoot two connected portals on walls to move through space in mind-bending ways. ' +
      'The story is hilarious thanks to GLaDOS and Wheatley, and there is a separate co-op campaign. ' +
      'Often on sale for very cheap, and it runs on almost any PC.',
    highlights: ['Clever puzzles', 'Hilarious story', 'Great co-op campaign'],
    links: [steam(620)],
    steamId: 620,
  },
].map(({ image, cover, ...g }) => ({
  ...g,
  // Portrait art for the vault card; wide art for the Discover card.
  // Non-Steam games use official art from the App Store, Epic Games Store or the game's site.
  cover_url: cover ?? (g.steamId ? steamCover(g.steamId) : null),
  image_url: image ?? (g.steamId ? steamHeader(g.steamId) : null),
}));
