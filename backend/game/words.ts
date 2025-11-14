export const wordList = [
  "apple", "house", "tree", "car", "dog", "cat", "book", "phone", "computer", "chair",
  "table", "door", "window", "flower", "sun", "moon", "star", "cloud", "rain", "snow",
  "mountain", "river", "ocean", "island", "bridge", "castle", "tower", "rocket", "airplane", "boat",
  "bicycle", "train", "bus", "truck", "pizza", "burger", "cake", "cookie", "ice cream", "coffee",
  "tea", "water", "juice", "bread", "cheese", "egg", "fish", "chicken", "carrot", "banana",
  "strawberry", "orange", "grape", "watermelon", "pineapple", "hat", "shoes", "shirt", "pants", "dress",
  "glasses", "watch", "ring", "necklace", "crown", "sword", "shield", "bow", "arrow", "gun",
  "hammer", "saw", "drill", "wrench", "screwdriver", "pencil", "pen", "eraser", "ruler", "scissors",
  "glue", "tape", "paper", "envelope", "stamp", "key", "lock", "clock", "calendar", "camera",
  "television", "radio", "speaker", "microphone", "guitar", "piano", "drum", "violin", "trumpet", "saxophone"
];

export function getRandomWords(count: number): string[] {
  const shuffled = [...wordList].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
