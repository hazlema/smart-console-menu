import * as readline from 'readline'; 

console.log({
  node: process.version,
  platform: process.platform,
  stdin_isTTY: process.stdin.isTTY,
  stdout_isTTY: process.stdout.isTTY,
  TERM: process.env.TERM,
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Enter value: ', (answer) => {
  console.log(`You entered: ${answer}`);
  rl.close();
});
