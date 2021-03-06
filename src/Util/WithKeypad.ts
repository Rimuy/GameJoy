import { Union } from "../Actions";

import aliases from "../Misc/Aliases";

type NumberEnums =
	| Enum.KeyCode.Zero
	| Enum.KeyCode.One
	| Enum.KeyCode.Two
	| Enum.KeyCode.Three
	| Enum.KeyCode.Four
	| Enum.KeyCode.Five
	| Enum.KeyCode.Six
	| Enum.KeyCode.Seven
	| Enum.KeyCode.Eight
	| Enum.KeyCode.Nine;

type SpecialCharEnums =
	| Enum.KeyCode.Plus
	| Enum.KeyCode.Equals
	| Enum.KeyCode.Minus
	| Enum.KeyCode.Period;

type KeypadEntry = CastsToEnum<NumberEnums> | CastsToEnum<SpecialCharEnums> | StringNumbers;

type StringNumbers = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

const keypadIndexDiff = 208;

const mappedKeypadEntries = {
	[43]: Enum.KeyCode.KeypadPlus.Value,
	[46]: Enum.KeyCode.KeypadPeriod.Value,
	[61]: Enum.KeyCode.KeypadEquals.Value,
	[45]: Enum.KeyCode.KeypadMinus.Value,
};

/**
 * Returns an union containing a number key and its numpad equivalent.
 */
export function WithKeypad<T extends KeypadEntry>(entry: T) {
	const value = typeIs(entry, "EnumItem")
		? entry.Value
		: typeIs(entry, "string")
		? aliases.has(entry as StringNumbers)
			? Enum.KeyCode[aliases.get(entry as StringNumbers)!].Value
			: Enum.KeyCode[entry as NumberEnums["Name"] | SpecialCharEnums["Name"]].Value
		: typeIs(entry, "number")
		? entry
		: entry;

	const v = value as Exclude<typeof value, T>;

	let keypadValue: number;

	if (v >= 48 && v <= 57) {
		keypadValue = v + keypadIndexDiff;
	} else {
		keypadValue = mappedKeypadEntries[value as SpecialCharEnums["Value"]];
	}

	return new Union([entry, keypadValue as T]);
}
