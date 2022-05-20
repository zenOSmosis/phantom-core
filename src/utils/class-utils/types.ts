// Borrowed from: https://stackoverflow.com/questions/39392853/is-there-a-type-for-class-in-typescript-and-does-any-include-it
export type Class = { new (...args: any[]): any };

// TODO: [3.0.0] Fix any type
export type ClassInstance = any;
