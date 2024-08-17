import { cardMap, leaderMap, CardData, LeaderCardData, defaultDeck, validateDeck, Player, Gwent } from "./gwent.mjs";

/////card tests/////

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


/////deck validation tests/////

test('testing validateDeck function for valid/default deck: ', () => {
  const defaultValidation = validateDeck(defaultDeck);

  expect(defaultValidation).toEqual({isValid: true, unitCount: 22, heroCount: 0, specialCount: 8, totalCardCount: 30, totalUnitStrength: 84});
});


test('testing validateDeck for invalid leader name / faction, invalid card name / faction, too many of 1 card, too many specials, and not enough units: ', () => {
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


/////game tests/////

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
    field: [{close: [], ranged: [], siege: []}, {close: [], ranged: [], siege: []}],
    weather: {close: false, ranged: false, siege: false},
    rallyHorns: [{close: false, ranged: false, siege: false}, {close: false, ranged: false, siege: false}],
    morale: [{close: 0, ranged: 0, siege: 0}, {close: 0, ranged: 0, siege: 0}],
    tightBondsMaps: [new Map(), new Map()]
  });


});

// test("testing combat strength calculations - normal, decoy, weather, rallyHorn, morale, tightBonds", () => {
//   const player1 = new Player("player one", "Northern Realms", "Foltest King of Temeria");
//   const player2 = new Player("player two", "Northern Realms", "Foltest King of Temeria");
  
//   const deck1 = [], deck2 = []; 
//   for(let cardName in defaultDeck.cards){
//     for(let i = 0; i < defaultDeck.cards[cardName]; i++){
//       deck1.push(cardMap.get(cardName));
//       deck2.push(cardMap.get(cardName));
//     }
//   }
  
//   const game = new Gwent(player1, player2, deck1, deck2);
  
//   game.players[0].hand = [
//     cardMap.get("Yarpen Zigrin"),
//     cardMap.get("Vesemir"),
//     cardMap.get("Geralt of Rivia"),
//     cardMap.get("Decoy"),
//     cardMap.get("Prince Stennis"),
//     cardMap.get("Crone: Brewess"),
//     cardMap.get("Crone: Weavess"),
//     cardMap.get("Crone: Whispess"),
//     cardMap.get("Scorch"),
//     cardMap.get("Biting Frost"),
//     cardMap.get("Clear Weather"),
//     cardMap.get("Commanders Horn")
//   ];

//   game.players[1].hand = [
//     cardMap.get("Torrential Rain"),
//     cardMap.get("Torrential Rain"),
//     cardMap.get("Torrential Rain"),
//     cardMap.get("Torrential Rain"),
//     cardMap.get("Torrential Rain"),
//     cardMap.get("Torrential Rain"),
//     cardMap.get("Torrential Rain"),
//     cardMap.get("Torrential Rain"),
//     cardMap.get("Torrential Rain"),
//     cardMap.get("Torrential Rain"),
//     cardMap.get("Torrential Rain")
//   ];

//   game.playCard(0, 0);



//   game.playCard(0, 0);
//   game.playCard(0, 0);
//   game.playCard(0, 0);
//   game.playCard(0, 0);
//   game.playCard(0, 0);
//   game.playCard(0, 0);
//   game.playCard(0, 0);
//   game.playCard(0, 0);


// });