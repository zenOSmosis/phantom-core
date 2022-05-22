interface IClass {
  new (): IClass;
}

// TODO: [3.0.0] Fix any type
// Borrowed from: https://stackoverflow.com/questions/39392853/is-there-a-type-for-class-in-typescript-and-does-any-include-it
export type Class<T = any> = IClass;

// TODO: Remove this... or rename and use intersection type
// TODO: [3.0.0] Fix any type
export type ClassInstance = any;
