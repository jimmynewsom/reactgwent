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

// Range-specific scorch tests

test('testing scorchClose (range-specific): ', () => {
  const player1 = new Player('player one', 'Northern Realms', 'Foltest King of Temeria');
  const player2 = new Player('player two', 'Northern Realms', 'Foltest King of Temeria');
  
  const deck1 = [], deck2 = []; 
  for(let cardName in defaultDeck.cards){
    for(let i = 0; i < defaultDeck.cards[cardName]; i++){
      deck1.push(cardMap.get(cardName));
      deck2.push(cardMap.get(cardName));
    }
  }

  const game = new Gwent(player1, player2, deck1, deck2);

  // opponent close has two Vesemirs (6 each) and a Dethmold (6). Total >= 10 -> scorch should remove all highest-strength non-hero cards
  game.players[0].hand = [cardMap.get('Villentretenmerth')];
  game.board.field[1].close = [cardMap.get('Vesemir'), cardMap.get('Vesemir'), cardMap.get('Dethmold')];

  game.playersTurn = 0;
  game.playCard(0, 0);

  // all cards with max non-hero strength (6) should be removed, leaving nothing in the close row
  expect(game.board.field[1].close.some(c => c.name === 'Vesemir')).toBe(false);
  expect(game.board.field[1].close.length).toBe(0);
});

test('testing scorchRanged (range-specific): ', () => {
  const player1 = new Player('player one', 'Northern Realms', 'Foltest King of Temeria');
  const player2 = new Player('player two', 'Northern Realms', 'Foltest King of Temeria');
  
  const deck1 = [], deck2 = []; 
  for(let cardName in defaultDeck.cards){
    for(let i = 0; i < defaultDeck.cards[cardName]; i++){
      deck1.push(cardMap.get(cardName));
      deck2.push(cardMap.get(cardName));
    }
  }

  const game = new Gwent(player1, player2, deck1, deck2);

  // opponent ranged has two Vesemirs (6 each). Triss Merigold (hero with scorchRanged) should scorch ranged and remove both Vesemirs
  game.players[0].hand = [cardMap.get('Triss Merigold')];
  game.board.field[1].ranged = [cardMap.get('Vesemir'), cardMap.get('Vesemir')];

  game.playersTurn = 0;
  game.playCard(0, 0);

  expect(game.board.field[1].ranged.some(c => c.name === 'Vesemir')).toBe(false);
  expect(game.board.field[1].ranged.length).toBe(0);
});

test('testing scorchSiege (range-specific): ', () => {
  const player1 = new Player('player one', 'Northern Realms', 'Foltest King of Temeria');
  const player2 = new Player('player two', 'Northern Realms', 'Foltest King of Temeria');
  
  const deck1 = [], deck2 = []; 
  for(let cardName in defaultDeck.cards){
    for(let i = 0; i < defaultDeck.cards[cardName]; i++){
      deck1.push(cardMap.get(cardName));
      deck2.push(cardMap.get(cardName));
    }
  }

  const game = new Gwent(player1, player2, deck1, deck2);

  // craft a small unit card that triggers scorchSiege when played
  const scorchSiegeCard = { name: 'TestScorchSiege', type: 'unit', special: 'scorchSiege', range: 'close', strength: 5 };
  game.players[0].hand = [scorchSiegeCard];

  // opponent siege row has two Dun Banner Medics (5 each) and Kaedweni Siege Expert (3) -> total >= 10
  game.board.field[1].siege = [cardMap.get('Dun Banner Medic'), cardMap.get('Dun Banner Medic'), cardMap.get('Kaedweni Siege Expert')];

  game.playersTurn = 0;
  game.playCard(0, 0);

  // Dun Banner Medics (5) should be removed as the highest non-hero in siege
  expect(game.board.field[1].siege.some(c => c.name === 'Dun Banner Medic')).toBe(false);
  expect(game.board.field[1].siege.length).toBe(1);
  expect(game.board.field[1].siege[0].name).toBe('Kaedweni Siege Expert');
});

// MEDIC tests

test('medic revives a single card from graveyard', () => {
  const p1 = new Player('p1', 'Northern Realms', 'Foltest King of Temeria');
  const p2 = new Player('p2', 'Northern Realms', 'Foltest King of Temeria');
  const deck1 = [cardMap.get('Dethmold')];
  const deck2 = [cardMap.get('Dethmold')];

  const g = new Gwent(p1, p2, deck1, deck2);
  g.playersTurn = 0;

  // player has a medic in hand and a Dethmold in graveyard
  g.players[0].hand = [cardMap.get('Dun Banner Medic')];
  g.board.field[0].graveyard = [cardMap.get('Dethmold')];

  g.playCard(0, 0, [0]);

  // expect medic on siege row and Dethmold revived somewhere on player's board
  expect(g.board.field[0].siege.some(c => c.name === 'Dun Banner Medic')).toBe(true);
  expect(g.board.field[0].close.concat(g.board.field[0].ranged, g.board.field[0].siege).some(c => c.name === 'Dethmold')).toBe(true);
  expect(g.board.field[0].graveyard.length).toBe(0);
});

test('medic revives medics in a chain', () => {
  const p1 = new Player('p1', 'Northern Realms', 'Foltest King of Temeria');
  const p2 = new Player('p2', 'Northern Realms', 'Foltest King of Temeria');
  const deck1 = [cardMap.get('Dethmold')];
  const deck2 = [cardMap.get('Dethmold')];

  const g = new Gwent(p1, p2, deck1, deck2);
  g.playersTurn = 0;

  // graveyard: first a medic, then a Dethmold
  g.board.field[0].graveyard = [cardMap.get('Dun Banner Medic'), cardMap.get('Dethmold')];
  g.players[0].hand = [cardMap.get('Dun Banner Medic')];

  // play medic and supply snapshot indexes [0,1]
  g.playCard(0, 0, [0,1]);

  expect(g.board.field[0].graveyard.length).toBe(0);
  expect(g.board.field[0].close.concat(g.board.field[0].ranged, g.board.field[0].siege).some(c => c.name === 'Dethmold')).toBe(true);
});

// ensure medics cannot revive non-unit types (e.g., heroes)
test('medic cannot revive non-unit types', () => {
  const p1 = new Player('p1', 'Northern Realms', 'Foltest King of Temeria');
  const p2 = new Player('p2', 'Northern Realms', 'Foltest King of Temeria');
  const deck1 = [cardMap.get('Dethmold')];
  const deck2 = [cardMap.get('Dethmold')];

  const g = new Gwent(p1, p2, deck1, deck2);
  g.playersTurn = 0;

  // graveyard contains a hero (Geralt)
  g.board.field[0].graveyard = [cardMap.get('Geralt of Rivia')];
  g.players[0].hand = [cardMap.get('Dun Banner Medic')];

  g.playCard(0, 0, [0]);

  // Geralt should remain in graveyard and not be placed on board
  expect(g.board.field[0].graveyard.length).toBe(1);
  expect(g.board.field[0].close.concat(g.board.field[0].ranged, g.board.field[0].siege).some(c => c.name === 'Geralt of Rivia')).toBe(false);
});

test('medic revives spy and triggers spy effects', () => {
  const p1 = new Player('p1', 'Northern Realms', 'Foltest King of Temeria');
  const p2 = new Player('p2', 'Northern Realms', 'Foltest King of Temeria');
  const deck1 = [cardMap.get('Dethmold')];
  const deck2 = [cardMap.get('Dethmold')];

  const g = new Gwent(p1, p2, deck1, deck2);
  g.playersTurn = 0;

  // graveyard contains a spy (Sigismund Dijkstra)
  g.board.field[0].graveyard = [cardMap.get('Sigismund Dijkstra')];
  g.players[0].hand = [cardMap.get('Dun Banner Medic')];
  // ensure deck has cards to draw from when spy is revived
  g.players[0].deck = [cardMap.get('Dethmold'), cardMap.get('Dethmold')];

  const prevHand = g.players[0].hand.length;
  g.playCard(0, 0, [0]);

  // spy should be moved to opponent's board and player should draw 2
  expect(g.players[0].hand.length).toBeGreaterThanOrEqual(prevHand);
  expect(g.board.field[1].close.some(c => c.name === 'Sigismund Dijkstra')).toBe(true);
});

// new test: medic revives an agile unit and places it into the specified row
test('medic revives agile unit into specified row', () => {
  const p1 = new Player('p1', 'Scoiatael', 'Queen of Dol Blathanna');
  const p2 = new Player('p2', 'Northern Realms', 'Foltest King of Temeria');
  const deck1 = [cardMap.get('Dethmold')];
  const deck2 = [cardMap.get('Dethmold')];

  const g = new Gwent(p1, p2, deck1, deck2);
  g.playersTurn = 0;

  // graveyard contains an agile unit (Yaevinn)
  g.board.field[0].graveyard = [cardMap.get('Yaevinn')];
  g.players[0].hand = [cardMap.get('Dun Banner Medic')];

  g.playCard(0, 0, [0], 'ranged');

  expect(g.board.field[0].ranged.some(c => c.name === 'Yaevinn')).toBe(true);
  expect(g.board.field[0].close.some(c => c.name === 'Yaevinn')).toBe(false);
});

// invalid-target tests

test('scorch removes morale counters when morale unit is killed', () => {
  const p1 = new Player('p1', 'Scoiatael', 'the Beautiful');
  const p2 = new Player('p2', 'Northern Realms', 'Foltest King of Temeria');
  const deck1 = [cardMap.get('Dethmold')];
  const deck2 = [cardMap.get('Dethmold')];

  const g = new Gwent(p1, p2, deck1, deck2);
  g.playersTurn = 0;

  // place Milva (ranged, morale) on board
  g.players[0].hand = [cardMap.get('Milva')];
  g.playCard(0, 0, 'ranged');
  expect(g.board.field[0].ranged.some(c => c.name === 'Milva')).toBe(true);
  expect(g.board.morale[0].ranged).toBe(1);

  // play Scorch special to kill highest cards
  g.players[0].hand = [cardMap.get('Scorch')];
  g.playersTurn = 0;
  g.playCard(0, 0);

  expect(g.board.field[0].ranged.some(c => c.name === 'Milva')).toBe(false);
  expect(g.board.morale[0].ranged).toBe(0);
});

test('scorch updates tight bond map when tight-bonded units are killed', () => {
  const p1 = new Player('p1', 'Northern Realms', 'Foltest King of Temeria');
  const p2 = new Player('p2', 'Northern Realms', 'Foltest King of Temeria');
  const deck1 = [cardMap.get('Dethmold')];
  const deck2 = [cardMap.get('Dethmold')];

  const g = new Gwent(p1, p2, deck1, deck2);
  g.playersTurn = 0;

  // play two Blue Stripes Commando (close, tight bond)
  g.players[0].hand = [cardMap.get('Blue Stripes Commando'), cardMap.get('Blue Stripes Commando')];
  g.playCard(0, 0);
  g.playersTurn = 0;
  g.playCard(0, 0);

  const tbMap = g.board.tightBondsMaps[0];
  expect(tbMap.has('Blue Stripes Commando')).toBe(true);
  // after two are played the stored count should be 1
  expect(tbMap.get('Blue Stripes Commando')).toBe(1);

  // sanity-check strengths before scorch
  const s0 = g.board.getCardStrength(0, 'close', 0);
  const s1 = g.board.getCardStrength(0, 'close', 1);
  expect(s0).toBe(s1);
  expect(s0).toBeGreaterThanOrEqual(4);

  // play Scorch to remove strongest (both are same strength so will be removed)
  g.players[0].hand = [cardMap.get('Scorch')];
  g.playersTurn = 0;
  g.playCard(0, 0);

  expect(g.board.field[0].close.some(c => c.name === 'Blue Stripes Commando')).toBe(false);
  expect(g.board.tightBondsMaps[0].has('Blue Stripes Commando')).toBe(false);
});
test('medic fails with duplicate indices and restores the medic', () => {
  const p1 = new Player('p1', 'Northern Realms', 'Foltest King of Temeria');
  const p2 = new Player('p2', 'Northern Realms', 'Foltest King of Temeria');
  const deck1 = [cardMap.get('Dethmold')];
  const deck2 = [cardMap.get('Dethmold')];

  const g = new Gwent(p1, p2, deck1, deck2);
  g.playersTurn = 0;

  // graveyard two units
  g.board.field[0].graveyard = [cardMap.get('Dethmold'), cardMap.get('Vesemir')];
  g.players[0].hand = [cardMap.get('Dun Banner Medic')];

  g.playCard(0, 0, [0,0]);

  // duplicate indices should cause validation failure; medic restored to hand, no revival
  expect(g.players[0].hand.some(c => c.name === 'Dun Banner Medic')).toBe(true);
  expect(g.board.field[0].graveyard.length).toBe(2);
  expect(g.board.field[0].close.concat(g.board.field[0].ranged, g.board.field[0].siege).some(c => c.name === 'Dethmold')).toBe(false);
});

test('medic fails with out-of-range index and restores the medic', () => {
  const p1 = new Player('p1', 'Northern Realms', 'Foltest King of Temeria');
  const p2 = new Player('p2', 'Northern Realms', 'Foltest King of Temeria');
  const deck1 = [cardMap.get('Dethmold')];
  const deck2 = [cardMap.get('Dethmold')];

  const g = new Gwent(p1, p2, deck1, deck2);
  g.playersTurn = 0;

  // graveyard has one unit
  g.board.field[0].graveyard = [cardMap.get('Dethmold')];
  g.players[0].hand = [cardMap.get('Dun Banner Medic')];

  g.playCard(0, 0, [5]);

  // out-of-range should cause validation failure; medic restored to hand, no revival
  expect(g.players[0].hand.some(c => c.name === 'Dun Banner Medic')).toBe(true);
  expect(g.board.field[0].graveyard.length).toBe(1);
  expect(g.board.field[0].close.concat(g.board.field[0].ranged, g.board.field[0].siege).some(c => c.name === 'Dethmold')).toBe(false);
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