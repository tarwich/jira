export type NonHomomorphicKeys<T> = ({[P in keyof T]: P } & { [x: string]: never })[keyof T];
export type Required<T> = {
  [K in NonHomomorphicKeys<T>]: T[K];
};
