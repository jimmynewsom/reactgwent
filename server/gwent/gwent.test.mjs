import { cardMap, leaderMap, CardData, LeaderCardData, defaultDeck, validateDeck, Player, Gwent } from "./gwent.mjs";

//TODO: test scorch<Range> and medic

///// CARD TESTS /////

test('testing CardData constructor format: ', () => {
  //               CardData( name,             image_url,             type,  faction, strength, range, special, available, description)
  const card = new CardData("Geralt of Rivia", "geralt_of_rivia.png", "hero", "neutral", "15", "close", "none", "1", "");

  expect(card).toEqual({name: "Geralt of Rivia", image_url: "geralt_of_rivia.png", type: "hero", faction: "neutral", strength: 15,
                        range: "close", special: "none", available: 1, description: ""});
});

test('testing LeaderCardData constructor format: ', () => {
  //                     LeaderCardData( name,                      image_url,         faction,           desc, ability_description)
  const leaderCard = new LeaderCardData("Foltest King of Temeria", "king_foltest.png", "Northern Realms", "censored",
    "Pick an Impenetrable Fog card from your deck and play it instantly.");

  expect(leaderCard).toEqual({name: "Foltest King of Temeria", image_url: "king_foltest.png", faction: "Northern Realms", desc: "censored",
    ability_description: "Pick an Impenetrable Fog card from your deck and play it instantly."});
});



///// DECK VALIDATION TESTS /////

test('testing validateDeck function for valid/default deck: ', () => {
  const defaultValidation = validateDeck(defaultDeck);

  expect(defaultValidation).toEqual({isValid: true, unitCount: 22, heroCount: 0, specialCount: 8, totalCardCount: 30, totalUnitStrength: 84});
});

//decks must have leaders of the correct faction, 22 or more unit cards, and at most 10 special cards
test('testing validateDeck for invalid decks (invalid leader name / faction, invalid card name / faction, too many of 1 card, too many specials, and not enough units): ', () => {
  defaultDeck.leaderName = "asdlkj";
  const f1 = validateDeck(defaultDeck);
  expect(f1).toEqual({isValid: false, message: "leaderName invalid or wrong faction"});
  defaultDeck.leaderName = "Foltest King of Temeria";

  defaultDeck.faction = "Monsters";
  const f2 = validateDeck(defaultDeck);
  expect(f2).toEqual({isValid: false, message: "leaderName invalid or wrong faction"});
  defaultDeck.faction = "Northern Realms";

  defaultDeck.cards.FakeName = "asdlkj";
  const f3 = validateDeck(defaultDeck);
  expect(f3).toEqual({isValid: false, message: "cardName invalid"});
  delete defaultDeck.cards.FakeName;

  defaultDeck.cards.Ballista = 20;
  const f4 = validateDeck(defaultDeck);
  expect(f4).toEqual({isValid: false, message: "too many Ballista in deck"});
  defaultDeck.cards.Ballista = 2;

  defaultDeck.cards.Toruviel = 1;
  const f5 = validateDeck(defaultDeck);
  expect(f5).toEqual({isValid: false, message: "Toruviel is not part of Northern Realms"});
  delete defaultDeck.cards.Toruviel;

  defaultDeck.cards.Decoy = 3;
  const f6 = validateDeck(defaultDeck);
  expect(f6).toEqual({isValid: false, message: "too many special cards"});
  delete defaultDeck.cards.Decoy;

  defaultDeck.cards["Kaedweni Siege Expert"] = 1;
  const f7 = validateDeck(defaultDeck);
  expect(f7).toEqual({isValid: false, message: "not enough unit cards"});
  defaultDeck.cards["Kaedweni Siege Expert"] = 3;
});



///// GAME TESTS /////

test('testing Player constructor format: ', () => {
  const player1 = new Player("player one", "Northern Realms", "Foltest King of Temeria");

  expect(player1).toEqual({playerName: "player one", faction: "Northern Realms", leaderName: "Foltest King of Temeria", lives: 2, passed: false, usedLeaderAbility: false});
});

test('testing Game initial set up: ', () => {
  const player1 = new Player("player one", "Northern Realms", "Foltest King of Temeria");
  const player2 = new Player("player two", "Northern Realms", "Foltest King of Temeria");
  
  const deck1 = [], deck2 = []; 
  for(let cardName in defaultDeck.cards){
    for(let i = 0; i < defaultDeck.cards[cardName]; i++){
      deck1.push(cardMap.get(cardName));
      deck2.push(cardMap.get(cardName));
    }
  }
  
  const game = new Gwent(player1, player2, deck1, deck2);

  expect(game.round).toBe(1);
  expect(game.players).toEqual([{player: player1, deck: deck1, hand: game.players[0].hand}, {player: player2, deck: deck2, hand: game.players[1].hand}]);
  expect(game.board).toEqual({
    field: [{close: [], ranged: [], siege: [], graveyard: []}, {close: [], ranged: [], siege: [], graveyard: []}],
    weather: {close: false, ranged: false, siege: false},
    rallyHorns: [{close: false, ranged: false, siege: false}, {close: false, ranged: false, siege: false}],
    morale: [{close: 0, ranged: 0, siege: 0}, {close: 0, ranged: 0, siege: 0}],
    tightBondsMaps: [new Map(), new Map()]
  });


});

//Vesemir is a normal unit, Geralt is a hero unit, and Decoy is a special unit, so this test covers all unit types
//normal units are subject to weather and rally horns, hero and special units are not
//testing normal conditions, weather on, rallyHorns on, and weather and rallyHorns on
test("testing combat strength calculations - normal, hero, decoy, weather, rallyHorn, morale: ", () => {
  const player1 = new Player("player one", "Northern Realms", "Foltest King of Temeria");
  const player2 = new Player("player two", "Northern Realms", "Foltest King of Temeria");
  
  const deck1 = [], deck2 = []; 
  for(let cardName in defaultDeck.cards){
    for(let i = 0; i < defaultDeck.cards[cardName]; i++){
      deck1.push(cardMap.get(cardName));
      deck2.push(cardMap.get(cardName));
    }
  }
  
  const game = new Gwent(player1, player2, deck1, deck2);

  game.board.field[0].close = [cardMap.get("Vesemir"), cardMap.get("Geralt of Rivia"), cardMap.get("Decoy")];

  expect(game.board.getCardStrength(0, "close", 0)).toBe(6);
  expect(game.board.getCardStrength(0, "close", 1)).toBe(15);
  expect(game.board.getCardStrength(0, "close", 2)).toBe(0);
  expect(game.board.getRowStrength(0, "close")).toBe(21);

  game.board.rallyHorns[0].close = true;

  expect(game.board.getCardStrength(0, "close", 0)).toBe(12);
  expect(game.board.getCardStrength(0, "close", 1)).toBe(15);
  expect(game.board.getCardStrength(0, "close", 2)).toBe(0);
  expect(game.board.getRowStrength(0, "close")).toBe(27);

  game.board.rallyHorns[0].close = false;
  game.board.weather.close = true;

  expect(game.board.getCardStrength(0, "close", 0)).toBe(1);
  expect(game.board.getCardStrength(0, "close", 1)).toBe(15);
  expect(game.board.getCardStrength(0, "close", 2)).toBe(0);
  expect(game.board.getRowStrength(0, "close")).toBe(16);

  game.board.rallyHorns[0].close = true;

  expect(game.board.getCardStrength(0, "close", 0)).toBe(2);
  expect(game.board.getCardStrength(0, "close", 1)).toBe(15);
  expect(game.board.getCardStrength(0, "close", 2)).toBe(0);
  expect(game.board.getRowStrength(0, "close")).toBe(17);

  game.board.weather.close = false;
  game.board.rallyHorns[0].close = false;
  game.board.morale[0].close = 5;

  expect(game.board.getCardStrength(0, "close", 0)).toBe(11);
  expect(game.board.getCardStrength(0, "close", 1)).toBe(15);
  expect(game.board.getCardStrength(0, "close", 2)).toBe(0);
  expect(game.board.getRowStrength(0, "close")).toBe(26);

  game.board.weather.close = true;

  expect(game.board.getCardStrength(0, "close", 0)).toBe(6);
  expect(game.board.getCardStrength(0, "close", 1)).toBe(15);
  expect(game.board.getCardStrength(0, "close", 2)).toBe(0);
  expect(game.board.getRowStrength(0, "close")).toBe(21);

  game.board.rallyHorns[0].close = true;

  expect(game.board.getCardStrength(0, "close", 0)).toBe(12);
  expect(game.board.getCardStrength(0, "close", 1)).toBe(15);
  expect(game.board.getCardStrength(0, "close", 2)).toBe(0);
  expect(game.board.getRowStrength(0, "close")).toBe(27);
});

test("testing tight bonds: ", () => {
  const player1 = new Player("player one", "Northern Realms", "Foltest King of Temeria");
  const player2 = new Player("player two", "Northern Realms", "Foltest King of Temeria");
  
  const deck1 = [], deck2 = []; 
  for(let cardName in defaultDeck.cards){
    for(let i = 0; i < defaultDeck.cards[cardName]; i++){
      deck1.push(cardMap.get(cardName));
      deck2.push(cardMap.get(cardName));
    }
  }
  
  const game = new Gwent(player1, player2, deck1, deck2);
  game.players[0].hand = [cardMap.get("Blue Stripes Commando"), cardMap.get("Blue Stripes Commando"), cardMap.get("Blue Stripes Commando")];
  
  game.playersTurn = 0;
  game.playCard(0, 0);

  expect(game.board.getCardStrength(0, "close", 0)).toBe(4);

  game.playersTurn = 0;
  game.playCard(0, 0);

  expect(game.board.getCardStrength(0, "close", 0)).toBe(8);
  
  game.playersTurn = 0;
  game.playCard(0, 0);

  expect(game.board.getCardStrength(0, "close", 0)).toBe(16);
  
  game.board.weather.close = true;

  expect(game.board.getCardStrength(0, "close", 0)).toBe(4);

  game.board.morale[0].close = 2;

  expect(game.board.getCardStrength(0, "close", 0)).toBe(12);

  game.board.rallyHorns[0].close = true;
  
  expect(game.board.getCardStrength(0, "close", 0)).toBe(24);
});

//technically I should test every muster group for full coverage, but I am lazy and this a free project....
//might add more test cases later. this covers muster with cards in your hand and deck
test("testing muster: ", () => {
  const player1 = new Player("player one", "Northern Realms", "Foltest King of Temeria");
  const player2 = new Player("player two", "Northern Realms", "Foltest King of Temeria");
  
  const deck1 = [], deck2 = []; 
  for(let cardName in defaultDeck.cards){
    for(let i = 0; i < defaultDeck.cards[cardName]; i++){
      deck1.push(cardMap.get(cardName));
      deck2.push(cardMap.get(cardName));
    }
  }
  
  const game = new Gwent(player1, player2, deck1, deck2);
  game.players[0].hand = [cardMap.get("Crone: Brewess"), cardMap.get("Crone: Weavess")];
  game.players[0].deck.push(cardMap.get("Crone: Whispess"));

  game.playersTurn = 0;
  game.playCard(0, 0);

  expect(game.board.getRowStrength(0, "close")).toBe(18);
});

test("testing scorch: ", () => {
  const player1 = new Player("player one", "Northern Realms", "Foltest King of Temeria");
  const player2 = new Player("player two", "Northern Realms", "Foltest King of Temeria");
  
  const deck1 = [], deck2 = []; 
  for(let cardName in defaultDeck.cards){
    for(let i = 0; i < defaultDeck.cards[cardName]; i++){
      deck1.push(cardMap.get(cardName));
      deck2.push(cardMap.get(cardName));
    }
  }
  
  const game = new Gwent(player1, player2, deck1, deck2);

  //scorch should burn the vesemirs but leave the rest
  game.players[0].hand = [cardMap.get("Scorch")];
  game.board.field[1].close = [cardMap.get("Geralt of Rivia"), cardMap.get("Vesemir"), cardMap.get("Keira Metz")];
  game.board.field[1].siege = [cardMap.get("Dun Banner Medic")];
  game.board.field[0].close = [cardMap.get("Vesemir"), cardMap.get("Vesemir")];

  game.playersTurn = 0;
  game.playCard(0, 0);

  expect(game.board.getRowStrength(1, "close")).toBe(20);
  expect(game.board.getRowStrength(1, "siege")).toBe(5);
  expect(game.board.getRowStrength(0, "close")).toBe(0);
});

test("testing spy: ", () => {
  const player1 = new Player("player one", "Northern Realms", "Foltest King of Temeria");
  const player2 = new Player("player two", "Northern Realms", "Foltest King of Temeria");
  
  const deck1 = [], deck2 = []; 
  for(let cardName in defaultDeck.cards){
    for(let i = 0; i < defaultDeck.cards[cardName]; i++){
      deck1.push(cardMap.get(cardName));
      deck2.push(cardMap.get(cardName));
    }
  }
  
  const game = new Gwent(player1, player2, deck1, deck2);
  game.players[0].hand = [cardMap.get("Sigismund Dijkstra")];
  game.playersTurn = 0;
  game.playCard(0, 0);

  //player 0 should get extra cards, Sigismund Dijkstra should be in opponents close range section
  expect(game.players[0].hand.length).toBe(2);
  expect(game.board.getRowStrength(1, "close")).toBe(4);
});

test("testing morale (via playCard method): ", () => {
  const player1 = new Player("player one", "Northern Realms", "Foltest King of Temeria");
  const player2 = new Player("player two", "Northern Realms", "Foltest King of Temeria");
  
  const deck1 = [], deck2 = []; 
  for(let cardName in defaultDeck.cards){
    for(let i = 0; i < defaultDeck.cards[cardName]; i++){
      deck1.push(cardMap.get(cardName));
      deck2.push(cardMap.get(cardName));
    }
  }
  
  const game = new Gwent(player1, player2, deck1, deck2);
  game.players[0].hand = [cardMap.get("Kaedweni Siege Expert")];
  game.playersTurn = 0;
  game.playCard(0, 0);

  expect(game.board.morale[0].siege).toBe(1);
});

test("testing weather: ", () => {
  const player1 = new Player("player one", "Northern Realms", "Foltest King of Temeria");
  const player2 = new Player("player two", "Northern Realms", "Foltest King of Temeria");
  
  const deck1 = [], deck2 = []; 
  for(let cardName in defaultDeck.cards){
    for(let i = 0; i < defaultDeck.cards[cardName]; i++){
      deck1.push(cardMap.get(cardName));
      deck2.push(cardMap.get(cardName));
    }
  }
  
  const game = new Gwent(player1, player2, deck1, deck2);
  game.players[0].hand = [cardMap.get("Biting Frost"), cardMap.get("Impenetrable Fog"), cardMap.get("Torrential Rain"), cardMap.get("Clear Weather")];
  game.playersTurn = 0;
  game.playCard(0, 0);
  game.playersTurn = 0;
  game.playCard(0, 0);
  game.playersTurn = 0;
  game.playCard(0, 0);

  expect(game.board.weather.close).toBe(true);
  expect(game.board.weather.ranged).toBe(true);
  expect(game.board.weather.siege).toBe(true);

  game.playersTurn = 0;
  game.playCard(0, 0);

  expect(game.board.weather.close).toBe(false);
});

//if the player plays a commanders horn, target should specify the range
test("testing rally horns: ", () => {
  const player1 = new Player("player one", "Northern Realms", "Foltest King of Temeria");
  const player2 = new Player("player two", "Northern Realms", "Foltest King of Temeria");
  
  const deck1 = [], deck2 = []; 
  for(let cardName in defaultDeck.cards){
    for(let i = 0; i < defaultDeck.cards[cardName]; i++){
      deck1.push(cardMap.get(cardName));
      deck2.push(cardMap.get(cardName));
    }
  }
  
  const game = new Gwent(player1, player2, deck1, deck2);
  game.players[0].hand = [cardMap.get("Commanders Horn")];
  game.playersTurn = 0;
  game.playCard(0, 0, "close");

  expect(game.board.rallyHorns[0].close).toBe(true);
});

//if the player plays a decoy, target should specify range & index, eg. {range: "close", index: 3}
test("testing decoy: ", () => {
  const player1 = new Player("player one", "Northern Realms", "Foltest King of Temeria");
  const player2 = new Player("player two", "Northern Realms", "Foltest King of Temeria");
  
  const deck1 = [], deck2 = []; 
  for(let cardName in defaultDeck.cards){
    for(let i = 0; i < defaultDeck.cards[cardName]; i++){
      deck1.push(cardMap.get(cardName));
      deck2.push(cardMap.get(cardName));
    }
  }
  
  const game = new Gwent(player1, player2, deck1, deck2);
  game.players[0].hand = [cardMap.get("Decoy")];
  game.board.field[0].close = [cardMap.get("Vesemir")];
  game.playersTurn = 0;
  game.playCard(0, 0, {range: "close", index: 0});

  expect(game.board.getCardStrength(0, "close", 0)).toBe(0);
});

//Nilfgaard wins ties
test("testing endRoundAndCalculateWinner: ", () => {
  const player1 = new Player("player one", "Northern Realms", "Foltest King of Temeria");
  const player2 = new Player("player two", "Northern Realms", "Foltest King of Temeria");
  
  const deck1 = [], deck2 = []; 
  for(let cardName in defaultDeck.cards){
    for(let i = 0; i < defaultDeck.cards[cardName]; i++){
      deck1.push(cardMap.get(cardName));
      deck2.push(cardMap.get(cardName));
    }
  }
  
  const game = new Gwent(player1, player2, deck1, deck2);
  game.players[1].player.faction = "Nilfgaard";
  game.playersTurn = 0;
  game.pass(0);
  game.pass(1);

  expect(game.players[0].player.lives).toBe(1);

  game.board.field[0].close = [cardMap.get("Geralt of Rivia")];
  game.playersTurn = 0;
  game.pass(0);
  game.pass(1);

  expect(game.players[1].player.lives).toBe(1);

  game.board.field[0].close = [cardMap.get("Geralt of Rivia")];
  game.playersTurn = 0;
  game.pass(0);
  game.pass(1);

  expect(game.players[1].player.lives).toBe(0);
});