import type { Language } from "../../types";

export type Lang = Exclude<Language, "en">;

/** English source string -> translation per non-English language. */
export type Dict = Record<string, Record<Lang, string>>;
