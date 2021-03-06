import { HashMap } from "@rbxts/rust-classes";
import type Signal from "@rbxts/signal";

import { ActionConnection } from "../Class/ActionConnection";
import { ActionEntry, ActionLikeArray, RawActionEntry } from "../Definitions/Types";
import { BaseAction } from "../Class/BaseAction";

import { transformAction } from "../Misc/TransformAction";
import { isOptional } from "../Misc/IsOptional";

/**
 * Variant that requires all of its entries to be active for it to trigger.
 */
export class CompositeAction<A extends RawActionEntry> extends BaseAction {
	private status: HashMap<ActionEntry<A>, boolean>;

	public constructor(public readonly RawAction: ActionLikeArray<A>) {
		super();

		const status = (this.status = HashMap.empty());

		for (const entry of this.RawAction) {
			const action = transformAction<A>(entry);
			status.insert(action, isOptional(action));
		}

		ActionConnection.From(this).Changed(() => {
			if (status.values().all((isPressed) => isPressed)) {
				return this.SetTriggered(true);
			}

			if (this.IsActive) this.SetTriggered(false);
		});
	}

	protected OnConnected() {
		const { status } = this;

		status.keys().forEach((action) => {
			const connection = ActionConnection.From(action);

			action.SetContext(this.Context);

			connection.Triggered(() => {
				status.insert(action, true);

				(this.Changed as Signal).Fire();
			});

			connection.Released(() => {
				if (!isOptional(action)) status.insert(action, false);

				(this.Changed as Signal).Fire();
			});

			ActionConnection.From(this).Destroyed(() => {
				action.Destroy();
			});
		});
	}
}

const actionMt = CompositeAction as LuaMetatable<CompositeAction<RawActionEntry>>;
actionMt.__tostring = (c) => `Composite(${c.GetContentString().join(", ")})`;
