const random = require('random');
const seedrandom = require('seedrandom');
const fs = require('fs');

random.use(seedrandom('foobar'));
console.log(random.float(0.000000001, 0.999999999));

// let myArr = [];
// for (i = 0; i < 1000; i++) {
//   myArr.push(random.float(0.000000001, 0.999999999));
// }

// fs.writeFileSync('./data.csv', JSON.stringify(myArr));
