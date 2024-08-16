import { cardMap, CardData, LeaderCardData, defaultDeck, validateDeck, Player, Gwent, leaderMap } from "./gwent.mjs";

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


test('testing validateDeck for invalid leader name / faction, invalid card name / faction, too many specials, and not enough units: ', () => {
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
const p1 = new Player("player one"), p2 = new Player("player two");
const d1 = [], d2 = [];




const game = new Gwent(p1, p2, d1, d2);
