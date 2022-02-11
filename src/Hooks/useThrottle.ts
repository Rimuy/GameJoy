import type Signal from "@rbxts/signal";
import { Bin } from "@rbxts/bin";

import {
	ActionEntry,
	ActionKey,
	ActionLikeArray,
	ConsumerSignal,
	RawActionEntry,
	TransformAction,
} from "../definitions";

import { ActionConnection } from "../Class/ActionConnection";

import { transformAction } from "../Misc/TransformAction";

import * as t from "../Util/TypeChecks";

/**
 * Changes the behavior of an action, making it loop-trigger each time in a given interval, until it's deactivated.
 */
export function useThrottle<R extends RawActionEntry, A extends ActionKey<R>>(
	action: A extends ActionEntry<R> ? A : A extends ActionLikeArray<R> ? ActionLikeArray<R> : R,
	interval = 1 / 60,
	debounce = 0.5,
) {
	const cloned = t.isAction(action) ? action.Clone() : transformAction<R>(action as never);
	let isActive = false;

	function onResolved() {
		const bin = new Bin();
		let isThrottling = true;

		function onReleased() {
			bin.destroy();
			onRejected();
		}

		bin.add(cloned.Released.Connect(onReleased));
		bin.add(cloned.Destroyed.Connect(onReleased));
		bin.add(() => (isThrottling = false));

		for (; isThrottling; ) {
			setTriggered(cloned, true);
			task.wait(interval < 1 / 60 ? 1 / 60 : interval);
		}

		isActive = false;
	}

	function onRejected() {
		setTriggered(cloned, false);
		isActive = false;
	}

	ActionConnection.From(cloned).Triggered(() => {
		if (isActive) return;

		isActive = true;

		if (debounce === 0) {
			return onResolved();
		}

		setTriggered(cloned, true);

		Promise.race([
			Promise.delay(debounce),
			rejectionEvent(cloned.Released),
			rejectionEvent(cloned.Destroyed),
		])
			.then(onResolved)
			.catch(onRejected);
	});

	return cloned as unknown as TransformAction<R, A>;
}

function setTriggered(action: ActionEntry, value: boolean) {
	(action as unknown as { SetTriggered(v: boolean): void }).SetTriggered(value);
	(action as unknown as { Changed: Signal }).Changed.Fire();
}

function rejectionEvent(event: ConsumerSignal<Callback>) {
	return Promise.fromEvent(event).then(() => Promise.reject({}));
}
