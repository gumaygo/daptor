"use strict";

function wrap(open, close) {
  return (value) => {
    if (!process.stdout.isTTY) {
      return String(value);
    }
    return `${open}${value}${close}`;
  };
}

module.exports = {
  blueBold: wrap("\u001b[1;34m", "\u001b[0m"),
  greenBold: wrap("\u001b[1;32m", "\u001b[0m"),
  redBold: wrap("\u001b[1;31m", "\u001b[0m"),
  yellow: wrap("\u001b[33m", "\u001b[0m"),
  gray: wrap("\u001b[90m", "\u001b[0m"),
};
