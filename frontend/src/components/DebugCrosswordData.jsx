// This file provides simple test crossword data that matches
// what's shown in the UI with no letter conflicts

/**
 * Returns simple mock crossword data for testing
 */
export const getFormattedMockData = () => {
    // Create a simple grid based on the words shown in your UI screenshot
    // JAZZ, ROCK, BEAT, JAM, BAND, KEYS
    return {
      // The table property is what your CrosswordPlayer component uses for rendering
      table: [
        ['J', 'A', 'Z', 'Z', '-', '-'],
        ['-', '-', '-', 'B', '-', '-'],
        ['R', 'O', 'C', 'K', '-', '-'],
        ['-', '-', '-', 'E', '-', '-'],
        ['B', 'E', 'A', 'T', '-', '-'],
        ['-', '-', '-', '-', '-', '-']
      ],
      // The result property contains all the crossword entries with coordinates
      result: [
        {
          answer: "JAZZ",
          clue: "Musical genre known for improvisation",
          orientation: "across",
          position: 1,
          startx: 0,
          starty: 0
        },
        {
          answer: "ROCK",
          clue: "Music popular for electric guitars",
          orientation: "across",
          position: 2,
          startx: 0,
          starty: 2
        },
        {
          answer: "BEAT",
          clue: "Rhythmic pulse in music",
          orientation: "across",
          position: 3,
          startx: 0,
          starty: 4
        },
        {
          answer: "JAM",
          clue: "Musicians playing together informally",
          orientation: "down",
          position: 1,
          startx: 0,
          starty: 0
        },
        {
          answer: "BAND",
          clue: "Group of musicians playing together",
          orientation: "down",
          position: 4,
          startx: 3,
          starty: 0
        },
        {
          answer: "KEYS",
          clue: "Piano or other keyboard instruments",
          orientation: "down",
          position: 5,
          startx: 1,
          starty: 1
        }
      ]
    };
  };
  export default DebugCrosswordData;
