import { cardMap, CardData, defaultDeck, validateDeck, Player, Gwent } from "./gwent.mjs";

/////card tests/////

//               CardData( name,             image_url,             type,  faction, strength, range, special, available, description)
const card = new CardData("Geralt of Rivia", "geralt_of_rivia.png", "hero", "neutral", "15", "close", "none", "1", "");

test('testing CardData constructor format: ', () => {
  expect(card).toEqual({name: "Geralt of Rivia", image_url: "geralt_of_rivia.png", type: "hero", faction: "neutral", strength: 15,
                        range: "close", special: "none", available: 1, description: ""});
});



/////deck tests/////

// const defaultDeckValidation = validateDeck(defaultDeck);

// test('testing validateDeck function for valid deck: ', () => {
//   expect(defaultDeckValidation).toEqual({isValid: true, unitCount: 22, heroCount: 0, specialCount: 8, totalCardCount: 30, totalUnitStrength: 84});
// });



/////game tests/////
const player1 = new Player("player one"), player2 = new Player("player two");
const deck1 = [], deck2 = [];




const game = new Gwent(p1, p2, defaultDeck, defaultDeck);
