function durstenfeldShuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.random() * array.length | 0;
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}
