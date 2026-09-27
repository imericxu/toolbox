import { humanId } from "human-id";

const messages = (await Bun.file("messages/en.json").json()) as Record<string, unknown>;

let key: string;

do {
  key = humanId({
    capitalize: false,
    separator: "_",
  });
} while (Object.hasOwn(messages, key));

console.log(key);
