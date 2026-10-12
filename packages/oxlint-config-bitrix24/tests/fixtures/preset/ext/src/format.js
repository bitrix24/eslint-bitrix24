import {Loc} from 'main.core';

export function format(text){
  const value = text + "!"; // eslint-disable-line quotes
  return value + "?"
}

export const loc = Loc;
