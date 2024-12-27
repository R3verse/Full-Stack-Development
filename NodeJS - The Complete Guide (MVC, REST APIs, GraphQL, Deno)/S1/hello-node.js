const person = {
  name: "Max",
  age: 31,
  greet() {
    console.log(
      "Hello, I'm " + this.name + " and I'm " + this.age + " years old."
    );
  },
};

const hobbies = ["Sports", "Cooking"];

console.log(hobbies.map((hobby) => "Hobby: " + hobby));
const copiedArray = [...hobbies];
console.log(copiedArray);
console.log(hobbies);
console.log(person.name);

const toArray = (...args) => {
  return args;
};

console.log(toArray("example", "max", "1", "2"));
const printName = ({ name, age }) => {
  console.log(name, age);
};

printName(person);
